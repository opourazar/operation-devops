import { useEffect, useState } from "react";
import GitOpsEditor from "@/components/GitOpsEditor";
import PreLab from "@/components/PreLab";
import GitTerminal from "@/components/GitTerminal";
import modulesData from "@/data/modules.json";
import { scenarioScript } from "@/data/scenarioScript";

export default function ModuleWorkspace() {
  const [moduleData, setModuleData] = useState(null);
  // prelab | terminal | editor
  const [stage, setStage] = useState("prelab");
  const [scenarioStep, setScenarioStep] = useState(1);
  
  useEffect(() => {
    const activeId = localStorage.getItem("activeModule");
    if (activeId) {
      const found = modulesData.find((m) => m.id === activeId);
      setModuleData(found);
    }
  }, []);

  function handleAdvance(nextStepId) {
    setScenarioStep(nextStepId);

    // transition logic, move from terminal to editor once dockerfile opened
    if (nextStepId === 3) {
      setStage("editor");
    } else if (nextStepId > scenarioScript.length) {
      // scenario complete — could trigger reflection or unlock next module
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

      {/* Context / Scenario */}
      {story && stage === "prelab" && (
        <div className="p-4 border-l-4 border-blue-500 bg-blue-50 text-slate-700">
          <strong>Scenario Context:</strong> {story}
        </div>
      )}

      {stage === "prelab" && (
        <PreLab moduleData={moduleData} onContinue={() => setStage("terminal")} />
      )}

      {stage === "terminal" && (
        <GitTerminal
          onAdvance={() => handleAdvance(3)} // ✅ tell the handler to go to step 3
        />
      )}

      {stage === "editor" && (
        <GitOpsEditor
          moduleData={moduleData}
          scenarioStep={scenarioStep}
          onAdvance={handleAdvance}
        />
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


