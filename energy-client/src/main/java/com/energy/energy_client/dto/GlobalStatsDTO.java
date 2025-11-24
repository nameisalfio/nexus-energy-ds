package com.energy.energy_client.dto;

public record GlobalStatsDTO(
    double averageTemperature,
    double totalEnergyConsumption,
    double peakLoad,
    long totalRecords
) {}
