/** LocalStorage-based analytics + event logging for the prototype.
 * Used across instructor dashboard panels.
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

// Retrieval + Maintenance
export function getTelemetry() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

export function clearTelemetry() {
  localStorage.removeItem(STORAGE_KEY);
}

// Deduplicate near-duplicate events for a given module/session/type
function shouldSkipRepeat(last, next) {
  if (!last) return false;
  const sameEvent = last.event === next.event;
  const sameModule = last.module === next.module;
  const sameSession = last.session === next.session;
  const within5s = Math.abs(next.ts - last.ts) < 5000;
  return sameEvent && sameModule && sameSession && within5s;
}

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
    const last = prev.length > 0 ? prev[prev.length - 1] : null;
    if (shouldSkipRepeat(last, entry)) {
      return;
    }

    prev.push(entry);
    const trimmed =
      prev.length > MAX_EVENTS ? prev.slice(prev.length - MAX_EVENTS) : prev;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.error("Telemetry store failed", err);
  }
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
  const byModule = events
    .filter((e) => e.module)
    .sort((a, b) => a.ts - b.ts)
    .reduce((acc, e) => {
      acc[e.module] = acc[e.module] || [];
      acc[e.module].push(e);
      return acc;
    }, {});

  const result = {};

  Object.entries(byModule).forEach(([mod, list]) => {
    let lastStart = null;
    let lastSession = null;
    let latestPair = null;

    for (const e of list) {
      if (e.event === "module_start") {
        lastStart = e.ts;
        lastSession = e.session;
      }

      if (e.event === "module_complete" && lastStart) {
        const duration = e.ts - lastStart;
        if (duration >= 0) {
          latestPair = {
            session: e.session ?? lastSession,
            start: lastStart,
            end: e.ts,
            durationMs: duration
          };
        }
        lastStart = null;
        lastSession = null;
      }
    }

    result[mod] =
      latestPair || {
        session: lastSession,
        start: lastStart,
        end: null,
        durationMs: null
      };
  });

  return result;
}

// Phase durations (prelab vs lab) per module (latest run)
export function computeModulePhaseDurations(events) {
  const byModule = events
    .filter((e) => e.module)
    .sort((a, b) => a.ts - b.ts)
    .reduce((acc, e) => {
      acc[e.module] = acc[e.module] || [];
      acc[e.module].push(e);
      return acc;
    }, {});

  const output = {};

  Object.entries(byModule).forEach(([mod, list]) => {
    let run = null;
    const runs = [];

    const commitRun = () => {
      if (run && run.end && run.start && run.end >= run.start) {
        runs.push({ ...run });
      }
      run = null;
    };

    list.forEach((e) => {
      if (e.event === "module_start") {
        // start a new run
        commitRun();
        run = {
          session: e.session,
          start: e.ts,
          prelabStart: e.ts,
          prelabEnd: null,
          labStart: null,
          end: null
        };
      }

      if (e.event === "module_stage_change" && run) {
        if (e.stage === "terminal" || e.stage === "editor") {
          if (!run.prelabEnd) {
            run.prelabEnd = e.ts;
          }
          if (!run.labStart) {
            run.labStart = e.ts;
          }
        }
      }

      if (e.event === "module_complete" && run) {
        run.end = e.ts;
        commitRun();
      }
    });

    // If a run is in progress without completion, keep as latest
    if (run && run.start) {
      runs.push(run);
    }

    const latest = runs.length > 0 ? runs[runs.length - 1] : null;
    if (!latest) return;

    const prelabMs =
      latest.prelabStart && latest.prelabEnd && latest.prelabEnd >= latest.prelabStart
        ? latest.prelabEnd - latest.prelabStart
        : null;

    const labEnd = latest.end || latest.prelabEnd || latest.start;
    const labStart = latest.labStart || latest.prelabEnd;
    const labMs =
      labStart && labEnd && labEnd >= labStart ? labEnd - labStart : null;

    output[mod] = {
      session: latest.session,
      prelabMs,
      labMs,
      start: latest.start,
      end: latest.end
    };
  });

  return output;
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
