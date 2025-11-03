import { getModules, saveModules } from "@/lib/loadModules";

export function updateModuleProgress(completedId) {
  const modules = getModules();
  const updated = modules.map((m) => {
    if (m.id === completedId) {
      return { ...m, status: "completed" };
    }
    // Unlock dependent modules
    if (modules.find((mod) => mod.id === completedId)?.unlocks?.includes(m.id)) {
      return { ...m, status: "unlocked" };
    }
    return m;
  });

  saveModules(updated);
}

/* export function updateModuleProgress() {
  const modules = JSON.parse(localStorage.getItem("modules") || "[]");
  const activeId = localStorage.getItem("activeModule");

  if (!modules.length || !activeId) return;

  const updatedModules = modules.map((m) => {
    if (m.id === activeId) {
      return { ...m, status: "completed" };
    } else if (m.unlocks?.includes(activeId) && m.status === "locked") {
      return { ...m, status: "unlocked" };
    }
    return m;
  });

  localStorage.setItem("modules", JSON.stringify(updatedModules));
  window.dispatchEvent(new Event("modulesUpdated"));
}*/
