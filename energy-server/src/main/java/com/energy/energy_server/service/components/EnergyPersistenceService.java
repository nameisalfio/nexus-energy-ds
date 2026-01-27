package com.energy.energy_server.service.components;

import com.energy.energy_server.config.RabbitMQConfig;
import com.energy.energy_server.model.EnergyReading;
import com.energy.energy_server.repository.EnergyReadingRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

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

    @CircuitBreaker(name = "energyDbBreaker", fallbackMethod = "fallbackSave")
    public void saveReading(EnergyReading entity) {
        ensureCorrelationId(entity);
        energyRepository.saveAndFlush(entity);
        entityCounter++;
        auditService.incrementDirect();
    }

    public void fallbackSave(EnergyReading entity, Throwable t) {
        log.error("DB_STRESS | Database Unreachable | Action: Fallback to RabbitMQ | Error: {}", t.getMessage());
        consecutiveFailures.incrementAndGet();
        ensureCorrelationId(entity);
        sendToRabbitMQ(entity);
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
            rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, RabbitMQConfig.ROUTING_KEY, entity, m -> {
                m.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
                return m;
            });
            auditService.incrementSent();
        } catch (Exception e) {
            log.error("RABBIT_FAILURE | Data risk!");
        }
    }
}