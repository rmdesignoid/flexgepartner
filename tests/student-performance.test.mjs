import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

const context = createContext({ exports: {}, require: () => ({ SKILL_LABELS: ["Pronunciation", "Speech Rhythm", "Use of Vocabulary", "Topic Adherence", "Use of Grammar"] }) });
runInContext(ts.transpileModule(readFileSync(new URL("../src/features/ai-conversation/performance.ts", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context);
const api = context.exports;
const practice = { id: "oral", practiceType: "oral-production", title: "Explain a need", level: "A2" };
const attempt = (id, day, evaluated = true) => ({ id, practiceId: "oral", student: "Anna", completedAt: `2026-09-${String(day).padStart(2, "0")}T12:00:00`, completed: true, ...(evaluated ? { evaluation: { overall: 75, dimensions: [{ label: "Pronunciation", score: 70, evidence: "Original evidence" }], growthAreas: ["Develop reasons so the listener understands your choice."] } } : {}) });
const history = (attempts) => api.studentHistory({ practices: [practice], attempts }, "Anna");

test("latest ten are selected before excluding pending feedback", () => {
  const entries = history(Array.from({ length: 15 }, (_, i) => attempt(String(i), i + 1, i < 7)));
  const slice = api.performanceSlice(entries);
  assert.equal(slice.length, 10);
  assert.equal(slice[0].attempt.id, "5");
  assert.equal(slice.filter(api.hasEvaluation).length, 2);
  assert.equal(entries.length, 15);
});
test("period includes both calendar boundaries and has no ten practice limit", () => {
  const entries = history(Array.from({ length: 15 }, (_, i) => attempt(String(i), i + 1)));
  const slice = api.performanceSlice(entries, "2026-09-02", "2026-09-14");
  assert.equal(slice.length, 13);
  assert.equal(slice[0].attempt.id, "1");
  assert.equal(slice.at(-1).attempt.id, "13");
  assert.equal(api.performanceSlice(entries, "2026-10-01", "2026-10-02").length, 0);
  assert.equal(api.performanceSlice(entries, "", "2026-09-03").length, 3);
});
test("history excludes other students, incomplete attempts and other exercise formats", () => {
  const entries = api.studentHistory({ practices: [practice, { ...practice, id: "exercise", practiceType: "ai-exercise" }], attempts: [attempt("a", 3), { ...attempt("b", 1), student: "Lucas" }, { ...attempt("c", 2), completed: false }, { ...attempt("d", 4), practiceId: "exercise" }, attempt("e", 1)] }, "Anna");
  assert.equal(entries.map((e) => e.attempt.id).join(","), "e,a");
});
test("teacher revisions replace skill evidence without changing overall or completion time", () => {
  const original = attempt("a", 3);
  const revised = { ...original, teacherCorrections: [{ label: "Pronunciation", score: 91, evidence: "Clearer requests" }] };
  assert.equal(api.effectiveSkills(revised)[0].score, 91);
  assert.equal(api.effectiveSkills(revised)[0].evidence, "Clearer requests");
  assert.equal(revised.evaluation.overall, 75);
  assert.equal(history([revised])[0].time, history([original])[0].time);
});
test("zero is a valid evaluated score and missing evaluation is pending", () => {
  const zero = { ...attempt("a", 1), evaluation: { overall: 0, dimensions: [] } };
  assert.equal(api.hasEvaluation(history([zero])[0]), true);
  assert.equal(api.hasEvaluation(history([attempt("b", 2, false)])[0]), false);
});
test("isolated and duplicate-attempt difficulties do not establish recurrence", () => {
  const one = attempt("a", 1), two = attempt("b", 2);
  assert.equal(api.recurringDifficulties(history([one])).length, 0);
  assert.equal(api.recurringDifficulties(history([one, two])).length, 0);
  const secondPractice = { ...practice, id: "second" };
  const entries = api.studentHistory({ practices: [practice, secondPractice], attempts: [one, { ...two, practiceId: "second" }] }, "Anna");
  assert.equal(api.recurringDifficulties(entries).length, 1);
  entries[1].attempt.teacherCorrections = [{ label: "Pronunciation", score: 90 }];
  assert.equal(api.recurringDifficulties(entries).length, 0);
});
