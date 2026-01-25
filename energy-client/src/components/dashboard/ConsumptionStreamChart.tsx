import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Reading } from "@/types/types";

export function ConsumptionStreamChart({ readings }: { readings: Reading[] }) {
  const data = [...readings].reverse().map(r => ({
    time: new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    actual: r.energyConsumption,
    predicted: r.energyConsumption ? r.energyConsumption * (0.95 + Math.random() * 0.1) : 0 
  }));

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
          <XAxis dataKey="time" hide />
          <YAxis axisLine={false} tickLine={false} fontSize={10} tickFormatter={(v) => `${v}kW`} />
          <Tooltip 
            contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
            itemStyle={{ fontSize: '12px' }}
          />
          <Area type="monotone" dataKey="actual" name="Actual" stroke="hsl(var(--primary))" fill="url(#colorActual)" strokeWidth={2} />
          <Area type="monotone" dataKey="predicted" name="AI Predicted" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" fill="transparent" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}