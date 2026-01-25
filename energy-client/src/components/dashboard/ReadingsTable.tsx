import { Reading } from "@/types/types";
import { cn } from "@/lib/utils";
import { Clock, MapPin, Thermometer, Zap, Users, Lightbulb, Calendar } from "lucide-react";

export function ReadingsTable({ readings = [], maxRows = 10 }: { readings: Reading[], maxRows?: number }) {
  const displayReadings = readings.slice(0, maxRows);

  return (
    <div className="glass-card-elevated overflow-hidden animate-fade-in border-border/40">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-secondary/20">
              <th className="px-4 py-4 text-left font-black text-[10px] uppercase tracking-tighter text-muted-foreground/70"><Clock className="inline h-3 w-3 mr-1.5 text-primary"/> Time</th>
              <th className="px-4 py-4 text-left font-black text-[10px] uppercase tracking-tighter text-muted-foreground/70"><MapPin className="inline h-3 w-3 mr-1.5 text-primary"/> Zone</th>
              <th className="px-4 py-4 text-left font-black text-[10px] uppercase tracking-tighter text-muted-foreground/70"><Thermometer className="inline h-3 w-3 mr-1.5 text-primary"/> Temp</th>
              <th className="px-4 py-4 text-left font-black text-[10px] uppercase tracking-tighter text-muted-foreground/70"><Zap className="inline h-3 w-3 mr-1.5 text-primary"/> Energy</th>
              <th className="px-4 py-4 text-left font-black text-[10px] uppercase tracking-tighter text-muted-foreground/70"><Users className="inline h-3 w-3 mr-1.5 text-primary"/> Occ.</th>
              <th className="px-4 py-4 text-left font-black text-[10px] uppercase tracking-tighter text-muted-foreground/70"><Lightbulb className="inline h-3 w-3 mr-1.5 text-primary"/> Light</th>
              <th className="px-4 py-4 text-left font-black text-[10px] uppercase tracking-tighter text-muted-foreground/70">HVAC</th>
              <th className="px-4 py-4 text-left font-black text-[10px] uppercase tracking-tighter text-muted-foreground/70"><Calendar className="inline h-3 w-3 mr-1.5 text-primary"/> Day</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {displayReadings.map((reading, index) => (
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
                  <span className="text-xs font-black font-mono text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]">
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
                    "text-[10px] font-black px-2 py-0.5 rounded-md border",
                    reading.lightingUsage === "ON" ? "bg-yellow-400/10 text-yellow-500 border-yellow-500/20" : "bg-muted text-muted-foreground border-transparent"
                  )}>
                    {reading.lightingUsage || "OFF"}
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}