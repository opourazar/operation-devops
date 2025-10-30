import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { scenarioScript } from "@/data/scenarioScript";
import { format } from "date-fns";
import FeedbackPanel from "@/components/FeedbackPanel";
import ReflectionCard from "@/components/ReflectionCard";
import PipelineSimulator from "./PipelineSimulator";
import { updateModuleProgress } from "@/lib/updateModuleProgress";

export default function GitOpsEditor({ moduleData, scenarioStep = 3, onAdvance }) {
  const [code, setCode] = useState(`# Example Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
# Missing CMD and EXPOSE intentionally`);
  const [log, setLog] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [input, setInput] = useState("");
  const [showReflection, setShowReflection] = useState(false);
  const [pipelineTrigger, setPipelineTrigger] = useState(false);
  const [currentStep, setCurrentStep] = useState(scenarioStep);
  const [branchName, setBranchName] = useState(localStorage.getItem("branchName") || "feature/fix-dockerfile");
  const [lastCommitMsg, setLastCommitMsg] = useState("");
  const terminalRef = useRef(null);

  const currentStory = scenarioScript.find((s) => s.id === currentStep);

  useEffect(() => {
    terminalRef.current?.scrollTo(0, terminalRef.current.scrollHeight);
  }, [log]);

  function addTerminalLog(message) {
    setLog((prev) => [...prev, { message, time: format(new Date(), "HH:mm:ss") }]);
  }

  function logAction(type, message) {
    setLog((prev) => [{ type, message, time: format(new Date(), "HH:mm:ss") }, ...prev]);
  }

  // 🧠 Feedback logic
  function analyzeCode(code) {
    const feedback = [];
    let success = false;

    const hasCMD = code.includes("CMD");
    const hasEXPOSE = code.includes("EXPOSE");

    if (!hasCMD) feedback.push("Hint: Add a CMD instruction to specify how your container starts.");
    if (!hasEXPOSE) feedback.push("Hint: Expose a port (e.g., 3000) so your service is reachable.");

    if (hasCMD && hasEXPOSE) {
      feedback.push("✅ Excellent! Your Dockerfile looks complete.");
      success = true;
    }

    return { feedback, success };
  }

  // 🧩 Terminal command handler inside editor
  function handleCommand(e) {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;
    addTerminalLog(`$ ${cmd}`);
    setInput("");

    const expected = currentStory?.expected || [];
    const matches = expected.some((pattern) => cmd.startsWith(pattern));

    // handle "git add"
    if (cmd.startsWith("git add")) {
      addTerminalLog("📦 Files staged successfully.");
      logAction("stage", "Files staged");
      return;
    }

    // handle "git commit"
    if (cmd.startsWith("git commit -m")) {
      const commitMsg = cmd.match(/git commit -m\s+["'](.+)["']/);
      if (commitMsg) setLastCommitMsg(commitMsg[1]);
      handleCommit();
      return;
    }

    // handle "git push"
    if (cmd.startsWith("git push")) {
      handlePush();
      return;
    }

    // handle "ok" or "continue" (review acknowledgement)
    if (cmd === "ok" || cmd === "continue") {
      addTerminalLog("✅ Review acknowledged. Applying feedback...");
      if (onAdvance && currentStory?.next) {
        setTimeout(() => onAdvance(currentStory.next), 800);
        setCurrentStep(currentStory.next);
      }
      return;
    }

    // handle merge actions
    if (cmd.startsWith("git merge")) {
      addTerminalLog("⚔️ Merge conflict detected in Dockerfile. Resolve manually in the editor.");
      if (onAdvance && currentStory?.next) {
        setTimeout(() => onAdvance(currentStory.next), 800);
        setCurrentStep(currentStory.next);
      }
      return;
    }

    // handle pipeline simulation
    if (cmd === "run pipeline" || cmd === "trigger pipeline") {
      handlePipelineRun();
      return;
    }

    if (matches) {
      addTerminalLog(`✅ ${currentStory.success}`);
      if (onAdvance && currentStory.next) {
        setTimeout(() => onAdvance(currentStory.next), 800);
        setCurrentStep(currentStory.next);
      }
    } else if (cmd === "help") {
      addTerminalLog(`💡 Hint: ${currentStory?.hint || "No hint available."}`);
    } else {
      addTerminalLog("❌ Unknown command. Type 'help' for guidance.");
    }
  }

  // ✳️ Commit logic
  function handleCommit() {
    const fb = analyzeCode(code);
    setFeedback(fb.feedback);
    if (fb.success) {
      addTerminalLog(`💬 Commit successful: "${lastCommitMsg || "fix: applied improvements"}"`);
      addTerminalLog("📢 Awaiting colleague review...");
      setTimeout(() => {
        addTerminalLog("👩‍💻 Leia: Looks good! But please expose port 3000.");
        if (onAdvance) onAdvance(6);
        setCurrentStep(6);
      }, 1200);
    } else {
      addTerminalLog("⚠️ Commit recorded, but Dockerfile has remaining issues.");
    }
  }

  // 🚀 Push logic
  function handlePush() {
    addTerminalLog(`📡 Pushed branch '${branchName}' to remote.`);
    addTerminalLog("🔄 Simulating PR creation and review process...");
    setPipelineTrigger(true);
    setTimeout(() => setPipelineTrigger(false), 1000);
  }

  // 🧩 Simulate CI/CD run
  function handlePipelineRun() {
    setPipelineTrigger(true);
    addTerminalLog("🔄 Running CI/CD pipeline simulation...");
    setTimeout(() => {
      addTerminalLog("✅ Build and deployment successful!");
      setPipelineTrigger(false);
      setShowReflection(true);
    }, 2000);
  }

  // 💭 Reflection save
  function handleReflectionSave(text, prompt) {
    const reflections = JSON.parse(localStorage.getItem("reflections") || "[]");
    const newEntry = { text, prompt, time: format(new Date(), "HH:mm:ss") };
    localStorage.setItem("reflections", JSON.stringify([newEntry, ...reflections]));
    setShowReflection(false);
    window.dispatchEvent(new Event("reflectionsUpdated"));
    updateModuleProgress();
  }

  return (
    <div className="space-y-6">
      {/* Story block */}
      {currentStory && (
        <Card className="p-4 border-l-4 border-blue-500 bg-blue-50">
          <p className="font-semibold">{currentStory.story}</p>
          <p className="text-sm text-slate-600 mt-1">
            🧠 <em>{currentStory.learning_focus}</em>
          </p>
          <p className="text-sm text-slate-500 mt-1 italic">
            Expected next: {currentStory.expected?.join(", ") || "—"}
          </p>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Editor */}
        <div className="border rounded-xl overflow-hidden shadow-sm">
          <Editor
            height="60vh"
            language="dockerfile"
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value || "")}
          />
        </div>

        {/* Terminal */}
        <Card className="p-4 bg-black text-green-300 font-mono">
          <div className="h-48 overflow-y-auto whitespace-pre-wrap mb-2" ref={terminalRef}>
            {log.map((l, i) => (
              <div key={i}>
                {l.time ? `[${l.time}] ` : ""}
                {l.message}
              </div>
            ))}
          </div>
          <form onSubmit={handleCommand} className="flex gap-2">
            <span className="text-green-400">$</span>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent outline-none text-green-100"
              placeholder="Type your git command..."
            />
            <Button type="submit" variant="secondary" size="sm">
              Run
            </Button>
          </form>
        </Card>
      </div>

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

      <hr className="my-6 border-slate-300" />
      <PipelineSimulator trigger={pipelineTrigger} />
      {showReflection && <ReflectionCard onSave={handleReflectionSave} />}
    </div>
  );
}
