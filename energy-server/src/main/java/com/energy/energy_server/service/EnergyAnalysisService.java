package com.energy.energy_server.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.energy.energy_server.dto.AiInsightDTO;
import com.energy.energy_server.dto.GlobalStatsDTO;
import com.energy.energy_server.dto.ReadingDTO;
import com.energy.energy_server.dto.SystemReportDTO;
import com.energy.energy_server.dto.WeeklyStatsDTO;
import com.energy.energy_server.model.EnergyReading;
import com.energy.energy_server.repository.EnergyRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class EnergyAnalysisService {

    private final EnergyRepository repository;
    private final AiModelService aiService;

    private static final double ANOMALY_THRESHOLD_PERCENT = 20.0;
    private static final int REQUIRED_HISTORY_SIZE = 24;

    @Transactional(readOnly = true)
    public SystemReportDTO generateFullReport() {
        log.info("Generating full system report...");

        List<EnergyReading> entities = repository.findTop100ByOrderByTimestampDesc();

        if (entities.size() <= REQUIRED_HISTORY_SIZE) {
            return buildEmptyReport(entities);
        }

        // 2. Anomaly Detection Logic
        EnergyReading currentReading = entities.get(0);
        List<EnergyReading> historicalContext = entities.subList(1, REQUIRED_HISTORY_SIZE + 1);

        double actualValue = currentReading.getEnergyConsumption();
        double predictedValue = aiService.predictNextHour(historicalContext);

        // 3. Deviation Calculation
        double delta = Math.abs(predictedValue - actualValue);
        double deviationPercent = (actualValue > 0) ? (delta / actualValue) * 100.0 : 0.0;
        boolean isAnomaly = deviationPercent > ANOMALY_THRESHOLD_PERCENT;

        AiInsightDTO aiInsights = new AiInsightDTO(
                isAnomaly,
                predictedValue,
                actualValue,
                deviationPercent,
                generateInsightMessage(isAnomaly, predictedValue, actualValue)
        );

        // 4. Statistical Aggregation
        GlobalStatsDTO stats = calculateGlobalStats(entities);
        
        List<ReadingDTO> readingDTOs = entities.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());

        return new SystemReportDTO(stats, readingDTOs, aiInsights);
    }

    @Transactional(readOnly = true)
    public List<WeeklyStatsDTO> getWeeklyStats() {
        return repository.findWeeklyStats();
    }

    @Transactional
    public void ingestCsvData(MultipartFile file) throws IOException {
        log.info("Starting CSV batch ingestion...");
        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            boolean isFirst = true;
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

            while ((line = br.readLine()) != null) {
                if (isFirst) { isFirst = false; continue; }
                
                String[] data = line.split(",");
                EnergyReading entity = new EnergyReading();
                
                entity.setTimestamp(LocalDateTime.parse(data[0], formatter));
                entity.setTemperature(Double.parseDouble(data[1]));
                entity.setHumidity(Double.parseDouble(data[2]));
                entity.setSquareFootage(Double.parseDouble(data[3]));
                entity.setOccupancy(Integer.parseInt(data[4]));
                entity.setHvacUsage(data[5]);
                entity.setLightingUsage(data[6]);
                entity.setRenewableEnergy(Double.parseDouble(data[7]));
                entity.setDayOfWeek(data[8]);
                entity.setHoliday(data[9]);
                entity.setEnergyConsumption(Double.parseDouble(data[10]));

                repository.save(entity);
            }
        }
    }

    // --- Private Helpers ---

    private GlobalStatsDTO calculateGlobalStats(List<EnergyReading> entities) {
        double totalConsumption = entities.stream().mapToDouble(EnergyReading::getEnergyConsumption).sum();
        double avgTemp = entities.stream().mapToDouble(EnergyReading::getTemperature).average().orElse(0.0);
        double peakLoad = entities.stream().mapToDouble(EnergyReading::getEnergyConsumption).max().orElse(0.0);
        
        return new GlobalStatsDTO(avgTemp, totalConsumption, peakLoad, repository.count());
    }

    private String generateInsightMessage(boolean isAnomaly, double predicted, double actual) {
        if (!isAnomaly) {
            return "System performing within expected AI parameters.";
        }
        if (actual > predicted) {
            return "High consumption anomaly detected! Usage exceeds model prediction.";
        } else {
            return "Low consumption anomaly. Check for sensor faults or unexpected shutdowns.";
        }
    }

    private SystemReportDTO buildEmptyReport(List<EnergyReading> entities) {
        List<ReadingDTO> dtos = entities.stream().map(this::mapToDTO).collect(Collectors.toList());
        return new SystemReportDTO(
                new GlobalStatsDTO(0, 0, 0, 0),
                dtos,
                new AiInsightDTO(false, 0, 0, 0, "Not enough data for AI analysis.")
        );
    }

    private ReadingDTO mapToDTO(EnergyReading e) {
        return new ReadingDTO(
                e.getId(),
                e.getTimestamp(),
                e.getTemperature(),
                e.getHumidity(),
                e.getSquareFootage(),
                e.getOccupancy(),
                e.getHvacUsage(),
                e.getLightingUsage(),
                e.getRenewableEnergy(),
                e.getDayOfWeek(),
                e.getHoliday(),
                e.getEnergyConsumption()
        );
    }
}