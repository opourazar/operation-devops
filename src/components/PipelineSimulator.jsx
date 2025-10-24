import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

export default function PipelineSimulator({ trigger }) {
  const [status, setStatus] = useState("idle");
  const [log, setLog] = useState([]);

  useEffect(() => {
    if (trigger) runPipeline();
  }, [trigger]);

  function logStep(message) {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()} — ${message}`]);
  }

  function runPipeline() {
    setStatus("running");
    setLog([]);
    logStep("🔄 Starting build...");
    setTimeout(() => {
      logStep("✅ Build succeeded.");
      logStep("🚀 Deploying container...");
      setTimeout(() => {
        logStep("✅ Deployment successful!");
        setStatus("success");
      }, 1500);
    }, 1500);
  }

  return (
    <Card className="p-4 space-y-2 bg-slate-50 border border-slate-300">
      <h2 className="font-semibold">Pipeline Simulation</h2>
      <p>Status: {status === "idle" ? "Waiting for push..." : status}</p>
      <div className="text-sm bg-white rounded-md p-2 border h-48 overflow-y-auto">
        {log.map((entry, i) => (
          <div key={i}>{entry}</div>
        ))}
      </div>
    </Card>
  );
}
