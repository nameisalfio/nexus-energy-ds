package com.energy.energy_server.service.components;

import java.time.LocalDateTime;
import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicBoolean;

import org.springframework.stereotype.Service;

import com.energy.energy_server.model.EnergyReading;
import com.energy.energy_server.repository.EnergyRepository;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class SimulationService {

    private final EnergyRepository repository;
    
    @Getter 
    private final Queue<EnergyReading> ingestionQueue = new ConcurrentLinkedQueue<>();
    
    @Getter
    private final AtomicBoolean isRunning = new AtomicBoolean(false);

    public void loadQueue(java.util.List<EnergyReading> readings) {
        ingestionQueue.clear();
        ingestionQueue.addAll(readings);
    }

    public void stop() {
        isRunning.set(false);
    }

    public void saveReading(EnergyReading entity) {
        entity.setTimestamp(LocalDateTime.now());
        repository.save(entity);
    }
    
    public long getRecordCount() {
        return repository.count();
    }
}