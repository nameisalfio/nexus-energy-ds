export interface GlobalStats {
    averageTemperature: number;
    totalEnergyConsumption: number;
    peakLoad: number;
    totalRecords: number;
}

export interface Reading {
    id: number;
    timestamp: string;
    temperature: number;
    humidity: number;
    squareFootage: number;
    occupancy: number;
    hvacStatus: string;
    lightingStatus: string;
    renewableEnergy: number;
    dayOfWeek: string;
    holiday: string;
    consumption: number;
}

export interface AiInsight {
    anomalyDetected: boolean;
    expectedValue: number;
    actualValue: number;
    deviationPercent: number;
    optimizationSuggestion: string;
}

export interface SystemReport {
    stats: GlobalStats;
    recentReadings: Reading[];
    aiInsights: AiInsight;
}

export interface WeeklyStat {
    day: string;
    avgConsumption: number;
}
