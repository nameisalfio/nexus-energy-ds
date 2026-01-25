import { useState, useCallback, useMemo } from "react";
import {
  Thermometer,
  Droplets,
  Zap,
  Leaf,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AccessControlPanel } from "@/components/admin/AccessControlPanel";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { WeeklyTrendsChart } from "@/components/dashboard/WeeklyTrendsChart";
import { ReadingsTable } from "@/components/dashboard/ReadingsTable";
import type { SystemStatus, Reading, WeeklyStat } from "@/types/reading";
import { toast } from "sonner";

const generateMockReading = (index: number): Reading => ({
  id: `reading-${Date.now()}-${index}`,
  timestamp: new Date(Date.now() - index * 30000),
  temperature: 20 + Math.random() * 8,
  humidity: 40 + Math.random() * 25,
  area: [`Zone A-1`, `Zone B-2`, `Zone C-3`, `Zone B-4`, `Zone A-2`][index % 5],
  occupancy: Math.floor(Math.random() * 80),
  hvacStatus: ["ON", "OFF", "AUTO"][Math.floor(Math.random() * 3)],
  lightLevel: 200 + Math.random() * 500,
  renewablePercent: Math.floor(40 + Math.random() * 50),
  dayType: "Weekday",
  isHoliday: false,
  energyLoad: 100 + Math.random() * 300,
});

const getDayName = (date: Date): string => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[date.getDay()];
};

