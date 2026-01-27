package com.energy.energy_server.service.components;

import com.energy.energy_server.config.RabbitMQConfig;
import com.energy.energy_server.model.EnergyReading;
import com.energy.energy_server.repository.EnergyReadingRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Queue;
import java.util.UUID;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
@RequiredArgsConstructor
public class SimulationServiceImpl implements SimulationService {

    private final EnergyReadingRepository energyRepository;
    private final RabbitTemplate rabbitTemplate;
    private final AuditService auditService;
    private final ApplicationEventPublisher eventPublisher;

    @Getter
    private final Queue<EnergyReading> ingestionQueue = new ConcurrentLinkedQueue<>();
    @Getter
    private final AtomicBoolean isRunning = new AtomicBoolean(false);
    @Getter
    private final AtomicInteger consecutiveFailures = new AtomicInteger(0);
    
    private static final int FIXED_RATE_MS = 2000;
    private static final int BURST_SIZE = 24;
    private static long entityCounter = 0L;

    @Override
    public void loadQueue(List<EnergyReading> readings) {
        ingestionQueue.clear();
        ingestionQueue.addAll(readings);
        log.info("NEXUS_SIM | Queue loaded with {} records", readings.size());
    }

    @Override
    public void start() {
        if (!ingestionQueue.isEmpty()) {
            isRunning.set(true);
            log.info("NEXUS_SIM | Engine STARTED - Executing initial 24 record burst");
            for (int i = 0; i < BURST_SIZE && !ingestionQueue.isEmpty(); i++) {
                processSingleStep(); 
            }
            
            log.info("NEXUS_SIM | Burst complete. Interval mode engaged.");
        }
    }

    @Override
    public void stop() {
        isRunning.set(false);
        log.info("NEXUS_SIM | Engine STOPPED");
    }

    private void processSingleStep() {
        EnergyReading reading = ingestionQueue.poll();
        if (reading != null) {
            saveReading(reading);
            eventPublisher.publishEvent(reading);
        }
    }
    
    @Scheduled(fixedRate = FIXED_RATE_MS)
    public void processSimulationStep() {
        if (!isRunning.get() || ingestionQueue.isEmpty()) {
            if (isRunning.get() && ingestionQueue.isEmpty()) stop();
            return;
        }
        EnergyReading reading = ingestionQueue.poll();
        if (reading != null) {
            reading.setTimestamp(LocalDateTime.now());
            String dayName = LocalDateTime.now().getDayOfWeek().getDisplayName(java.time.format.TextStyle.FULL, java.util.Locale.ENGLISH);
            reading.setDayOfWeek(dayName);
            
            saveReading(reading);
            eventPublisher.publishEvent(reading);
        }
    }

    @CircuitBreaker(name = "energyDbBreaker", fallbackMethod = "fallbackSave")
    public void saveReading(EnergyReading entity) {
        ensureCorrelationId(entity);
        energyRepository.saveAndFlush(entity); 
        entityCounter++;
        auditService.incrementDirect();
    }

    public void fallbackSave(EnergyReading entity, Throwable t) {
        consecutiveFailures.incrementAndGet();
        ensureCorrelationId(entity);
        sendToRabbitMQ(entity);
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

    @CircuitBreaker(name = "energyDbBreaker", fallbackMethod = "fallbackCount")
    public long getRecordCount() { return energyRepository.count(); }

    public long fallbackCount(Throwable t) { return entityCounter; }
}