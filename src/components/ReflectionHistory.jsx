import { Card } from "@/components/ui/card";

export default function ReflectionHistory() {
  const reflections = JSON.parse(localStorage.getItem("reflections") || "[]");

  if (reflections.length === 0)
    return <p className="text-sm text-gray-500">No reflections yet. Start committing to reflect!</p>;

  return (
    <Card className="p-4 space-y-3 bg-slate-50 border border-slate-200">
      <h2 className="font-semibold text-lg">Reflection History</h2>
      <ul className="text-sm space-y-2">
        {reflections.map((r, i) => (
          <li key={i} className="border-b pb-1">
            <p className="text-sm italic text-gray-600">Prompt: “{r.prompt || "No prompt"}”</p>
            <p>{r.text}</p>
            <p className="text-xs text-gray-500">{r.time}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}
