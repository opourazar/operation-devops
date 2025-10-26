import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";


export default function PipelineSimulator({ trigger }) {
  const [status, setStatus] = useState("idle");
  const [log, setLog] = useState([]);

  useEffect(() => {
    if (trigger) runPipeline();
  }, [trigger]);

  function logStep(message) {
    setLog(prev => {
      const newLog = [...prev, `${new Date().toLocaleTimeString()} — ${message}`];
      setTimeout(() => {
        const logBox = document.querySelector(".pipeline-log-box");
        if (logBox) logBox.scrollTop = logBox.scrollHeight;
      }, 100);
      return newLog;
    });
  }

  function runPipeline() {
    setStatus("running");
    setLog([]);
    logStep("🔄 Starting build...");

    // Random duration (simulated build time)
    const duration = Math.floor(Math.random() * 10) + 2;
    // Random error chance (20%)
    const hasError = Math.random() < 0.2;

    // Simulate build phase
    setTimeout(() => {
        if (hasError) {
        logStep("❌ Build failed due to missing dependency.");
        setStatus("failed");
        savePipelineRun({ duration, errors: 1, success: false });
        return;
      }
      logStep("✅ Build succeeded.");
      logStep("🚀 Deploying container...");

      // Simulate deploy phase
      setTimeout(() => {
        logStep("✅ Deployment successful!");
        setStatus("success");

        // Save run data only for successful deployments
        savePipelineRun({ duration, errors: 0, success: true });
      }, 1500);
    }, 1500);
  }

  function savePipelineRun(run) {
    const runs = JSON.parse(localStorage.getItem("pipelineRuns") || "[]");
    runs.push({
      timestamp: new Date().toISOString(),
      duration: run.duration,
      errors: run.errors,
      success: run.success,
    });
    localStorage.setItem("pipelineRuns", JSON.stringify(runs));
  }

  return (
    <Card className="p-4 space-y-2 bg-slate-50 border border-slate-300">
      <h2 className="font-semibold">Pipeline Simulation</h2>
      <p>Status: {status === "idle" ? "Waiting for push..." : status}</p>
      <div className="text-sm bg-white rounded-md p-2 border h-48 overflow-y-auto pipeline-log-box">
        <AnimatePresence>
          {log.map((entry, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.25 }}
              className="py-0.5"
            >
              {entry}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Card>
  );
}
