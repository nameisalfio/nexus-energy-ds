package com.energy.energy_server.service;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.TimeUnit;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.energy.energy_server.dto.SystemReportDTO;
import com.energy.energy_server.dto.WeeklyStatsDTO;
import com.energy.energy_server.model.EnergyReading;
import com.energy.energy_server.service.components.AnalyticsService;
import com.energy.energy_server.service.components.IngestionService;
import com.energy.energy_server.service.components.SimulationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class EnergySystemFacade {

    // fine-grained dependencies
    private final IngestionService ingestionService;
    private final SimulationService simulationService;
    private final AnalyticsService analyticsService;

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();
    private static final int REQUIRED_HISTORY_SIZE = 24;

    @jakarta.annotation.PostConstruct
    public void init() {
        log.info("System Init & Cleanup");
        analyticsService.clearHistory();
    }

    // --- 1. GESTIONE UPLOAD ---
    public void handleDatasetUpload(MultipartFile file) throws IOException {
        List<EnergyReading> data = ingestionService.parseCsv(file);
        simulationService.loadQueue(data);
        log.info("Dataset processed and queued.");
    }

    // --- 2. GESTIONE SIMULAZIONE ---
    @Async("taskExecutor")
    public void startSimulation() {
        if (simulationService.getIsRunning().get()) return;
        simulationService.getIsRunning().set(true);

        CompletableFuture.runAsync(() -> {
            log.info("Simulation Loop Started");
            
            while (!simulationService.getIngestionQueue().isEmpty() && simulationService.getIsRunning().get()) {
                try {
                    long dbCount = simulationService.getRecordCount();
                    TimeUnit.MILLISECONDS.sleep(dbCount >= REQUIRED_HISTORY_SIZE ? 1000 : 50);
                    EnergyReading entity = simulationService.getIngestionQueue().poll();
                    if (entity == null) break;
                    simulationService.saveReading(entity);
                    SystemReportDTO report = analyticsService.generateReport(entity);
                    broadcast(report);
                } catch (Exception e) {
                    log.error("Simulation Error", e);
                }
            }
            simulationService.getIsRunning().set(false);
            log.info("Simulation Loop Ended");
        });
    }

    public void stopSimulation() {
        simulationService.stop();
    }

    // --- 3. REPORTING ---
    public SystemReportDTO getCurrentStatus() {
        EnergyReading latest = analyticsService.getLatestReading();
        return analyticsService.generateReport(latest);
    }

    public List<WeeklyStatsDTO> getWeeklyTrends() {
        return analyticsService.getWeeklyStats();
    }

    // --- 4. STREAMING ---
    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitters.add(emitter);
        return emitter;
    }

    private void broadcast(SystemReportDTO payload) {
        for (SseEmitter emitter : emitters) {
            try {
                emitter.send(SseEmitter.event().name("update").data(payload));
            } catch (IOException e) {
                emitters.remove(emitter);
            }
        }
    }
}