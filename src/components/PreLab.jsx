import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";

export default function PreLab({ moduleData, onContinue }) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const [quizFeedback, setQuizFeedback] = useState("");
  const [showDeepDive, setShowDeepDive] = useState(false);
  const prelab = moduleData?.phases?.prelab;

  if (!prelab) return null;
  const current = prelab.activities[step];
  const isLastStep = step === prelab.activities.length - 1;

  function handleNext() {
    if (current.type === "quiz" && !quizFeedback.startsWith("✅")) return;
    if (step < prelab.activities.length - 1) {
      setStep(step + 1);
      setSelected(null);
      setQuizFeedback("");
      setShowDeepDive(false);
    } else onContinue();
  }

  function handleAnswer(option) {
    setSelected(option);
    
    const isCorrect = option === current.correct_answer;

    if (isCorrect) {
      setQuizFeedback("✅ Correct! " + current.explanation);
    } else {
      setQuizFeedback("❌ Not quite. " + current.explanation);

      //adaptive branching: insert a remediation card dynamically
      if (current.remediation) {
        setTimeout(() => {
          setStep(prev => {
            const nextStep = {
              type: "remediation_card",
              title: "Quick Refresher",
              content: current.remediation
            };
            const newActivities = [...prelab.activities];
            newActivities.splice(prev + 1, 0, nextStep);
            prelab.activities = newActivities;
            return prev + 1;
          });
          setQuizFeedback("");
        }, 1200);
      }
    }
  }

  return (
    <Card className="p-6 space-y-4 bg-slate-50 border border-slate-200">
      <h2 className="text-xl font-semibold text-slate-800">{prelab.title}</h2>
      <p className="text-sm text-gray-600">{prelab.description}</p>

      <CardContent className="space-y-6">
        {/* Concept or Example */}
        {(current.type === "concept_card" || current.type === "example_task") && (
          <motion.div
            key={`concept-${step}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="prose max-w-none text-gray-800 leading-relaxed"
          >
            {current.type === "concept_card" && (
              <ReactMarkdown>{current.content}</ReactMarkdown>
            )}
            {current.type === "example_task" && (
              <>
                <p className="text-gray-800">{current.content}</p>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded text-sm overflow-x-auto">
                  {current.example_code}
                </pre>
              </>
            )}

            {/* Optional Deep Dive */}
            {current.deep_dive && (
              <div className="mt-3">
                <button
                  onClick={() => setShowDeepDive(!showDeepDive)}
                  className="text-blue-600 hover:underline text-sm font-medium"
                >
                  {showDeepDive ? "Hide Deep Dive ▲" : "Show Deep Dive ▼"}
                </button>
                <AnimatePresence>
                  {showDeepDive && (
                    <motion.div
                      key="deep-dive"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.3 }}
                      className="mt-2 p-3 border-l-4 border-blue-400 bg-blue-50 text-sm text-slate-700 rounded"
                    >
                      <ReactMarkdown>{current.deep_dive}</ReactMarkdown>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {/* Quiz */}
        {current.type === "quiz" && (
          <motion.div
            key={`quiz-${step}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-3"
          >
            <p className="font-medium text-gray-800">{current.question}</p>
            <div className="space-y-2">
              {current.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt)}
                  className={`w-full text-left px-3 py-2 rounded border transition duration-200 ${
                    selected === opt
                      ? opt === current.correct_answer
                        ? "bg-green-100 border-green-400"
                        : "bg-red-100 border-red-400"
                      : "hover:bg-slate-100 border-slate-300"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {quizFeedback && (
              <p
                className={`text-sm ${
                  quizFeedback.startsWith("✅")
                    ? "text-green-700"
                    : "text-red-700"
                }`}
              >
                {quizFeedback}
              </p>
            )}
          </motion.div>
        )}

        {/* 🧩 Micro-Scenario */}
        {current.type === "micro_scenario" && (
          <motion.div
            key={`micro-${step}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-3"
          >
            <p className="font-medium text-gray-800">{current.scenario}</p>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded text-sm overflow-x-auto">
              {current.context_code}
            </pre>

            <div className="space-y-2">
              {current.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt)}
                  className={`w-full text-left px-3 py-2 rounded border transition duration-200 ${
                    selected === opt
                      ? opt === current.correct_answer
                        ? "bg-green-100 border-green-400"
                        : "bg-red-100 border-red-400"
                      : "hover:bg-slate-100 border-slate-300"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {quizFeedback && (
              <p
                className={`text-sm ${
                  quizFeedback.startsWith("✅") ? "text-green-700" : "text-red-700"
                }`}
              >
                {quizFeedback}
              </p>
            )}
          </motion.div>
        )}

        {/* 🧩 Remediation Card */}
        {current.type === "remediation_card" && (
          <motion.div
            key={`rem-${step}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="p-4 bg-amber-50 border-l-4 border-amber-400 rounded space-y-2"
          >
            <h3 className="font-semibold text-amber-800">
              {current.title || "Concept Refresher"}
            </h3>
            <p className="text-amber-900 text-sm leading-relaxed">
              {current.content}
            </p>
          </motion.div>
        )}

        {/* Further Reading Hint*/}
        {isLastStep && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="border-t border-slate-300 pt-3 text-sm text-slate-600 italic"
          >
            📘 *Note:* You can find further reading materials on the{" "}
            <strong>Student Dashboard</strong>.
          </motion.div>
        )}
      </CardContent>

      <div className="flex justify-end">
        <Button
          onClick={handleNext}
          disabled={current.type === "quiz" && !quizFeedback.startsWith("✅")}
        >
          {isLastStep ? "Start Challenge" : "Next"}
        </Button>
      </div>
    </Card>
  );
}



