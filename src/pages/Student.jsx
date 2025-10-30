import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getModules, saveModules } from "@/lib/loadModules";

export default function Student() {
  const [modules, setModules] = useState([]);

  useEffect(() => {
    const storedModules = getModules();
    setModules(storedModules);
  }, []);

  //Stores active module for use across pages and navigates to working area
  function handleStartModule(moduleId) {
    localStorage.setItem("activeModule", moduleId);
    window.location.href = "/workspace";
  }

  function handleModuleComplete(moduleId) {
    const updated = modules.map((m) => {
      if (m.id === moduleId) return { ...m, status: "completed" };
      if (m.prerequisites.includes(moduleId)) return { ...m, status: "unlocked" };
      return m;
    });
    setModules(updated);
    saveModules(updated);
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Learning Modules</h1>
      <p className="text-sm text-gray-600">
        Progress through authentic DevOps learning challenges — from foundational containerization to cloud deployment.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {modules.map((m) => (
          <Card key={m.id} className={`border ${
              m.status === "locked" ? "opacity-50" : "hover:shadow-md"
            } transition`}
          >
            <CardContent className="space-y-3">
              <h2 className="text-lg font-semibold">{m.title}</h2>
              <p className="text-sm text-gray-700">{m.category}</p>
              <p className="text-sm text-gray-600">{m.description}</p>
              <div className="flex gap-2">
                {m.status === "unlocked" && (
                  <Button onClick={() => handleStartModule(m.id)}>Start</Button>
                )}
                {m.status === "completed" && (
                  <span className="text-green-600 text-sm font-medium">✔ Completed</span>
                )}
                {m.status === "locked" && (
                  <span className="text-xs text-gray-500">Locked</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
