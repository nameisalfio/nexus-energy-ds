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
  hvacUsage: string;
  lightingUsage: string;
  renewableEnergy: number;
  dayOfWeek: string;
  holiday: string;
  energyConsumption: number;
}

export interface SystemReport {
  stats: {
    averageTemperature: number;
    totalEnergyConsumption: number;
    peakLoad: number;
    totalRecords: number;
  };
  aiInsights: {
    anomalyDetected: boolean;
    expectedValue: number;
    actualValue: number;
    deviationPercent: number;
    optimizationSuggestion: string;
  };
  recentReadings: Reading[];
}
export interface AiInsight {
    anomalyDetected: boolean;
    expectedValue: number;
    actualValue: number;
    deviationPercent: number;
    optimizationSuggestion: string;
}

export interface WeeklyStat {
    day: string;
    avgConsumption: number;
}
