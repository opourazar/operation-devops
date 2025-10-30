import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { scenarioScript } from "@/data/scenarioScript";

export default function GitTerminal({ onAdvance }) {
  const [log, setLog] = useState(["👋 Welcome to the GitOps Simulation Terminal"]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState(0);
  const terminalRef = useRef(null);

  useEffect(() => {
    terminalRef.current?.scrollTo(0, terminalRef.current.scrollHeight);
  }, [log]);

  function addLog(entry) {
    setLog((prev) => [...prev, entry]);
  }

  function handleCommand(e) {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;
    addLog(`$ ${cmd}`);

    const current = scenarioScript[step];
    const matches =
      current?.expected?.some((pattern) => cmd.startsWith(pattern)) || false;

    // Dynamic branch name parsing
    const branchMatch = cmd.match(/git\s+(?:checkout|switch)\s+(?:-b|-c)?\s*([\w\/.-]+)/);
    const branchName = branchMatch ? branchMatch[1] : "feature/fix-dockerfile";

    if (matches) {
      let successMsg = current.success;

      // Replace branch name dynamically
      if (current.id === 1 && branchMatch) {
        successMsg = `🪄 Branch '${branchName}' created and switched.`;
      }

      addLog(`✅ ${successMsg}`);
      if (current.learning_focus) {
        addLog(`🧠 Learning Focus: ${current.learning_focus}`);
      }

      // If command involves opening the Dockerfile, move to editor view
      if (cmd.includes("open dockerfile") || cmd.includes("code dockerfile")) {
        addLog("📂 Opening Dockerfile in the editor...");
        setTimeout(() => onAdvance("editor"), 1000); // tell parent to open editor
        setInput("");
        return;
      }

      // Otherwise, just continue to next scenario step
      setTimeout(() => {
        if (current.next !== null) {
          setStep(current.next - 1);
        } else {
          addLog("🎉 All steps completed. Opening Dockerfile...");
          setTimeout(() => onAdvance("editor"), 1500);
        }
      }, 800);
    } 
    else if (cmd === "help" || cmd === "hint") {
      addLog(`💡 Hint: ${current.hint}`);
    } 
    else {
      addLog(`❌ Unknown command. Type 'help' if you're stuck.`);
    }

    setInput("");
  }

  const currentStory = scenarioScript[step]?.story;

  return (
    <Card className="p-4 bg-black text-green-300 font-mono">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, backgroundColor: "rgba(34,197,94,0.2)" }}
          animate={{ opacity: 1, backgroundColor: "rgba(0,0,0,0)" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-2 text-green-200 p-2 rounded"
        >
          {currentStory && (
            <>
              <div>{currentStory}</div>
              <div className="text-green-500 mt-1 text-sm italic">
                (Type a command to proceed — type 'help' for a hint)
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <div
        className="h-56 overflow-y-auto whitespace-pre-wrap mb-2 border-t border-green-700 pt-2"
        ref={terminalRef}
      >
        {log.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>

      <form onSubmit={handleCommand} className="flex gap-2">
        <span className="text-green-400">$</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent outline-none text-green-100"
          placeholder="Type your command..."
        />
        <Button type="submit" variant="secondary">
          Run
        </Button>
      </form>
    </Card>
  );
}
