import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import FeedbackPanel from "@/components/FeedbackPanel";
import ReflectionCard from "@/components/ReflectionCard";
import PipelineSimulator from "./PipelineSimulator";

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

  function handleCommit() {
    const { feedback: fb, success } = analyzeCode(code);
    setFeedback(fb);
    const newEntry = {
      type: "commit",
      message: success ? "Successful commit" : "Commit with warnings",
      time: format(new Date(), "HH:mm:ss"),
    };
    setLog((prev) => [newEntry, ...prev]);
    setShowReflection(true);
  }

  function handleReflectionSave(text) {
    const reflections = JSON.parse(localStorage.getItem("reflections") || "[]");
    const newEntry = { text, time: format(new Date(), "HH:mm:ss") };
    localStorage.setItem("reflections", JSON.stringify([newEntry, ...reflections]));
    setShowReflection(false);
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
          <FeedbackPanel feedback={feedback} />
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

function analyzeCode(code) {
  const feedback = [];
  let success = false;

  if (!code.includes("CMD"))
    feedback.push("Hint: Add a CMD instruction to specify how the container starts.");
  else if (!code.includes("EXPOSE"))
    feedback.push("Reminder: Expose the port your application runs on.");
  else if (!code.includes("WORKDIR"))
    feedback.push("Hint (Level 3): You can add WORKDIR to define where your app runs.");
  else if (feedback.length === 0){
    feedback.push("✅ Great! Your Dockerfile meets key GitOps principles.");
    success = true;
  }
  return {feedback, success};
}
