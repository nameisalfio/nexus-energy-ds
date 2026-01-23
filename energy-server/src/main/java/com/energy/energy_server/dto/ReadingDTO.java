package com.energy.energy_server.dto;

import com.energy.energy_server.model.EnergyReading;
import java.time.LocalDateTime;

public record ReadingDTO(
    Long id,
    LocalDateTime timestamp,
    double temperature,
    double humidity,
    double squareFootage, 
    int occupancy,
    String hvacUsage,
    String lightingUsage, 
    double renewableEnergy, 
    String dayOfWeek, 
    String holiday, 
    double energyConsumption
) {

    public static ReadingDTO fromEntity(EnergyReading entity) {
        return new ReadingDTO(
            entity.getId(),
            entity.getTimestamp(),
            entity.getTemperature() != null ? entity.getTemperature() : 0.0,
            entity.getHumidity() != null ? entity.getHumidity() : 0.0,
            entity.getSquareFootage() != null ? entity.getSquareFootage() : 0.0,
            entity.getOccupancy() != null ? entity.getOccupancy() : 0,
            entity.getHvacUsage(),
            entity.getLightingUsage(),
            entity.getRenewableEnergy() != null ? entity.getRenewableEnergy() : 0.0,
            entity.getDayOfWeek(),
            entity.getHoliday(),
            entity.getEnergyConsumption() != null ? entity.getEnergyConsumption() : 0.0
        );
    }
}