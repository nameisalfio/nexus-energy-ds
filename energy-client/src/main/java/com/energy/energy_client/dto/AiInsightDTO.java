package com.energy.energy_client.dto;

public record AiInsightDTO(
    boolean anomalyDetected,
    double predictedLoadNextHour,
    String optimizationSuggestion
) {}