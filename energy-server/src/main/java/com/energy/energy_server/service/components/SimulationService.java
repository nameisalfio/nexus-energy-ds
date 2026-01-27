package com.energy.energy_server.service.components;

import com.energy.energy_server.model.EnergyReading;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
@RequiredArgsConstructor
public class SimulationService {

    private final EnergyPersistenceService energyPersistenceService;
    private final ApplicationEventPublisher eventPublisher;

    @Getter
    private final Queue<EnergyReading> ingestionQueue = new ConcurrentLinkedQueue<>();
    @Getter
    private final AtomicBoolean isRunning = new AtomicBoolean(false);
    @Getter
    private final AtomicInteger consecutiveFailures = new AtomicInteger(0);

    private static final int FIXED_RATE_MS = 2000;
    private static final int BURST_SIZE = 24;

    public void loadQueue(List<EnergyReading> readings) {
        ingestionQueue.clear();
        ingestionQueue.addAll(readings);
        log.info("NEXUS_SIM | Queue loaded with {} records", readings.size());
    }

    public void start() {
        if (!ingestionQueue.isEmpty()) {
            isRunning.set(true);

            long existingRecords = energyPersistenceService.getRecordCount();

            if (existingRecords == 0) {
                log.info("NEXUS_SIM | Database empty (0 records). Executing warm-up burst.");
                for (int i = 0; i < BURST_SIZE && !ingestionQueue.isEmpty(); i++) {
                    processSingleStep();
                }
            } else {
                log.info("NEXUS_SIM | Database warm ({} records). Skipping burst, entering interval mode.", existingRecords);
            }

            log.info("NEXUS_SIM | Burst complete. Interval mode engaged.");
        }
    }

    public void stop() {
        isRunning.set(false);
        log.info("NEXUS_SIM | Engine STOPPED");
    }

    private void processSingleStep() {
        EnergyReading reading = ingestionQueue.poll();
        if (reading != null) {
            energyPersistenceService.saveReading(reading);
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

            energyPersistenceService.saveReading(reading);
            eventPublisher.publishEvent(reading);
        }
    }

    @CircuitBreaker(name = "energyDbBreaker", fallbackMethod = "fallbackCount")
    public long getRecordCount() {
        return energyPersistenceService.getRecordCount();
    }

    public long fallbackCount(Throwable t) {
        return energyPersistenceService.consecutiveFailures.get();
    }
}