import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { logEvent } from "@/lib/telemetry";

function CodeBlock({ children }) {
  return (
    <pre className="p-3 bg-slate-900 text-slate-100 text-left rounded text-sm overflow-x-auto whitespace-pre">
      {children}
    </pre>
  );
}

export default function PreLab({
  moduleData,
  onContinue,
  initialStep = 0,
  onStepChange
}) {
  const prelab = moduleData?.phases?.prelab;
  const totalSteps = prelab?.activities?.length ?? 0;
  const clampStep = (value) =>
    totalSteps ? Math.min(Math.max(value ?? 0, 0), totalSteps - 1) : 0;

  const [step, setStep] = useState(() => clampStep(initialStep));
  const [selected, setSelected] = useState(null);
  const [quizFeedback, setQuizFeedback] = useState("");
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);

  if (!prelab) return null;
  const current = prelab.activities[step];
  const isLastStep = step === prelab.activities.length - 1;

  // Sync step with persisted value when it changes externally (resume flow)
  useEffect(() => {
    setStep(clampStep(initialStep));
  }, [initialStep, totalSteps]);

  // Notify parent whenever the step changes so it can persist progress
  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  function handleNext() {
    // Only lock when a quiz is unanswered or incorrect
    if (current.type === "quiz" && !isAnswerCorrect) return;
    if (step < prelab.activities.length - 1) {
      setIsAnswerCorrect(false);
      setStep(step + 1);
      setSelected(null);
      setQuizFeedback("");
      setShowDeepDive(false);
    } else onContinue();
  }

  function handlePrev() {
    if (step === 0) return;
    setIsAnswerCorrect(false);
    setStep(step - 1);
    setSelected(null);
    setQuizFeedback("");
    setShowDeepDive(false);
  }

  /** Unified quiz handler for both inline and standalone quizzes */
  function handleAnswer(option, quizObj = current) {
    setSelected(option);
    const isCorrect = option === quizObj.correct_answer;
    setIsAnswerCorrect(isCorrect);

    const questionText =
      quizObj?.question ||
      current.question ||
      current.scenario ||
      (typeof current.content === "string" ? current.content.slice(0, 120) : "Unknown question");

    if (isCorrect) {
      setQuizFeedback("✅ Correct! " + quizObj.explanation);
    } else {
      setQuizFeedback("❌ Not quite. " + quizObj.explanation);
    }

    // Telemetry hook used for quiz failure stats per module
    logEvent("prelab_quiz_answer", {
      module: moduleData.id,
      step,
      question: questionText,
      answer: option,
      correct: isCorrect
    });
  }

  return (
    <Card className="p-6 space-y-4 bg-slate-50 border border-slate-200">
      <CardContent className="space-y-6">
        {/* Concept card */}
        {current.type === "concept_card" && (
          <motion.div
            key={`concept-${step}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="prose max-w-none text-gray-800 leading-relaxed"
          >
            {/* Main Content */}
            {current.content && (
              <ReactMarkdown>{current.content}</ReactMarkdown>
            )}

            {/* Multiple Examples */}
            {Array.isArray(current.examples) && current.examples.length > 0 && (
              <div className="mt-4 space-y-3">
                {current.examples.map((ex, idx) => (
                  <div key={idx}>
                    {ex.label && (
                      <p className="font-medium text-gray-700">{ex.label}</p>
                    )}
                    {ex.code && (
                      <div className="not-prose">
                        <CodeBlock>{ex.code}</CodeBlock>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Rendering for example_code field */}
            {current.example_code && (
              <div className="not-prose">
                <CodeBlock>{current.example_code}</CodeBlock>
              </div>
            )}

            {/* Inline Quiz */}
            {current.quiz && (
              <div className="mt-4 space-y-2">
                <p className="font-medium text-gray-800">{current.quiz.question}</p>
                {current.quiz.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(opt, current.quiz)}
                    className={`w-full text-left px-3 py-2 rounded border transition duration-200 bg-slate-50 text-slate-800 ${
                      selected === opt
                        ? opt === current.quiz.correct_answer
                          ? "bg-green-200 border-green-400"
                          : "bg-red-200 border-red-400"
                        : "hover:bg-slate-100 border-slate-300"
                    }`}
                  >
                    {opt}
                  </button>
                ))}

                {quizFeedback && (
                  <div className="mt-2 text-sm">
                    <p className={isAnswerCorrect ? "text-green-700" : "text-red-700"}>
                      {quizFeedback}
                    </p>

                    {/* Remediation */}
                    {!isAnswerCorrect && current.quiz.remediation && selected && (
                      <div className="p-3 mt-2 bg-amber-50 border-l-4 border-amber-400 rounded text-amber-900 text-sm">
                        💡 {current.quiz.remediation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Deep Dive Block */}
            {current.deep_dive && (
              <div className="mt-4">
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
                      className="mt-2 p-3 border-l-4 border-blue-400 bg-blue-50 text-sm text-slate-700 rounded space-y-2"
                    >
                      {/* If deep_dive is a string, treat as markdown */}
                      {typeof current.deep_dive === "string" && (
                        <ReactMarkdown>{current.deep_dive}</ReactMarkdown>
                      )}

                      {/* If deep_dive is object, render text + links */}
                      {typeof current.deep_dive === "object" && (
                        <>
                          {current.deep_dive.text && (
                            <ReactMarkdown>{current.deep_dive.text}</ReactMarkdown>
                          )}
                          {Array.isArray(current.deep_dive.links) &&
                            current.deep_dive.links.length > 0 && (
                              <ul className="space-y-1">
                                {current.deep_dive.links.map((lnk, i) => (
                                  <li key={i}>
                                    <a
                                      href={lnk.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-700 underline"
                                    >
                                      {lnk.label}
                                    </a>
                                    {lnk.note && (
                                      <p className="text-xs text-slate-600">{lnk.note}</p>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}


        {/* Standalone Quiz Cards */}
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
                  className={`w-full text-left px-3 py-2 rounded border transition duration-200 bg-slate-50 text-slate-800 ${
                    selected === opt
                      ? opt === current.correct_answer
                        ? "bg-green-200 border-green-400"
                        : "bg-red-200 border-red-400"
                      : "hover:bg-slate-100 border-slate-300"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {quizFeedback && (
              <div className="mt-2 text-sm space-y-1">
                <p
                  className={
                    isAnswerCorrect
                      ? "text-green-700"
                      : "text-red-700"
                  }
                >
                  {quizFeedback}
                </p>

                {/* Remediation display */}
                {!isAnswerCorrect &&
                  current.remediation &&
                  selected && (
                    <div className="p-3 mt-2 bg-amber-50 border-l-4 border-amber-400 rounded text-amber-900 text-sm">
                      💡 {current.remediation}
                    </div>
                  )}
              </div>
            )}
          </motion.div>
        )}

        {/* Micro-Scenario */}
        {current.type === "micro_scenario" && (
          <motion.div
            key={`micro-${step}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-3"
          >
            <p className="font-medium text-gray-800">{current.scenario}</p>
            <div className="not-prose">
              <CodeBlock>{current.context_code}</CodeBlock>
            </div>
            <div className="space-y-2">
              {current.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt)}
                  className={`w-full text-left px-3 py-2 rounded border transition duration-200 bg-slate-50 text-slate-800 ${
                    selected === opt
                      ? opt === current.correct_answer
                        ? "bg-green-200 border-green-400"
                        : "bg-red-200 border-red-400"
                      : "hover:bg-slate-100 border-slate-300"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {quizFeedback && (
              <div className="mt-2 text-sm space-y-1">
                <p
                  className={
                    isAnswerCorrect
                      ? "text-green-700"
                      : "text-red-700"
                  }
                >
                  {quizFeedback}
                </p>

                {/* Remediation display */}
                {!isAnswerCorrect &&
                  current.remediation &&
                  selected && (
                    <div className="p-3 mt-2 bg-amber-50 border-l-4 border-amber-400 rounded text-amber-900 text-sm">
                      💡 {current.remediation}
                    </div>
                  )}
              </div>
            )}
          </motion.div>
        )}

        {/* Further Reading Hint */}
        {isLastStep && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="border-t border-slate-300 pt-3 text-sm text-slate-600 italic"
          >
            📘 <strong>Note</strong>: This pre-lab phase covered only fundamentals needed for the lab challenge. There is so much more to learn. The links from the prelab are a good starting point. If you haven't taken a look at them, no worries, you can find them on the{" "}
            <strong>Student Dashboard</strong> in the further reading section.
          </motion.div>
        )}
      </CardContent>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrev} disabled={step === 0}>
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={current.type === "quiz" && !isAnswerCorrect}
        >
          {isLastStep ? "Start Challenge" : "Next"}
        </Button>
      </div>
    </Card>
  );
}
