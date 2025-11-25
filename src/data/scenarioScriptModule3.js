export const scenarioScriptModule3 = [
  {
    id: 1,
    story:
      "Your cloud operations colleague, Mia, reports that last night's Terraform apply created instances in the wrong region leading to unexpected costs. She asks for your help to check the configuration and redeploy correctly. First, initialize the Terraform workspace.",
    expected: ["terraform init"],
    hint: "Run 'terraform init' to initialize your Terraform working directory and providers.",
    success: "✅ Terraform initialized. Backend and provider plugins configured.",
    next: 2,
    learning_focus:
      "IaC initialization — preparing the working directory for reproducible infrastructure deployment."
  },
  {
    id: 2,
    story:
      "Initialization complete. Next, preview what Terraform plans to deploy before actually applying changes.",
    expected: ["terraform plan"],
    hint: "Use 'terraform plan' to preview resources before provisioning them.",
    success:
      "Terraform generated an execution plan — you notice resources targeting 'us-east-1' instead of 'eu-central-1'.",
    next: 3,
    learning_focus:
      "Change evaluation — inspecting planned infrastructure to detect misconfigurations early."
  },
  {
    id: 3,
    story:
      "Mia confirms: your company policy requires all workloads in 'eu-central-1'. Open the Terraform configuration file to adjust the region (type 'open main.tf').",
    expected: ["open main.tf", "code main.tf"],
    hint: "Type 'open main.tf' to open the Terraform configuration file in the editor.",
    success: "📂 main.tf opened in the IaC editor.",
    next: 4,
    learning_focus:
      "Editing declarative IaC — adjusting provider configuration to comply with policy."
  },
  {
    id: 4,
    story:
      "Update your configuration to use the correct region and ensure instance types are cost-optimized. Once edited, validate your changes before deployment.",
    expected: ["terraform validate"],
    hint: "Run 'terraform validate' to check your Terraform configuration.",
    success:
      "Validation confirms the correct region ('eu-central-1') and optimized instance type ('t3.micro'). No cost warnings detected.",
    next: 5,
    learning_focus:
      "Feedback loop — validating configuration changes before deployment."
  },
  {
    id: 5,
    story:
      "Looks good! Apply the changes to deploy the infrastructure and observe the monitoring output.",
    expected: ["terraform apply"],
    hint: "Run 'terraform apply' to provision the updated resources.",
    success:
      "Terraform applied successfully. Instances deployed in eu-central-1. Monitoring dashboard shows reduced cost and stable latency.",
    next: 6,
    learning_focus:
      "IaC automation — applying reproducible infrastructure definitions."
  },
  {
    id: 6,
    story:
      "A few hours later, an alert appears: response latency increased slightly. Check the monitoring metrics to investigate.",
    expected: ["check metrics", "show metrics"],
    hint: "Type 'check metrics' to review simulated Grafana metrics for latency and cost.",
    success:
      "Metrics show latency at 180 ms (acceptable), cost still optimized. No SLA violation.",
    next: 7,
    learning_focus:
      "Observability — interpreting monitoring data to evaluate performance impacts of infrastructure decisions."
  },
  {
    id: 7,
    story:
      "Mia suggests adding an auto-scaling group to handle occasional traffic spikes. Open the configuration again and add the scaling block.",
    expected: ["open main.tf", "code main.tf"],
    hint: "Use 'open main.tf' to edit again.",
    success:
      "📂 main.tf reopened — ready to add auto-scaling configuration (e.g., aws_autoscaling_group).",
    next: 8,
    learning_focus:
      "Scalability enhancement — extending IaC configuration to adapt to workload demand."
  },
  {
    id: 8,
    story:
      "After adding the scaling block, validate your changes to ensure syntax correctness and dependencies resolve before reapplying.",
    expected: ["terraform validate"],
    hint: "Run 'terraform validate' to check syntax and configuration integrity.",
    success:
      "✅ Configuration valid — no syntax errors detected. Ready to apply.",
    next: 9,
    learning_focus:
      "Validation — using Terraform tools to ensure quality and consistency before deployment."
  },
  {
    id: 9,
    story:
      "Now re-apply to deploy the auto-scaling configuration.",
    expected: ["terraform apply"],
    hint: "Run 'terraform apply' to provision the scaling resources.",
    success:
      "Auto-scaling group deployed. Monitoring updates show reduced latency under load and steady cost.",
    next: 10,
    learning_focus:
      "Continuous improvement — iterating on infrastructure based on feedback and monitoring data."
  },
  {
    id: 10,
    story:
      "The deployment looks stable. Destroy the temporary test environment to avoid ongoing costs.",
    expected: ["terraform destroy"],
    hint: "Use 'terraform destroy' to tear down infrastructure safely.",
    success:
      "Infrastructure destroyed. All resources removed successfully. Cost savings confirmed.",
    next: 11,
    learning_focus:
      "Lifecycle management — cleaning up cloud resources responsibly after testing."
  },
  {
    id: 11,
    story:
      "Excellent work! You’ve successfully deployed, scaled, and managed your cloud infrastructure. Review your reflection below to wrap up the module.",
    expected: [],
    success:
      "🎉 Module 3 complete! Reflect on your key takeaways and lessons learned.",
    next: null,
    learning_focus:
      "Reflection — connecting Infrastructure-as-Code automation with continuous improvement and lifecycle management."
  }
];
