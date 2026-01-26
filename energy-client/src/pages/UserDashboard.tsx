import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Thermometer, Zap, Activity, TrendingUp, BarChart3, Download, Search, Filter, ChevronRight, RotateCcw } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ReadingsTable } from "@/components/dashboard/ReadingsTable";
import { ConsumptionStreamChart } from "@/components/dashboard/ConsumptionStreamChart";
import { WeeklyEfficiencyChart } from "@/components/dashboard/WeeklyEfficiencyChart";
import { useAuth } from "@/contexts/AuthContext";
import type { SystemReport, WeeklyStat, SystemStatus, Reading } from "@/types/types";
import { toast } from "sonner";

const API_BASE = "http://localhost:8081/api";

export default function UserDashboard() {
  const { user } = useAuth();
  const [report, setReport] = useState<SystemReport | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStat[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>("IDLE");
  
  // Advanced Filtering States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeAttr, setActiveAttr] = useState<keyof Reading | null>(null);
  const [filterValue, setFilterValue] = useState<any>("All");
  const [rangeValue, setRangeValue] = useState<[number, number]>([0, 200]);
  
  const scrollPos = useRef(0);
  const hasData = report?.stats && report.stats.totalRecords > 0;

  // Persistence of scroll position during re-renders
  useEffect(() => {
    window.scrollTo(0, scrollPos.current);
  });

  const saveScroll = () => {
    scrollPos.current = window.scrollY;
  };

  // Logic to identify if an attribute is numeric for Slider UI
  const isNumeric = (attr: keyof Reading | null) => {
    if (!attr) return false;
    return ["temperature", "humidity", "energyConsumption", "renewableEnergy", "occupancy", "squareFootage"].includes(attr);
  };

  // Map internal keys to professional UI labels
  const labelMap: Record<string, string> = {
    dayOfWeek: "DAY",
    hvacUsage: "HVAC",
    lightingUsage: "LIGHT",
    holiday: "HOLIDAY",
    temperature: "TEMP",
    humidity: "HUMIDITY",
    energyConsumption: "ENERGY",
    occupancy: "OCC."
  };

  // Extract unique values for categorical attributes
  const uniqueValues = useMemo(() => {
    if (!report?.recentReadings || !activeAttr || isNumeric(activeAttr)) return [];
    const values = report.recentReadings.map((r: any) => String(r[activeAttr]));
    return ["All", ...Array.from(new Set(values))];
  }, [report, activeAttr]);

  // Unified Filtering Logic: Search + Nested Attributes + Sliders
  const filteredReadings = useMemo(() => {
    if (!report?.recentReadings) return [];
    return report.recentReadings.filter((r: Reading) => {
      const matchesSearch = searchQuery === "" || 
        Object.values(r).some(val => String(val).toLowerCase().includes(searchQuery.toLowerCase()));
      
      if (!activeAttr) return matchesSearch;

      if (isNumeric(activeAttr)) {
        const val = Number(r[activeAttr]);
        return matchesSearch && (val >= rangeValue[0] && val <= rangeValue[1]);
      } else {
        return matchesSearch && (filterValue === "All" || String(r[activeAttr]) === filterValue);
      }
    });
  }, [report, searchQuery, activeAttr, filterValue, rangeValue]);

  // Data Fetching
  const fetchStatus = useCallback(async () => {
    if (!user?.token) return;
    try {
      const response = await fetch(`${API_BASE}/full-report`, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      const data = await response.json();
      setReport(data);
    } catch (error) { console.error("Sync error:", error); }
  }, [user?.token]);

  const fetchSystemStatus = useCallback(async () => {
    if (!user?.token) return;
    try {
      const response = await fetch(`${API_BASE}/simulation/status`, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data.status);
      }
    } catch (error) { console.error("Status check failed"); }
  }, [user?.token]);

  const fetchWeeklyStats = useCallback(async () => {
    if (!user?.token) return;
    try {
      const response = await fetch(`${API_BASE}/stats/weekly`, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      const data = await response.json();
      setWeeklyStats(data);
    } catch (error) { console.error("Weekly stats error:", error); }
  }, [user?.token]);

  useEffect(() => {
    fetchSystemStatus();
    fetchStatus();
    fetchWeeklyStats();
    const interval = setInterval(() => {
      fetchSystemStatus();
      if (systemStatus === "STREAMING") {
        fetchStatus();
        fetchWeeklyStats();
      }
    }, systemStatus === "STREAMING" ? 3000 : 10000);
    return () => clearInterval(interval);
  }, [systemStatus, fetchStatus, fetchSystemStatus, fetchWeeklyStats]);

  const handleDownloadReport = useCallback(() => {
    if (!filteredReadings.length) return;
    try {
      const headers = ["Timestamp", "Zone ID", "Temp", "Hum", "Energy", "Occ", "HVAC", "Light", "Day"].join(",");
      const rows = filteredReadings.map((r: any) => [
        `"${new Date(r.timestamp).toLocaleString()}"`,
        `"Zone-${String(r.id).slice(-4)}"`,
        r.temperature, r.humidity, r.energyConsumption, r.occupancy, r.hvacUsage, r.lightingUsage, r.dayOfWeek
      ].join(","));
      const csvContent = "\uFEFF" + [headers, ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Nexus_Report_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      toast.success("Report exported");
    } catch (error) { toast.error("Export failed"); }
  }, [filteredReadings]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-[1600px] mx-auto pt-24 pb-8 px-8 animate-fade-in">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Observer Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1 tracking-tight">Full infrastructure monitoring and diagnostics</p>
          </div>
          <button 
            disabled={!hasData}
            onClick={handleDownloadReport}
            className="flex items-center gap-2 bg-primary disabled:bg-muted text-primary-foreground px-4 py-2 rounded-xl font-bold text-xs uppercase transition-all shadow-lg hover:opacity-90 active:scale-95"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard title="Avg Temp" value={hasData ? report.stats.averageTemperature.toFixed(1) : "0.0"} unit="°C" icon={Thermometer} />
          <MetricCard title="Energy Load" value={hasData ? report.stats.totalEnergyConsumption.toFixed(1) : "0.0"} unit="kWh" icon={Zap} />
          <MetricCard title="Peak Demand" value={hasData ? report.stats.peakLoad.toFixed(2) : "0.00"} unit="kW" icon={TrendingUp} />
          <MetricCard title="Telemetry Rows" value={hasData ? report.stats.totalRecords.toLocaleString() : "0"} unit="rows" icon={Activity} />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          <div className="xl:col-span-2 glass-card-elevated p-6 h-[450px]">
             <ConsumptionStreamChart readings={report?.recentReadings || []} />
          </div>
          <div className="xl:col-span-1 glass-card-elevated p-6 h-[450px]">
             <WeeklyEfficiencyChart data={weeklyStats} />
          </div>
        </div>

        {/* Multi-Level Filtering Section */}
        <div className="glass-card-elevated p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
              <Activity className="h-4 w-4" /> Multi-Level Data Explorer
            </h3>
            
            <div className="flex flex-wrap gap-3 items-center">
              {/* Level 1: Attribute Selection with Proper Labels */}
              <div className="relative group">
                <button className="bg-secondary/50 border border-border/50 rounded-lg px-4 py-2 text-xs font-bold flex items-center gap-2 hover:bg-primary/10 transition-all uppercase tracking-wider">
                  <Filter className="h-3.5 w-3.5 text-primary" />
                  {activeAttr ? (labelMap[activeAttr] || activeAttr) : "By Field"}
                </button>
                <div className="absolute top-full left-0 mt-2 w-48 bg-background border border-border rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60] overflow-hidden">
                  {Object.keys(labelMap).map(attr => (
                    <button 
                      key={attr}
                      onClick={() => { saveScroll(); setActiveAttr(attr as keyof Reading); setFilterValue("All"); }}
                      className="w-full text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 flex justify-between items-center group/item transition-colors"
                    >
                      {labelMap[attr]} <ChevronRight className="h-3 w-3 opacity-0 group-hover/item:opacity-100 text-primary" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Level 2: Nested Values or Sliders */}
              {activeAttr && (
                <div className="flex items-center gap-3 animate-in slide-in-from-left-2">
                  {isNumeric(activeAttr) ? (
                    <div className="flex items-center gap-4 bg-primary/5 px-4 py-2 rounded-lg border border-primary/20">
                      <span className="text-[10px] font-black uppercase text-primary tracking-tighter">Limit:</span>
                      <input 
                        type="range" min="0" max="200" step="1"
                        value={rangeValue[1]}
                        onChange={(e) => { saveScroll(); setRangeValue([rangeValue[0], Number(e.target.value)]); }}
                        className="w-24 accent-primary"
                      />
                      <span className="text-xs font-mono font-bold text-primary">{rangeValue[1]}</span>
                    </div>
                  ) : (
                    <div className="relative group">
                      <button className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider">
                        Value: <span className="text-primary font-black ml-1">{filterValue}</span>
                      </button>
                      <div className="absolute top-full left-0 mt-2 w-48 bg-background border border-border rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60] max-h-64 overflow-y-auto">
                        {uniqueValues.map(val => (
                          <button 
                            key={val}
                            onClick={() => { saveScroll(); setFilterValue(val); }}
                            className="w-full text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:bg-primary/10 transition-colors"
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Universal Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Fast search..."
                  className="bg-secondary/50 border border-border/50 rounded-lg pl-9 pr-4 py-2 text-xs w-40 outline-none focus:border-primary/50 transition-all font-medium"
                  value={searchQuery}
                  onChange={(e) => { saveScroll(); setSearchQuery(e.target.value); }}
                />
              </div>

              {/* Beautiful Reset Button */}
              {(activeAttr || searchQuery !== "") && (
                 <button 
                   onClick={() => { saveScroll(); setActiveAttr(null); setFilterValue("All"); setSearchQuery(""); setRangeValue([0, 200]); }}
                   className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-white transition-all text-[10px] font-black uppercase tracking-widest active:scale-95 shadow-sm"
                 >
                   <RotateCcw className="h-3 w-3" /> Reset
                 </button>
              )}
            </div>
          </div>

          <ReadingsTable readings={filteredReadings} maxRows={10} />
          
          {filteredReadings.length === 0 && (
            <div className="py-20 text-center text-muted-foreground italic text-xs tracking-widest uppercase opacity-40">
              No matching records found
            </div>
          )}
        </div>
      </main>
    </div>
  );
}