package com.energy.energy_server.service;

import com.energy.energy_server.dto.AiInsightDTO;
import com.energy.energy_server.model.EnergyReading;
import java.util.List;

public interface AiModelService {

    void init();

    AiInsightDTO analyze(EnergyReading reading);

    double predictNextHour(List<EnergyReading> history);

}