package com.energy.energy_server.dto;

public record GlobalStatsDTO(
    double averageTemperature,
    double totalEnergyConsumption,
    double peakLoad,
    long totalRecords
) {}
