import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function PreLab({ moduleData, onContinue }) {
  const [step, setStep] = useState(0);
  const prelab = moduleData?.phases?.prelab;

  if (!prelab) return null;

  const currentActivity = prelab.activities[step];

  // Move to lab stage
  function nextStep() {
    if (step < prelab.activities.length - 1) setStep(step + 1);
    else onContinue(); 
  }

  return (
    <Card className="p-6 space-y-4 bg-slate-50 border border-slate-200">
      <h2 className="text-xl font-semibold">{prelab.title}</h2>
      <p className="text-sm text-gray-600">{prelab.description}</p>

      <CardContent className="space-y-4">
        {currentActivity && (
          <>
            {currentActivity.type === "concept_card" && (
              <p className="text-gray-800 leading-relaxed">{currentActivity.content}</p>
            )}
            {currentActivity.type === "example_task" && (
              <div className="space-y-2">
                <p className="text-gray-800">{currentActivity.content}</p>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded text-sm overflow-x-auto">
                  {currentActivity.example_code}
                </pre>
              </div>
            )}
          </>
        )}
      </CardContent>

      <div className="flex justify-end">
        <Button onClick={nextStep}>
          {step < prelab.activities.length - 1 ? "Next" : "Start Challenge"}
        </Button>
      </div>
    </Card>
  );
}
