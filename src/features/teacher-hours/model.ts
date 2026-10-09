import type { TeacherHoursSession } from './types';

export type PeriodPreset = 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'last-30' | 'last-60' | 'last-90' | 'custom';
export type DateRange = { from: string; to: string };
export const periodPresets: Array<{ value: Exclude<PeriodPreset, 'custom'>; label: string }> = [
  { value: 'this-week', label: 'This week' }, { value: 'last-week', label: 'Last week' },
  { value: 'this-month', label: 'This month' }, { value: 'last-month', label: 'Last month' },
  { value: 'last-30', label: 'Last 30 days' }, { value: 'last-60', label: 'Last 60 days' }, { value: 'last-90', label: 'Last 90 days' },
];
export function localDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function dateRangeFor(preset: Exclude<PeriodPreset, 'custom'>, now = new Date()): DateRange {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (preset.startsWith('last-') && /^last-\d+$/.test(preset)) {
    const start = new Date(today); start.setDate(start.getDate() - Number(preset.split('-')[1]) + 1);
    return { from: localDate(start), to: localDate(today) };
  }
  if (preset === 'this-week' || preset === 'last-week') {
    const start = new Date(today); start.setDate(today.getDate() - today.getDay() - (preset === 'last-week' ? 7 : 0));
    const end = new Date(start); end.setDate(start.getDate() + 6);
    return { from: localDate(start), to: localDate(end) };
  }
  const offset = preset === 'last-month' ? -1 : 0;
  return { from: localDate(new Date(today.getFullYear(), today.getMonth() + offset, 1)), to: localDate(new Date(today.getFullYear(), today.getMonth() + offset + 1, 0)) };
}
export function formatHours(minutes: number) {
  const hours = Math.floor(minutes / 60), remainder = minutes % 60;
  return remainder ? `${hours ? `${hours}h ` : ''}${remainder}m` : `${hours}h`;
}
export function sessionStudents(session: TeacherHoursSession): string[] {
  // Explicit roster data takes precedence; individual lessons already identify their learner.
  return session.students?.map(student => student.name) ?? (session.classOrGroup.id.startsWith('individual-') ? [session.classOrGroup.name] : []);
}
export type SessionFilters = { range: DateRange; teachers: string[]; groups: string[]; students: string[]; statuses: string[] };
export function filterSessions(sessions: TeacherHoursSession[], filters: SessionFilters) {
  return sessions.filter(session => {
    const names = [session.scheduled.teacher.name, session.actual.teacher?.name];
    return session.scheduledDate >= filters.range.from && session.scheduledDate <= filters.range.to
      && (!filters.teachers.length || filters.teachers.some(name => names.includes(name)))
      && (!filters.groups.length || filters.groups.includes(session.classOrGroup.name))
      && (!filters.students.length || filters.students.some(name => sessionStudents(session).includes(name)))
      && (!filters.statuses.length || filters.statuses.includes(session.actual.sessionStatus));
  });
}
export function sessionTotals(rows: TeacherHoursSession[]) {
  return { total: rows.length, scheduled: rows.reduce((sum, session) => sum + session.scheduled.durationMinutes, 0), actual: rows.reduce((sum, session) => sum + (session.actual.timeInClassMinutes ?? 0), 0), substitutions: rows.filter(session => session.classType === 'substitution').length, absent: rows.filter(session => session.actual.attendance === 'Absent').length, flagged: rows.filter(session => session.flags.length > 0).length };
}
