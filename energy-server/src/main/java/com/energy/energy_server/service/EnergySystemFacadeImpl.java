package com.energy.energy_server.service;

import com.energy.energy_server.dto.SystemReportDTO;
import com.energy.energy_server.dto.WeeklyStatsDTO;
import com.energy.energy_server.model.EnergyReading;
import com.energy.energy_server.repository.EnergyReadingRepository;
import com.energy.energy_server.service.components.*;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
@RequiredArgsConstructor
public class EnergySystemFacadeImpl implements EnergySystemFacade{

    private final IngestionService ingestionService;
    private final SimulationService simulationService;
    private final AnalyticsService analyticsService;
    private final EnergyReadingRepository energyReadingRepository;

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();


    @PostConstruct
    public void init() {
        log.info("NEXUS_CORE | System Startup: Purging old telemetry");
        energyReadingRepository.deleteAllInBatch();
        analyticsService.clearHistory();
    }

    @Override
    public void handleDatasetUpload(MultipartFile file) throws IOException {
        try {
            ingestionService.handleUpload(file);
        } catch (Exception e) {
            throw new IOException("Dataset ingestion rejected", e);
        }
    }

    @Override
    public void startSimulation() { 
        simulationService.start(); 
    }

    @Override
    public void stopSimulation() { 
        simulationService.stop(); 
    }

    @EventListener
    @Override
    public void onTelemetryUpdate(EnergyReading reading) {
        SystemReportDTO report = analyticsService.generateReport(reading);
        broadcast(report);
    }

    @Override
    public SystemReportDTO getCurrentStatus() {
        return analyticsService.generateReport(analyticsService.getLatestReading());
    }

    @Override
    public List<WeeklyStatsDTO> getWeeklyTrends() {
        return analyticsService.getWeeklyStats();
    }

    @Override
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
            } catch (Exception e) {
                emitters.remove(emitter);
            }
        }
    }

    @Override
    public void clearAllData() {
        simulationService.stop();
        energyReadingRepository.deleteAllInBatch();
        analyticsService.clearHistory();
        log.warn("NEXUS_CORE | Full purge executed manually");
    }

    @EventListener
    public void handleTelemetryEvent(EnergyReading reading) {
        try {
            SystemReportDTO report = analyticsService.generateReport(reading);
            broadcast(report);
        } catch (Exception e) {
            log.error("Error during real-time broadcast", e);
        }
    }
}