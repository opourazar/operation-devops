import { useEffect, useRef, useState } from "react";
import GitOpsEditor from "@/components/GitOpsEditor";
import PreLab from "@/components/PreLab";
import GitTerminal from "@/components/GitTerminal";
import KubeEditor from "@/components/KubeEditor";
import IaCEditor from "@/components/IaCEditor";
import CheatSheetPanel from "@/components/CheatSheetPanel";
import { Button } from "@/components/ui/button";
import modulesData from "@/data/modules.json";
import { scenarioScript } from "@/data/scenarioScript";
import { scenarioScriptModule2 } from "@/data/scenarioScriptModule2";
import { scenarioScriptModule3 } from "@/data/scenarioScriptModule3";
import { getSessionId, logEvent } from "@/lib/telemetry";
import { getCheatSheetOpen, setCheatSheetOpen } from "@/lib/cheatsheet";

export default function ModuleWorkspace() {
  const [moduleData, setModuleData] = useState(null);
  const [stage, setStage] = useState("prelab");
  const [scenarioStep, setScenarioStep] = useState(1);
  const [prelabStep, setPrelabStep] = useState(0);
  const [cheatOpen, setCheatOpen] = useState(false);
  const activeModule = localStorage.getItem("activeModule");
  const script =
  activeModule === "module-3"
    ? scenarioScriptModule3
    : activeModule === "module-2"
    ? scenarioScriptModule2
    : scenarioScript;
  const sessionId = getSessionId();
  const startLogged = useRef(false);
  const progressKey = (id) => `moduleProgress:${id}`;
  const validStages = new Set(["prelab", "terminal", "editor", "complete"]);
  
  useEffect(() => {
    const activeId = localStorage.getItem("activeModule");
    if (activeId) {
      const found = modulesData.find((m) => m.id === activeId);
      setModuleData(found);

      const saved = localStorage.getItem(progressKey(activeId));
      if (saved && found) {
        try {
          const parsed = JSON.parse(saved);
          const prelabCount = found?.phases?.prelab?.activities?.length ?? 0;
          const maxScenario = Math.max(script.length, 1);

          const safePrelabStep = prelabCount
            ? Math.min(Math.max(parsed.prelabStep ?? 0, 0), prelabCount - 1)
            : 0;
          const safeScenarioStep = Math.min(
            Math.max(parsed.scenarioStep ?? 1, 1),
            maxScenario
          );
          const parsedStage = validStages.has(parsed.stage)
            ? parsed.stage
            : "prelab";
          const stageFromScenario =
            parsedStage !== "complete" && parsed.scenarioStep > script.length
              ? "complete"
              : parsedStage;

          setStage(stageFromScenario);
          setScenarioStep(stageFromScenario === "complete" ? maxScenario : safeScenarioStep);
          setPrelabStep(safePrelabStep);
        } catch (err) {
          console.warn("Unable to parse saved module progress", err);
        }
      }

      // Restore cheat sheet open preference
      setCheatOpen(getCheatSheetOpen(activeId));
    }
    // Reset branch name on module start to avoid cross-module carryover
    localStorage.removeItem("branchName");
  }, []);

  useEffect(() => {
    if (!moduleData) return;

    // Telemetry hook module_start marks the beginning for phase timing metrics
    if (!startLogged.current) {
      logEvent("module_start", {
        module: moduleData.id,
        session: sessionId,
        timestamp: Date.now()
      });
      startLogged.current = true;
    }
  }, [moduleData]);

  useEffect(() => {
    if (!moduleData) return;
    // Telemetry hook for stage changes used for prelab vs lab duration comparison
    logEvent("module_stage_change", {
      module: moduleData.id,
      session: sessionId,
      stage,
      timestamp: Date.now()
    });
  }, [stage, moduleData, sessionId]);

  useEffect(() => {
    if (!moduleData) return;
    const payload = {
      stage,
      prelabStep,
      scenarioStep
    };
    localStorage.setItem(progressKey(moduleData.id), JSON.stringify(payload));
  }, [stage, prelabStep, scenarioStep, moduleData]);

  function handleAdvance(nextStepId) {
    const boundedStep = Math.min(Math.max(nextStepId, 1), script.length);
    setScenarioStep(boundedStep);

    const openEditorSteps = {
      "module-1": 3,
      "module-2": 3,
      "module-3": 3
    };

    if (nextStepId === openEditorSteps[activeModule]) {
      setStage("editor");
    } else if (nextStepId > script.length) {
      console.log("🎓 Module complete!");
      setStage("complete");
    }
  }

  if (!moduleData) {
    return (
      <div className="p-6 text-slate-600">
        <h1 className="text-xl font-semibold">No Module Selected</h1>
        <p>Return to the Student Dashboard to start a learning module.</p>
      </div>
    );
  }

  const story = moduleData?.phases?.lab?.story_context;
  const prelab = moduleData?.phases?.prelab;

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto h-screen min-w-0 overflow-y-scroll px-4">
      <div className="flex items-start gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{moduleData.title}</h1>
          {stage === "prelab" && prelab && (
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-slate-800">{prelab.title}</h2>
              <p className="text-sm text-gray-700">{prelab.description}</p>
            </div>
          )}
        </div>
        <Button
          variant={cheatOpen ? "secondary" : "outline"}
          onClick={() => {
            setCheatOpen(!cheatOpen);
            setCheatSheetOpen(moduleData.id, !cheatOpen);
          }}
        >
          {cheatOpen ? "Hide Cheat Sheet" : "Open Cheat Sheet"}
        </Button>
      </div>

      {stage === "prelab" && (
        <PreLab
          moduleData={moduleData}
          initialStep={prelabStep}
          onStepChange={setPrelabStep}
          onContinue={() => setStage("terminal")}
        />
      )}

      {stage === "terminal" && (
        <GitTerminal
          onAdvance={handleAdvance} 
          sessionId={sessionId}
        />
      )}

      {stage === "editor" && (
        <>
          {moduleData.id === "module-3" ? (
            <IaCEditor moduleData={moduleData} onAdvance={handleAdvance} sessionId={sessionId}/>
          ) : moduleData.id === "module-2" ? (
            <KubeEditor moduleData={moduleData} onAdvance={handleAdvance} sessionId={sessionId}/>
          ) : (
            <GitOpsEditor
              moduleData={moduleData}
              scenarioStep={scenarioStep}
              onAdvance={handleAdvance}
              sessionId={sessionId}
            />
          )}
        </>
      )}

      {stage === "complete" && (
        <div className="p-6 text-center bg-green-50 border border-green-300 rounded-xl">
          <h2 className="text-xl font-semibold text-green-700 mb-2">Module Complete!</h2>
          <p className="text-green-600">🎉 Well done — you’ve finished this learning scenario.</p>
        </div>
      )}
      <CheatSheetPanel
        moduleId={moduleData.id}
        moduleTitle={moduleData.title}
        open={cheatOpen}
        onClose={() => {
          setCheatOpen(false);
          setCheatSheetOpen(moduleData.id, false);
        }}
      />
    </div>
  );
}


