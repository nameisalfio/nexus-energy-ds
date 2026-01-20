package com.energy.energy_server.service.components;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.Queue;
import java.util.UUID;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

import com.energy.energy_server.config.RabbitMQConfig;
import org.slf4j.MDC;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.energy.energy_server.model.EnergyReading;
import com.energy.energy_server.repository.EnergyRepository;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class SimulationService {

    private final EnergyRepository energyRepository;
    private final RabbitTemplate rabbitTemplate;

    private final AuditService auditService;

    @Getter
    private final Queue<EnergyReading> ingestionQueue = new ConcurrentLinkedQueue<>();

    @Getter
    private final AtomicInteger consecutiveFailures = new AtomicInteger(0);
    private static final int ALERT_THRESHOLD = 25;

    @Getter
    private final AtomicBoolean isRunning = new AtomicBoolean(false);

    public void loadQueue(List<EnergyReading> readings) {
        ingestionQueue.clear();
        ingestionQueue.addAll(readings);
        log.info("📥 Queue loaded with {} readings", readings.size());
    }

    public void stop() {
        isRunning.set(false);
        log.info("⏸️  Simulation stopped");
    }

    @CircuitBreaker(name = "energyDbBreaker", fallbackMethod = "fallbackSave")
    public void saveReading(EnergyReading entity) {

        ensureCorrelationId(entity);

        if (entity.getTimestamp() == null) {
            entity.setTimestamp(LocalDateTime.now());
        }

        energyRepository.save(entity);
        auditService.incrementDirect(); // Incremento salvataggio diretto

        // Log strutturato per salvataggio diretto su DB
        log.info("💾 DB_SAVE | ID: {} | Timestamp: {} | Temp: {}°C | Humidity: {}% | Energy: {} kWh",
                entity.getCorrelationId(),
                entity.getTimestamp(),
                entity.getTemperature(),
                entity.getHumidity(),
                entity.getEnergyConsumption());

        // Reset contatore fallimenti
        if (consecutiveFailures.get() > 0) {
            log.info("✅ DATABASE_RECOVERED | Previous failures: {}", consecutiveFailures.get());
            consecutiveFailures.set(0);
        }
    }

    public void fallbackSave(EnergyReading entity, Throwable t) {

        int currentFailures = consecutiveFailures.incrementAndGet();
        String user = getUserForAlert();

        try {
            // Alert con severità appropriata
            if (currentFailures == 1) {
                MDC.put("alert_email", user);
                log.error("🔴 DB_DOWN | First failure detected | User: {} | Switching to RabbitMQ fallback", user);
            } else if (currentFailures % ALERT_THRESHOLD == 0) {
                MDC.put("alert_email", user);
                log.error("🔴 DB_STRESS | Failures: {} | User: {} | System under stress", currentFailures, user);
            } else {
                log.debug("⚠️  DB_FALLBACK | Failure #{} | CorrelationId: {}", currentFailures, entity.getCorrelationId());
            }

            ensureCorrelationId(entity);
            sendToRabbitMQ(entity);

        } finally {
            MDC.remove("alert_email");
        }
    }

    @CircuitBreaker(name = "energyDbBreaker", fallbackMethod = "fallbackCount")
    public long getRecordCount() {
        return energyRepository.count();
    }

    // Voglio rallentare analisi del csv quando il DB non risponde
    // cosi quando il DB torna sù, non ho tante entità che arriva a rabbit per essere processate
    public long fallbackCount(Throwable t) {
        log.warn("⚠️ DB Down: Rallento la simulazione a 1 riga al secondo...");
        return 100; // Un numero >= 24 forzerà il delay di 1000ms nel Facade
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
                    }
            );

            auditService.incrementSent(); // Incremento invio a RabbitMQ

            // Log strutturato per invio a RabbitMQ
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

    private String getUserForAlert() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return "system-admin";
    }
}