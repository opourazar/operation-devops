import { getModules, saveModules } from "@/lib/loadModules";

export function updateModuleProgress(completedId) {
  const modules = getModules();
  const completedModule = modules.find((m) => m.id === completedId);

  if (!completedModule) {
    console.warn(`Tried to update progress, but module '${completedId}' not found.`);
    return;
  }

  const updated = modules.map((m) => {
    // Mark the completed module
    if (m.id === completedId) {
      console.log(`Module completed: ${m.title}`);
      return { ...m, status: "completed" };
    }

    // Unlock any modules that depend on the completed one
    if (completedModule.unlocks?.includes(m.id)) {
      console.log(`Unlocking next module: ${m.title}`);
      return { ...m, status: "unlocked" };
    }

    return m;
  });

  saveModules(updated);
  console.log("Module progress updated and saved to localStorage.");
}
