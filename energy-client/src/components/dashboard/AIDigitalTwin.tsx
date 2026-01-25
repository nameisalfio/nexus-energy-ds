import { Brain, Sparkles, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AIInsight } from "@/types/reading";

interface AIDigitalTwinProps {
  insights: AIInsight[];
  isActive: boolean;
  expectedValue?: number;
  realValue?: number;
}

export function AIDigitalTwin({
  insights,
  isActive,
  expectedValue = 2847,
  realValue = 2934,
}: AIDigitalTwinProps) {
  const deviation = ((realValue - expectedValue) / expectedValue) * 100;

  return (
    <div className="glass-card-elevated p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Brain className="h-6 w-6 text-primary" />
            {isActive && (
              <span className="absolute -right-1 -top-1 status-online pulse-glow" />
            )}
          </div>
          <div>
            <h3 className="font-semibold">AI Digital Twin</h3>
            <p className="text-xs text-muted-foreground">
              Predictive Analytics Engine
            </p>
          </div>
        </div>
        <div
          className={cn(
            "flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
            isActive
              ? "bg-status-online/10 text-status-online"
              : "bg-muted text-muted-foreground"
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              isActive ? "bg-status-online animate-pulse" : "bg-muted-foreground"
            )}
          />
          {isActive ? "Active" : "Idle"}
        </div>
      </div>

      {/* Deviation Display */}
      <div className="mt-6 rounded-xl bg-secondary/50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="data-label">AI Expected</p>
            <p className="data-value text-lg">{expectedValue.toLocaleString()} kWh</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="data-label">Real Value</p>
            <p className="data-value text-lg">{realValue.toLocaleString()} kWh</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="data-label">Deviation</p>
            <p
              className={cn("text-lg font-mono font-medium", {
                "text-status-online": Math.abs(deviation) < 3,
                "text-status-warning": Math.abs(deviation) >= 3 && Math.abs(deviation) < 5,
                "text-status-error": Math.abs(deviation) >= 5,
              })}
            >
              {deviation > 0 ? "+" : ""}
              {deviation.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="mt-6">
        <h4 className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" />
          Optimization Suggestions
        </h4>
        <div className="mt-3 space-y-3">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className={cn(
                "rounded-lg border p-3 transition-colors",
                {
                  "border-status-online/30 bg-status-online/5":
                    insight.type === "optimization",
                  "border-status-warning/30 bg-status-warning/5":
                    insight.type === "warning",
                  "border-primary/30 bg-primary/5": insight.type === "info",
                }
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn("mt-0.5 rounded p-1", {
                    "bg-status-online/20": insight.type === "optimization",
                    "bg-status-warning/20": insight.type === "warning",
                    "bg-primary/20": insight.type === "info",
                  })}
                >
                  {insight.type === "optimization" && (
                    <Sparkles className="h-3.5 w-3.5 text-status-online" />
                  )}
                  {insight.type === "warning" && (
                    <AlertTriangle className="h-3.5 w-3.5 text-status-warning" />
                  )}
                  {insight.type === "info" && (
                    <Info className="h-3.5 w-3.5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {insight.description}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-xs font-medium text-primary">
                      {insight.impact}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {insight.confidence}% confidence
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
