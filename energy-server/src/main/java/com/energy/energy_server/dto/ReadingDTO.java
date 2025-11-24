package com.energy.energy_server.dto;

import java.time.LocalDateTime;

public record ReadingDTO(
    Long id,
    LocalDateTime timestamp,
    double temperature,
    double humidity,
    double squareFootage, 
    int occupancy,
    String hvacStatus,
    String lightingStatus, 
    double renewableEnergy, 
    String dayOfWeek, 
    String holiday, 
    double consumption
) {}