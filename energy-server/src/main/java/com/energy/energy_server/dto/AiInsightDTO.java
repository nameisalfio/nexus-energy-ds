package com.energy.energy_server.dto;

public record AiInsightDTO(
    boolean anomalyDetected,
    double predictedLoadNextHour,
    String optimizationSuggestion
) {}