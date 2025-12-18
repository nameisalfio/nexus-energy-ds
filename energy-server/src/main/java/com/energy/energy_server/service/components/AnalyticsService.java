package com.energy.energy_server.service.components;

import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.energy.energy_server.dto.AiInsightDTO;
import com.energy.energy_server.dto.GlobalStatsDTO;
import com.energy.energy_server.dto.ReadingDTO;
import com.energy.energy_server.dto.SystemReportDTO;
import com.energy.energy_server.dto.WeeklyStatsDTO;
import com.energy.energy_server.model.EnergyReading;
import com.energy.energy_server.repository.EnergyRepository;
import com.energy.energy_server.service.AiModelService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final EnergyRepository repository;
    private final AiModelService aiService;
    private static final int REQUIRED_HISTORY_SIZE = 24;
    private static final double ANOMALY_THRESHOLD_PERCENT = 20.0;

    @Transactional(readOnly = true)
    public SystemReportDTO generateReport(EnergyReading current) {
        long count = repository.count();
        List<EnergyReading> all = repository.findAll();
        
        Double avgTemp = all.stream().mapToDouble(e -> e.getTemperature() != null ? e.getTemperature() : 0.0).average().orElse(0.0);
        Double totalEnergy = all.stream().mapToDouble(e -> e.getEnergyConsumption() != null ? e.getEnergyConsumption() : 0.0).sum();
        Double peakLoad = all.stream().mapToDouble(e -> e.getEnergyConsumption() != null ? e.getEnergyConsumption() : 0.0).max().orElse(0.0);

        GlobalStatsDTO stats = new GlobalStatsDTO(avgTemp, totalEnergy, peakLoad, count);

        double predicted = 0.0;
        double actual = current != null && current.getEnergyConsumption() != null ? current.getEnergyConsumption() : 0.0;
        double deviation = 0.0;
        boolean anomaly = false;
        String message;

        if (count <= REQUIRED_HISTORY_SIZE) {
            message = String.format("Initializing (Buffer: %d/%d)...", count, REQUIRED_HISTORY_SIZE);
        } else {
            List<EnergyReading> history = repository.findTop100ByOrderByTimestampDesc();
            predicted = aiService.predictNextHour(history);
            if(actual > 0) deviation = Math.abs(predicted - actual) / actual * 100.0;
            anomaly = deviation > ANOMALY_THRESHOLD_PERCENT;
            message = anomaly ? "⚠️ Anomaly detected!" : "System Normal";
        }

        AiInsightDTO ai = new AiInsightDTO(anomaly, predicted, actual, deviation, message);
        List<ReadingDTO> readings = current != null ? Collections.singletonList(mapToDTO(current)) : Collections.emptyList();

        return new SystemReportDTO(stats, readings, ai);
    }
    
    public ReadingDTO mapToDTO(EnergyReading e) {
        return new ReadingDTO(e.getId(), e.getTimestamp(), e.getTemperature(), e.getHumidity(), e.getSquareFootage(), e.getOccupancy(), e.getHvacUsage(), e.getLightingUsage(), e.getRenewableEnergy(), e.getDayOfWeek(), e.getHoliday(), e.getEnergyConsumption());
    }

    public List<WeeklyStatsDTO> getWeeklyStats() {
        return repository.findWeeklyStats();
    }
    
    public EnergyReading getLatestReading() {
        List<EnergyReading> recent = repository.findTop100ByOrderByTimestampDesc();
        return recent.isEmpty() ? null : recent.get(0);
    }
    
    public void clearHistory() {
        repository.deleteAllInBatch();
    }
}