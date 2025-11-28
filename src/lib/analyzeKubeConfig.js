import yaml from "js-yaml";

export function analyzeKubeConfig(code) {
  let feedback = [];
  let success = false;

  // Track attempts for adaptive mentor hints
  let attempts = Number(localStorage.getItem("kubeAttempts") || 0);
  attempts += 1;
  localStorage.setItem("kubeAttempts", attempts);

  // Parse YAML (multi-document)
  let docs = [];
  try {
    docs = yaml.loadAll(code);
  } catch (err) {
    feedback.push({
      type: "error",
      message: `YAML syntax error: ${err.message}`
    });

    if (attempts >= 2) {
      feedback.push({
        type: "tip",
        message:
          "Use consistent indentation (2 spaces). YAML errors usually come from bad spacing or missing ':' characters."
      });
    }

    return { success: false, feedback };
  }

  // Extract Deployment and Service
  const deployment = docs.find((d) => d?.kind === "Deployment");
  const service = docs.find((d) => d?.kind === "Service");

  // Validate Deployment existence
  if (!deployment) {
    feedback.push({
      type: "error",
      message: "No Deployment manifest found. Your YAML must include a Kubernetes Deployment."
    });
    return { success: false, feedback };
  }

  if (typeof deployment !== "object") {
    feedback.push({
      type: "error",
      message: "Deployment manifest is not a valid YAML object."
    });
    return { success: false, feedback };
  }

  // Validate Deployment kind explicitly
  if (deployment.kind !== "Deployment") {
    feedback.push({
      type: "error",
      message: "This module requires a `Deployment`. Add `kind: Deployment`."
    });
  }

  // Extract key fields safely
  const spec = deployment.spec || {};
  const template = spec.template || {};
  const podMetadata = template.metadata || {};
  const podLabels = podMetadata.labels || {};
  const podSpec = template.spec || {};
  const containers = podSpec.containers || [];
  const selector = spec.selector || {};
  const matchLabels = selector.matchLabels || null;

  // Validate replicas
  if (spec.replicas === undefined) {
    feedback.push({
      type: "error",
      message: "Missing `spec.replicas` — Deployment cannot scale."
    });
  } else if (typeof spec.replicas !== "number") {
    feedback.push({
      type: "error",
      message: "`replicas` must be a number."
    });
  } else if (spec.replicas < 1) {
    feedback.push({
      type: "warning",
      message: "`replicas: 0` means no Pods will run. Valid, but not helpful here."
    });
  } else if (spec.replicas < 2) {
    feedback.push({
      type: "warning",
      message: "Use at least 2 replicas to handle realistic load scenarios."
    });
  }

  // Validate selector.matchLabels + typos
  const selectorKeys = Object.keys(selector);
  const hasMatchLabels = selectorKeys.includes("matchLabels");

  const possibleTypos = selectorKeys.filter((k) =>
    k.toLowerCase().includes("matchlabels")
  );

  if (!hasMatchLabels) {
    if (possibleTypos.length > 0) {
      feedback.push({
        type: "error",
        message: `Field typo detected — did you mean \`matchLabels\`? Found: ${possibleTypos.join(", ")}`
      });
    } else {
      feedback.push({
        type: "error",
        message: "Missing `selector.matchLabels` — Deployment cannot manage or scale Pods."
      });
    }
  }

  // Validate label alignment
  if (matchLabels && typeof matchLabels === "object") {
    const mismatches = [];

    for (const key of Object.keys(matchLabels)) {
      if (podLabels[key] !== matchLabels[key]) {
        mismatches.push(
          `Selector '${key}: ${matchLabels[key]}' does not match Pod label '${podLabels[key] ?? "undefined"}'`
        );
      }
    }

    if (mismatches.length > 0) {
      feedback.push({
        type: "error",
        message: "Label mismatch — Deployment cannot manage Pods:\n" + mismatches.join("\n")
      });
    }
  }

  // Validate containers
  if (!Array.isArray(containers) || containers.length === 0) {
    feedback.push({
      type: "error",
      message: "No containers defined under `spec.template.spec.containers`."
    });
  } else {
    const c = containers[0];

    if (!c.name) {
      feedback.push({
        type: "warning",
        message: "Container has no `name` field."
      });
    }

    if (!c.image) {
      feedback.push({
        type: "error",
        message: "Container image is missing."
      });
    }

    const ports = c.ports || [];

    if (ports.length === 0) {
      feedback.push({
        type: "warning",
        message: "No `containerPort` defined — Service cannot route traffic."
      });
    } else {
      const exposes3000 = ports.some((p) => p.containerPort === 3000);

      if (!exposes3000) {
        feedback.push({
          type: "warning",
          message: "Missing `containerPort: 3000` — required for this module’s routing scenario."
        });
      }
    }
  }

  // Service validation
  if (service) {
    const svcSelector = service.spec?.selector || {};
    const svcPort = service.spec?.ports?.[0];
    const containerPorts = containers?.[0]?.ports || [];

    // Missing selector (normally required for routing)
    if (!service.spec?.selector) {
      feedback.push({
        type: "warning",
        message: "Service has no selector — it will not route traffic to any Pods."
      });
    }

    // Service selector mismatch
    const svcMismatches = [];

    for (const key of Object.keys(svcSelector)) {
      if (podLabels[key] !== svcSelector[key]) {
        svcMismatches.push(
          `Service selector '${key}: ${svcSelector[key]}' does not match Pod label '${podLabels[key] ?? "undefined"}'`
        );
      }
    }

    if (svcMismatches.length > 0) {
      feedback.push({
        type: "error",
        message: "Service selector mismatch — Service cannot route traffic:\n" + svcMismatches.join("\n")
      });
    }

    // targetPort must match containerPort
    if (svcPort) {
      const target = svcPort.targetPort;
      const matchesContainerPort = containerPorts.some(
        (p) => p.containerPort === target
      );

      if (!matchesContainerPort) {
        feedback.push({
          type: "error",
          message: `Service targetPort (${target}) does not match any containerPort (${containerPorts
            .map((p) => p.containerPort)
            .join(", ")})`
        });
      }
    }
  }

 
  // Success check
  if (feedback.length === 0) {
    success = true;

    feedback.push({
      type: "success",
      message: "All validations passed — Deployment and Service are correctly aligned!"
    });

    feedback.push({
      type: "tip",
      message: "Everything checks out — your manifest meets Kubernetes best practices."
    });

    localStorage.removeItem("kubeAttempts");
    return { success, feedback };
  }

  // Adaptive mentor feedback
  if (attempts === 1) {
    feedback.push({
      type: "mentor",
      message: "Sam: “Look closely at the label relationships. Selectors are usually the game breaker.”"
    });
  } else if (attempts >= 3) {
    feedback.push({
      type: "mentor",
      message: "Sam: “Here’s a reference Deployment you can adapt if you're stuck.”"
    });

    feedback.push({
      type: "code",
      code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: web
          image: nginx
          ports:
            - containerPort: 3000`
    });
  }

  return { success, feedback };
}
