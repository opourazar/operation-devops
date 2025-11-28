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

export function ValidationAttemptsChart({ events }) {
  const data = useMemo(() => {
    const modules = Array.from(new Set(events.map((e) => e.module).filter(Boolean)));
    return modules.map((id) => {
      const validations = events.filter(
        (e) =>
          (e.event === "validation_result" || e.event === "kube_linting_attempt") &&
          e.module === id
      );
      const success = validations.filter((v) => v.success).length;
      const fail = validations.filter((v) => !v.success).length;
      const attemptsToFirstSuccess = (() => {
        const firstSuccessIndex = validations.findIndex((v) => v.success);
        return firstSuccessIndex === -1 ? null : firstSuccessIndex + 1;
      })();
      return {
        module: id,
        success,
        fail,
        attemptsToFirstSuccess: attemptsToFirstSuccess ?? 0
      };
    });
  }, [events]);

  if (!data.length) return null;

  return (
    <div className="border p-4 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Validation Outcomes</h3>
        <p className="text-xs text-slate-500">Success vs failed attempts</p>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="module" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="success" fill="#22c55e" name="Success" />
            <Bar dataKey="fail" fill="#ef4444" name="Fail" />
            <Bar
              dataKey="attemptsToFirstSuccess"
              fill="#f97316"
              name="Attempts to 1st success"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
