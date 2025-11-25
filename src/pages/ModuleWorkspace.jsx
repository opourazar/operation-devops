import { useEffect, useState } from "react";
import GitOpsEditor from "@/components/GitOpsEditor";
import PreLab from "@/components/PreLab";
import GitTerminal from "@/components/GitTerminal";
import KubeEditor from "@/components/KubeEditor";
import IaCEditor from "@/components/IaCEditor";
import modulesData from "@/data/modules.json";
import { scenarioScript } from "@/data/scenarioScript";
import { scenarioScriptModule2 } from "@/data/scenarioScriptModule2";
import { scenarioScriptModule3 } from "@/data/scenarioScriptModule3";

export default function ModuleWorkspace() {
  const [moduleData, setModuleData] = useState(null);
  // prelab | terminal | editor
  const [stage, setStage] = useState("prelab");
  const [scenarioStep, setScenarioStep] = useState(1);
  const activeModule = localStorage.getItem("activeModule");
  const script =
  activeModule === "module-3"
    ? scenarioScriptModule3
    : activeModule === "module-2"
    ? scenarioScriptModule2
    : scenarioScript;
  
  useEffect(() => {
    // Reset branch name on module start to avoid cross-module carryover
  localStorage.removeItem("branchName");
    const activeId = localStorage.getItem("activeModule");
    if (activeId) {
      const found = modulesData.find((m) => m.id === activeId);
      setModuleData(found);
    }
  }, []);

  function handleAdvance(nextStepId) {
    setScenarioStep(nextStepId);

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{moduleData.title}</h1>

      {stage === "prelab" && (
        <PreLab moduleData={moduleData} onContinue={() => setStage("terminal")} />
      )}

      {stage === "terminal" && (
        <GitTerminal
          onAdvance={handleAdvance} 
        />
      )}

      {stage === "editor" && (
        <>
          {moduleData.id === "module-3" ? (
            <IaCEditor moduleData={moduleData} onAdvance={handleAdvance} />
          ) : moduleData.id === "module-2" ? (
            <KubeEditor moduleData={moduleData} onAdvance={handleAdvance} />
          ) : (
            <GitOpsEditor
              moduleData={moduleData}
              scenarioStep={scenarioStep}
              onAdvance={handleAdvance}
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
    </div>
  );
}


