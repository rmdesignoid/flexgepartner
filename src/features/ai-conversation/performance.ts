import { SKILL_LABELS, type Attempt, type ConversationState, type Practice } from "./types";

export type PerformanceEntry = { attempt: Attempt; practice: Practice; time: number };
export function studentHistory(state: ConversationState, student: string): PerformanceEntry[] {
  const practices = new Map(state.practices.filter((p) => p.practiceType !== "ai-exercise").map((p) => [p.id, p]));
  return state.attempts.flatMap((attempt) => {
    const practice = practices.get(attempt.practiceId);
    const time = Date.parse(attempt.completedAt);
    return practice && attempt.student === student && attempt.completed !== false
      ? [{ attempt, practice, time }] : [];
  }).sort((a, b) => (Number.isFinite(a.time) ? a.time : 0) - (Number.isFinite(b.time) ? b.time : 0) || a.attempt.id.localeCompare(b.attempt.id));
}
export function performanceSlice(history: PerformanceEntry[], start = "", end = ""): PerformanceEntry[] {
  if (!start && !end) return history.slice(-10);
  // Calendar boundaries use the same local dates displayed in the UI.
  const lower = start ? new Date(`${start}T00:00:00`).getTime() : -Infinity;
  const upper = end ? new Date(`${end}T00:00:00`).getTime() : Infinity;
  const exclusiveEnd = Number.isFinite(upper) ? new Date(`${end}T00:00:00`) : null;
  exclusiveEnd?.setDate(exclusiveEnd.getDate() + 1);
  return history.filter((entry) => Number.isFinite(entry.time) && entry.time >= lower && entry.time < (exclusiveEnd?.getTime() ?? upper));
}
export function effectiveSkills(attempt: Attempt) {
  return SKILL_LABELS.map((label) => attempt.teacherCorrections?.find((s) => s.label === label) ?? attempt.evaluation?.dimensions.find((s) => s.label === label)).filter((s): s is { label: string; score: number; evidence?: string } => !!s);
}
export function hasEvaluation(entry: PerformanceEntry) {
  const overall = entry.attempt.evaluation?.overall;
  return typeof overall === "number" && Number.isFinite(overall) && overall >= 0 && overall <= 100;
}
export function recurringDifficulties(entries: PerformanceEntry[]) {
  const occurrences = new Map<string, { text: string; entries: PerformanceEntry[] }>();
  for (const entry of entries) {
    // Unstructured original comments cannot establish a current pattern after a teacher revision.
    if (entry.attempt.teacherCorrections?.length) continue;
    for (const text of new Set(entry.attempt.evaluation?.growthAreas ?? [])) {
      const key = text.trim().toLowerCase().replace(/[.!?]+$/, "");
      if (!key) continue;
      const current = occurrences.get(key) ?? { text, entries: [] };
      if (!current.entries.some((e) => e.attempt.practiceId === entry.attempt.practiceId)) current.entries.push(entry);
      occurrences.set(key, current);
    }
  }
  return [...occurrences.values()].filter((value) => value.entries.length >= 2);
}
export function performanceDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
