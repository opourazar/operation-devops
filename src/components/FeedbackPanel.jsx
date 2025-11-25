import React from "react";
import { cn } from "@/lib/utils";

const typeStyles = {
  error: "border-red-400 bg-red-50 text-red-800",
  warning: "border-amber-400 bg-amber-50 text-amber-800",
  tip: "border-blue-400 bg-blue-50 text-blue-800",
  mentor: "border-gray-400 bg-gray-50 text-gray-800 italic",
  success: "border-green-400 bg-green-50 text-green-800",
  code: "border-gray-300 bg-gray-900 text-gray-100 font-mono text-sm text-left p-3 rounded"
};

export default function FeedbackPanel({ feedback }) {
  if (!feedback || feedback.length === 0) return null;

  return (
    <div className="space-y-3 mt-4">
      <h2 className="text-md font-semibold">Feedback</h2>

      {feedback.map((item, i) => {
        // Handle legacy string-based feedback
        if (typeof item === "string") {
          return (
            <div
              key={i}
              className="border bg-amber-50 border-amber-300 rounded p-3"
            >
              {item}
            </div>
          );
        }

        // Typed feedback object
        const { type, message, code } = item;

        if (type === "code") {
          return (
            <pre
              key={i}
              className={cn("whitespace-pre-wrap rounded", typeStyles.code)}
            >
              {code}
            </pre>
          );
        }

        return (
          <div
            key={i}
            className={cn(
              "border rounded p-3 leading-relaxed",
              typeStyles[type] || "bg-gray-50 border-gray-300"
            )}
          >
            {message}
          </div>
        );
      })}
    </div>
  );
}
