package com.energy.energy_server.service.components;

import com.energy.energy_server.dto.SystemReportDTO;
import com.energy.energy_server.dto.WeeklyStatsDTO;
import com.energy.energy_server.model.EnergyReading;
import java.util.List;

public interface AnalyticsService {

    void clearHistory();

    EnergyReading getLatestReading();

    SystemReportDTO generateReport(EnergyReading latest);

    List<WeeklyStatsDTO> getWeeklyStats();

}