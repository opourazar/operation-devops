import React, { useEffect, useState } from "react";
import { getTelemetry, clearTelemetry } from "@/lib/telemetry";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Module1Panel } from "@/components/telemetry/Module1Panel";
import { Module2Panel } from "@/components/telemetry/Module2Panel";
import { Module3Panel } from "@/components/telemetry/Module3Panel";
import { OverviewPanel } from "@/components/telemetry/OverviewPanel";
import { StudentTimeline } from "@/components/telemetry/StudentTimeline";
import { ValidationAttemptsChart } from "@/components/telemetry/ValidationAttemptsChart";
import { DurationChart } from "@/components/telemetry/DurationChart";
import { HelpUsageChart } from "@/components/telemetry/HelpUsageChart";

export default function Instructor() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    setEvents(getTelemetry());
  }, []);

  function resetTelemetry() {
    clearTelemetry();
    setEvents([]);
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Instructor Dashboard</h1>

      {/* Reset button */}
      <Button variant="destructive" onClick={resetTelemetry}>
        Clear telemetry (prototype only)
      </Button>

      {/* Overview */}
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-2">Overview</h2>
        <OverviewPanel events={events} />
      </Card>

      {/* Visualizations */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <ValidationAttemptsChart events={events} />
        <HelpUsageChart events={events} />
      </div>
      <DurationChart events={events} />

      {/* Modules */}
      <Module1Panel events={events} />
      <Module2Panel events={events} />
      <Module3Panel events={events} />

      {/* Student timeline */}
      <StudentTimeline events={events} />
    </div>
  );
}
