export interface Reading {
  id: string;
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

export interface WeeklyStat {
  day: string;
  avgConsumption: number;
  expectedConsumption: number;
  renewableContribution: number;
}

export interface AIInsight {
  anomalyDetected: boolean;
  expectedValue: number;
  actualValue: number;
  deviationPercent: number;
  optimizationSuggestion: string;
  confidenceScore: number;
}

export interface SystemStats {
  averageTemperature: number;
  totalEnergyConsumption: number;
  peakLoad: number;
  totalRecords: number;
}

export interface SystemReport {
  stats: SystemStats;
  aiInsights: AIInsight;
  recentReadings: Reading[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: "ADMIN" | "USER";
}

export type SystemStatus = "IDLE" | "STREAMING" | "PROCESSING" | "ERROR";