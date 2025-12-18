package com.energy.energy_server.service.components;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.energy.energy_server.model.EnergyReading;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class IngestionService {

    public List<EnergyReading> parseCsv(MultipartFile file) throws IOException {
        log.info("Component: Parsing CSV...");
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
        return buffer;
    }
}