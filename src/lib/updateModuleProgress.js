export function updateModuleProgress() {
  const activeId = localStorage.getItem("activeModule");
  if (!activeId) return;

  const modules = JSON.parse(localStorage.getItem("modules"));
  if (!modules) return;

  const updated = modules.map((m) => {
    if (m.id === activeId) return { ...m, status: "completed" };
    if (m.prerequisites.includes(activeId)) return { ...m, status: "unlocked" };
    return m;
  });

  localStorage.setItem("modules", JSON.stringify(updated));
  console.log(`Module ${activeId} marked completed, next unlocked.`);
}
