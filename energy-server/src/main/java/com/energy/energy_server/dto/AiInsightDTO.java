package com.energy.energy_server.dto;

public record AiInsightDTO(
    boolean anomalyDetected,
    double expectedValue,    
    double actualValue,      
    double deviationPercent, 
    String optimizationSuggestion
) {}