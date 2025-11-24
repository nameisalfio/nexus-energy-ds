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

    /**
     * Generates a comprehensive system report.
     * This method acts as an aggregator for various data sources.
     *
     * @return A SystemReportDTO containing stats, readings, and insights.
     */
    @Transactional(readOnly = true)
    public SystemReportDTO generateFullReport() {
        log.info("Generating full system report...");

        // 1. Fetch raw data from DB (Limit to last 100 for performance in this demo)
        List<EnergyReading> entities = repository.findTop100ByOrderByTimestampDesc();

        // 2. Map Entity to DTO
        List<ReadingDTO> readingDTOs = entities.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());

        // 3. Calculate Statistics (Simple math for POC)
        double totalConsumption = entities.stream().mapToDouble(EnergyReading::getEnergyConsumption).sum();
        double avgTemp = entities.stream().mapToDouble(EnergyReading::getTemperature).average().orElse(0.0);
        double peakLoad = entities.stream().mapToDouble(EnergyReading::getEnergyConsumption).max().orElse(0.0);

        GlobalStatsDTO stats = new GlobalStatsDTO(avgTemp, totalConsumption, peakLoad, repository.count());

        // 4. Simulate AI Analysis (Placeholder for future expansion)
        AiInsightDTO aiInsights = performAiAnalysis(entities);

        return new SystemReportDTO(stats, readingDTOs, aiInsights);
    }

    /**
     * Handles the ingestion of a CSV file.
     *
     * @param file The uploaded MultipartFile.
     * @throws IOException If a reading error occurs.
     */
    @Transactional
    public void ingestCsvData(MultipartFile file) throws IOException {
        log.info("Starting CSV ingestion for file: {}", file.getOriginalFilename());
        
        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            // Skip header
            String line = br.readLine(); 
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

            while ((line = br.readLine()) != null) {
                String[] data = line.split(",");
                // Basic mapping logic (assumes CSV structure is strictly valid)
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
        log.info("CSV Ingestion completed successfully.");
    }

    private AiInsightDTO performAiAnalysis(List<EnergyReading> data) {
        // Mock AI logic: In a real scenario, this would call an external Python service or load a model.
        boolean anomaly = data.stream().anyMatch(r -> r.getEnergyConsumption() > 150.0);
        double prediction = data.isEmpty() ? 0.0 : data.getFirst().getEnergyConsumption() * 1.15;
        
        return new AiInsightDTO(
                anomaly,
                prediction,
                anomaly ? "High consumption detected. Inspect HVAC systems." : "System operating within normal parameters."
        );
    }

    /**
     * Retrieves the weekly statistics from the repository.
     * Acts as a pass-through to maintain architectural layering.
     *
     * @return List of WeeklyStatsDTO
     */
    @Transactional(readOnly = true)
    public List<WeeklyStatsDTO> getWeeklyStats() {
        return repository.findWeeklyStats();
    }

    private ReadingDTO mapToDTO(EnergyReading entity) {
        return new ReadingDTO(
            entity.getId(),
            entity.getTimestamp(),
            entity.getTemperature(),
            entity.getHumidity(),
            entity.getSquareFootage(),
            entity.getOccupancy(),
            entity.getHvacUsage(),
            entity.getLightingUsage(),
            entity.getRenewableEnergy(),
            entity.getDayOfWeek(),
            entity.getHoliday(),
            entity.getEnergyConsumption()
        );
    }
}