import React from "react";
import { computeQuizFailures } from "@/lib/telemetry";

export function Module2Panel({ events }) {
  const mod = events.filter(e => e.module === "module-2");
  if (mod.length === 0) return null;

  const lint = mod.filter(e => e.event === "kube_linting_attempt");
  const success = lint.filter(l => l.success).length;
  const fails = lint.filter(l => !l.success).length;

  const editorChanges = mod.filter(e => e.event === "editor_change").length;
  const help = mod.filter(e => e.event === "help_request").length;
  const quizStats = computeQuizFailures(events, "module-2");

  return (
    <div className="border p-4 rounded-lg">
      <h2 className="text-lg font-semibold text-green-600">Module 2 - Container Orchestration (Kubernetes)</h2>

      <ul className="mt-2 text-sm space-y-1">
        <li><strong>Lint attempts:</strong> {lint.length}</li>
        <li><strong>Successful:</strong> {success}</li>
        <li><strong>Failed:</strong> {fails}</li>
        <li><strong>Editor changes:</strong> {editorChanges}</li>
        <li><strong>Help requests:</strong> {help}</li>
        {quizStats.total > 0 && (
          <li><strong>Quiz failures:</strong> {quizStats.total}</li>
        )}
        {quizStats.top && (
          <li>
            <strong>Top failed question:</strong>{" "}
            {quizStats.top.question.slice(0, 60)}
            {quizStats.top.question.length > 60 ? "…" : ""} ({quizStats.top.count})
          </li>
        )}
      </ul>
    </div>
  );
}
