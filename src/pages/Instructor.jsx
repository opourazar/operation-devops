import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

export default function Instructor() {
  const [runs, setRuns] = useState([]);
  const [reflections, setReflections] = useState([]);

  useEffect(() => {
    setRuns(JSON.parse(localStorage.getItem("pipelineRuns") || "[]"));
    setReflections(JSON.parse(localStorage.getItem("reflections") || "[]"));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Instructor Analytics (Mock)</h1>

      <Card className="p-4">
        <h2 className="font-semibold mb-2">Pipeline Performance Overview</h2>
        <p>Total runs: {runs.length}</p>
        <p>Success rate: {((runs.filter(r => r.success).length / (runs.length || 1)) * 100).toFixed(0)}%</p>
        <p>Average duration: {(runs.reduce((a, r) => a + r.duration, 0) / (runs.length || 1)).toFixed(1)} s</p>
      </Card>

      <Card className="p-4">
        <h2 className="font-semibold mb-2">Recent Reflections</h2>
        {reflections.length === 0 ? (
          <p className="text-slate-500">No reflections yet.</p>
        ) : (
          <ul className="list-disc ml-5 space-y-1 text-sm">
            {reflections.slice(0, 5).map((r, i) => (
              <li key={i}>
                {r.text} <span className="text-slate-400 text-xs">({r.time})</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
