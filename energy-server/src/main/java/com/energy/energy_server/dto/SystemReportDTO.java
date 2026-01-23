package com.energy.energy_server.dto;

import java.util.List;
import com.energy.energy_server.model.EnergyReading;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SystemReportDTO {
    
    private StatsDTO stats;
    private AiInsightDTO aiInsights;
    private List<EnergyReading> recentReadings;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class StatsDTO {
        private double averageTemperature;
        private double totalEnergyConsumption;
        private double peakLoad;
        private long totalRecords;
    }
}