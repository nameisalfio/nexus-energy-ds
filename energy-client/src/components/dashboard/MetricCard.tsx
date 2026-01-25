import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean; };
  status?: "online" | "warning" | "error" | "idle";
}

export function MetricCard({ title, value, unit, icon: Icon, trend, status }: MetricCardProps) {
  return (
    <div className="glass-card p-5 animate-fade-in border border-border/50 hover:border-primary/30 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {status && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary/50 border border-border">
            <span className={cn("h-1.5 w-1.5 rounded-full", {
              "bg-status-online animate-pulse": status === "online",
              "bg-status-warning": status === "warning",
              "bg-status-error": status === "error",
              "bg-muted-foreground": status === "idle",
            })} />
            <span className="text-[10px] font-bold uppercase text-muted-foreground">{status}</span>
          </div>
        )}
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-2xl font-mono font-bold tracking-tight">{value}</span>
          {unit && <span className="text-xs font-medium text-muted-foreground">{unit}</span>}
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1.5">
          <div className={cn("flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold", 
            trend.isPositive ? "bg-status-online/10 text-status-online" : "bg-status-error/10 text-status-error")}>
            {trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend.isPositive ? "+" : ""}{trend.value}%
          </div>
          <span className="text-[10px] text-muted-foreground font-medium uppercase">vs last cycle</span>
        </div>
      )}
    </div>
  );
}