const contentKey = (id) => `cheatsheet:${id}`;
const openKey = (id) => `cheatsheetOpen:${id}`;

export function loadCheatSheet(moduleId) {
  if (!moduleId) return { content: "", updatedAt: null };
  try {
    const raw = localStorage.getItem(contentKey(moduleId));
    return raw ? JSON.parse(raw) : { content: "", updatedAt: null };
  } catch (err) {
    console.warn("Could not load cheat sheet", err);
    return { content: "", updatedAt: null };
  }
}

export function saveCheatSheet(moduleId, content) {
  if (!moduleId) return { content: "", updatedAt: null };
  const payload = {
    content,
    updatedAt: Date.now()
  };
  localStorage.setItem(contentKey(moduleId), JSON.stringify(payload));
  return payload;
}

export function clearCheatSheet(moduleId) {
  if (!moduleId) return;
  localStorage.removeItem(contentKey(moduleId));
}

export function exportCheatSheet(moduleId, moduleTitle) {
  const { content } = loadCheatSheet(moduleId);
  const blob = new Blob([content || ""], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${moduleTitle || moduleId}-cheatsheet.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export function setCheatSheetOpen(moduleId, open) {
  if (!moduleId) return;
  localStorage.setItem(openKey(moduleId), JSON.stringify(!!open));
}

export function getCheatSheetOpen(moduleId) {
  if (!moduleId) return false;
  return localStorage.getItem(openKey(moduleId)) === "true";
}
