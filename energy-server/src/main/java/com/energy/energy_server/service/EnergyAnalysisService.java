package com.energy.energy_server.service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

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

    private final Queue<EnergyReading> ingestionQueue = new ConcurrentLinkedQueue<>();
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();
    private final AtomicBoolean isRunning = new AtomicBoolean(false);

    @jakarta.annotation.PostConstruct
    public void init() {
        log.info("Cleaning Database on Startup...");
        repository.deleteAll();
        ingestionQueue.clear();
    }

    @Transactional
    public void ingestCsvData(MultipartFile file) throws IOException {
        log.info("Receiving CSV. Parsing into RAM Queue (Database NOT touched yet)...");
        
        List<EnergyReading> buffer = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            boolean isFirst = true;
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

            while ((line = br.readLine()) != null) {
                if (isFirst) { isFirst = false; continue; }
                
                String[] data = line.split(",");
                EnergyReading entity = new EnergyReading();
                
                entity.setTimestamp(LocalDateTime.parse(data[0], formatter)); 
                entity.setTemperature(Double.valueOf(data[1]));
                entity.setHumidity(Double.valueOf(data[2]));
                entity.setSquareFootage(Double.valueOf(data[3]));
                entity.setOccupancy(Integer.valueOf(data[4]));
                entity.setHvacUsage(data[5]);
                entity.setLightingUsage(data[6]);
                entity.setRenewableEnergy(Double.valueOf(data[7]));
                entity.setDayOfWeek(data[8]);
                entity.setHoliday(data[9]);
                entity.setEnergyConsumption(Double.valueOf(data[10]));
                
                buffer.add(entity);
            }
        }
        
        ingestionQueue.addAll(buffer);
        log.info("Loaded {} records into RAM Queue. Waiting for START command.", buffer.size());
    }

    @Async("taskExecutor") 
    public void startSimulation() {
        if (isRunning.get()) {
            log.warn("Simulation already running!");
            return;
        }
        isRunning.set(true);
        log.info("🚀 Simulation Started manually.");

        while (!ingestionQueue.isEmpty() && isRunning.get()) {
            try {
                TimeUnit.MILLISECONDS.sleep(1000);
                EnergyReading entity = ingestionQueue.poll();
                if (entity == null) break;

                entity.setTimestamp(LocalDateTime.now());
                repository.save(entity);

                // Calcola Report e Invia
                SystemReportDTO liveReport = generateFullReport();
                broadcast(liveReport);

            } catch (Exception e) {
                log.error("Simulation step failed", e);
            }
        }
        isRunning.set(false);
        log.info("🏁 Simulation Stopped (Queue empty or User stop)");
    }

    public void stopSimulation() {
        log.info("🛑 Simulation Stopping...");
        isRunning.set(false);
    }

    @Transactional(readOnly = true)
    public SystemReportDTO generateFullReport() {
        List<EnergyReading> recentData = repository.findTop100ByOrderByTimestampDesc();
        long count = repository.count();

        if (recentData.isEmpty()) {
            return buildEmptyReport();
        }
        
        EnergyReading current = recentData.get(0);
        List<EnergyReading> allData = repository.findAll();
        Double avgTemp = allData.stream().mapToDouble(e -> e.getTemperature() != null ? e.getTemperature() : 0.0).average().orElse(0.0);
        Double totalEnergy = allData.stream().mapToDouble(e -> e.getEnergyConsumption() != null ? e.getEnergyConsumption() : 0.0).sum();
        Double peakLoad = allData.stream().mapToDouble(e -> e.getEnergyConsumption() != null ? e.getEnergyConsumption() : 0.0).max().orElse(0.0);
        
        GlobalStatsDTO stats = new GlobalStatsDTO(avgTemp, totalEnergy, peakLoad, count);

        // AI
        double predicted = aiService.predictNextHour(recentData);
        double actual = current.getEnergyConsumption() != null ? current.getEnergyConsumption() : 0.0;
        double deviation = (actual > 0) ? Math.abs(predicted - actual) / actual * 100.0 : 0.0;
        boolean anomaly = deviation > 20.0;

        AiInsightDTO ai = new AiInsightDTO(
            anomaly, predicted, actual, deviation,
            anomaly ? "⚠️ Anomaly Detected!" : "✅ System Normal."
        );

        ReadingDTO currentDto = mapToDTO(current);
        return new SystemReportDTO(stats, Collections.singletonList(currentDto), ai);
    }

    @Transactional(readOnly = true)
    public List<WeeklyStatsDTO> getWeeklyStats() { return repository.findWeeklyStats(); }
    
    private ReadingDTO mapToDTO(EnergyReading e) {
        return new ReadingDTO(
            e.getId(),
            e.getTimestamp(),
            e.getTemperature() != null ? e.getTemperature() : 0.0,
            e.getHumidity() != null ? e.getHumidity() : 0.0,
            e.getSquareFootage() != null ? e.getSquareFootage() : 0.0,
            e.getOccupancy() != null ? e.getOccupancy() : 0,
            e.getHvacUsage() != null ? e.getHvacUsage() : "Unknown",
            e.getLightingUsage() != null ? e.getLightingUsage() : "Unknown",
            e.getRenewableEnergy() != null ? e.getRenewableEnergy() : 0.0,
            e.getDayOfWeek() != null ? e.getDayOfWeek() : "N/A",
            e.getHoliday() != null ? e.getHoliday() : "No",
            e.getEnergyConsumption() != null ? e.getEnergyConsumption() : 0.0
        );
    }

    private SystemReportDTO buildEmptyReport() { return new SystemReportDTO(new GlobalStatsDTO(0,0,0,0), Collections.emptyList(), new AiInsightDTO(false,0,0,0,"Waiting for data...")); }
    
    public SseEmitter subscribe() { 
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError((Throwable ex) -> emitters.remove(emitter));
        emitters.add(emitter);
        return emitter;
    }
    
    private void broadcast(SystemReportDTO payload) {
        for (SseEmitter emitter : emitters) {
            try { emitter.send(SseEmitter.event().name("update").data(payload)); } 
            catch (Exception e) { emitters.remove(emitter); }
        }
    }
}