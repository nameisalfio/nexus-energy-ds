package com.energy.energy_server.service.components;

import com.energy.energy_server.model.EnergyReading;
import java.util.List;

public interface SimulationService {

    void loadQueue(List<EnergyReading> readings);

    void start();

    void stop();

}