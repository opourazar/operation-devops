import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function Monitoring() {
  const [data, setData] = useState([]);
  const [metric, setMetric] = useState("Build Duration");

  useEffect(() => {
    // Load stored pipeline runs from localStorage
    const runs = JSON.parse(localStorage.getItem("pipelineRuns") || "[]");

    // Transform for chart display
    const formatted = runs.map((run, i) => ({
      name: `Run ${i + 1}`,
      duration: run.duration,
      errors: run.errors,
      success: run.success,
    }));
    setData(formatted);
  }, [metric]);

  function clearData(){
    localStorage.removeItem("pipelineRuns");
    setData([]);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Monitoring Dashboard</h1>
      <div className="flex gap-4 flex-wrap">
        <Button variant={metric === "Build Duration" ? "default" : "outline"} onClick={() => setMetric("Build Duration")}>
          Build Duration
        </Button>
        <Button variant={metric === "Error Count" ? "default" : "outline"} onClick={() => setMetric("Error Count")}>
          Error Count
        </Button>
        <Button
          variant="destructive"
          onClick={clearData}
          className="ml-auto"
        >
          Clear Data
        </Button>
      </div>

      <Card className="p-4 bg-slate-50">
        <CardContent>
          {data.length === 0 ? (
            <p className="text-slate-500">
              No data yet — run a few pipeline pushes first.
            </p>
          ) : (
            <>
              <h2 className="font-semibold mb-3">{metric} over Runs</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  {metric === "Build Duration" ? (
                    <Line type="monotone" dataKey="duration" stroke="#2563eb" strokeWidth={2} />
                  ) : (
                    <Line type="monotone" dataKey="errors" stroke="#dc2626" strokeWidth={2} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
