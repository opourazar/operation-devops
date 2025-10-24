import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

function ReflectionCard({ onSave }) {
  const [text, setText] = useState("");

  return (
    <div className="border rounded-lg p-4 bg-slate-50 mt-4">
      <h2 className="font-semibold mb-2">Reflect on Your Commit</h2>
      <p className="text-sm text-slate-600 mb-2">
        What did you change and why? What would you test next?
      </p>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} />
      <Button
        onClick={() => {
          onSave(text);
          setText("");
        }}
        className="mt-2"
      >
        Save Reflection
      </Button>
    </div>
  );
}

export default ReflectionCard;