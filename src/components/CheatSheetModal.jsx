import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { loadCheatSheet, exportCheatSheet } from "@/lib/cheatsheet";

export default function CheatSheetModal({ moduleId, moduleTitle, open, onClose }) {
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!open || !moduleId) return;
    const saved = loadCheatSheet(moduleId);
    setContent(saved.content || "");
  }, [moduleId, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs uppercase text-slate-500">Cheat Sheet</p>
            <h2 className="text-lg font-semibold text-slate-800">{moduleTitle}</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportCheatSheet(moduleId, moduleTitle)}>
              Export
            </Button>
            <Button size="sm" onClick={onClose}>Close</Button>
          </div>
        </div>

        <div className="border border-slate-200 rounded-md p-3 bg-slate-50 min-h-[240px] max-h-[420px] overflow-auto text-sm text-slate-800 whitespace-pre-wrap">
          {content?.trim().length ? content : "No notes yet for this module."}
        </div>
      </Card>
    </div>
  );
}
