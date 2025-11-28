import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import ReflectionCard from "@/components/ReflectionCard";
import { updateModuleProgress } from "@/lib/updateModuleProgress";
import { scenarioScriptModule3 } from "@/data/scenarioScriptModule3";
import { logEvent } from "@/lib/telemetry";

// Mock Terraform file imports (replace with actual paths if needed)
import mainFile from "@/data/terraform/main.tf?raw";
import variablesFile from "@/data/terraform/variables.tf?raw";
import outputsFile from "@/data/terraform/outputs.tf?raw";
import autoscalingFile from "@/data/terraform/autoscaling.tf?raw";

export default function IaCEditor({ moduleData, onAdvance, sessionId }) {
  const fileDefaults = {
    "main.tf": mainFile,
    "variables.tf": variablesFile,
    "outputs.tf": outputsFile,
    "autoscaling.tf": autoscalingFile,
  };

  const getInitialFileContents = () => {
    const base = { ...fileDefaults };
    if (typeof window === "undefined") return base;

    return Object.keys(base).reduce((acc, key) => {
      const stored = localStorage.getItem(`iacEditor_${key}`);
      acc[key] = stored ?? base[key];
      return acc;
    }, {});
  };

  const [fileContents, setFileContents] = useState(getInitialFileContents);
  const [selectedFile, setSelectedFile] = useState("main.tf");
  const [code, setCode] = useState(() => getInitialFileContents()["main.tf"]);
  const [feedback, setFeedback] = useState([]);
  const [metrics, setMetrics] = useState({
    cost: 220,
    latency: 250,
    availability: 99.2,
  });
  const [applied, setApplied] = useState(false);
  const [validated, setValidated] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showAutoStructure, setShowAutoStructure] = useState(false);

  // Scenario flow state
  const [currentStep, setCurrentStep] = useState(4); // Start after main.tf is opened
  const currentStory = scenarioScriptModule3.find((s) => s.id === currentStep);

  // Step-based enable/disable control for Terraform actions
  const buttonStateMap = {
    4: { validate: true, apply: false, checkMetrics: false, destroy: false }, // Editing region / instance type
    5: { validate: false, apply: true, checkMetrics: false, destroy: false },  // Apply changes
    6: { validate: false, apply: false, checkMetrics: true, destroy: false },  // Check metrics
    7: { validate: false, apply: false, checkMetrics: false, destroy: false }, // Preparing for autoscaling
    8: { validate: true, apply: false, checkMetrics: false, destroy: false },  // Validate autoscaling.tf
    9: { validate: false, apply: true, checkMetrics: false, destroy: false },  // Apply autoscaling
    10: { validate: false, apply: false, checkMetrics: false, destroy: true }, // Destroy environment
    11: { validate: false, apply: false, checkMetrics: false, destroy: false } // Reflection step
  };

  const activeButtons = buttonStateMap[currentStep] || {};

  // Load selected Terraform file (preferring saved drafts) + only auto-advance to step 8 when user opens autoscaling.tf after step 6
  useEffect(() => {
    const nextCode = fileContents[selectedFile] ?? fileDefaults[selectedFile] ?? "";
    setCode(nextCode);

    // Only auto-advance to next scenario step when opening autoscaling.tf at the right time
    if (selectedFile === "autoscaling.tf" && currentStep === 7) {
      // Inform the learner and then advance to step 8 (ready to validate scaling)
      setFeedback([
        "📂 autoscaling.tf opened — add the auto-scaling blocks now using the TODOs or peek the structure below.",
        "When ready, run 'terraform validate' to check syntax."
      ]);
      setTimeout(() => setCurrentStep(8), 800);
    }
  }, [selectedFile, fileContents, currentStep]);

  // Hide the structure helper when leaving autoscaling.tf
  useEffect(() => {
    if (selectedFile !== "autoscaling.tf" && showAutoStructure) {
      setShowAutoStructure(false);
    }
  }, [selectedFile, showAutoStructure]);

  // Terraform analysis
  function analyzeIaC(code) {
    const findings = [];

    const regionMatch = code.match(/region\s*=\s*"?([\w-]+)"?/);
    const instanceMatch = code.match(/instance_type\s*=\s*"?([\w.-]+)"?/);
    const hasProvider = /provider\s+"aws"/.test(code);
    const hasOutput = /output\s+"/.test(code);
    const hasResource = /resource\s+"/.test(code);

    // Checklist booleans
    const correctRegion = regionMatch?.[1] === "eu-central-1";
    const instanceType = instanceMatch?.[1] || "";
    const isCostOptimized =
      instanceType.includes("micro") ||
      instanceType.includes("small") ||
      instanceType.startsWith("t3.");

    // Collect findings
    if (!hasProvider)
      findings.push("❌ Missing provider block (`provider \"aws\" { ... }`).");
    if (!hasResource)
      findings.push("❌ No resource block found. Define at least one `aws_instance` or similar.");
    if (!hasOutput)
      findings.push("⚠️ Consider adding an output block to expose deployment results.");

    if (!correctRegion && regionMatch)
      findings.push(`⚠️ Region set to '${regionMatch[1]}'. Policy requires 'eu-central-1'.`);

    if (instanceMatch) {
      if (!isCostOptimized)
        findings.push("Instance type too costly — use 't3.micro' or 't3.small'.");
      else
        findings.push("✅ Cost-optimized instance type detected.");
    }

    // Final success condition (Step 4 logic)
    const isOptimized =
      hasProvider &&
      hasResource &&
      correctRegion &&
      isCostOptimized;

    if (isOptimized) {
      findings.push("🎉 Configuration looks well optimized and ready for apply.");
    }

    return {
      findings,
      isOptimized
    };
  }


  // Monitoring simulation
  function simulateMetrics() {
    let newMetrics = { ...metrics };
    if (code.includes("eu-central-1")) newMetrics.latency = 110;
    if (code.includes("t3.micro")) newMetrics.cost = 75;
    if (code.includes("autoscaling_group")) newMetrics.availability = 99.9;
    setMetrics(newMetrics);
  }

  function handleValidate() {
    if (!activeButtons.validate) return;

    // logEvent call for telemetry hook
    logEvent("editor_action", {
      module: moduleData.id,
      session: sessionId,
      action: "terraform_validate",
      file: selectedFile,
      step: currentStep
    });

   // Step 8: Autoscaling.tf validation logic with comment filtering
    if (currentStep === 8) {
      if (selectedFile !== "autoscaling.tf") {
        setFeedback(["⚠️ Switch to autoscaling.tf to validate the scaling configuration."]);
        return;
      }

      // Filter out commented lines
      const uncommented = code
        .split("\n")
        .filter((line) => !line.trim().startsWith("#"))
        .join("\n");

      const findings = [];

      // Actual checks on code (ignoring comments)
      const hasLaunchTemplate = /resource\s+"aws_launch_template"\s+"/.test(uncommented);
      const hasASG = /resource\s+"aws_autoscaling_group"\s+"/.test(uncommented);
      const hasLaunchRef = /launch_template\s*\{/.test(uncommented);
      const hasTagBlock = /tag\s*\{/.test(uncommented);

      // Feedback
      findings.push(
        hasLaunchTemplate
          ? "✅ Launch template block found."
          : "❌ Missing launch template resource. Complete TODO 1."
      );

      findings.push(
        hasASG
          ? "✅ Auto-scaling group resource detected."
          : "❌ Missing auto-scaling group resource. Complete TODO 2."
      );

      if (hasASG && !hasLaunchRef)
        findings.push("⚠️ Auto-scaling group exists but lacks a launch_template reference.");
      else if (hasLaunchRef)
        findings.push("🔗 Launch template correctly referenced.");

      findings.push(
        hasTagBlock
          ? "🏷️ Tag block present — good job!"
          : "💡 Tip: Add a tag block to label instances (see TODO 3)."
      );

      // Completion + progress
      const success = hasLaunchTemplate && hasASG && hasLaunchRef && hasTagBlock;

      if (success) {
        findings.push("✅ Configuration valid — no syntax errors detected. Ready to apply scaling.");
        setFeedback(findings);
        setValidated(true);

        // logEvent call for telemetry hook for validation result
        logEvent("validation_result", {
          module: moduleData.id,
          session: sessionId,
          success: success,
          details: feedback
        });

        // Progress after success
        setTimeout(() => setCurrentStep(9), 1000);
      } else {
        findings.push("Continue completing the remaining To-Dos.");
        setFeedback(findings);

        // logEvent call for telemetry hook for validation result
        logEvent("validation_result", {
          module: moduleData.id,
          session: sessionId,
          success: success,
          details: feedback
        });
      }

      return;
    }

    // Default validation for main.tf
    const { findings, isOptimized } = analyzeIaC(code);
    setFeedback(findings);
    setValidated(true);

    if (currentStep === 4 && isOptimized) {
      setTimeout(() => setCurrentStep(5), 1000);
    }
  }


  // Apply Step
  function handleApply() {
    if (!activeButtons.apply) return;
    
    if (selectedFile !== "main.tf") {
      setFeedback([
        `⚠️ You’re currently viewing ${selectedFile}.`,
        "Terraform apply is only available from main.tf — switch files using the dropdown above.",
      ]);
      return;
    }

    // logEvent call for telemetry hook
    logEvent("editor_action", {
      module: moduleData.id,
      session: sessionId,
      action: "apply_fix",
      file: selectedFile,
      step: currentStep
    });

    simulateMetrics();
    setFeedback([
      "🚀 Terraform apply simulated successfully.",
      "✅ Resources deployed in eu-central-1.",
      "📊 Monitoring dashboard updated below.",
    ]);
    setApplied(true);

    if (currentStep === 5) setTimeout(() => setCurrentStep(6), 1000);
    if (currentStep === 9) setTimeout(() => setCurrentStep(10), 1000);
  }

  function handleCheckMetrics() {
    if (!activeButtons.checkMetrics) return;
    simulateMetrics();
    setFeedback([
      "📊 Monitoring: Metrics show latency at 180 ms (acceptable), cost still optimized.",
      "No SLA violation detected."
    ]);
    setTimeout(() => setCurrentStep(7), 1000);
  }

  function handleDestroy() {
    if (!activeButtons.destroy) return;
    setFeedback(["🧹 Environment destroyed."]);
    setTimeout(() => {
      setCurrentStep(11);
      updateModuleProgress(moduleData.id);
      setShowReflection(true);
    }, 1200);
  }

  return (
    <Card className="p-4 bg-slate-950 text-slate-100 font-mono space-y-4 relative">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-sky-400 mb-1">
          IaC Configuration Editor (Terraform)
        </h2>
        <p className="text-slate-400 text-sm mb-2">
          Adjust Terraform files, then run validation and apply commands to see simulated
          monitoring feedback.
        </p>
      </div>

      {/* Story Panel */}
      {currentStory && (
        <Card className="p-4 border-l-4 border-blue-500 bg-blue-50 mb-3 text-slate-900">
          <p className="font-semibold">{currentStory.story}</p>
          <p className="text-sm text-slate-600 mt-1">
            <em>{currentStory.learning_focus}</em>
          </p>
        </Card>
      )}

      {/* Hint: step 7 prompt to open autoscaling.tf */}
      {currentStep === 7 && !showReflection && (
        <div className="text-sm text-yellow-300 mb-2">
          Mia suggested adding an auto-scaling group. Open <strong>autoscaling.tf</strong> from the File dropdown to begin.
        </div>
      )}


      {/* File selection */}
      <div className="flex items-center gap-2 mb-2">
        <label className="text-slate-400 text-sm">File:</label>
        <select
          value={selectedFile}
          onChange={(e) => setSelectedFile(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-100 text-sm rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-sky-400"
        >
          <option value="main.tf">main.tf</option>
          <option value="variables.tf">variables.tf</option>
          <option value="outputs.tf">outputs.tf</option>
          <option value="autoscaling.tf">autoscaling.tf</option>
        </select>
      </div>

      {/* Code Editor */}
      <textarea
        className="w-full h-56 bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
        value={code}
        onChange={(e) => {
          const nextValue = e.target.value;
          setCode(nextValue);
          setFileContents((prev) => {
            const updated = { ...prev, [selectedFile]: nextValue };
            if (typeof window !== "undefined") {
              localStorage.setItem(`iacEditor_${selectedFile}`, nextValue);
            }
            return updated;
          });
          logEvent("editor_change", {
            module: moduleData.id,
            session: sessionId,
            editor: "iac",
            file: selectedFile,
            length: nextValue.length
          });
        }}
      />

      {selectedFile === "autoscaling.tf" && (
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            Tip: follow the TODOs or reveal a reference structure for launch templates and Auto Scaling Groups.
          </span>
          <button
            type="button"
            className="text-sky-300 hover:text-sky-200"
            onClick={() => {
              const next = !showAutoStructure;
              setShowAutoStructure(next);
              logEvent("iac_show_structure_toggle", {
                module: moduleData.id,
                session: sessionId,
                shown: next,
                file: selectedFile,
                step: currentStep
              });
            }}
          >
            {showAutoStructure ? "Hide autoscaling structure" : "Show autoscaling structure"}
          </button>
        </div>
      )}

      {showAutoStructure && selectedFile === "autoscaling.tf" && (
        <div className="mt-2 p-3 border-l-4 border-slate-700 bg-slate-900 rounded text-sm">
          <pre className="whitespace-pre-wrap text-left text-slate-100">
{`resource "aws_launch_template" "demo_template" {
  name_prefix   = "demo-template-"
  image_id      = "ami-12345"
  instance_type = var.instance_type
}

resource "aws_autoscaling_group" "demo_asg" {
  desired_capacity = 1
  min_size         = 1
  max_size         = 3

  launch_template {
    id      = aws_launch_template.demo_template.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "demo-autoscaling"
    propagate_at_launch = true
  }
}`}
          </pre>
          <p className="text-xs text-slate-400 mt-2">
            Use this as a reference—keep working from the TODOs above so validation still guides you.
          </p>
        </div>
      )}

      {/* Buttons */}
      <p className="text-slate-400 text-sm italic mb-1">
        Simulated Terraform CLI commands:
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleValidate}
          variant="secondary"
          className={`bg-sky-700 hover:bg-sky-600 text-white ${
            !activeButtons.validate ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={!activeButtons.validate}
        >
          terraform validate
        </Button>

        <Button
          onClick={handleApply}
          variant="secondary"
          className={`bg-emerald-700 hover:bg-emerald-600 text-white ${
            !activeButtons.apply ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={!activeButtons.apply}
        >
          terraform apply
        </Button>

        <Button
          onClick={handleCheckMetrics}
          variant="secondary"
          className={`bg-amber-700 hover:bg-amber-600 text-white ${
            !activeButtons.checkMetrics ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={!activeButtons.checkMetrics}
        >
          check metrics
        </Button>

        <Button
          onClick={handleDestroy}
          variant="secondary"
          className={`bg-rose-700 hover:bg-rose-600 text-white ${
            !activeButtons.destroy ? "opacity-50 cursor-not-allowed" : ""
          }`}
          disabled={!activeButtons.destroy}
        >
          terraform destroy
        </Button>
      </div>

      {/* Validation Feedback */}
      {validated && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-slate-800 border border-slate-700 rounded-lg p-3 mt-3"
        >
          <h3 className="text-sky-400 font-semibold mb-2">
            🔍 Validation Feedback
          </h3>
          <ul className="text-sm space-y-1">
            {feedback.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Monitoring Feedback */}
      {applied && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-slate-900 border border-emerald-700 rounded-lg p-4 mt-3"
        >
          <h3 className="text-emerald-400 font-semibold mb-2">
            📊 Monitoring Dashboard
          </h3>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="p-2 bg-slate-800 rounded-lg text-center">
              💰 Cost<br />
              <span className="text-sky-300">{metrics.cost} USD/month</span>
            </div>
            <div className="p-2 bg-slate-800 rounded-lg text-center">
              ⚙️ Latency<br />
              <span className="text-sky-300">{metrics.latency} ms</span>
            </div>
            <div className="p-2 bg-slate-800 rounded-lg text-center">
              ☁️ Availability<br />
              <span className="text-sky-300">{metrics.availability}%</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Reflection Section */}
      {showReflection && (
        <ReflectionCard
          moduleData={moduleData}
          onComplete={() => {
            setFeedback(["🎉 Reflection saved! Module complete."]);
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
            <h2 className="text-xl font-semibold text-green-700">
              🎉 Module Complete!
            </h2>
            <p className="text-slate-700 text-sm">
              You’ve completed <strong>{moduleData.title}</strong>.<br />
              Thank you for testing the prototype!
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
    </Card>
  );
}
