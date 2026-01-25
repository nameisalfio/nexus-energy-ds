import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { WeeklyStat } from "@/types/types";

export function WeeklyEfficiencyChart({ data }: { data: WeeklyStat[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center border border-dashed border-border rounded-xl">
        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Awaiting Historical Data...</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 0, left: -25, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.2} />
          <XAxis 
            dataKey="day" 
            axisLine={false} 
            tickLine={false} 
            fontSize={10}
            fontWeight="bold"
            tick={{ fill: "hsl(var(--muted-foreground))" }} 
            dy={10} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            fontSize={10} 
            tick={{ fill: "hsl(var(--muted-foreground))" }}
          />
          <Tooltip 
             cursor={{ fill: 'hsl(var(--primary)/0.05)' }}
             contentStyle={{ 
               backgroundColor: "hsl(var(--background))", 
               borderColor: "hsl(var(--border))",
               borderRadius: '8px',
               fontSize: '12px'
             }}
          />
          <Bar dataKey="avgConsumption" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.avgConsumption > 85 ? "hsl(var(--status-error))" : "hsl(var(--primary))"} 
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}