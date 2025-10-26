import ReflectionHistory from "@/components/ReflectionHistory";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

export default function Reflection() {
  const reflections = JSON.parse(localStorage.getItem("reflections") || "[]");
  
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Reflection Workspace</h1>
      <p className="text-sm text-gray-600">
        Here you can review your previous reflections and identify recurring insights or misconceptions.
      </p>
      <ReflectionHistory />

      {/*Progress Visualization */}
      {reflections.length > 0 && (
        <div className="mt-6">
          <h2 className="font-semibold mb-2">Reflection Depth Over Time</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={reflections.map((r, i) => ({ index: i + 1, length: r.text.length }))}>
              <Line type="monotone" dataKey="length" stroke="#4f46e5" />
              <XAxis dataKey="index" />
              <YAxis />
              <Tooltip />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
