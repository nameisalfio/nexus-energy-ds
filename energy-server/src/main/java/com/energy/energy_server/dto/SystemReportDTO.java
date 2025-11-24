package com.energy.energy_server.dto;

import java.util.List;

/**
 * Coarse-grained object containing the full state of the system.
 * This DTO aggregates raw data, statistical analysis, and AI insights
 * to minimize network round-trips.
 */
public record SystemReportDTO(
    GlobalStatsDTO stats,
    List<ReadingDTO> recentReadings,
    AiInsightDTO aiInsights
) {}