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

export function HelpUsageChart({ events }) {
  const helpEvents = useMemo(
    () => events.filter((e) => e.event === "help_request"),
    [events]
  );

  const data = useMemo(() => {
    const modules = Array.from(
      new Set(helpEvents.map((e) => e.module).filter(Boolean))
    );

    return modules.map((id) => {
      const modEvents = helpEvents.filter((e) => e.module === id);
      const terminal = modEvents.filter(
        (e) => e.source === "git_terminal"
      ).length;
      const editor = modEvents.filter(
        (e) => e.source === "gitops_editor_terminal"
      ).length;

      const stepCounts = modEvents.reduce((acc, e) => {
        const key = e.step ?? "unknown";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      const topStepEntry = Object.entries(stepCounts).sort(
        (a, b) => b[1] - a[1]
      )[0];

      return {
        module: id,
        total: modEvents.length,
        terminal,
        editor,
        topStep:
          topStepEntry && topStepEntry.length === 2
            ? `${topStepEntry[0]} (${topStepEntry[1]})`
            : "—"
      };
    });
  }, [helpEvents]);

  if (!data.length) return null;

  return (
    <div className="border p-4 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Help Requests</h3>
        <p className="text-xs text-slate-500">
          Hints used per module
        </p>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="module" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="terminal" stackId="help" fill="#38bdf8" name="Git Terminal" />
            <Bar dataKey="editor" stackId="help" fill="#a855f7" name="Editor Terminal" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 text-xs text-slate-600 space-y-1">
        {data.map((d) => (
          <div key={d.module}>
            <span className="font-semibold text-slate-800">{d.module}:</span>{" "}
            {d.total} total help calls; top step {d.topStep}
          </div>
        ))}
      </div>
    </div>
  );
}
