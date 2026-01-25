import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  status?: "online" | "warning" | "error" | "idle";
  className?: string;
}

export function MetricCard({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  status,
  className,
}: MetricCardProps) {
  return (
    <div className={cn("glass-card p-5 animate-fade-in", className)}>
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {status && (
          <div className="flex items-center gap-2">
            <span
              className={cn("status-dot", {
                "status-online pulse-glow": status === "online",
                "status-warning": status === "warning",
                "status-error": status === "error",
                "status-idle": status === "idle",
              })}
            />
            <span className="text-xs text-muted-foreground capitalize">
              {status}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="data-label">{title}</p>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-2xl font-semibold tracking-tight">{value}</span>
          {unit && (
            <span className="text-sm text-muted-foreground">{unit}</span>
          )}
        </div>
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1">
          <span
            className={cn("text-xs font-medium", {
              "text-status-online": trend.isPositive,
              "text-status-error": !trend.isPositive,
            })}
          >
            {trend.isPositive ? "+" : ""}
            {trend.value}%
          </span>
          <span className="text-xs text-muted-foreground">vs last week</span>
        </div>
      )}
    </div>
  );
}
