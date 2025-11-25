import ReflectionJournal from "@/components/ReflectionJournal";

export default function Reflection() {
  const reflections = JSON.parse(localStorage.getItem("reflections") || "[]");
  
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Reflection Workspace</h1>
      <p className="text-sm text-gray-600">
        Here you can review your previous reflections and identify recurring insights or misconceptions.
      </p>
      <ReflectionJournal />
    </div>
  );
}
