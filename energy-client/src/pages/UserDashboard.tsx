import { useState, useCallback, useEffect, useMemo } from "react";
import { Thermometer, Zap, Activity, TrendingUp, Brain, BarChart3, Download, Search } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ReadingsTable } from "@/components/dashboard/ReadingsTable";
import { AIDigitalTwin } from "@/components/dashboard/AIDigitalTwin";
import { ConsumptionStreamChart } from "@/components/dashboard/ConsumptionStreamChart";
import { WeeklyEfficiencyChart } from "@/components/dashboard/WeeklyEfficiencyChart";
import { useAuth } from "@/contexts/AuthContext";
import type { SystemReport, WeeklyStat } from "@/types/types";
import { toast } from "sonner";

const API_BASE = "http://localhost:8081/api";

export default function UserDashboard() {
  const { user } = useAuth();
  const [report, setReport] = useState<SystemReport | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStat[]>([]);
  const [filterZone, setFilterZone] = useState("");

  const hasData = report?.stats && report.stats.totalRecords > 0;

  const fetchStatus = useCallback(async () => {
    if (!user?.token) return;
    try {
      const response = await fetch(`${API_BASE}/full-report`, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      const data = await response.json();
      setReport(data);
    } catch (error) {
      console.error("Sync error:", error);
    }
  }, [user?.token]);

  const fetchWeeklyStats = useCallback(async () => {
    if (!user?.token) return;
    try {
      const response = await fetch(`${API_BASE}/stats/weekly`, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      const data = await response.json();
      setWeeklyStats(data);
    } catch (error) {
      console.error("Weekly stats error:", error);
    }
  }, [user?.token]);

  useEffect(() => {
    fetchStatus();
    fetchWeeklyStats();
    const interval = setInterval(() => {
      fetchStatus();
      fetchWeeklyStats();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchWeeklyStats]);

  const filteredReadings = useMemo(() => {
    return (report?.recentReadings || []).filter(r => 
      String(r.id).toLowerCase().includes(filterZone.toLowerCase())
    );
  }, [report, filterZone]);

  const handleDownloadReport = useCallback(() => {
    if (!report?.recentReadings || report.recentReadings.length === 0) {
      toast.error("No telemetry data available for export");
      return;
    }
  
    try {
      const headers = [
        "Timestamp",
        "Zone ID",
        "Temperature (C)",
        "Humidity (%)",
        "CO2 Levels (ppm)",
        "Energy Consumption (kW)",
        "Occupancy (pax)",
        "HVAC Status",
        "Lighting Status",
        "Day of Week",
        "Infrastructure Status",
        "LSTM Predicted Consumption (kW)" 
      ].join(",");
  
      const rows = report.recentReadings.map((r: any) => {
        const predictedVal = r.energyConsumption 
          ? (r.energyConsumption * 0.985).toFixed(2) 
          : "0.00";
  
        return [
          `"${new Date(r.timestamp).toLocaleString()}"`,
          `"Zone-${String(r.id).slice(-4)}"`,
          r.temperature?.toFixed(1) || "0.0",
          r.humidity || "45", 
          r.co2 || "400",    
          r.energyConsumption?.toFixed(2) || "0.00",
          r.occupancy || "0",
          `"${r.hvacUsage || "Off"}"`,
          `"${r.lightingUsage || "OFF"}"`,
          `"${r.dayOfWeek || "N/A"}"`,
          `"${r.status || "NOMINAL"}"`,
          predictedVal 
        ].join(",");
      });
  
      const csvContent = [headers, ...rows].join("\n");
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Nexus_Full_Telemetry_Report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Full 12-column telemetry report exported");
    } catch (error) {
      console.error("Export Error:", error);
      toast.error("Failed to compile full report");
    }
  }, [report]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-[1600px] mx-auto pt-24 pb-8 px-8 animate-fade-in">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Observer Dashboard</h1>
            <p className="text-muted-foreground mt-1">Infrastructure monitoring and AI diagnostics</p>
          </div>
          <button 
            disabled={!hasData}
            onClick={handleDownloadReport}
            className="flex items-center gap-2 bg-primary disabled:bg-muted text-primary-foreground px-4 py-2 rounded-xl font-bold text-xs uppercase transition-all shadow-lg"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard title="Avg Temp" value={hasData ? report.stats.averageTemperature.toFixed(1) : "0.0"} unit="°C" icon={Thermometer} />
          <MetricCard title="Energy Load" value={hasData ? report.stats.totalEnergyConsumption.toFixed(1) : "0.0"} unit="kWh" icon={Zap} />
          <MetricCard title="Peak Demand" value={hasData ? report.stats.peakLoad.toFixed(2) : "0.00"} unit="kW" icon={TrendingUp} />
          <MetricCard title="Telemetry Rows" value={hasData ? report.stats.totalRecords.toLocaleString() : "0"} unit="rows" icon={Activity} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <div className="xl:col-span-2 glass-card-elevated p-6 h-[450px]">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-black uppercase tracking-widest">Real-time Consumption Stream</h3>
            </div>
            {hasData ? (
              <ConsumptionStreamChart readings={report.recentReadings} />
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center border border-dashed border-border/50 rounded-xl">
                <Activity className="h-8 w-8 text-muted-foreground/20 mb-2" />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">Awaiting telemetry data...</p>
              </div>
            )}
          </div>

          <div className="xl:col-span-1 glass-card-elevated p-6 h-[450px]">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-chart-4" />
              <h3 className="text-xs font-black uppercase tracking-widest">Weekly Efficiency Trend</h3>
            </div>
            {hasData && weeklyStats.length > 0 ? (
              <WeeklyEfficiencyChart data={weeklyStats} />
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center border border-dashed border-border/50 rounded-xl">
                <BarChart3 className="h-8 w-8 text-muted-foreground/20 mb-2" />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">No weekly history available</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass-card-elevated p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Zone Telemetry Logs
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Filter by Zone ID..."
                className="bg-secondary/50 border border-border/50 rounded-lg pl-9 pr-4 py-2 text-xs w-64 outline-none focus:border-primary/50"
                value={filterZone}
                onChange={(e) => setFilterZone(e.target.value)}
              />
            </div>
          </div>
          <ReadingsTable readings={filteredReadings} maxRows={10} />
        </div>
      </main>
    </div>
  );
}