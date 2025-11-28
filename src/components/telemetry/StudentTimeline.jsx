import React, { useMemo, useState, useEffect } from "react";
import { getTimelineForSession } from "@/lib/telemetry";

export function StudentTimeline({ events }) {
  const sessions = useMemo(
    () =>
      Array.from(
        new Set(events.map((e) => e.session).filter(Boolean))
      ),
    [events]
  );
  const [selectedSession, setSelectedSession] = useState(
    sessions[0] || null
  );

  useEffect(() => {
    if (sessions.length === 0) {
      setSelectedSession(null);
    } else if (!selectedSession || !sessions.includes(selectedSession)) {
      setSelectedSession(sessions[0]);
    }
  }, [sessions, selectedSession]);

  if (!selectedSession) return null;

  const essentialEvents = new Set([
    "module_launch",
    "module_resume",
    "module_start",
    "module_stage_change",
    "scenario_advance",
    "terminal_command",
    "validation_result",
    "kube_linting_attempt",
    "help_request",
    "show_solution",
    "module_complete",
    "reflection_submit"
  ]);

  const timeline = getTimelineForSession(events, selectedSession).filter((e) =>
    essentialEvents.has(e.event)
  );

  return (
    <div className="border p-4 rounded-lg">
      <h2 className="text-lg font-semibold text-slate-700">Student Timeline</h2>
      {sessions.length > 1 && (
        <div className="mt-2">
          <label className="text-xs text-slate-500 mr-2">Session</label>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="text-xs border rounded px-2 py-1"
          >
            {sessions.map((sid) => (
              <option key={sid} value={sid}>
                {sid}
              </option>
            ))}
          </select>
        </div>
      )}

      <ul className="mt-3 text-xs space-y-1 font-mono">
        {timeline.map((e, i) => (
          <li key={i}>
            <span className="text-slate-500">
              {new Date(e.ts).toLocaleTimeString()} — 
            </span>{" "}
            {e.event} {e.module ? `(${e.module})` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
