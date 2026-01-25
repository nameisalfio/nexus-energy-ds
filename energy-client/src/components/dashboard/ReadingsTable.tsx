import type { Reading } from "@/types/reading";
import { cn } from "@/lib/utils";
import { Clock, MapPin, Thermometer, Droplets, Zap } from "lucide-react";

interface ReadingsTableProps {
  readings: Reading[];
  maxRows?: number;
}

export function ReadingsTable({ readings, maxRows = 10 }: ReadingsTableProps) {
  const displayReadings = readings.slice(0, maxRows);

  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      <div className="border-b border-border/50 p-4">
        <h3 className="font-semibold">Live Readings Stream</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Real-time sensor data from all zones
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 bg-secondary/30">
              <th className="px-4 py-3 text-left">
                <span className="data-label flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> Time
                </span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="data-label flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" /> Area
                </span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="data-label flex items-center gap-1.5">
                  <Thermometer className="h-3 w-3" /> Temp
                </span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="data-label flex items-center gap-1.5">
                  <Droplets className="h-3 w-3" /> Hum
                </span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="data-label flex items-center gap-1.5">
                  <Zap className="h-3 w-3" /> Load
                </span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="data-label">HVAC</span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="data-label">Renew</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {displayReadings.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  No readings available. Start a simulation to see live data.
                </td>
              </tr>
            ) : (
              displayReadings.map((reading, index) => (
                <tr
                  key={reading.id}
                  className={cn(
                    "border-b border-border/30 transition-colors hover:bg-secondary/20",
                    index === 0 && "bg-primary/5"
                  )}
                >
                  <td className="px-4 py-3">
                    <span className="data-value">
                      {new Date(reading.timestamp).toLocaleTimeString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium">{reading.area}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn("data-value", {
                        "text-status-error": reading.temperature > 28,
                        "text-status-warning":
                          reading.temperature > 25 && reading.temperature <= 28,
                      })}
                    >
                      {reading.temperature.toFixed(1)}°C
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="data-value">{reading.humidity}%</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="data-value">
                      {reading.energyLoad.toFixed(1)} kW
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        {
                          "bg-status-online/10 text-status-online":
                            reading.hvacStatus === "ON",
                          "bg-muted text-muted-foreground":
                            reading.hvacStatus === "OFF",
                          "bg-status-warning/10 text-status-warning":
                            reading.hvacStatus === "AUTO",
                        }
                      )}
                    >
                      {reading.hvacStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-status-online"
                          style={{ width: `${reading.renewablePercent}%` }}
                        />
                      </div>
                      <span className="data-value text-xs">
                        {reading.renewablePercent}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {readings.length > maxRows && (
        <div className="border-t border-border/50 p-3 text-center">
          <p className="text-xs text-muted-foreground">
            Showing {maxRows} of {readings.length} readings
          </p>
        </div>
      )}
    </div>
  );
}
