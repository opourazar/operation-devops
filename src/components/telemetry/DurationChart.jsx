import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { computeModulePhaseDurations } from "@/lib/telemetry";

export function DurationChart({ events }) {
  const data = useMemo(() => {
    const durations = computeModulePhaseDurations(events);
    return Object.entries(durations).map(([module, d]) => ({
      module,
      prelab: d.prelabMs ? Number((d.prelabMs / 1000 / 60).toFixed(2)) : 0,
      lab: d.labMs ? Number((d.labMs / 1000 / 60).toFixed(2)) : 0
    }));
  }, [events]);

  if (!data.length) return null;

  const maxMinutes = Math.max(
    ...data.map((d) => d.prelab + d.lab),
    0.1
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;
    const items = payload.reduce((acc, p) => {
      acc[p.name] = p.value;
      return acc;
    }, {});
    return (
      <div className="rounded border bg-white px-2 py-1 text-xs shadow">
        <div className="font-semibold text-slate-700">{label}</div>
        <div className="text-sky-500">Prelab: {items.Prelab ?? 0} min</div>
        <div className="text-violet-500">Lab: {items.Lab ?? 0} min</div>
      </div>
    );
  };

  return (
    <div className="border p-4 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Time by Phase</h3>
        <p className="text-xs text-slate-500">Prelab vs Lab (minutes)</p>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <XAxis type="number" unit=" min" domain={[0, Math.max(maxMinutes * 1.1, 1)]} />
            <YAxis type="category" dataKey="module" />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="prelab" stackId="time" fill="#0ea5e9" name="Prelab" />
            <Bar dataKey="lab" stackId="time" fill="#8b5cf6" name="Lab" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
