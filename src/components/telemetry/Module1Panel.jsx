import React from "react";
import { computeQuizFailures } from "@/lib/telemetry";

export function Module1Panel({ events }) {
  const mod = events.filter(e => e.module === "module-1");
  if (mod.length === 0) return null;

  const commits = mod.filter(e => e.event === "validation_result");
  const success = commits.filter(e => e.success).length;
  const fails = commits.filter(e => !e.success).length;

  const showSolutionClicks = mod.filter(e => e.event === "show_solution").length;

  const terminal = mod.filter(e => e.event === "terminal_command").length;
  const editorChanges = mod.filter(e => e.event === "editor_change").length;
  const quizStats = computeQuizFailures(events, "module-1");

  return (
    <div className="border p-4 rounded-lg">
      <h2 className="text-lg font-semibold text-blue-600">Module 1 - GitOps Editor Lab Analytics</h2>

      <ul className="mt-2 text-sm space-y-1">
        <li><strong>Total commits:</strong> {commits.length}</li>
        <li><strong>Successful:</strong> {success}</li>
        <li><strong>Failed:</strong> {fails}</li>
        <li><strong>Solution button clicks:</strong> {showSolutionClicks}</li>
        <li><strong>Opening Terminal commands:</strong> {terminal}</li>
        <li><strong>Editor changes:</strong> {editorChanges}</li>
        <li><strong>Quiz failures:</strong> {quizStats.total}</li>
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
