import { useState, useCallback, useEffect } from "react";
import { Thermometer, Zap, Activity, TrendingUp, Brain, BarChart3, Calendar } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AccessControlPanel } from "@/components/admin/AccessControlPanel";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ReadingsTable } from "@/components/dashboard/ReadingsTable";
import { AIDigitalTwin } from "@/components/dashboard/AIDigitalTwin";
import { ConsumptionStreamChart } from "@/components/dashboard/ConsumptionStreamChart";
import { WeeklyEfficiencyChart } from "@/components/dashboard/WeeklyEfficiencyChart";
import { useAuth } from "@/contexts/AuthContext";
import type { SystemStatus, SystemReport, WeeklyStat } from "@/types/types";
import { toast } from "sonner";

const API_BASE = "http://localhost:8081/api";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [systemStatus, setSystemStatus] = useState<SystemStatus>("IDLE");
  const [report, setReport] = useState<SystemReport | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStat[]>([]);
  const [isAccessControlOpen, setIsAccessControlOpen] = useState(false);
  const [isDatasetLoaded, setIsDatasetLoaded] = useState(false);

  // Data Fetching: Infrastructure Report
  const fetchStatus = useCallback(async () => {
    if (!user?.token) return;
    try {
      const response = await fetch(`${API_BASE}/full-report`, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (!response.ok) throw new Error();
      const data: SystemReport = await response.json();
      setReport(data);
    } catch (error) {
      console.error("Infrastructure Sync Error:", error);
    }
  }, [user?.token]);

  // Data Fetching: Weekly Analytics
  const fetchWeeklyStats = useCallback(async () => {
    if (!user?.token) return;
    try {
      const response = await fetch(`${API_BASE}/stats/weekly`, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (!response.ok) throw new Error();
      const data: WeeklyStat[] = await response.json();
      setWeeklyStats(data);
    } catch (error) {
      console.error("Weekly Stats Sync Error:", error);
    }
  }, [user?.token]);

  // Polling Management
  useEffect(() => {
    fetchStatus();
    if (systemStatus === "STREAMING") {
      const interval = setInterval(() => {
        fetchStatus();
        fetchWeeklyStats();
      }, 3000); 
      return () => clearInterval(interval);
    } else {
      fetchWeeklyStats();
    }
  }, [systemStatus, fetchStatus, fetchWeeklyStats]);

  // Simulation Handlers
  const handleStartSimulation = useCallback(async () => {
    if (!user?.token) return;
    try {
      const response = await fetch(`${API_BASE}/simulation/start`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (response.ok) {
        setSystemStatus("STREAMING"); 
        toast.success("Nexus Simulation Engine Online");
        fetchStatus();
      }
    } catch (error) {
      toast.error("Engine start failed");
    }
  }, [user?.token, fetchStatus]);

  const handleStopSimulation = useCallback(async () => {
    if (!user?.token) return;
    try {
      const response = await fetch(`${API_BASE}/simulation/stop`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (response.ok) {
        setSystemStatus("IDLE");
        toast.info("Simulation engine halted");
        fetchStatus();
      }
    } catch (error) {
      toast.error("Emergency stop failed");
    }
  }, [user?.token, fetchStatus]);

  const handlePurgeData = useCallback(async () => {
    if (!user?.token) return;
    try {
      const response = await fetch(`${API_BASE}/admin/data/clear`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (response.ok) {
        toast.success("Core database purged");
        fetchStatus();
        fetchWeeklyStats();
      }
    } catch (error) {
      toast.error("Purge operation denied");
    }
  }, [user?.token, fetchStatus, fetchWeeklyStats]);

  const handleUploadCSV = useCallback(async (file: File) => {
    if (!user?.token) return;
    setSystemStatus("PROCESSING");
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE}/ingest-dataset`, {
        method: 'POST',
        headers: { "Authorization": `Bearer ${user.token}` },
        body: formData,
      });

      if (response.ok) {
        toast.success("Dataset synchronized successfully");
        setIsDatasetLoaded(true); 
        await fetchStatus();
      }
    } catch (err) {
      toast.error("Ingestion failed");
    } finally {
      setSystemStatus("IDLE");
    }
  }, [user?.token, fetchStatus]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <AdminSidebar
        systemStatus={systemStatus}
        totalRecords={report?.stats?.totalRecords || 0}
        isDatasetLoaded={isDatasetLoaded}
        onUploadCSV={handleUploadCSV}
        onStartSimulation={handleStartSimulation}
        onStopSimulation={handleStopSimulation}
        onPurgeData={handlePurgeData}
        onOpenAccessControl={() => setIsAccessControlOpen(true)}
      />

      <AccessControlPanel isOpen={isAccessControlOpen} onClose={() => setIsAccessControlOpen(false)} />

      <main className="ml-[300px] pt-20 pb-8 px-6">
        {/* Header Section */}
        <div className="mb-8 animate-fade-in flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Command Center</h1>
            <p className="text-muted-foreground mt-1 text-sm">Real-time infrastructure and predictive modeling</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border">
             <span className={`h-2 w-2 rounded-full ${systemStatus === 'STREAMING' ? 'bg-success animate-pulse' : 'bg-muted'}`} />
             <span className="text-[10px] font-black uppercase tracking-widest">{systemStatus}</span>
          </div>
        </div>

        {/* Top Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard title="Avg Temp" value={report?.stats?.averageTemperature?.toFixed(1) || "0.0"} unit="°C" icon={Thermometer} />
          <MetricCard title="Energy Load" value={(report?.stats?.totalEnergyConsumption || 0).toFixed(1)} unit="kWh" icon={Zap} />
          <MetricCard title="Peak Demand" value={report?.stats?.peakLoad?.toFixed(2) || "0.00"} unit="kW" icon={TrendingUp} />
          <MetricCard title="Telemetry Rows" value={report?.stats?.totalRecords?.toLocaleString() || "0"} unit="rows" icon={Activity} />
        </div>

        {/* Analytics Section - Dual Chart Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          {/* Main Chart: Real-time actual vs predicted */}
          <div className="xl:col-span-2">
            <div className="glass-card-elevated p-6 h-[450px]">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-sm uppercase tracking-widest">Consumption Stream (Live vs AI)</h3>
              </div>
              <ConsumptionStreamChart readings={report?.recentReadings || []} />
            </div>
          </div>

          {/* AI Digital Twin */}
          <div className="xl:col-span-1">
            {report?.aiInsights ? (
              <AIDigitalTwin
                insight={report.aiInsights.optimizationSuggestion}
                expectedValue={report.aiInsights.expectedValue}
                realValue={report.aiInsights.actualValue}
                deviation={report.aiInsights.deviationPercent}
                confidence={report.aiInsights.confidenceScore}
                isActive={systemStatus === "STREAMING"}
              />
            ) : (
              <div className="glass-card-elevated p-8 flex flex-col items-center justify-center h-full text-center border-dashed">
                <Brain className="h-10 w-10 text-primary/20 mb-4 animate-pulse" />
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter italic opacity-50">Synchronizing Predictive Engine...</p>
              </div>
            )}
          </div>
        </div>

        {/* Secondary Analytics Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
           {/* Weekly Chart: Historial averages */}
           <div className="xl:col-span-1 glass-card-elevated p-6 h-[400px]">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-sm uppercase tracking-widest">Weekly Efficiency</h3>
              </div>
              <WeeklyEfficiencyChart data={weeklyStats} />
           </div>

           {/* Table: Latest Logs */}
           <div className="xl:col-span-2 glass-card-elevated p-6 h-[400px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> Infrastructure Logs
                </h3>
              </div>
              <ReadingsTable readings={report?.recentReadings || []} maxRows={6} />
           </div>
        </div>
      </main>
    </div>
  );
}