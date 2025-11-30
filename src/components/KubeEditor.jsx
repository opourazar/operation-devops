import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Editor from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import yaml from "js-yaml";
import { analyzeKubeConfig } from "@/lib/analyzeKubeConfig";
import FeedbackPanel from "@/components/FeedbackPanel";
import ReflectionCard from "@/components/ReflectionCard";
import { updateModuleProgress } from "@/lib/updateModuleProgress";
import { scenarioScriptModule2 } from "@/data/scenarioScriptModule2";
import { logEvent } from "@/lib/telemetry";

export default function KubeEditor({ moduleData, onAdvance, sessionId }) {
  const erroneousYaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
      - name: web
        image: nginx
---
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  selector:
    app: web-app
  ports:
    - port: 80
      targetPort: 8080
      protocol: TCP
  type: ClusterIP
`;
  const savedYaml = localStorage.getItem("kubeEditorDraft");
  const [yamlText, setYamlText] = useState(savedYaml || erroneousYaml);
  const [feedback, setFeedback] = useState([]);
  const [success, setSuccess] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [scenarioStep, setScenarioStep] = useState(3);
  const [showStructure, setShowStructure] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState(null);
  const currentStory = scenarioScriptModule2.find((s) => s.id === scenarioStep);
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [liveLint, setLiveLint] = useState([]);
  const editorLogRef = useRef(0);

  useEffect(() => {
    if (onAdvance) onAdvance(scenarioStep);
  }, [scenarioStep]);

  // Debounced live linter
  useEffect(() => {
    if (!yamlText) return;

    const timer = setTimeout(() => {
      runLiveLint(yamlText);
    }, 600);

    return () => clearTimeout(timer);
  }, [yamlText]);

  // Push Monaco markers for live lint warnings
  useEffect(() => {
    const model = monaco.editor.getModels()[0];
    if (!model) return;

    // Map each lint message into a marker. We don't compute exact lines,
    // so show them at top of file (Monaco will display hover text).
    const markers = liveLint.map((msg, idx) => ({
      startLineNumber: 1 + idx,
      startColumn: 1,
      endLineNumber: 1 + idx,
      endColumn: 1,
      message: msg,
      severity: monaco.MarkerSeverity.Warning,
    }));

    monaco.editor.setModelMarkers(model, "kube-lint", markers);
  }, [liveLint]);

  // Lint/quick analysis without committing. Includes telemetry hook for validation outcomes chart.
  function handleLint() {
    const result = analyzeKubeConfig(yamlText);
    logEvent("kube_linting_attempt", {
      module: moduleData.id,
      session: sessionId,
      success: result.success,
      details: result.feedback
    });
    setFeedback(result.feedback);
  }

  /**
   * Live linter which supports multi-doc YAML (Deployment + Service).
   * Adds warnings for: missing kind; candidate Service selector mismatches; targetPort / containerPort mismatches 
   */
  function runLiveLint(code) {
    try {
      const docs = yaml.loadAll(code);

      const lint = [];

      // find deployment/service
      const deployment = docs.find((d) => d && d.kind === "Deployment");
      const service = docs.find((d) => d && d.kind === "Service");

      if (!deployment) {
        lint.push("Missing Deployment object (kind: Deployment).");
      } else {
        if (!deployment.spec) lint.push("Deployment missing `spec`.");
        else {
          if (!deployment.spec.replicas) lint.push("No `replicas` field defined (recommended >=1).");
          if (!deployment.spec.selector || !deployment.spec.selector.matchLabels)
            lint.push("Missing `spec.selector.matchLabels` in Deployment.");
          if (!deployment.spec.template || !deployment.spec.template.metadata)
            lint.push("Missing `spec.template.metadata` in Deployment.");
          const podLabels = deployment.spec?.template?.metadata?.labels || {};
          const containers = deployment.spec?.template?.spec?.containers || [];
          if (!containers.length) lint.push("No containers defined in Deployment template.");
          else {
            const c = containers[0];
            if (!c.image) lint.push("Container missing `image`.");
            const ports = c.ports || [];
            if (!ports.length) lint.push("No `containerPort` defined in container (Service routing may fail).");
          }

          // detect potential selector/template mismatch
          const sel = deployment.spec?.selector?.matchLabels || {};
          const mismatchKeys = [];
          for (const k of Object.keys(sel)) {
            if ((deployment.spec?.template?.metadata?.labels || {})[k] !== sel[k]) {
              mismatchKeys.push(k);
            }
          }
          if (mismatchKeys.length > 0) {
            lint.push(
              `Possible selector/template label mismatch on keys: ${mismatchKeys.join(", ")}.`
            );
          }
        }
      }

      if (service) {
        const svcSelector = service.spec?.selector || {};
        if (!Object.keys(svcSelector).length) {
          lint.push("Service has no selector — it will not find Pods.");
        }

        // if we have deployment info, attempt to cross-check
        if (deployment) {
          const podLabels = deployment.spec?.template?.metadata?.labels || {};
          const svcMismatches = Object.keys(svcSelector).filter((k) => podLabels[k] !== svcSelector[k]);

          if (svcMismatches.length > 0) {
            lint.push(`Service selector keys mismatching Pod labels: ${svcMismatches.join(", ")}.`);
          }

          const svcPort = service.spec?.ports?.[0];
          const containerPorts = (deployment.spec?.template?.spec?.containers?.[0]?.ports || []).map(p => p.containerPort);

          if (svcPort && typeof svcPort.targetPort !== "undefined") {
            const target = svcPort.targetPort;
            if (!containerPorts.includes(target)) {
              lint.push(`Service targetPort (${target}) does not match container ports (${containerPorts.join(", ") || "none"}).`);
            }
          }
        }
      }

      setLiveLint(lint);
    } catch (err) {
      setLiveLint([`YAML syntax error: ${err.message}`]);
    }
  }

  /** Validate YAML and trigger adaptive feedback (Commit Fix)
   * After commit we go to story step with id 4 (CI/CD).
   **/
  function handleCommitFix() {
    const result = analyzeKubeConfig(yamlText);
    setFeedback(result.feedback);
    setSuccess(Boolean(result.success));
    setLastAnalysis(result);

    if (result.success) {
      // fully valid; persist and advance to CI/CD validation step
      localStorage.setItem("kubeConfig", yamlText);
      setScenarioStep(4);
      return;
    }

    // not fully valid — check whether errors are service-specific.
    // If service errors present, we keep student on editor but warn; they must fix service later.
    // We'll not advance scenarioStep here; student must fix until no blocking errors remain.
  }

  /** Simulate CI/CD pipeline run.
   * After CI/CD stage (scenarioStep 4), the system simulates applying manifests.
   * If analysis already showed full success => pipeline will succeed and we advance to final verification (6).
   * If analysis shows service-specific error(s), pipeline will simulate pods running but service still failing,
   * leading to service-fix step (5).
   */
  function handleRunPipeline() {
    // If lastAnalysis indicates fully valid manifest
    if (lastAnalysis && lastAnalysis.success) {
      const pipelineFeedback = [
        { type: "tip", message: "Running CI/CD pipeline simulation..." },
        { type: "tip", message: "Building container image..." },
        { type: "tip", message: "Deploying updated configuration..." },
        {
          type: "success",
          message:
            "✅ All Pods reached 'Running' state. The Deployment reconciled with the desired state."
        },
        {
          type: "success",
          message:
            "Scaling verified — your fix resolved the issue under load."
        }
      ];
      setFeedback(pipelineFeedback);
      // advance to final observation (step 6) and show reflection later
      setTimeout(() => {
        setScenarioStep(6);
      }, 1200);
      return;
    }

    // If lastAnalysis exists but not successful, inspect feedback for service-related errors
    if (lastAnalysis && lastAnalysis.feedback) {
      const fb = lastAnalysis.feedback;
      const hasServiceError = fb.some(
        (it) =>
          (it.type === "error" || it.type === "warning") &&
          typeof it.message === "string" &&
          it.message.toLowerCase().includes("service")
      );

      if (hasServiceError) {
        // Simulate partial success: pods started but service has no endpoints
        const pipelineFeedback = [
          { type: "tip", message: "Running CI/CD pipeline simulation..." },
          { type: "tip", message: "Building container image..." },
          { type: "tip", message: "Deploying updated configuration..." },
          { type: "success", message: "✅ Deployment applied — Pods started." },
          {
            type: "error",
            message:
              "❌ Service has no healthy endpoints — Service selector or targetPort likely mismatched."
          },
          { type: "mentor", message: "Hint: Check service.spec.selector vs template.metadata.labels and service.targetPort vs containerPort." }
        ];
        setFeedback(pipelineFeedback);

        // advance to service-fix step (5)
        setTimeout(() => {
          setScenarioStep(5);
          // keep reflection modal closed until student fixes Service
        }, 1200);
        return;
      }
    }

    // Fallback: general pipeline fail
    const failFeedback = [
      { type: "tip", message: "Running CI/CD pipeline simulation..." },
      {
        type: "error",
        message:
          "❌ Pipeline failed during manifest validation — deployment not applied."
      },
      {
        type: "mentor",
        message:
          "Mentor: Make sure selectors and ports match between Deployment and Service, and that the container image is valid."
      }
    ];
    setFeedback(failFeedback);
  }

  return (
    <div className="space-y-6">
      {/* Story Context Panel */}
      {currentStory && scenarioStep < 7 && (
        <Card className="p-4 border-l-4 border-blue-500 bg-blue-50 w-full max-w-full">
          <p className="font-semibold whitespace-pre-line text-left break-words">{currentStory.story}</p>
          <p className="text-sm text-slate-600 mt-1 break-words">
            <em>{currentStory.learning_focus}</em>
          </p>
        </Card>
      )}

      {/* YAML Editor Section (with debounce autosave) */}
      <Card className="p-4 bg-slate-50 space-y-3">
        <div className="text-left flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-lg">Kubernetes Manifest Editor</h3>
            <p className="text-xs text-slate-500 mt-1">
              Edit the configurations below. Use <strong>Commit Fix</strong> to validate your changes.
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleLint} variant="secondary">
              Lint
            </Button>
            <Button onClick={handleCommitFix}>Commit Fix</Button>
            {success && (
              <Button onClick={handleRunPipeline} className="bg-green-600 text-white">
                Apply & Trigger Pipeline
              </Button>
            )}
          </div>
        </div>

        <Editor
          height="320px"
          defaultLanguage="yaml"
          value={yamlText}
        onChange={(val) => {
          setYamlText(val ?? "");
          if (debounceTimer) clearTimeout(debounceTimer);
            setDebounceTimer(
              setTimeout(() => {
                localStorage.setItem("kubeEditorDraft", val);
              }, 500)
            );
            const now = Date.now();
            if (now - editorLogRef.current > 1500) {
              editorLogRef.current = now;
              logEvent("editor_change", {
                module: moduleData.id,
                session: sessionId,
                editor: "kube",
                file: "manifest (YAML)",
                length: (val ?? "").length
              });
            }
          }}
          theme="vs-dark"
        />

        <div className="flex items-center justify-between gap-4">
          <div className="text-xs text-slate-500 italic">
            💡 Note: Commit Fix abstracts the Git steps from Module 1 — stage, commit, push.
          </div>
          <button
            onClick={() => {setShowStructure(!showStructure);
            }}
            className="text-sm text-blue-600 hover:underline"
            type="button"
          >
            {showStructure ? "Hide required structure ▲" : "Show required structure ▼"}
          </button>
        </div>

        {showStructure && (
          <div className="mt-3 p-3 border-l-4 border-slate-300 bg-slate-50 text-sm rounded">
            <pre className="whitespace-pre-wrap text-left text-sm">
{`#Essential Deployment structure:
apiVersion: apps/v1
kind: Deployment
metadata:
  name: <name>
spec:
  replicas: <number>
  selector:
    matchLabels:
      app: <label>
  template:
    metadata:
      labels:
        app: <label>
    spec:
      containers:
      - name: <container-name>
        image: <image>
        ports:
        - containerPort: <port>

#Service structure:
apiVersion: v1
kind: Service
metadata:
  name: <name>
spec:
  selector:
    app: <label>
  ports:
    - port: <service-port>
      targetPort: <container-port>
      protocol: TCP`}
            </pre>
            <p className="text-xs text-slate-500 mt-2">
              Use this as a quick reference while editing.
            </p>
          </div>
        )}
      </Card>

      {scenarioStep === 6 && success && (
        <Card className="p-4 border-l-4 border-purple-500 bg-purple-50 space-y-3">
          <p className="font-semibold">Final Verification</p>
          <p className="text-sm text-slate-600">
            Simulate <code>kubectl get</code> to check Pods and Services.
          </p>
          <Button
            onClick={() => {
              setFeedback([
                { type: "tip", message: "kubectl get pods - simulated output:" },
                {
                  type: "code",
                  code: `NAME        READY   STATUS    RESTARTS   AGE
web-12345   1/1     Running   0          2m`
                },
                { type: "tip", message: "kubectl get svc — simulated output:" },
                {
                  type: "code",
                  code: `NAME   TYPE        CLUSTER-IP     PORT(S)    AGE
web    ClusterIP   10.0.0.12     80/TCP     2m`
                }
              ]);
              setScenarioStep(7);
              setShowReflection(true);
            }}
          >
            Run kubectl get
          </Button>
        </Card>
      )}

      {scenarioStep === 7 && (
        <Card className="p-4 border-l-4 border-green-500 bg-green-50 space-y-3">
          <p className="font-semibold">{currentStory.story}</p>
          <p className="text-sm italic text-slate-600">{currentStory.learning_focus}</p>
        </Card>
      )}



      {/* Feedback */}
      {feedback && feedback.length > 0 && <FeedbackPanel feedback={feedback} />}

      {/* Reflection */}
      {showReflection && (
        <ReflectionCard
          moduleData={moduleData}
          onComplete={() => {
            setShowReflection(false);
            updateModuleProgress(moduleData.id);
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

      {/* Completion Modal */}
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
