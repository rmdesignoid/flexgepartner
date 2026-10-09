import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
const context = createContext({ exports: {} });
runInContext(ts.transpileModule(readFileSync(new URL('../src/features/teacher-hours/model.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context);
const api = context.exports;
const session = (overrides = {}) => ({ id: '1', scheduledDate: '2026-09-15', classOrGroup: { id: 'group', name: 'Conversation' }, students: [{ id: 'anna', name: 'Anna' }], scheduled: { teacher: { id: 'lucas', name: 'Lucas' }, startMinutes: 540, endMinutes: 600, durationMinutes: 60 }, actual: { teacher: { id: 'ana', name: 'Ana' }, timeInClassMinutes: 57, attendance: 'Present', sessionStatus: 'Rescheduled' }, classType: 'substitution', flags: ['Substitution requiring review'], ...overrides });
const filters = { range: { from: '2026-09-01', to: '2026-09-30' }, teachers: [], groups: [], students: [], statuses: [] };
test('rolling ranges are inclusive and cross month/year boundaries', () => {
  for (const days of [30,60,90]) {
    const range = api.dateRangeFor(`last-${days}`, new Date(2026,0,5));
    assert.equal(range.to, '2026-01-05');
    assert.equal((Date.parse(range.to) - Date.parse(range.from)) / 86400000 + 1, days);
  }
  assert.equal(api.dateRangeFor('last-month', new Date(2026,0,5)).from, '2025-12-01');
  assert.equal(api.dateRangeFor('last-month', new Date(2026,2,1)).to, '2026-02-28');
  assert.equal(api.dateRangeFor('last-month', new Date(2024,2,1)).to, '2024-02-29');
});
test('filters intersect and match both scheduled and substitute teachers', () => {
  const rows = [session(), session({ id:'2', scheduledDate:'2026-10-01' })];
  for (const teacher of ['Lucas','Ana']) assert.equal(api.filterSessions(rows,{...filters,teachers:[teacher],groups:['Conversation'],students:['Anna'],statuses:['Rescheduled']}).length,1);
  assert.equal(api.filterSessions(rows,{...filters,students:['Unknown']}).length,0);
  assert.equal(api.filterSessions(rows,{...filters,statuses:['Canceled']}).length,0);
  assert.equal(api.filterSessions(rows,{...filters,range:{from:'2026-09-15',to:'2026-09-15'}}).length,1);
});
test('student filters prefer explicit rosters and identify individual lessons', () => {
  assert.equal(api.sessionStudents(session()).join(','),'Anna');
  assert.equal(api.sessionStudents(session({students:undefined,classOrGroup:{id:'individual-lucas',name:'Lucas'}})).join(','),'Lucas');
  assert.equal(api.sessionStudents(session({students:undefined})).length,0);
});
test('totals keep absence, substitution and review counts independent', () => {
  const result = api.sessionTotals([session(),session({classType:'original',actual:{teacher:null,timeInClassMinutes:null,attendance:'Absent',sessionStatus:'Canceled'},flags:['Teacher absent','Missing check-in']})]);
  assert.equal(result.total,2); assert.equal(result.scheduled,120); assert.equal(result.actual,57);
  assert.equal(result.substitutions,1); assert.equal(result.absent,1); assert.equal(result.flagged,2);
  assert.equal(api.formatHours(515),'8h 35m'); assert.equal(api.formatHours(600),'10h'); assert.equal(api.formatHours(0),'0h');
});
