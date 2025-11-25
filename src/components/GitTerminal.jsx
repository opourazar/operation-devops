import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { scenarioScript } from "@/data/scenarioScript";
import { scenarioScriptModule2 } from "@/data/scenarioScriptModule2";
import { scenarioScriptModule3 } from "@/data/scenarioScriptModule3";

export default function GitTerminal({ onAdvance }) {
  const [log, setLog] = useState(["Welcome to the GitOps Simulation Terminal"]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState(0);
  const terminalRef = useRef(null);

  //Determines which script to use based on the active module
  const activeModule = localStorage.getItem("activeModule");
  const script =
    activeModule === "module-3"
      ? scenarioScriptModule3
      : activeModule === "module-2"
      ? scenarioScriptModule2
      : scenarioScript;

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

    const current = script[step];
    const matches =
      current?.expected?.some((pattern) => cmd.startsWith(pattern)) || false;

    // Dynamic branch name parsing
    const branchMatch = cmd.match(
      /git\s+(?:checkout|switch)\s+(?:-b|-c)?\s*([\w\/.-]+)/
    );
    const branchName = branchMatch ? branchMatch[1] : "feature/fix-dockerfile";

    if (current?.id === 1 && branchMatch) {
      localStorage.setItem("branchName", branchName);
    }

    if (matches) {
      let successMsg = current.success;

      if (current?.id === 1 && branchMatch) {
        successMsg = `🪄 Branch '${branchName}' created and switched.`;
      }

      addLog(successMsg);
      if (current.learning_focus) {
        addLog(`💡 Why?: ${current.learning_focus}`);
      }

      // Open Dockerfile editor (Module 1)
      if (cmd.includes("open dockerfile") || cmd.includes("code dockerfile")) {
        addLog("📂 Opening Dockerfile in the editor...");
        setTimeout(() => onAdvance(3), 2000);
        setInput("");
        return;
      }

      // Branching and open Kube YAML editor (Module 2)
      if (activeModule === "module-2") {
        if (cmd.startsWith("open deployment.yaml")) {
          addLog("📂 Opening Kubernetes deployment editor...");
          setTimeout(() => onAdvance(3), 2000);
          setInput("");
          return;
        }
      }

      if (
        (cmd.includes("open main.tf") || cmd.includes("code main.tf"))
      ) {
        addLog("📂 Opening Terraform configuration (main.tf)...");
        setTimeout(() => onAdvance(3), 2000);
        setInput("");
        return;
      }

      // Terraform command visual feedback (Module 3, Step 1-3)
      if (activeModule === "module-3") {
        if (cmd.startsWith("terraform init")) {
          addLog("🔧 Initializing Terraform... downloading providers and modules...");
        } else if (cmd.startsWith("terraform plan")) {
          addLog("Generating Terraform execution plan...");
        } else if (cmd.includes("open main.tf") || cmd.includes("code main.tf")) {
          addLog("📂 Opening Terraform configuration (main.tf)...");
          addLog("You'll continue the next steps inside the IaC Editor.");
        }
      }

      // Continue to next scenario step
      setTimeout(() => {
        if (current.next !== null && current.next <= script.length) {
          setStep(current.next - 1);
        } else {
          addLog("🎉 Scenario complete — proceeding to reflection or summary view.");
          setTimeout(() => onAdvance("editor"), 1200);
        }
      }, 800);
    } else if (cmd === "help" || cmd === "hint") {
      addLog(`💡 Hint: ${current?.hint || "No hint available."}`);
    } else {
      addLog("That command doesn't fit here. Type 'help' if you're unsure.");
    }

    setInput("");
  }

  const currentStory = script[step]?.story;

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
