import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import FeedbackPanel from "@/components/FeedbackPanel";
import ReflectionCard from "@/components/ReflectionCard";
import PipelineSimulator from "./PipelineSimulator";
import { motion, AnimatePresence } from "framer-motion";


export default function GitOpsEditor() {
  const [code, setCode] = useState(`# Example Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
CMD ["npm", "start"]`);
  const [log, setLog] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [showReflection, setShowReflection] = useState(false);
  const [pipelineTrigger, setPipelineTrigger] = useState(false);
  const [feedbackLevel, setFeedbackLevel] = useState(1);

  // Checks the committed code and provides tiered feedback
  function handleCommit() {
    const fb = analyzeCode(code, feedbackLevel);
    setFeedback(fb.feedback);
    
    const newEntry = {
      type: "commit",
      message: fb.success ? "Successful commit" : `Commit attempt ${feedbackLevel}`,
      time: format(new Date(), "HH:mm:ss"),
    };
    setLog((prev) => [newEntry, ...prev]);
    if (!fb.success && feedbackLevel < 3) setFeedbackLevel(prev => prev + 1);
    if (fb.success) setFeedbackLevel(1);
    setShowReflection(true);
  }

  function handleReflectionSave(text) {
    const reflections = JSON.parse(localStorage.getItem("reflections") || "[]");
    const newEntry = { text, time: format(new Date(), "HH:mm:ss") };
    localStorage.setItem("reflections", JSON.stringify([newEntry, ...reflections]));
    setShowReflection(false);

    // Log reflection for now (simulating analytics)
    console.log("Reflection saved:", text);
    // Notify other components that reflections updated
    window.dispatchEvent(new Event("reflectionsUpdated"));
  }

  // Currently resets trigger after a timeout value (here 500 ms)
  function handlePush() {
    const newEntry = {
      type: "push",
      message: "Pushed to main branch → Pipeline triggered",
      time: format(new Date(), "HH:mm:ss"),
    };
    setLog((prev) => [newEntry, ...prev]);
    setPipelineTrigger(true);
    setTimeout(() => setPipelineTrigger(false), 500);
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Editor + buttons */}
        <div className="border rounded-xl overflow-hidden shadow-sm">
          <Editor
            height="60vh"
            language="dockerfile"
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value || "")}
          />
          <div className="flex gap-3 p-3 bg-slate-100 border-t">
            <Button onClick={handleCommit}>Commit</Button>
            <Button onClick={handlePush} variant="secondary">Push</Button>
          </div>
        </div>

        {/* Feedback and log */}
        <div className="space-y-4">
          <AnimatePresence>
            {feedback.length > 0 && (
              <motion.div
                key={feedback.join("-")}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <FeedbackPanel feedback={feedback} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="border rounded-lg p-4 bg-slate-50">
            <h2 className="font-semibold mb-2">Commit Log</h2>
            <ul className="text-sm space-y-1">
              {log.map((l, i) => (
                <li key={i}>
                  <strong>{l.type.toUpperCase()}</strong> – {l.message} ({l.time})
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <hr className="my-6 border-slate-300" />

      <PipelineSimulator trigger={pipelineTrigger} />

      {showReflection && <ReflectionCard onSave={handleReflectionSave} />}
    </div>
  );
}

function analyzeCode(code, level) {
  const feedback = [];
  let success = false;

  const hasCMD = code.includes("CMD");
  const hasEXPOSE = code.includes("EXPOSE");
  const hasWORKDIR = code.includes("WORKDIR");

  if (!hasCMD && level === 1) feedback.push("Hint 1: Add a CMD instruction.");
  else if (!hasCMD && level === 2) feedback.push("Hint 2: CMD defines how the container starts.");
  else if (!hasCMD && level === 3) feedback.push("Explanation: Without CMD, Docker doesn’t know what to execute.");

  if (hasCMD && !hasEXPOSE) feedback.push("Hint: Remember to expose the port for your service.");
  if (hasCMD && hasEXPOSE && !hasWORKDIR) feedback.push("Optional: Define WORKDIR to improve maintainability.");

  if (hasCMD && hasEXPOSE) {
    feedback.push("✅ Great! You applied key GitOps principles.");
    success = true;
  }

  return { feedback, success };
}
