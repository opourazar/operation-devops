import modules from "@/data/modules.json";

export function getModules() {
  return JSON.parse(localStorage.getItem("modules")) || modules;;
}

export function saveModules(updatedModules) {
  localStorage.setItem("modules", JSON.stringify(updatedModules));
}