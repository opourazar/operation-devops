import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  loadCheatSheet,
  saveCheatSheet,
  clearCheatSheet,
  exportCheatSheet
} from "@/lib/cheatsheet";

export default function CheatSheetPanel({
  moduleId,
  moduleTitle,
  open,
  onClose
}) {
  const [content, setContent] = useState("");
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    if (!open || !moduleId) return;
    const saved = loadCheatSheet(moduleId);
    setContent(saved.content || "");
    setLastSaved(saved.updatedAt || null);
  }, [moduleId, open]);

  useEffect(() => {
    if (!open || !moduleId) return;
    const id = setTimeout(() => {
      const saved = saveCheatSheet(moduleId, content);
      setLastSaved(saved.updatedAt);
    }, 350);
    return () => clearTimeout(id);
  }, [content, open, moduleId]);

  if (!open) return null;

  const handleClear = () => {
    setContent("");
    clearCheatSheet(moduleId);
    setLastSaved(null);
  };

  const lastSavedText = lastSaved
    ? new Date(lastSaved).toLocaleTimeString()
    : "Not saved yet";

  return (
    <div className="fixed right-4 bottom-4 top-4 z-40 w-full max-w-md">
      <Card className="h-full flex flex-col border border-slate-200 shadow-lg bg-white">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-slate-500">Cheat Sheet</p>
            <h3 className="text-sm font-semibold text-slate-800 truncate">
              {moduleTitle}
            </h3>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleClear}>
              Clear
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportCheatSheet(moduleId, moduleTitle)}
            >
              Export
            </Button>
            <Button size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-hidden">
          <textarea
            className="w-full h-full border border-slate-200 rounded-md p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 resize-none"
            placeholder="Jot down commands, reminders, links..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <div className="px-4 py-2 text-xs text-slate-500 border-t border-slate-200 flex items-center justify-between">
          <span>Autosaves locally</span>
          <span>Last saved: {lastSavedText}</span>
        </div>
      </Card>
    </div>
  );
}
