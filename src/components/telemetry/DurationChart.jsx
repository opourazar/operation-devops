import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { computeModuleDurations } from "@/lib/telemetry";

export function DurationChart({ events }) {
  const data = useMemo(() => {
    const durations = computeModuleDurations(events);
    return Object.entries(durations).map(([module, d]) => ({
      module,
      minutes: d.durationMs ? Number((d.durationMs / 1000 / 60).toFixed(1)) : 0
    }));
  }, [events]);

  if (!data.length) return null;

  return (
    <div className="border p-4 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Time to Complete</h3>
        <p className="text-xs text-slate-500">Minutes from start → completion</p>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <XAxis type="number" unit=" min" />
            <YAxis type="category" dataKey="module" />
            <Tooltip />
            <Bar dataKey="minutes" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
