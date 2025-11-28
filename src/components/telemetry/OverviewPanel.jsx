import React from "react";
import { computeModuleDurations } from "@/lib/telemetry";

export function OverviewPanel({ events }) {
  if (!events || events.length === 0) {
    return <p className="text-sm text-slate-500">No analytics recorded yet.</p>;
  }

  const durations = computeModuleDurations(events);

  const help = events.filter(e => e.event === "help_request").length;
  const quizFailures = events.filter(
    e => e.event === "prelab_quiz_answer" && e.correct === false
  ).length;

  return (
    <div className="space-y-3 text-sm">
      <p><strong>Help requests:</strong> {help}</p>
      <p><strong>Quiz failures:</strong> {quizFailures}</p>

      <h3 className="font-semibold mt-3">Time spent per module:</h3>
      {Object.entries(durations).map(([mod, d]) => (
        <div key={mod}>
          <strong>{mod}:</strong>{" "}
          {d.durationMs ? (d.durationMs / 1000 / 60).toFixed(1) + " min" : "N/A"}
        </div>
      ))}
    </div>
  );
}
