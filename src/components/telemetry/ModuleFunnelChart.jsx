import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export function ModuleFunnelChart({ events }) {
  const data = useMemo(() => {
    const modules = Array.from(new Set(events.map((e) => e.module).filter(Boolean)));
    return modules.map((id) => {
      const modEvents = events.filter((e) => e.module === id);
      const stageChanges = modEvents.filter((e) => e.event === "module_stage_change");
      return {
        module: id,
        launch: modEvents.filter((e) => e.event === "module_launch").length,
        start: modEvents.filter((e) => e.event === "module_start").length,
        terminal: stageChanges.filter((s) => s.stage === "terminal").length,
        editor: stageChanges.filter((s) => s.stage === "editor").length,
        complete: modEvents.filter((e) => e.event === "module_complete").length
      };
    });
  }, [events]);

  if (!data.length) return null;

  return (
    <div className="border p-4 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Module Funnel</h3>
        <p className="text-xs text-slate-500">Launch → Start → Editor → Complete</p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="module" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="launch" stackId="funnel" fill="#94a3b8" name="Launch" />
            <Bar dataKey="start" stackId="funnel" fill="#60a5fa" name="Start" />
            <Bar dataKey="terminal" stackId="funnel" fill="#22c55e" name="Terminal" />
            <Bar dataKey="editor" stackId="funnel" fill="#f97316" name="Editor" />
            <Bar dataKey="complete" stackId="funnel" fill="#a855f7" name="Complete" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
