import { Reading } from "@/types/types";
import { cn } from "@/lib/utils";
import { Clock, MapPin, Thermometer, Zap, Users, Lightbulb, Calendar } from "lucide-react";

export function ReadingsTable({ readings = [], maxRows = 100 }: { readings: Reading[], maxRows?: number }) {
  const displayReadings = readings.slice(0, maxRows);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">

      <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-1 border rounded-lg border-border/10">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr className="sticky top-0 z-30">
              {[
                { icon: Clock, label: "Time" },
                { icon: MapPin, label: "Zone" },
                { icon: Thermometer, label: "Temp" },
                { icon: Zap, label: "Energy" },
                { icon: Users, label: "Occ." },
                { icon: Lightbulb, label: "Light" },
                { label: "HVAC" },
                { icon: Calendar, label: "Day" }
              ].map((header, i) => (
                <th
                  key={i}
                  className="px-4 py-4 text-left font-black text-[10px] uppercase tracking-tighter text-muted-foreground/70 bg-secondary/95 backdrop-blur-md border-b border-border/50"
                >
                  <span className="flex items-center gap-1.5">
                    {header.icon && <header.icon className="h-3 w-3 text-primary"/>}
                    {header.label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border/20">
            {displayReadings.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-xs text-muted-foreground italic uppercase tracking-widest opacity-40">
                  Waiting for telemetry stream...
                </td>
              </tr>
            ) : (
              displayReadings.map((reading, index) => (
                <tr key={reading.id || index} className="hover:bg-primary/5 transition-all duration-200 group">
                  <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground group-hover:text-primary transition-colors">
                    {reading.timestamp ? new Date(reading.timestamp).toLocaleTimeString() : "--:--"}
                  </td>
                  <td className="px-4 py-3 text-xs font-bold tracking-tight text-foreground">
                    Zone-{String(reading.id || "").slice(-4).toUpperCase()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "text-xs font-black font-mono px-2 py-0.5 rounded",
                      (reading.temperature || 0) > 26 ? "text-orange-400 bg-orange-400/10" : "text-blue-400 bg-blue-400/10"
                    )}>
                      {reading.temperature?.toFixed(1)}°C
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-black font-mono text-primary">
                      {reading.energyConsumption?.toFixed(2)} <span className="text-[10px] opacity-50 font-medium">kW</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                     <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-foreground">{reading.occupancy}</span>
                        <div className="h-1 w-8 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${Math.min((reading.occupancy || 0) * 10, 100)}%` }} />
                        </div>
                     </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter",
                      reading.lightingUsage === "On" ? "bg-status-online/10 text-status-online" : "bg-muted text-muted-foreground"
                    )}>
                      {reading.lightingUsage || "Off"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter",
                      reading.hvacUsage === "On" ? "bg-status-online/10 text-status-online" : "bg-muted text-muted-foreground"
                    )}>
                      <span className={cn("h-1 w-1 rounded-full", reading.hvacUsage === "On" ? "bg-status-online animate-pulse" : "bg-muted-foreground")} />
                      {reading.hvacUsage || "Off"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-bold text-muted-foreground/80 bg-secondary/30 px-2 py-1 rounded">
                      {reading.dayOfWeek}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}