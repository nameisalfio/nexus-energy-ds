package com.energy.energy_server.service.components;

import com.energy.energy_server.config.RabbitMQConfig;
import com.energy.energy_server.model.EnergyReading;
import com.energy.energy_server.repository.EnergyReadingRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
@RequiredArgsConstructor
public class EnergyPersistenceService {

    private final EnergyReadingRepository energyRepository;
    private final RabbitTemplate rabbitTemplate;
    private final AuditService auditService;

    public final AtomicInteger consecutiveFailures = new AtomicInteger(0);
    private static long entityCounter = 0L;
    private static final int ALERT_THRESHOLD = 20;

    @CircuitBreaker(name = "energyDbBreaker", fallbackMethod = "fallbackSave")
    public void saveReading(EnergyReading entity) {
        ensureCorrelationId(entity);

        if (entity.getTimestamp() == null) {
            entity.setTimestamp(LocalDateTime.now());
        }


        energyRepository.saveAndFlush(entity);
        entityCounter++;
        auditService.incrementDirect();

        log.info("💾 DB_SAVE | ID: {} | Timestamp: {} | Temp: {}°C | Humidity: {}% | Energy: {} kWh",
                entity.getCorrelationId(),
                entity.getTimestamp(),
                entity.getTemperature(),
                entity.getHumidity(),
                entity.getEnergyConsumption());

        // Reset failures counter
        if (consecutiveFailures.get() > 0) {
            log.info("✅ DATABASE_RECOVERED | Previous failures: {}", consecutiveFailures.get());
            consecutiveFailures.set(0);
        }
    }

    public void fallbackSave(EnergyReading entity, Throwable t) {

        int currentFailures = consecutiveFailures.incrementAndGet();

        try {

            MDC.put("failure_count", String.valueOf(currentFailures));

            if (currentFailures == 1) {
                log.error("DB_STRESS | Initial database failure | ID: {} | Error: {}",
                        entity.getCorrelationId(), t.getMessage());
            } else if (currentFailures % ALERT_THRESHOLD == 0) {
                log.error("DB_STRESS | Cumulative failures: {} | ID: {} | Error: {}",
                        currentFailures, entity.getCorrelationId(), t.getMessage());
            } else {
                log.debug("DB_FALLBACK | Rerouting to RabbitMQ...");
            }

            ensureCorrelationId(entity);
            sendToRabbitMQ(entity);

        } finally {
            MDC.clear();
        }

    }

    @CircuitBreaker(name = "energyDbBreaker", fallbackMethod = "fallbackCount")
    public long getRecordCount() {
        return energyRepository.count();
    }

    public long fallbackCount(Throwable t) {
        return entityCounter;
    }

    private void ensureCorrelationId(EnergyReading entity) {
        if (entity.getCorrelationId() == null) {
            entity.setCorrelationId(UUID.randomUUID().toString());
        }
    }

    private void sendToRabbitMQ(EnergyReading entity) {
        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.EXCHANGE_NAME,
                    RabbitMQConfig.ROUTING_KEY,
                    entity,
                    message -> {
                        message.getMessageProperties().setMessageId(entity.getCorrelationId());
                        message.getMessageProperties().setTimestamp(new Date());
                        message.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
                        message.getMessageProperties().setHeader("source", "circuit-breaker-fallback");
                        message.getMessageProperties().setHeader("failureCount", consecutiveFailures.get());
                        return message;
                    });

            auditService.incrementSent();

            log.info("📨 RABBITMQ_SEND | ID: {} | Timestamp: {} | Temp: {}°C | Humidity: {}% | Energy: {} kWh | Failures: {}",
                    entity.getCorrelationId(),
                    entity.getTimestamp(),
                    entity.getTemperature(),
                    entity.getHumidity(),
                    entity.getEnergyConsumption(),
                    consecutiveFailures.get());

        } catch (Exception e) {
            log.error("❌ RABBITMQ_UNREACHABLE | CRITICAL DATA LOSS RISK | ID: {} | Error: {}",
                    entity.getCorrelationId(),
                    e.getClass().getSimpleName() + ": " + e.getMessage());
        }
    }
}