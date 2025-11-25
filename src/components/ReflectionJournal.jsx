import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function ReflectionJournal() {
  const [reflections, setReflections] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [tagInputs, setTagInputs] = useState({});
  const [tagFilter, setTagFilter] = useState("all");
  const [showRevisionOnly, setShowRevisionOnly] = useState(false);

  useEffect(() => {
    function loadReflections() {
      const raw = JSON.parse(localStorage.getItem("reflections") || "[]");

      const normalized = raw.map((r) => ({
        id: r.id || crypto.randomUUID(), // alt id value is fallback for older entries
        module: r.module || "Unknown Module",
        question: r.question || r.prompt || "No prompt provided",
        answer: r.answer || r.text || "No answer recorded",
        tags: r.tags || [],
        needsRevision: r.needsRevision || false,
        timestamp: r.timestamp || r.time || new Date().toISOString(),
      }));

      setReflections(normalized);
    }

    loadReflections();
    window.addEventListener("reflectionsUpdated", loadReflections);
    return () => window.removeEventListener("reflectionsUpdated", loadReflections);
  }, []);

  // Save updated reflections into localStorage
  function persist(updated) {
    localStorage.setItem("reflections", JSON.stringify(updated));
    window.dispatchEvent(new Event("reflectionsUpdated"));
  }

  function startEditing(id, answer) {
    setEditingId(id);
    setEditValue(answer);
  }

  function saveEdit(id) {
    const updated = reflections.map((r) =>
      r.id === id ? { ...r, answer: editValue } : r
    );

    persist(updated);
    setEditingId(null);
    setEditValue("");
  }

  function deleteEntry(id) {
    if (!confirm("Delete this reflection entry?")) return;

    const updated = reflections.filter((r) => r.id !== id);
    persist(updated);
  }

  function addTag(id, tag) {
    const trimmed = tag.trim();
    if (!trimmed) return;

    const updated = reflections.map((r) =>
      r.id === id
        ? { ...r, tags: [...new Set([...r.tags, trimmed])] }
        : r
    );

    persist(updated);

    setTagInputs((prev) => ({ ...prev, [id]: "" }));
  }

  function removeTag(id, tag) {
    const updated = reflections.map((r) =>
      r.id === id ? { ...r, tags: r.tags.filter((t) => t !== tag) } : r
    );

    persist(updated);
  }

  function toggleRevision(id) {
    const updated = reflections.map((r) =>
      r.id === id ? { ...r, needsRevision: !r.needsRevision } : r
    );

    persist(updated);
  }

  function downloadFile(filename, content) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function toMarkdown(reflections) {
    return reflections
      .map(
        (r) => `### ${r.module}
  **Prompt:** ${r.question}

  ${r.answer}

  *${new Date(r.timestamp).toLocaleString()}*`
      )
      .join("\n\n---\n\n");
  }

  function toTxt(reflections) {
    return reflections
      .map(
        (r) =>
          `MODULE: ${r.module}\nPROMPT: ${r.question}\nANSWER:\n${r.answer}\nDATE: ${new Date(
            r.timestamp
          ).toLocaleString()}\n`
      )
      .join("\n----------------------\n\n");
  }

  // Extract unique module names
  const moduleOptions = ["all", ...new Set(reflections.map((r) => r.module))];

  // Extract tag options
  const tagOptions = ["all", ...new Set(reflections.flatMap((r) => r.tags))];

  // Logic for handling search bar input or module filter choice
  const filteredReflections = reflections
  .filter((r) => {
    const text = `${r.module} ${r.question} ${r.answer}`.toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    const matchesModule = moduleFilter === "all" || r.module === moduleFilter;
    const matchesTag = tagFilter === "all" || r.tags.includes(tagFilter);
    const matchesRevision = !showRevisionOnly || r.needsRevision === true;

    return matchesSearch && matchesModule && matchesTag && matchesRevision;
  });

  if (reflections.length === 0)
    return (
      <p className="text-sm text-gray-500">
        No reflections yet. Start completing modules to build your learning history.
      </p>
    );

  return (
    <Card className="p-4 space-y-3 bg-slate-50 border border-slate-200">
      <h2 className="font-semibold text-lg">Reflection Journal</h2>

      <input
        type="text"
        placeholder="Search reflections..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mt-2 mb-2 px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-800 bg-white"
      />

      <select
        value={moduleFilter}
        onChange={(e) => setModuleFilter(e.target.value)}
        className="w-full mb-3 px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-800 bg-white"
      >
        {moduleOptions.map((m) => (
          <option key={m} value={m}>
            {m === "all" ? "All Modules" : m}
          </option>
        ))}
      </select>

      <select
        value={tagFilter}
        onChange={(e) => setTagFilter(e.target.value)}
        className="w-full mb-3 px-3 py-2 border border-slate-300 rounded-md text-sm text-slate-800 bg-white"
      >
        {tagOptions.map((t) => (
          <option key={t} value={t}>
            {t === "all" ? "All Tags" : t}
          </option>
        ))}
      </select>

      <div className="flex gap-2 mt-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            downloadFile("reflections.json", JSON.stringify(reflections, null, 2))
          }
        >
          Export JSON
        </Button>

        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            downloadFile("reflections.txt", toTxt(reflections))
          }
        >
          Export TXT
        </Button>

        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            downloadFile("reflections.md", toMarkdown(reflections))
          }
        >
          Export MD
        </Button>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => setShowRevisionOnly(!showRevisionOnly)}
        >
          {showRevisionOnly ? "Show All Reflections" : "Show Only Needs Revision"}
        </Button>
      </div>

      <ul className="text-sm space-y-4">
        {filteredReflections.map((r) => (
          <li key={r.id} className="border-b pb-3 last:border-b-0">
            <p className="font-semibold text-blue-700">{r.module}</p>
            <p className="italic text-gray-600">Prompt: “{r.question}”</p>

            {editingId === r.id ? (
              <>
                <Textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  rows="4"
                  className="mt-2 text-sm"
                />

                <div className="flex gap-2 mt-2">
                  <Button size="sm" onClick={() => saveEdit(r.id)}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-slate-800 mt-1 whitespace-pre-line">{r.answer}</p>

                <p className="text-xs text-gray-500 mt-1">
                  {new Date(r.timestamp).toLocaleString()}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {r.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(r.id, tag)}
                        className=" bg-blue-50 text-red-600 hover:text-red-800 ml-1 text-xs"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>


                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={tagInputs[r.id] || ""}
                    onChange={(e) =>
                      setTagInputs({ ...tagInputs, [r.id]: e.target.value })
                    }
                    placeholder="Add tag..."
                    className="px-2 py-1 border border-slate-300 rounded text-sm text-slate-800 bg-white"
                  />

                  <Button
                    size="sm"
                    onClick={() => addTag(r.id, tagInputs[r.id] || "")}
                  >
                    Add Tag
                  </Button>

                  <Button
                    size="sm"
                    variant={r.needsRevision ? "default" : "outline"}
                    onClick={() => toggleRevision(r.id)}
                  >
                    {r.needsRevision ? "Marked for Revision" : "Mark for Revision"}
                  </Button>

                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => startEditing(r.id, r.answer)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteEntry(r.id)}
                  >
                    Delete
                  </Button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}


