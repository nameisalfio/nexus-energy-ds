package com.energy.energy_server.service.components;

import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.energy.energy_server.dto.SystemReportDTO;
import com.energy.energy_server.dto.WeeklyStatsDTO;
import com.energy.energy_server.dto.AiInsightDTO; 
import com.energy.energy_server.model.EnergyReading;
import com.energy.energy_server.repository.EnergyReadingRepository;
import com.energy.energy_server.service.AiModelService; 

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final EnergyReadingRepository energyReadingRepository;
    private final AiModelService aiModelService; 

    public void clearHistory() {
        log.info("Analytics history cleared");
    }

    public EnergyReading getLatestReading() {
        return energyReadingRepository.findTop100ByOrderByTimestampDesc().stream()
                .findFirst()
                .orElse(new EnergyReading());
    }

    public SystemReportDTO generateReport(EnergyReading latest) {
        AiInsightDTO defaultInsight = new AiInsightDTO(false, 0.0, 0.0, 0.0, "AI Initializing...");

        AiInsightDTO insights = (aiModelService != null && latest.getId() != null) 
            ? aiModelService.analyze(latest) 
            : defaultInsight;
        
        List<EnergyReading> recent = energyReadingRepository.findTop100ByOrderByTimestampDesc();
        
        double avgTemp = recent.stream().mapToDouble(r -> r.getTemperature() != null ? r.getTemperature() : 0.0).average().orElse(0.0);
        double totalEnergy = recent.stream().mapToDouble(r -> r.getEnergyConsumption() != null ? r.getEnergyConsumption() : 0.0).sum();
        double peakLoad = recent.stream().mapToDouble(r -> r.getEnergyConsumption() != null ? r.getEnergyConsumption() : 0.0).max().orElse(0.0);

        SystemReportDTO.StatsDTO stats = new SystemReportDTO.StatsDTO(
            avgTemp,
            totalEnergy,
            peakLoad,
            (long) recent.size()
        );

        return new SystemReportDTO(stats, insights, recent);
    }

    public List<WeeklyStatsDTO> getWeeklyStats() {
    List<EnergyReading> readings = energyReadingRepository.findAll();

    Map<String, Double> statsMap = new LinkedHashMap<>();
    String[] daysLong = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"};
    String[] daysShort = {"Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"};
    
    for (String s : daysShort) statsMap.put(s, 0.0);

    readings.forEach(r -> {
        String dayFromCsv = r.getDayOfWeek(); 
        for (int i = 0; i < daysLong.length; i++) {
            if (daysLong[i].equalsIgnoreCase(dayFromCsv)) {
                statsMap.merge(daysShort[i], r.getEnergyConsumption(), 
                    (oldV, newV) -> (oldV == 0.0) ? newV : (oldV + newV) / 2);
            }
        }
    });

    return statsMap.entrySet().stream()
        .map(entry -> new WeeklyStatsDTO(entry.getKey(), entry.getValue()))
        .collect(Collectors.toList());
}
}