export default function AdminDashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>("IDLE");
  const [totalRecords, setTotalRecords] = useState(24567);
  const [readings, setReadings] = useState<Reading[]>(() =>
    Array.from({ length: 8 }, (_, i) => generateMockReading(i))
  );
  const [isAccessControlOpen, setIsAccessControlOpen] = useState(false);

  // Compute weekly data from readings dynamically
  const weeklyData = useMemo<WeeklyStat[]>(() => {
    const dayMap: Record<string, { actual: number; predicted: number; renewable: number; count: number }> = {
      Mon: { actual: 0, predicted: 0, renewable: 0, count: 0 },
      Tue: { actual: 0, predicted: 0, renewable: 0, count: 0 },
      Wed: { actual: 0, predicted: 0, renewable: 0, count: 0 },
      Thu: { actual: 0, predicted: 0, renewable: 0, count: 0 },
      Fri: { actual: 0, predicted: 0, renewable: 0, count: 0 },
      Sat: { actual: 0, predicted: 0, renewable: 0, count: 0 },
      Sun: { actual: 0, predicted: 0, renewable: 0, count: 0 },
    };

    readings.forEach((reading) => {
      const day = getDayName(new Date(reading.timestamp));
      if (dayMap[day]) {
        dayMap[day].actual += reading.energyLoad;
        dayMap[day].predicted += reading.energyLoad * (0.9 + Math.random() * 0.2);
        dayMap[day].renewable += reading.energyLoad * (reading.renewablePercent / 100);
        dayMap[day].count += 1;
      }
    });

    // If no readings, return baseline data
    if (readings.length === 0) {
      return Object.keys(dayMap).map((day) => ({
        day,
        actual: 0,
        predicted: 0,
        renewable: 0,
      }));
    }

    return Object.entries(dayMap).map(([day, data]) => ({
      day,
      actual: Math.round(data.count > 0 ? data.actual : 0),
      predicted: Math.round(data.count > 0 ? data.predicted : 0),
      renewable: Math.round(data.count > 0 ? data.renewable : 0),
    }));
  }, [readings]);

  // Compute energy metrics from readings
  const metrics = useMemo(() => {
    if (readings.length === 0) {
      return {
        avgTemp: 0,
        avgHumidity: 0,
        totalEnergy: 0,
        renewableMix: 0,
      };
    }

    const totals = readings.reduce(
      (acc, reading) => ({
        temp: acc.temp + reading.temperature,
        humidity: acc.humidity + reading.humidity,
        energy: acc.energy + reading.energyLoad,
        renewable: acc.renewable + (reading.energyLoad * reading.renewablePercent) / 100,
      }),
      { temp: 0, humidity: 0, energy: 0, renewable: 0 }
    );

    return {
      avgTemp: totals.temp / readings.length,
      avgHumidity: totals.humidity / readings.length,
      totalEnergy: totals.energy / 1000, // Convert to MWh
      renewableMix: (totals.renewable / totals.energy) * 100,
    };
  }, [readings]);

  const handleUploadCSV = useCallback(async (file: File) => {
    setSystemStatus("PROCESSING");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Add new mock readings when CSV is uploaded
    const newReadings = Array.from({ length: 20 }, (_, i) => generateMockReading(i));
    setReadings((prev) => [...newReadings, ...prev].slice(0, 50));
    setTotalRecords((prev) => prev + Math.floor(Math.random() * 5000) + 1000);
    setSystemStatus("IDLE");
    toast.success(`Dataset "${file.name}" loaded successfully`);
  }, []);

  const handleStartSimulation = useCallback(() => {
    setSystemStatus("STREAMING");
    toast.success("Simulation started - streaming live data");

    const interval = setInterval(() => {
      setReadings((prev) => {
        const newReading = generateMockReading(0);
        return [newReading, ...prev.slice(0, 49)];
      });
      setTotalRecords((prev) => prev + 1);
    }, 2000);

    (window as any).__simulationInterval = interval;
  }, []);

  const handleStopSimulation = useCallback(() => {
    setSystemStatus("IDLE");
    if ((window as any).__simulationInterval) {
      clearInterval((window as any).__simulationInterval);
    }
    toast.info("Simulation stopped");
  }, []);

  const handlePurgeData = useCallback(() => {
    if (confirm("Are you sure you want to purge all records? This action cannot be undone.")) {
      setTotalRecords(0);
      setReadings([]);
      toast.success("All records purged successfully");
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <AdminSidebar
        systemStatus={systemStatus}
        totalRecords={totalRecords}
        onUploadCSV={handleUploadCSV}
        onStartSimulation={handleStartSimulation}
        onStopSimulation={handleStopSimulation}
        onPurgeData={handlePurgeData}
        onOpenAccessControl={() => setIsAccessControlOpen(true)}
      />

      {/* Access Control Modal */}
      <AccessControlPanel
        isOpen={isAccessControlOpen}
        onClose={() => setIsAccessControlOpen(false)}
      />

      {/* Main content - offset by sidebar width */}
      <main className="ml-[300px] pt-20 pb-8 px-6">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Command Center</h1>
              <p className="text-muted-foreground mt-1">
                Infrastructure monitoring and system management
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
                  systemStatus === "STREAMING"
                    ? "bg-status-online/10 text-status-online"
                    : systemStatus === "PROCESSING"
                    ? "bg-status-warning/10 text-status-warning"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    systemStatus === "STREAMING"
                      ? "bg-status-online animate-pulse"
                      : systemStatus === "PROCESSING"
                      ? "bg-status-warning animate-pulse"
                      : "bg-muted-foreground"
                  }`}
                />
                {systemStatus}
              </div>
            </div>
          </div>
        </div>

        {/* Energy Metrics - Only these 4 cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Avg Temperature"
            value={metrics.avgTemp.toFixed(1)}
            unit="°C"
            icon={Thermometer}
            trend={{ value: 2.3, isPositive: true }}
          />
          <MetricCard
            title="Avg Humidity"
            value={Math.round(metrics.avgHumidity)}
            unit="%"
            icon={Droplets}
          />
          <MetricCard
            title="Total Energy Today"
            value={metrics.totalEnergy.toFixed(2)}
            unit="MWh"
            icon={Zap}
            trend={{ value: 5.2, isPositive: false }}
          />
          <MetricCard
            title="Renewable Mix"
            value={Math.round(metrics.renewableMix)}
            unit="%"
            icon={Leaf}
            trend={{ value: 8.4, isPositive: true }}
          />
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <WeeklyTrendsChart data={weeklyData} />
          <ReadingsTable readings={readings} maxRows={6} />
        </div>
      </main>
    </div>
  );
}
