function FeedbackPanel({ feedback }) {
  return (
    <div className="border rounded-lg p-4 bg-amber-50">
      <h2 className="text-md font-semibold mb-2">Feedback</h2>
      <ul className="list-disc ml-5 space-y-1">
        {feedback.map((f, i) => (
          <li key={i}>{f}</li>
        ))}
      </ul>
    </div>
  );
}

export default FeedbackPanel;