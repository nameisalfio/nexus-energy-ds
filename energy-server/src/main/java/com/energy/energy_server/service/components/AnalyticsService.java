package com.energy.energy_server.service.components;

import java.util.Collections;
import java.util.List;

import com.energy.energy_server.config.RabbitMQConfig;
import com.energy.energy_server.dto.event.AnomalyEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
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
@Slf4j
public class AnalyticsService {

    private final EnergyRepository energyRepository;
    private final AiModelService aiService;
    private final RabbitTemplate rabbitTemplate;

    private static final int REQUIRED_HISTORY_SIZE = 24;
    private static final double ANOMALY_THRESHOLD_PERCENT = 20.0;

    private static double maxdeviation = 0.0;

    @Transactional(readOnly = true)
    public SystemReportDTO generateReport(EnergyReading current) {
        long count = energyRepository.count();
        List<EnergyReading> all = energyRepository.findAll();

        double avgTemp = all.stream().mapToDouble(e -> e.getTemperature() != null ? e.getTemperature() : 0.0).average().orElse(0.0);
        double totalEnergy = all.stream().mapToDouble(e -> e.getEnergyConsumption() != null ? e.getEnergyConsumption() : 0.0).sum();
        double peakLoad = all.stream().mapToDouble(e -> e.getEnergyConsumption() != null ? e.getEnergyConsumption() : 0.0).max().orElse(0.0);

        GlobalStatsDTO stats = new GlobalStatsDTO(avgTemp, totalEnergy, peakLoad, count);

        double predicted = 0.0;
        double actual = current != null && current.getEnergyConsumption() != null ? current.getEnergyConsumption() : 0.0;
        double deviation = 0.0;
        boolean anomaly = false;
        String message;

        if (count <= REQUIRED_HISTORY_SIZE) {
            message = String.format("Initializing (Buffer: %d/%d)...", count, REQUIRED_HISTORY_SIZE);
        } else {
            List<EnergyReading> history = energyRepository.findTop100ByOrderByTimestampDesc();
            predicted = aiService.predictNextHour(history);
            if (actual > 0) deviation = Math.abs(predicted - actual) / actual * 100.0;
            maxdeviation = Math.max(deviation, maxdeviation);
            anomaly = deviation > ANOMALY_THRESHOLD_PERCENT;
            message = anomaly ? "⚠️ Anomaly detected!" : "System Normal";

            // Se anomalia, spedisco a RabbitMQ
            if (anomaly) {
                AnomalyEvent anomalyEvent = new AnomalyEvent(
                        current.getTimestamp(),
                        actual,
                        predicted,
                        deviation,
                        "High deviation detected by AI model",
                        current.getId()
                );

                // Pub in modo asincrono
                rabbitTemplate.convertAndSend(
                        RabbitMQConfig.EXCHANGE_NAME,
                        "energy.anomaly.detected",
                        anomalyEvent
                );
            }
        }

        AiInsightDTO ai = new AiInsightDTO(anomaly, predicted, actual, deviation, message);
        List<ReadingDTO> readings = current != null ? Collections.singletonList(mapToDTO(current)) : Collections.emptyList();

        log.info("massima deviazione {}", maxdeviation);
        return new SystemReportDTO(stats, readings, ai);
    }

    public ReadingDTO mapToDTO(EnergyReading e) {
        return new ReadingDTO(e.getId(), e.getTimestamp(), e.getTemperature(), e.getHumidity(), e.getSquareFootage(), e.getOccupancy(), e.getHvacUsage(), e.getLightingUsage(), e.getRenewableEnergy(), e.getDayOfWeek(), e.getHoliday(), e.getEnergyConsumption());
    }

    public List<WeeklyStatsDTO> getWeeklyStats() {
        return energyRepository.findWeeklyStats();
    }

    public EnergyReading getLatestReading() {
        List<EnergyReading> recent = energyRepository.findTop100ByOrderByTimestampDesc();
        return recent.isEmpty() ? null : recent.getFirst();
    }

    public void clearHistory() {
        energyRepository.deleteAllInBatch();
    }
}