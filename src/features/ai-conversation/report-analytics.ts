import type { Attempt, ConversationState, Practice } from "./types";

export type OralHistoryItem = { attempt: Attempt; practice: Practice; sourceIndex: number };

export function resolvedDimensions(attempt: Attempt) {
  return attempt.evaluation?.dimensions.map((dimension) =>
    attempt.teacherCorrections?.find((correction) => correction.label === dimension.label) ?? dimension,
  ) ?? [];
}

export function attemptScore(attempt: Attempt): number | null {
  const dimensions = resolvedDimensions(attempt);
  if (!dimensions.length) return null;
  const scores = dimensions.map(({ score }) => score).filter((score) => Number.isFinite(score));
  if (!scores.length) return null;
  return Math.round(scores.reduce((total, score) => total + score, 0) / scores.length);
}

export function isOralProductionPractice(practice: Practice) {
  return !practice.practiceType || practice.practiceType === "oral-production";
}

export function oralProductionHistory(state: ConversationState, student: string): OralHistoryItem[] {
  const normalizedStudent = student.trim().toLocaleLowerCase();
  if (!normalizedStudent) return [];
  return state.attempts
    .map((attempt, sourceIndex) => ({ attempt, sourceIndex, practice: state.practices.find((item) => item.id === attempt.practiceId) }))
    .filter((item): item is OralHistoryItem => !!item.practice
      && isOralProductionPractice(item.practice)
      && item.attempt.completed !== false
      && item.attempt.student.trim().toLocaleLowerCase() === normalizedStudent)
    .sort((a, b) => {
      const difference = Date.parse(a.attempt.completedAt) - Date.parse(b.attempt.completedAt);
      return Number.isFinite(difference) && difference !== 0 ? difference : a.sourceIndex - b.sourceIndex;
    });
}

export function performanceComparisons(state: ConversationState, student: string, current: Attempt) {
  const history = oralProductionHistory(state, student);
  const currentIndex = history.findIndex(({ attempt }) => attempt.id === current.id);
  if (currentIndex < 0) return { previousDelta: null, averageDelta: null };
  const currentScore = attemptScore(current);
  if (currentScore === null) return { previousDelta: null, averageDelta: null };
  const priorScores = history.slice(0, currentIndex)
    .map(({ attempt }) => attemptScore(attempt))
    .filter((score): score is number => score !== null);
  if (!priorScores.length) return { previousDelta: null, averageDelta: null };
  const previousScore = priorScores[priorScores.length - 1];
  const historicalAverage = Math.round(priorScores.reduce((total, score) => total + score, 0) / priorScores.length);
  return {
    previousDelta: currentScore - previousScore,
    averageDelta: currentScore - historicalAverage,
  };
}
