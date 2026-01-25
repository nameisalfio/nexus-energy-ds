export interface Reading {
  id: string;
  timestamp: Date;
  temperature: number;     // Temp
  humidity: number;        // Hum
  area: string;            // Area
  occupancy: number;       // Occ
  hvacStatus: string;      // HVAC
  lightLevel: number;      // Light
  renewablePercent: number; // Renew
  dayType: string;         // Day
  isHoliday: boolean;      // Holiday
  energyLoad: number;      // Load
}

export interface WeeklyStat {
  day: string;
  actual: number;
  predicted: number;
  renewable: number;
}

export interface SystemReport {
  avgTemperature: number;
  avgHumidity: number;
  totalEnergy: number;
  renewableRatio: number;
  peakLoad: number;
  efficiency: number;
  totalReadings: number;
  aiInsights: AIInsight[];
}

export interface AIInsight {
  id: string;
  type: "optimization" | "warning" | "info";
  title: string;
  description: string;
  impact: string;
  confidence: number;
}

export type SystemStatus = "IDLE" | "STREAMING" | "PROCESSING" | "ERROR";
