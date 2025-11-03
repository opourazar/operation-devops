import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getModules, saveModules } from "@/lib/loadModules";

export default function Student() {
  const [modules, setModules] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const storedModules = getModules();
    setModules(storedModules);
  }, []);

  // Stores active module and navigates to workspace
  function handleStartModule(moduleId) {
    localStorage.setItem("activeModule", moduleId);
    window.location.href = "/workspace";
  }

  // Extract all post-lab resources grouped by module
  const groupedResources = modules
    .filter((m) => m.phases?.postlab?.further_resources?.length)
    .map((m) => ({
      title: m.title,
      resources: m.phases.postlab.further_resources,
    }));

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <section>
        <h1 className="text-2xl font-semibold">Learning Modules</h1>
        <p className="text-sm text-gray-600">
          Progress through authentic DevOps learning challenges — from foundational containerization to cloud deployment.
        </p>
      </section>

      {/* Module List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((m) => (
          <Card
            key={m.id}
            className={`border ${
              m.status === "locked" ? "opacity-50" : "hover:shadow-md"
            } transition`}
          >
            <CardContent className="space-y-3">
              <h2 className="text-lg font-semibold">{m.title}</h2>
              <p className="text-sm text-gray-700">{m.category}</p>
              <p className="text-sm text-gray-600">{m.description}</p>
              <div className="flex gap-2 items-center">
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

      {/* Further Reading Section */}
      {groupedResources.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800">
            Further Reading & Advanced Resources
          </h2>
          <p className="text-sm text-slate-600">
            Explore curated references from completed or unlocked modules.
          </p>

          <div className="space-y-3">
            {groupedResources.map((group, i) => (
              <Card key={i} className="border border-blue-100">
                <div
                  onClick={() =>
                    setExpanded(expanded === i ? null : i)
                  }
                  className="flex justify-between items-center p-4 cursor-pointer hover:bg-blue-50"
                >
                  <span className="font-medium text-slate-800">{group.title}</span>
                  <span className="text-blue-600">
                    {expanded === i ? "▲" : "▼"}
                  </span>
                </div>

                {expanded === i && (
                  <CardContent className="p-4 pt-0 space-y-2">
                    {group.resources.map((res, j) => (
                      <div key={j}>
                        <a
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 text-sm hover:underline"
                        >
                          {res.label}
                        </a>
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
