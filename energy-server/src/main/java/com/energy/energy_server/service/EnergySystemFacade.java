package com.energy.energy_server.service;

import com.energy.energy_server.dto.SystemReportDTO;
import com.energy.energy_server.dto.WeeklyStatsDTO;
import com.energy.energy_server.model.EnergyReading;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;

public interface EnergySystemFacade {

    void handleDatasetUpload(MultipartFile file) throws IOException;

    void startSimulation();

    void stopSimulation();

    SystemReportDTO getCurrentStatus();

    List<WeeklyStatsDTO> getWeeklyTrends();

    SseEmitter subscribe();

    void clearAllData();

    void onTelemetryUpdate(EnergyReading reading);

    boolean isSimulationRunning();
}