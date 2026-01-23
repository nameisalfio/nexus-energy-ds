package com.energy.energy_server.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import com.energy.energy_server.model.EnergyReading;

public interface EnergyReadingRepository extends JpaRepository<EnergyReading, Long> {

    boolean existsByCorrelationId(String correlationId);

    List<EnergyReading> findByTimestampAfter(LocalDateTime timestamp);

    List<EnergyReading> findTop100ByOrderByTimestampDesc();
}