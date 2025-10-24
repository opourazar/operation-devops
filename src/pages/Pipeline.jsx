import GitOpsEditor from "@/components/GitOpsEditor";

export default function Pipeline() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">GitOps Workspace</h1>
      <p className="text-slate-600">
        Edit configuration files, commit changes, and push to trigger your simulated pipeline.
      </p>
      <GitOpsEditor />
    </div>
  );
}