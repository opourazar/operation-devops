/** LocalStorage-based analytics + event logging for the prototype.
 * Used across Instructor Dashboard panels.
 */

const STORAGE_KEY = "telemetry_events";
const SESSION_KEY = "telemetry_session_id";
const MAX_EVENTS = 1000; // keep telemetry bounded for localStorage

// Session Id (one per student browser lifetime)
export function getSessionId() {
  let sid = localStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = "session-" + Math.random().toString(36).slice(2);
    localStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

// Log event
export function logEvent(event, payload = {}) {
  try {
    const session = payload.session ?? getSessionId();
    const entry = {
      ts: Date.now(),
      session,
      event,
      module: payload.module ?? null,
      ...payload
    };

    const prev = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    prev.push(entry);
    const trimmed =
      prev.length > MAX_EVENTS ? prev.slice(prev.length - MAX_EVENTS) : prev;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.error("Telemetry store failed", err);
  }
}

// Retrieval + Maintenance
export function getTelemetry() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

export function clearTelemetry() {
  localStorage.removeItem(STORAGE_KEY);
}

// Quiz failure aggregation
export function computeQuizFailures(events, moduleId = null) {
  const filtered = events.filter(
    (e) =>
      e.event === "prelab_quiz_answer" &&
      e.correct === false &&
      (!moduleId || e.module === moduleId)
  );

  const grouped = filtered.reduce((acc, e) => {
    const key = e.question || "Unknown question";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const topEntry = Object.entries(grouped).sort((a, b) => b[1] - a[1])[0];

  return {
    total: filtered.length,
    top: topEntry ? { question: topEntry[0], count: topEntry[1] } : null
  };
}

// Group by module
export function groupByModule(events) {
  return events.reduce((acc, e) => {
    if (!e.module) return acc;
    if (!acc[e.module]) acc[e.module] = [];
    acc[e.module].push(e);
    return acc;
  }, {});
}

// Module durations
export function computeModuleDurations(events) {
  const durations = {};

  events.forEach((e) => {
    if (!e.module) return;

    // Track start
    if (e.event === "module_start") {
      if (!durations[e.module]) durations[e.module] = {};
      durations[e.module].start = e.ts;
      durations[e.module].session = e.session;
    }

    // Track completion
    if (e.event === "module_complete") {
      if (!durations[e.module]) durations[e.module] = {};
      durations[e.module].end = e.ts;
      durations[e.module].session = e.session;
    }
  });

  // Derive duration
  const result = {};
  for (const mod of Object.keys(durations)) {
    const data = durations[mod];
    result[mod] = {
      session: data.session,
      start: data.start ?? null,
      end: data.end ?? null,
      durationMs:
        data.start && data.end ? data.end - data.start : null
    };
  }

  return result;
}

// Timeline for a specific session
export function getTimelineForSession(events, sessionId) {
  return events
    .filter((e) => e.session === sessionId)
    .sort((a, b) => a.ts - b.ts);
}

// Reflection extraction
export function getReflectionEvents(events) {
  return events.filter((e) => e.event === "reflection_submit");
}
