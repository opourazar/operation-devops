export const scenarioScriptModule2 = [
  {
    id: 1,
    story:
      "Welcome to the Kubernetes Deployment Debug Lab! Your teammate reports that the newly deployed backend service isn't reachable. Before touching Kubernetes configs, let’s follow standard DevOps workflow: create a working branch to experiment safely.",
    expected: ["git checkout -b", "git switch -c", "git switch -b"],
    success: "Branch prepared — you’re now working safely on an isolated change.",
    hint: "Use: git checkout -b fix/deployment-bug",
    next: 2,
    learning_focus:
      "DevOps teams ALWAYS branch before experimenting — it protects main from broken configs."
  },

  {
    id: 2,
    story:
      "Great. Now you need to inspect the Kubernetes manifest that seems to be causing trouble. The CI pipeline flagged a deployment issue, and logs hint at a selector mismatch or port configuration problem. Open the deployment manifest to investigate (type 'open deployment.yaml').",
    expected: ["open deployment.yaml"],
    success: "Kubernetes manifest opened. Time to debug!",
    hint: "Try: open deployment.yaml",
    next: 3,
    learning_focus:
      "Real debugging starts with configuration inspection — Deployments break silently if labels or ports are wrong."
  },

  {
    id: 3,
    story:
      "Inside the editor, check the Deployment carefully. DevOps reports mention:\n- Pods stuck in 0/1 Ready\n- Service returning connection refused\n- ReplicaSet not managing Pods\n\nThese symptoms almost always mean: label mismatch, missing containerPort, or incorrect selector.\n\nFix the manifest so it becomes a valid, functional Deployment and Service.",
    expected: ["apply", "commit", "save"], // editor handles save/apply manually
    success: "Changes received — running validation and simulating CI/CD checks...",
    hint: "Look at: selector.matchLabels, template.metadata.labels, containerPort, replicas.",
    learning_focus:
      "Kubernetes is strict about field names and label alignment — one wrong character breaks the entire object."
  },

  {
    id: 4,
    story:
      "CI/CD Validation Stage\nTime to trigger the pipeline. The pipeline is applying your updated manifest. This simulates what a GitOps or CI workflow (GitHub Actions, ArgoCD, Flux) would do.\n\nIf validation passes, your Deployment should now reconcile.",
    expected: ["kubectl apply", "kubectl"], // simulated
    success:"Cluster accepted the manifest. Monitoring rollout...",
    hint: "You don’t need a real cluster here — just follow the story.",
    learning_focus:
      "In real teams, manifests are validated automatically before reaching the cluster. Automation catches most structural errors."
  },

  {
    id: 5,
    story:
      "Rollout Observation\nPods are starting... but the Service still reports no healthy endpoints.\n\nThis is almost always caused by either a port mismatch or labels not matching the Service selector.\n\nFix the Service or ensure your Deployment template exposes the correct containerPort.",
    expected: ["apply", "commit", "save"],
    success: "Configuration updated — re-running deployment and Service sync...",
    hint: "Check: service.spec.selector vs template.metadata.labels AND containerPort.",
    learning_focus:
      "Services rely strictly on selectors and containerPort — if these don’t match, Kubernetes can’t route traffic."
  },

  {
    id: 6,
    story:
      "Final Verification\nThe Deployment is rolling out again. We can now use `kubectl get` commands like `kubectl get pods` or `kubectl get svc` to inspect what the cluster sees.",
    expected: ["kubectl"],
    success: "🎉 Rollout successful! Your app is reachable and stable. You've fixed the Kubernetes configuration.",
    hint: "Try using: kubectl get pods",
    learning_focus:
      "Kubectl comes with a lot of handy commands, one of which is `kubectl get`"
  },

  {
    id: 7,
    story:
      "Great work! You fixed the Deployment and restored service reliability. Time to reflect on the debugging process — just like a real DevOps retrospective.",
    expected: ["continue", "next"],
    success: "Moving to reflection...",
    hint: "Type: continue",
    learning_focus:
      "Reflection reinforces mental models and long-term DevOps intuition."
  }
];

