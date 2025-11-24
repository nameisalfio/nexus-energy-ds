package com.energy.energy_server.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.energy.energy_server.dto.WeeklyStatsDTO; 
import com.energy.energy_server.model.EnergyReading;

@Repository
public interface EnergyRepository extends JpaRepository<EnergyReading, Long> {

    List<EnergyReading> findTop100ByOrderByTimestampDesc();

    @Query("SELECT new com.energy.energy_server.dto.WeeklyStatsDTO(e.dayOfWeek, AVG(e.energyConsumption)) " +
           "FROM EnergyReading e GROUP BY e.dayOfWeek")
    List<WeeklyStatsDTO> findWeeklyStats();
}