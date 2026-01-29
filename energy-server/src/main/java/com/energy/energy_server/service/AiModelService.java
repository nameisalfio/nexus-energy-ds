package com.energy.energy_server.service;

import java.util.List;

import com.energy.energy_server.model.EnergyReading;
import com.energy.energy_server.dto.AiInsightDTO;

import jakarta.annotation.PostConstruct;

public interface AiModelService {

    @PostConstruct
    void init();

    AiInsightDTO analyze(EnergyReading reading);

    double predictNextHour(List<EnergyReading> history);
}