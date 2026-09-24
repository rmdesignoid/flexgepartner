import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

// Execute the actual store code without requiring a browser or changing saved user data.
function model(saved) {
  let value = saved && JSON.stringify({ samplePackVersion: 1, ...saved });
  const examples = { exports: {} };
  runInContext(ts.transpileModule(readFileSync(new URL("../src/features/ai-conversation/example-practices.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, createContext(examples));
  if (saved) value = JSON.stringify({ samplePackVersion: examples.exports.EXAMPLE_PACK_VERSION, ...saved });
  const context = createContext({ exports: {}, require: () => examples.exports, window: { localStorage: { getItem: () => value, setItem: (_key, next) => { value = next; } } } });
  const source = readFileSync(new URL("../src/features/ai-conversation/types.ts", import.meta.url), "utf8");
  runInContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context);
  context.exports.storedValue = () => value;
  return context.exports;
}

test("legacy activities migrate to publication states without losing assignments", () => {
  const base = model().INITIAL_STATE.practices[0];
  const api = model({ practices: ["Assigned", "In progress", "Completed", "Draft"].map((status, i) => ({ ...base, id: String(i), status, students: i === 3 ? [] : ["Student"], minResponseTime: undefined, maxResponseTime: 10 })), attempts: [] });
  const state = api.readState();
  assert.equal(state.practices.map((item) => item.status).join(","), "Published,Published,Published,Draft");
  assert.equal(state.practices[0].students[0], "Student");
  assert.equal(state.practices[0].minResponseTime, 1);
  assert.equal(state.practices[0].maxResponseTime, 5);
});

test("removed themes stay removed after saving and reloading", () => {
  const base = model().INITIAL_STATE.practices[0];
  const api = model({ practices: [{ ...base, tags: [] }], attempts: [] });
  api.saveState(api.readState());
  assert.equal(api.readState().practices[0].tags.length, 0);
});

test("single submission guard is scoped to the activity and student", () => {
  const api = model();
  const state = { practices: [], attempts: [{ practiceId: "a", student: "Anna", completed: true }, { practiceId: "b", student: "Anna", completed: false }] };
  assert.equal(api.hasSubmitted(state, "a", "Anna"), true);
  assert.equal(api.hasSubmitted(state, "a", "Lucas"), false);
  assert.equal(api.hasSubmitted(state, "b", "Anna"), false);
});

test("legacy evaluation migration preserves overall score and teacher review", () => {
  const initial = model().INITIAL_STATE;
  const old = { ...initial.attempts[0], evaluation: { ...initial.attempts[0].evaluation, overall: 73, dimensions: [{ label: "Interaction", score: 90 }] }, reviewStatus: "Completed", teacherComment: "Feedback", teacherCorrections: [{ label: "Pronunciation", score: 95, evidence: "Clear speech" }] };
  const api = model({ practices: initial.practices, attempts: [old] });
  const response = api.readState().attempts[0];
  assert.equal(response.evaluation.overall, 73);
  assert.equal(response.evaluation.dimensions.map((item) => item.label).join(","), api.SKILL_LABELS.join(","));
  assert.equal(response.teacherCorrections[0].score, 95);
  assert.equal(response.teacherComment, "Feedback");
  assert.equal(response.reviewStatus, "Completed");
});

test("real recordings never receive demonstration evaluations during migration", () => {
  const api = model({ practices: [], attempts: [{ id: "real-recording", practiceId: "activity", student: "Anna", audioId: "audio", transcript: [], completed: true }] });
  assert.equal(api.readState().attempts[0].evaluation, undefined);
});

test("example pack seeds once and preserves existing work", () => {
  const api = model({ samplePackVersion: 0, practices: [{ ...model().INITIAL_STATE.practices[0], id: "user", title: "My work", isExample: false }], attempts: [] });
  const state = api.readState();
  const examplePracticeCount = api.INITIAL_STATE.practices.filter((item) => item.isExample).length;
  const exampleAttemptCount = api.INITIAL_STATE.attempts.filter((item) => item.id.startsWith("example-response-")).length;
  assert.equal(state.practices.length, examplePracticeCount + 1);
  assert.equal(state.attempts.length, exampleAttemptCount);
  assert.equal(state.practices.find((p) => p.id === "user").title, "My work");
  assert.equal(api.readState().attempts.length, exampleAttemptCount);
  api.saveState({ ...state, practices: state.practices.filter((p) => p.id === "user"), attempts: [] });
  assert.equal(api.readState().practices.length, 1);
});

test("every new example has a full illustrative report and playable media assets", () => {
  const state = model().INITIAL_STATE;
  for (const p of state.practices.filter((p) => p.isExample)) {
    const a = state.attempts.find((a) => a.practiceId === p.id);
    assert.equal(a.syntheticAudio, true);
    assert.ok(readFileSync(new URL(`../public${p.imageDataUrl}`, import.meta.url)).length > 1000);
    assert.ok(readFileSync(new URL(`../public${a.audioUrl}`, import.meta.url)).length > 1000);
    for (const field of ["summary", "howYouDid", "strengths", "growthAreas", "growthOpportunities", "communicativeGoal", "repeatedWords", "falseCognates"]) assert.ok(a.evaluation[field].length);
    assert.equal(a.evaluation.dimensions.length, 5);
  }
});

test("Anna's sample history shows varied scores across dated practices", () => {
  const state = model().INITIAL_STATE;
  const evolutionAttempts = state.attempts.filter((attempt) => attempt.student === "Anna Johnson" && attempt.id.includes("-v2"));
  const scores = evolutionAttempts.map((attempt) => Math.round(attempt.evaluation.dimensions.reduce((sum, dimension) => sum + dimension.score, 0) / attempt.evaluation.dimensions.length));
  assert.deepEqual(Array.from(scores), [60, 65, 71, 75, 81]);
  assert.equal(new Set(evolutionAttempts.map((attempt) => attempt.practiceId)).size, 5);
  assert.ok(evolutionAttempts.every((attempt) => attempt.completed && attempt.syntheticAudio));
  const dates = Array.from(evolutionAttempts, (attempt) => attempt.completedAt);
  assert.deepEqual(dates, [...dates].sort());
});

test("Anna's submitted sample practices have illustrative timeline KPIs", () => {
  const attempts = model().INITIAL_STATE.attempts.filter((attempt) => attempt.student === "Anna Johnson" && attempt.completed !== false);
  assert.ok(attempts.length > 0);
  for (const attempt of attempts) {
    assert.ok(attempt.demoMetrics, `${attempt.id} should include illustrative metrics`);
    assert.ok(attempt.demoMetrics.uniqueWordCount > 0);
    assert.ok(attempt.demoMetrics.errorCount >= 0);
    assert.match(attempt.demoMetrics.spokenCefrLevel, /^[ABC][12]$/);
  }
});

test("read-only student preview never persists migrations", () => {
  const api = model({ samplePackVersion: 0, practices: [], attempts: [] });
  const snapshot = api.readState({ persistMigration: false });
  assert.equal(snapshot.practices.length, model().INITIAL_STATE.practices.filter((item) => item.isExample).length);
  const original = api.storedValue();
  api.readState({ persistMigration: false });
  assert.equal(api.storedValue(), original);
  assert.equal(JSON.parse(api.storedValue()).samplePackVersion, 0);
});
