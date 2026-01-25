import { useMemo } from "react";
import {
  Thermometer,
  Droplets,
  Zap,
  Leaf,
  Activity,
  TrendingUp,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { WeeklyTrendsChart } from "@/components/dashboard/WeeklyTrendsChart";
import { AIDigitalTwin } from "@/components/dashboard/AIDigitalTwin";
import { ReadingsTable } from "@/components/dashboard/ReadingsTable";
import type { WeeklyStat, AIInsight, Reading } from "@/types/reading";

// Mock data for demonstration
const mockWeeklyData: WeeklyStat[] = [
  { day: "Mon", actual: 2450, predicted: 2400, renewable: 980 },
  { day: "Tue", actual: 2680, predicted: 2650, renewable: 1020 },
  { day: "Wed", actual: 2340, predicted: 2500, renewable: 890 },
  { day: "Thu", actual: 2890, predicted: 2750, renewable: 1150 },
  { day: "Fri", actual: 3120, predicted: 3000, renewable: 1240 },
  { day: "Sat", actual: 1890, predicted: 2000, renewable: 950 },
  { day: "Sun", actual: 1650, predicted: 1800, renewable: 880 },
];

const mockInsights: AIInsight[] = [
  {
    id: "1",
    type: "optimization",
    title: "HVAC Schedule Optimization",
    description:
      "Shifting cooling cycles by 2 hours during peak solar generation can increase renewable usage by 18%.",
    impact: "Save 340 kWh/week",
    confidence: 94,
  },
  {
    id: "2",
    type: "warning",
    title: "Zone B-4 Efficiency Drop",
    description:
      "Detected 12% efficiency decrease in Building B, Zone 4. Recommend sensor calibration check.",
    impact: "Potential 8% energy waste",
    confidence: 87,
  },
  {
    id: "3",
    type: "info",
    title: "Weekend Pattern Detected",
    description:
      "Consistent low occupancy weekends present opportunity for deeper setback temperatures.",
    impact: "Additional 5% savings",
    confidence: 91,
  },
];

const mockReadings: Reading[] = [
  {
    id: "1",
    timestamp: new Date(),
    temperature: 23.4,
    humidity: 48,
    area: "Zone A-1",
    occupancy: 42,
    hvacStatus: "ON",
    lightLevel: 450,
    renewablePercent: 67,
    dayType: "Weekday",
    isHoliday: false,
    energyLoad: 245.8,
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 60000),
    temperature: 24.1,
    humidity: 52,
    area: "Zone B-2",
    occupancy: 28,
    hvacStatus: "AUTO",
    lightLevel: 380,
    renewablePercent: 54,
    dayType: "Weekday",
    isHoliday: false,
    energyLoad: 189.3,
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 120000),
    temperature: 22.8,
    humidity: 45,
    area: "Zone C-3",
    occupancy: 65,
    hvacStatus: "ON",
    lightLevel: 520,
    renewablePercent: 72,
    dayType: "Weekday",
    isHoliday: false,
    energyLoad: 312.5,
  },
  {
    id: "4",
    timestamp: new Date(Date.now() - 180000),
    temperature: 26.2,
    humidity: 58,
    area: "Zone B-4",
    occupancy: 18,
    hvacStatus: "ON",
    lightLevel: 290,
    renewablePercent: 48,
    dayType: "Weekday",
    isHoliday: false,
    energyLoad: 156.7,
  },
  {
    id: "5",
    timestamp: new Date(Date.now() - 240000),
    temperature: 21.5,
    humidity: 42,
    area: "Zone A-2",
    occupancy: 55,
    hvacStatus: "OFF",
    lightLevel: 680,
    renewablePercent: 81,
    dayType: "Weekday",
    isHoliday: false,
    energyLoad: 278.4,
  },
];

export default function UserDashboard() {
  const metrics = useMemo(
    () => ({
      avgTemp: 23.4,
      avgHumidity: 49,
      totalEnergy: 17420,
      renewableRatio: 64,
      efficiency: 92.3,
      peakLoad: 3120,
    }),
    []
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-8 px-6">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold tracking-tight">Observer Hub</h1>
          <p className="text-muted-foreground mt-1">
            Real-time energy analytics and AI-powered insights
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <MetricCard
            title="Avg Temperature"
            value={metrics.avgTemp}
            unit="°C"
            icon={Thermometer}
            status="online"
            trend={{ value: 2.3, isPositive: true }}
          />
          <MetricCard
            title="Avg Humidity"
            value={metrics.avgHumidity}
            unit="%"
            icon={Droplets}
            status="online"
          />
          <MetricCard
            title="Total Energy"
            value={(metrics.totalEnergy / 1000).toFixed(1)}
            unit="MWh"
            icon={Zap}
            trend={{ value: 5.2, isPositive: false }}
          />
          <MetricCard
            title="Renewable Mix"
            value={metrics.renewableRatio}
            unit="%"
            icon={Leaf}
            status="online"
            trend={{ value: 8.4, isPositive: true }}
          />
          <MetricCard
            title="System Efficiency"
            value={metrics.efficiency}
            unit="%"
            icon={Activity}
            status="online"
          />
          <MetricCard
            title="Peak Load"
            value={(metrics.peakLoad / 1000).toFixed(2)}
            unit="MW"
            icon={TrendingUp}
            status="warning"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Weekly Trends - Takes 2 columns */}
          <div className="xl:col-span-2">
            <WeeklyTrendsChart data={mockWeeklyData} />
          </div>

          {/* AI Digital Twin Sidecar */}
          <div className="xl:col-span-1">
            <AIDigitalTwin
              insights={mockInsights}
              isActive={true}
              expectedValue={2847}
              realValue={2934}
            />
          </div>
        </div>

        {/* Readings Table */}
        <div className="mt-6">
          <ReadingsTable readings={mockReadings} maxRows={5} />
        </div>
      </main>
    </div>
  );
}
