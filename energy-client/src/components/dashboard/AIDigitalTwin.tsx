import { Brain, TrendingUp, TrendingDown, CheckCircle, AlertTriangle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIDigitalTwinProps {
  insight: string;      
  expectedValue: number;
  realValue: number;
  deviation: number;
  confidence: number;
  isActive: boolean;
}

export function AIDigitalTwin({
  insight,
  expectedValue = 0,
  realValue = 0,
  deviation = 0,
  confidence = 0,
  isActive
}: AIDigitalTwinProps) {
  const isHighDeviation = Math.abs(deviation) > 15;
  const isLoss = realValue > expectedValue;

  return (
    <div className={cn(
      "glass-card-elevated p-6 h-full border-l-4 transition-all duration-500",
      isHighDeviation ? "border-l-status-error" : "border-l-status-online"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Brain className={cn("h-6 w-6 text-primary", isActive && "animate-pulse")} />
          </div>
          <div>
            <h3 className="font-bold text-sm uppercase tracking-widest">AI Digital Twin</h3>
            <p className="text-[10px] text-muted-foreground font-mono">Confidence: {confidence.toFixed(1)}%</p>
          </div>
        </div>
        <div className={cn(
          "px-2 py-1 rounded text-[10px] font-black border",
          isHighDeviation ? "bg-status-error/10 text-status-error border-status-error/20" : "bg-status-online/10 text-status-online border-status-online/20"
        )}>
          {isHighDeviation ? "ANOMALY" : "OPTIMIZED"}
        </div>
      </div>

      {/* Value Comparison */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-secondary/20 p-4 rounded-xl border border-border/50">
          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">AI Prediction</p>
          <p className="text-xl font-mono font-bold">{expectedValue.toFixed(2)}</p>
        </div>
        <div className="bg-secondary/20 p-4 rounded-xl border border-border/50">
          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Actual Value</p>
          <div className="flex items-center gap-2">
            <p className="text-xl font-mono font-bold">{realValue.toFixed(2)}</p>
            {isLoss ? <TrendingUp className="h-4 w-4 text-status-error" /> : <TrendingDown className="h-4 w-4 text-status-online" />}
          </div>
          <p className={cn("text-[10px] font-bold mt-1", isHighDeviation ? "text-status-error" : "text-status-online")}>
            {deviation > 0 ? "+" : ""}{deviation.toFixed(2)}% dev
          </p>
        </div>
      </div>

      {/* Dynamic Suggestions Section */}
      <div className="space-y-3">
        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
          <Sparkles className="h-3 w-3" /> Optimization Strategy
        </h4>
        <div className={cn(
          "rounded-xl border p-4 transition-colors",
          isHighDeviation ? "bg-status-warning/5 border-status-warning/20" : "bg-status-online/5 border-status-online/20"
        )}>
          <div className="flex items-start gap-3">
            <div className={cn("mt-0.5 rounded p-1.5", isHighDeviation ? "bg-status-warning/20" : "bg-status-online/20")}>
              {isHighDeviation ? (
                <AlertTriangle className="h-4 w-4 text-status-warning" />
              ) : (
                <CheckCircle className="h-4 w-4 text-status-online" />
              )}
            </div>
            <p className="text-xs italic leading-relaxed text-foreground/90 font-medium">
              "{insight || "Initializing predictive analysis for current infrastructure cycle..."}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}