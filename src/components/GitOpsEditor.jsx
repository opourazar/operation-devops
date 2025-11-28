import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { scenarioScript } from "@/data/scenarioScript";
import { format } from "date-fns";
import FeedbackPanel from "@/components/FeedbackPanel";
import ReflectionCard from "@/components/ReflectionCard";
import { updateModuleProgress } from "@/lib/updateModuleProgress";
import { logEvent } from "@/lib/telemetry";

export default function GitOpsEditor({ moduleData, scenarioStep = 3, onAdvance, sessionId }) {
  const [code, setCode] = useState(`FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install`);
  const correctSolution = `FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
CMD ["node", "app.js"]
EXPOSE 80`;
  const [log, setLog] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [input, setInput] = useState("");
  const [showReflection, setShowReflection] = useState(false);
  const [pipelineTrigger, setPipelineTrigger] = useState(false);
  const [currentStep, setCurrentStep] = useState(scenarioStep);
  const branchName = useState(localStorage.getItem("branchName") || "feature/fix-dockerfile");
  const [lastCommitMsg, setLastCommitMsg] = useState("");
  const terminalRef = useRef(null);
  const [mergeConflict, setMergeConflict] = useState(false);
  const [conflictIntroduced, setConflictIntroduced] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [showSolutionButton, setShowSolutionButton] = useState(false);
  const [staged, setStaged] = useState(false);
  const [hasCommitted, setHasCommitted] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [reflectionText, setReflectionText] = useState("");
  const currentStory = scenarioScript.find((s) => s.id === currentStep);

  useEffect(() => {
    terminalRef.current?.scrollTo(0, terminalRef.current.scrollHeight);
  }, [log]);

  useEffect(() => {
    if (currentStep === 8) {
      setHasFetched(false);
    }
  }, [currentStep]);

  useEffect(() => {
    console.log("Modal visibility:", showCompletionModal);
  }, [showCompletionModal]);

  function addTerminalLog(message) {
    setLog((prev) => [...prev, { message, time: format(new Date(), "HH:mm:ss") }]);
  }

  function logAction(type, message) {
    setLog((prev) => [{ type, message, time: format(new Date(), "HH:mm:ss") }, ...prev]);
  }

  /// Feedback logic with tiered hints
  function analyzeCode(code, attempt = 1) {
    const feedback = [];
    let success = false;

    const hasFROM = code.includes("FROM");
    const hasWORKDIR = code.includes("WORKDIR");
    const hasCOPY = code.includes("COPY");
    const hasRUN = code.includes("RUN");
    const hasCMD = code.includes("CMD");
    const hasEXPOSE = code.includes("EXPOSE");

    // Detect destructive edits
    if (!hasFROM || !hasWORKDIR || !hasCOPY || !hasRUN) {
      feedback.push("⚠️ Some essential Dockerfile instructions (FROM, WORKDIR, COPY, RUN) seem to be missing.");
    }

    // Detect missing key fix parts
    if (!hasCMD) feedback.push("Hint: Add a CMD instruction to specify how your container starts.");
    if (!hasEXPOSE) feedback.push("Hint: Expose a port (e.g., 80 for localhost) so your service is reachable.");

    // If student is stuck after multiple commits, escalate hinting
    if (attempt > 2 && (!hasCMD || !hasEXPOSE)) {
      feedback.push("💡 Need a stronger nudge? Try adding both:");
      feedback.push(`CMD ["node", "app.js"]`);
      feedback.push(`EXPOSE 80 or EXPOSE 3000`);
    }

    // Success condition
    if (hasCMD && hasEXPOSE && hasFROM && hasWORKDIR && hasCOPY && hasRUN) {
      feedback.push("Your Dockerfile looks complete and production-ready.");
      success = true;
    }

    return { feedback, success };
  }

  // Terminal command handler inside editor
  function handleCommand(e) {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;
    addTerminalLog(`$ ${cmd}`);
    setInput("");

    const expected = currentStory?.expected || [];
    const matches = expected.some((pattern) => cmd.startsWith(pattern));

    // handle "git add"
    if (cmd.startsWith("git add") && currentStep !== 7 && currentStep !== 9) {
      setStaged(true);
      addTerminalLog("Files staged successfully.");
      logAction("stage", "Files staged");

      if (onAdvance && currentStory?.next) {
      setTimeout(() => onAdvance(currentStory.next), 600);
      setCurrentStep(currentStory.next);
    }
      return;
    }

    // handle "git commit"
    if (cmd.startsWith("git commit -m") && currentStep !== 7 && currentStep !== 9) {
      const commitMsgMatch = cmd.match(/git commit -m\s+["'](.+)["']/);
      if (!staged && !mergeConflict) {
      addTerminalLog("You must stage files first (use 'git add .').");
      setInput("");
      return;
      } 
      const commitMsg = commitMsgMatch ? commitMsgMatch[1] : null;

      if (commitMsg) {
        setLastCommitMsg(commitMsg);
      }

      handleCommit(commitMsg);
      setStaged(false);
      return;
    }

    // handle "git push"
    if (cmd.startsWith("git push") && currentStep !== 7 && currentStep !== 9) {
      handlePush();
      return;
    }

    // handle "ok" or "continue" (review acknowledgement)
    if (cmd === "ok" || cmd === "continue") {
      addTerminalLog("Review acknowledged. Applying feedback...");
      if (currentStep === 6 && onAdvance) {
        setTimeout(() => onAdvance(7), 800);
        setCurrentStep(7);
      } else {
        addTerminalLog("Nothing more to acknowledge right now.");
      }
      return;
    }

    // Stage, commit and push for colleague feedback integration
    if (currentStep === 7) {
      if (cmd.startsWith("git add")) {
        setStaged(true);
        addTerminalLog("Files staged successfully.");
        return;
      }
      if (cmd.startsWith("git commit -m")) {
        if (!staged) {
          addTerminalLog("⚠️ You must stage files first (use 'git add .').");
          return;
        }
        handleCommit();
        setStaged(false);
        setHasCommitted(true); 
        //addTerminalLog("✅ Commit created, now push your branch.");
        return;
      }
      if (cmd.startsWith("git push")) {
        if (!hasCommitted) {
          addTerminalLog("⚠️ You haven’t committed any new changes yet. Run 'git commit -m \"...\"' first.");
          return;
        }
        handlePush();
        setHasCommitted(false);
        return;
      }
    }

    // handle merge actions
    if (currentStep === 8) {
      if (cmd === "git fetch") {
        addTerminalLog("Fetched latest updates from origin/main.");
        setHasFetched(true);
        return;
      }

      if (cmd.startsWith("git merge main")) {
        if (!hasFetched) {
          addTerminalLog("⚠️ You need to fetch the latest changes first (run 'git fetch').");
          return;
        }
        addTerminalLog("Merging main into your branch...");
        addTerminalLog("⚠️ Merge conflict detected in Dockerfile!");
        setMergeConflict(true);
        setConflictIntroduced(true);
        setCode(prev =>
          `<<<<<<< HEAD\n${prev.trim()}\n=======\nEXPOSE 8080\n>>>>>>> main\n`
        );

        if (onAdvance) onAdvance(9);
        setCurrentStep(9);
        return;
      }

      addTerminalLog("💡 Hint: Try 'git fetch' then 'git merge main'.");
      return;
    }

    if (currentStep === 9) {
      if (cmd.startsWith("git add")) {
        setStaged(true);
        addTerminalLog("Files staged after resolving conflicts.");
        return;
      }

      if (cmd.startsWith("git commit -m")) {
        if (!staged) {
          addTerminalLog("⚠️ You must stage your resolved file first (use 'git add .').");
          return;
        }

        if (code.includes("<<<<<<<") || code.includes("=======") || code.includes(">>>>>>>")) {
          addTerminalLog("⚠️ Conflict markers still present. Please resolve them first.");
          return;
        }

        addTerminalLog("Commit successful: 'fix: resolve merge conflict'");
        setMergeConflict(false);
        setConflictIntroduced(false);
        setStaged(false);
        setHasCommitted(true);
        addTerminalLog("✅ Conflicts resolved and committed locally. Now push to main.");
        return;
      }

      if (cmd.startsWith("git push")) {
        if (!hasCommitted) {
          addTerminalLog("⚠️ You haven’t committed the resolved file yet. Run 'git commit -m' first.");
          return;
        }
        addTerminalLog("Pushed branch to main. Merge completed successfully!");
        if (onAdvance) onAdvance(10);
        setCurrentStep(10);
        return;
      }

      addTerminalLog("💡 Hint: Resolve conflicts, then 'git add .', 'git commit -m', 'git push origin main'.");
      return;
    }

    // handle pipeline simulation
    if (cmd === "run pipeline" || cmd === "trigger pipeline") {
      handlePipelineRun();
      return;
    }

    // Success feedback and story step progression or show hints
    if (matches) {
      addTerminalLog(` ${currentStory.success}`);
      if (onAdvance && currentStory.next) {
        setTimeout(() => onAdvance(currentStory.next), 800);
        setCurrentStep(currentStory.next);
      }
    } else if (cmd === "help") {
      addTerminalLog(`💡Hint: ${currentStory?.hint || "No hint available."}`);
      logEvent("help_request", {
        module: moduleData.id,
        session: sessionId,
        step: currentStory?.id ?? currentStep,
        source: "gitops_editor_terminal",
        command: cmd
      });
    } else {
      addTerminalLog(" Rethink your command choice. Type 'help' for guidance.");
    }
  }

  // Commit logic
  function handleCommit(msgFromCmd) {
    // If resolving a conflict
    if (mergeConflict) {
      if (code.includes("<<<<<<<") || code.includes("=======") || code.includes(">>>>>>>")) {
        addTerminalLog("⚠️ Conflict markers still present. Please resolve them manually before committing.");
        return;
      } else {
        addTerminalLog("Merge conflict resolved! Committing fix...");
        setMergeConflict(false);
        setConflictIntroduced(false);
        addTerminalLog(`Commit successful: "${lastCommitMsg || "fix: resolve merge conflict"}"`);
        setShowReflection(true);
        if (onAdvance) onAdvance(10);
        setCurrentStep(10);
        return;
      }
    }

    // Regular commit flow. Shows solution button if multiple failed attempts
    const msg = msgFromCmd || lastCommitMsg || "fix: applied improvements";
    const nextAttempt = attemptCount + 1;
    setAttemptCount(nextAttempt);
    const fb = analyzeCode(code, nextAttempt);
    setFeedback(fb.feedback);

    // logEvent for telemetry hook for validation
    logEvent("validation_result", {
      module: moduleData.id,
      session: sessionId,
      success: fb.success,
      details: fb.feedback
    });

    if (fb.success) {
      addTerminalLog(`Commit successful: "${msg}"`);
      addTerminalLog("Great! Now push your branch to share changes.");
      setAttemptCount(0);
      setShowSolutionButton(false);
      if (currentStep !== 7 && onAdvance && currentStory?.next) {
        setTimeout(() => onAdvance(currentStory.next), 800);
        setCurrentStep(currentStory.next);
      }
      return;
    } else {
      addTerminalLog("⚠️ Commit recorded, but Dockerfile has remaining issues.");
      if (onAdvance && currentStory?.id > 3) {
        setTimeout(() => onAdvance(3), 800);
        setCurrentStep(3);
      }
      if (nextAttempt >= 3) setShowSolutionButton(true);
    }
  }

  function handleShowSolution() {
    setCode(correctSolution);
    addTerminalLog("Solution applied. Review it carefully to understand why it works.");
    setFeedback(["Correct solution applied. Reflect on the Dockerfile structure."]);
    setShowSolutionButton(false);
    logEvent("show_solution", {
      module: moduleData.id,
      session: sessionId,
      editor: "gitops",
      hint: "show_solution",
      attemptsBeforeHint: attemptCount
    });
  }

  // Push logic
  function handlePush() {
    addTerminalLog(` Pushed branch to remote.`);
    const fb = analyzeCode(code);
    const exposeMatch = code.match(/EXPOSE\s+(\d+)/i);
    const exposePort = exposeMatch ? Number(exposeMatch[1]) : null;

    // logEvent for telemetry hook for validation
    logEvent("validation_result", {
      module: moduleData.id,
      session: sessionId,
      success: fb.success,
      details: fb.feedback
    });

    // Case 1: Dockerfile correct and port is 3000
    if (fb.success && exposePort === 3000) {
      addTerminalLog("Ben: Perfect. Thanks! I'm going to merge your branch into main...");
      setTimeout(() => {
        if (onAdvance) onAdvance(8);
        setCurrentStep(8);
      }, 1000);
      return;
    }

    // Case 2: Wrong port or missing EXPOSE
    if (fb.success && exposePort !== 3000) {
      addTerminalLog(`Leia: Looks good overall, but please expose port 3000 (found EXPOSE ${exposePort || "none"}).`);
      addTerminalLog("💬 Type 'ok' to acknowledge and fix it.");
      setFeedback(["Expose port 3000 for accessibility."]);
      if (onAdvance) onAdvance(6);
      setCurrentStep(6);
      return;
    }

    // Case 3: Other issues remain
    addTerminalLog("Leia: I see some remaining issues in the Dockerfile.");
    fb.feedback.forEach((msg) => addTerminalLog(msg));
    addTerminalLog("💬 Type 'ok' to acknowledge and continue.");
    setFeedback(fb.feedback);

    if (onAdvance) onAdvance(6);
    setCurrentStep(6);
  }


  // Simulate CI/CD run
  function handlePipelineRun() {
    if (mergeConflict) {
      addTerminalLog("❗ Cannot run pipeline while there is an unresolved merge conflict. Resolve it first.");
      return;
    }
    setPipelineTrigger(true);
    addTerminalLog("🔄 Running CI/CD pipeline simulation...");
    setTimeout(() => {
      addTerminalLog("✅ Build and deployment successful!");
      setPipelineTrigger(false);
      setShowReflection(true);
    }, 2000);
  }

  return (
    <div className="space-y-6">
      {/* Story block */}
      {currentStory && (
        <Card className="p-4 border-l-4 border-blue-500 bg-blue-50">
          <p className="font-semibold">{currentStory.story}</p>
          <p className="text-sm text-slate-600 mt-1">
            <em>{currentStory.learning_focus}</em>
          </p>
        </Card>
      )}

      {/* Feedback Panel*/}
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

      {/* Show Solution Button (appears after 3 failed attempts) */}
      {showSolutionButton && (
        <div className="text-center mt-4">
          <Button
            onClick={handleShowSolution}
            variant="outline"
            className="text-blue-700 border-blue-400"
          >
            💡 Show Solution
          </Button>
          <p className="text-xs text-gray-500 mt-1">
            Review the applied fix to learn why it resolves the build issue.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Editor */}
        <div className={`border rounded-xl overflow-hidden shadow-sm transition ${
            mergeConflict ? "border-red-500 ring-2 ring-red-200" : ""
          }`}
        >
          <Editor
            height="30vh"
            language="dockerfile"
            theme="vs-dark"
            value={code}
            onChange={(value) => {setCode(value || ""); 
              logEvent("editor_change", {
                  module: moduleData.id,
                  session: sessionId,
                  editor: "gitops",
                  file: "Dockerfile",
                  length: code.length
                });
            }}
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

      {/* Reflection Section*/}
      {showReflection && (
        <ReflectionCard
          moduleData={moduleData}
          onComplete={() => {
            addTerminalLog("🎉 Reflection saved! Module complete — next challenge unlocked.");
            updateModuleProgress(moduleData.id);
            setShowReflection(false);
            setShowCompletionModal(true);
            logEvent("module_complete", {
              module: moduleData.id,
              session: sessionId,
              timestamp: Date.now()
            });
          }}
          sessionId={sessionId}
        />
      )}

      {/* Module Complete Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[90%] max-w-md text-center space-y-4">
            <h2 className="text-xl font-semibold text-green-700">🎉 Module Complete!</h2>
            <p className="text-slate-700 text-sm">
              You’ve completed <strong>{moduleData.title}</strong>.<br />
              The next module is now unlocked on your dashboard.
            </p>
            <Button
              onClick={() => (window.location.href = "/")}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
