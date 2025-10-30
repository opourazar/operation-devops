import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { reflectionPrompts } from "@/lib/reflectionPrompts";

function ReflectionCard({ onSave }) {
  const [text, setText] = useState("");
  const [prompt] = useState(() => {
    const randomIndex = Math.floor(Math.random() * reflectionPrompts.length);
    return reflectionPrompts[randomIndex];
  });

  return (
    <div className="border rounded-lg p-4 bg-white shadow-md">
      <h2 className="font-semibold mb-2">Reflection</h2>
      <p className="text-sm text-gray-600 mb-3 italic">"{prompt}"</p>
      <Textarea
        placeholder="Write your reflection here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="mb-3"
      />
      <div className="flex justify-end">
        <Button onClick={() => onSave(text, prompt)}>Save Reflection</Button>
      </div>
    </div>
  );
}

export default ReflectionCard;