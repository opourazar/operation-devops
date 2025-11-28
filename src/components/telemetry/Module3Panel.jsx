import React from "react";
import { computeQuizFailures } from "@/lib/telemetry";

export function Module3Panel({ events }) {
  const mod = events.filter(e => e.module === "module-3");
  if (mod.length === 0) return null;

  const validations = mod.filter(e => e.event === "validation_result");
  const success = validations.filter(v => v.success).length;
  const fails = validations.filter(v => !v.success).length;

  const apply = mod.filter(e => e.action === "apply_fix").length;

  const editorChanges = mod.filter(e => e.event === "editor_change").length;
  const help = mod.filter(e => e.event === "help_request").length;
  const quizStats = computeQuizFailures(events, "module-3");

  return (
    <div className="border p-4 rounded-lg">
      <h2 className="text-lg font-semibold text-purple-600">Module 3 - IaC (Terraform)</h2>

      <ul className="mt-2 text-sm space-y-1">
        <li><strong>Validations:</strong> {validations.length}</li>
        <li><strong>Successful:</strong> {success}</li>
        <li><strong>Failed:</strong> {fails}</li>
        <li><strong>Apply actions:</strong> {apply}</li>
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
