package com.energy.energy_server.service.components;

import com.energy.energy_server.model.EnergyReading;
import com.energy.energy_server.repository.EnergyReadingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class IngestionService {

    private final EnergyReadingRepository repository;
    private final SimulationService simulationService;
    private final AuditService auditService;

    public void handleUpload(MultipartFile file) throws Exception {
        List<EnergyReading> readings = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        try (BufferedReader fileReader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
             CSVParser csvParser = CSVFormat.Builder.create(CSVFormat.DEFAULT)
                     .setHeader()
                     .setSkipHeaderRecord(true)
                     .setIgnoreHeaderCase(true)
                     .setTrim(true)
                     .build()
                     .parse(fileReader)) {

            for (CSVRecord csvRecord : csvParser) {
                EnergyReading entity = new EnergyReading();
                
                entity.setCorrelationId(java.util.UUID.randomUUID().toString());
                entity.setTimestamp(LocalDateTime.parse(csvRecord.get("Timestamp"), formatter));
                entity.setTemperature(Double.parseDouble(csvRecord.get("Temperature")));
                entity.setHumidity(Double.parseDouble(csvRecord.get("Humidity")));
                entity.setSquareFootage(Double.parseDouble(csvRecord.get("SquareFootage")));
                entity.setOccupancy(Integer.parseInt(csvRecord.get("Occupancy")));
                entity.setHvacUsage(csvRecord.get("HVACUsage"));
                entity.setLightingUsage(csvRecord.get("LightingUsage"));
                entity.setRenewableEnergy(Double.parseDouble(csvRecord.get("RenewableEnergy")));
                entity.setDayOfWeek(csvRecord.get("DayOfWeek"));
                entity.setHoliday(csvRecord.get("Holiday"));
                entity.setEnergyConsumption(Double.parseDouble(csvRecord.get("EnergyConsumption")));

                readings.add(entity);
            }

            if (!readings.isEmpty()) {
                repository.deleteAllInBatch();
                auditService.reset(readings.size());
                simulationService.loadQueue(readings);
                log.info("Ingested {} records", readings.size());
            }

        } catch (Exception e) {
            log.error("CSV ingestion failed", e);
            throw e;
        }
    }
}