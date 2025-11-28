import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { logEvent } from "@/lib/telemetry";
import { v4 as uuid } from "uuid";

function ReflectionCard({ moduleData, onComplete, sessionId }) {
  const prompts = moduleData?.phases?.postlab?.reflection_prompts || [];
  const [responses, setResponses] = useState(prompts.map(() => ""));
  function handleChange(index, value) {
    const updated = [...responses];
    updated[index] = value;
    setResponses(updated);
  }

  function handleFinish() {
    const now = new Date().toISOString();

    // Only include reflections that have an answer
    const entries = prompts
      .map((q, i) => ({
        id: uuid(),
        module: moduleData?.title || "Unnamed Module",
        question: q,
        answer: responses[i]?.trim() || "",
        timestamp: now,
      }))
      .filter((e) => e.answer.length > 0);

    if (entries.length === 0) {
      alert("Please write at least one reflection before finishing.");
      return;
    }

    // Save reflections to localStorage (append mode)
    const stored = JSON.parse(localStorage.getItem("reflections") || "[]");
    const updated = [...stored, ...entries];
    localStorage.setItem("reflections", JSON.stringify(updated));

    // Trigger reflection update event so history refreshes immediately
    window.dispatchEvent(new Event("reflectionsUpdated"));

    // Telemetry hook for reflection submit
    logEvent("reflection_submit", {
      module: moduleData.id,
      session: sessionId,
      answers: entries,
      timestamp: now
    });

    // Mark module as complete in localStorage
    localStorage.setItem(`${moduleData?.id}-complete`, "true");

    // Call onComplete if provided (used for showing completion modal)
    if (onComplete) onComplete(entries);
  }

  return (
    <div className="border rounded-xl p-6 bg-blue-50 space-y-4 text-slate-800">
      <h2 className="text-lg font-semibold text-blue-700">Reflection</h2>
      <p className="text-sm text-slate-700">
        Before completing the module, take a moment to reflect on what you learned:
      </p>

      {prompts.map((prompt, i) => (
        <div key={i}>
          <p className="text-sm font-medium text-slate-800 mb-1">• {prompt}</p>
          <Textarea
            placeholder="Write your reflection here..."
            value={responses[i]}
            onChange={(e) => handleChange(i, e.target.value)}
            rows="3"
            className="w-full text-sm text-slate-900"
          />
        </div>
      ))}

      <div className="flex justify-end pt-2">
        <Button onClick={handleFinish}>Finish Module</Button>
      </div>
    </div>
  );
}

export default ReflectionCard;
