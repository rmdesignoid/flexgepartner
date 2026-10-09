"use client";
import * as Popover from '@radix-ui/react-popover';
import { Check, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Badge, Button, Card, IconButton } from '../../design-system';
import { teacherHoursMockSessions } from './data';
import { timeBandFor, type TeacherHoursAttendance, type TeacherHoursSession, type TeacherHoursSessionStatus } from './types';
import { dateRangeFor, filterSessions, formatHours, sessionStudents, sessionTotals, type DateRange, type PeriodPreset } from './model';
import { DesignIcon, TeacherHoursPeriod } from './TeacherHoursPeriod';
import './teacher-hours.css';
import './teacher-hours-overrides.css';

function formatMinutes(minutes: number) { return `${minutes} min`; }
function formatTime(minutes: number) { return `${Math.floor(minutes / 60) % 12 || 12}${minutes % 60 ? `:${String(minutes % 60).padStart(2, '0')}` : ''}${minutes < 720 ? 'AM' : 'PM'}`; }
function dateLabel(value: string) { return new Date(`${value}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
function MultiFilter({ label, allLabel, icon, options, value, onChange }: { label: string; allLabel: string; icon: string; options: string[]; value: string[]; onChange: (value: string[]) => void }) {
  return <Popover.Root><Popover.Trigger asChild><button className={`teacher-hours__filter-button${value.length ? ' is-active' : ''}`} type="button" aria-label={value.length ? `${label}: ${value.length} selected` : allLabel}><DesignIcon name={icon} /><span>{value.length === 1 ? value[0] : value.length ? `${label} (${value.length})` : allLabel}</span><DesignIcon name="down" /></button></Popover.Trigger><Popover.Portal><Popover.Content className="teacher-hours__filter-menu" side="bottom" align="start" sideOffset={4} collisionPadding={12}><header><strong>{label}</strong><button type="button" onClick={() => onChange([])} disabled={!value.length}>Clear</button></header><div role="group" aria-label={`${label} filters`}>{options.map(option => <button type="button" role="checkbox" aria-checked={value.includes(option)} className={value.includes(option) ? 'is-selected' : ''} key={option} onClick={() => onChange(value.includes(option) ? value.filter(item => item !== option) : [...value, option])}><span>{value.includes(option) ? <Check size={13} /> : null}</span>{option}</button>)}{!options.length ? <p>No {label.toLowerCase()} available.</p> : null}</div></Popover.Content></Popover.Portal></Popover.Root>;
}
function SemanticBadge({ tone, children }: { tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral'; children: ReactNode }) { return <Badge><span className={`teacher-hours__badge teacher-hours__badge--${tone}`}>{children}</span></Badge>; }
function AttendanceBadge({ value }: { value: TeacherHoursAttendance }) { return <SemanticBadge tone={value === 'Present' ? 'info' : value === 'Absent' ? 'warning' : 'neutral'}>{value}</SemanticBadge>; }
function StatusBadge({ value }: { value: TeacherHoursSessionStatus }) { return <SemanticBadge tone={value === 'Canceled' || value === 'Student no-show' ? 'danger' : value === 'Rescheduled' || value === 'Taught' ? 'info' : value === 'Reschedule pending' ? 'warning' : 'neutral'}>{value}</SemanticBadge>; }
function TimeCell({ session }: { session: TeacherHoursSession }) {
  const band = session.flags.includes('Time discrepancy') ? 'critical' : timeBandFor(session.actual.timeInClassMinutes, session.actual.attendance);
  return <span className={`teacher-hours__time teacher-hours__time--${band}`}>{band !== 'no-data' ? <i aria-hidden="true" /> : null}{session.actual.timeInClassMinutes === null ? '—' : formatMinutes(session.actual.timeInClassMinutes)}</span>;
}
function SessionDialog({ session, onClose }: { session: TeacherHoursSession; onClose: () => void }) {
  return <div className="teacher-hours__dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="teacher-hours__dialog" role="dialog" aria-modal="true" aria-labelledby="teacher-hours-detail-title"><header><div><span>Class session</span><h2 id="teacher-hours-detail-title">{session.classOrGroup.name}</h2><p>{dateLabel(session.scheduledDate)} · {formatTime(session.scheduled.startMinutes)}–{formatTime(session.scheduled.endMinutes)}</p></div><IconButton label="Close session details" onClick={onClose}><X size={17} /></IconButton></header><div className="teacher-hours__dialog-body"><section><h3>Scheduled</h3><dl><div><dt>Teacher</dt><dd>{session.scheduled.teacher.name}</dd></div><div><dt>Time</dt><dd>{formatTime(session.scheduled.startMinutes)}–{formatTime(session.scheduled.endMinutes)}</dd></div><div><dt>Duration</dt><dd>{formatMinutes(session.scheduled.durationMinutes)}</dd></div></dl></section><section><h3>Actual</h3><dl><div><dt>Teacher</dt><dd>{session.actual.teacher?.name ?? "No data"}</dd></div><div><dt>Time in class</dt><dd><TimeCell session={session} /></dd></div><div><dt>Attendance</dt><dd><AttendanceBadge value={session.actual.attendance} /></dd></div><div><dt>Session status</dt><dd><StatusBadge value={session.actual.sessionStatus} /></dd></div></dl></section><section><h3>Review</h3><dl><div><dt>Class type</dt><dd><SemanticBadge tone={session.classType === "substitution" ? "warning" : "neutral"}>{session.classType === "substitution" ? "Substitution" : "Original"}</SemanticBadge></dd></div><div><dt>Flags</dt><dd>{session.flags.length ? <span className="teacher-hours__flag-list">{session.flags.map((flag) => <SemanticBadge tone="warning" key={flag}>{flag}</SemanticBadge>)}</span> : "None"}</dd></div><div><dt>Observations</dt><dd>{session.observations ?? "No observations recorded."}</dd></div></dl></section></div><footer><Button variant="secondary" onClick={onClose}>Close</Button></footer></section></div>;
}


export function TeacherHoursView() {
  const [plannerEvents, setPlannerEvents] = useState<Array<{ id: string | number; observation?: string | null }>>([]);
  const [teachers, setTeachers] = useState<string[]>([]), [groups, setGroups] = useState<string[]>([]), [students, setStudents] = useState<string[]>([]), [statuses, setStatuses] = useState<string[]>([]);
  const [period, setPeriod] = useState<PeriodPreset>('last-30'), [range, setRange] = useState<DateRange>(() => dateRangeFor('last-30'));
  const [ascending, setAscending] = useState(true), [page, setPage] = useState(1), [selected, setSelected] = useState<TeacherHoursSession | null>(null);
  const [exportState, setExportState] = useState<'idle' | 'downloading' | 'complete'>('idle');
  const exportTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (exportTimer.current) clearTimeout(exportTimer.current); }, []);
  useEffect(() => { const controller = new AbortController(); void fetch('/api/events', { signal: controller.signal }).then(response => response.ok ? response.json() as Promise<{ events?: Array<{ id: string | number; observation?: string | null }> }> : null).then(payload => { if (!controller.signal.aborted) setPlannerEvents(payload?.events ?? []); }).catch(() => {}); return () => controller.abort(); }, []);
  const sessions = useMemo(() => {
    const observations = new Map(plannerEvents.map(event => [String(event.id), event.observation]));
    return teacherHoursMockSessions.map(session => session.plannerEventId != null && observations.has(String(session.plannerEventId)) ? { ...session, observations: observations.get(String(session.plannerEventId)) ?? null } : session);
  }, [plannerEvents]);
  const options = useMemo(() => ({
    teachers: Array.from(new Set(sessions.flatMap(session => [session.scheduled.teacher.name, session.actual.teacher?.name].filter((name): name is string => Boolean(name))))).sort(),
    groups: Array.from(new Set(sessions.filter(session => !session.classOrGroup.id.startsWith('individual-')).map(session => session.classOrGroup.name))).sort(),
    students: Array.from(new Set(sessions.flatMap(sessionStudents))).sort(),
    statuses: Array.from(new Set(sessions.map(session => session.actual.sessionStatus))).sort(),
  }), [sessions]);
  const periodRows = useMemo(() => filterSessions(sessions, { range, teachers: [], groups: [], students: [], statuses: [] }), [sessions, range]);
  const rows = useMemo(() => filterSessions(sessions, { range, teachers, groups, students, statuses }).sort((left, right) => (ascending ? 1 : -1) * (left.scheduledDate.localeCompare(right.scheduledDate) || left.scheduled.startMinutes - right.scheduled.startMinutes)), [sessions, range, teachers, groups, students, statuses, ascending]);
  const totals = useMemo(() => sessionTotals(rows), [rows]);
  const pageCount = Math.max(1, Math.ceil(rows.length / 10)), currentPage = Math.min(page, pageCount), visibleRows = rows.slice((currentPage - 1) * 10, currentPage * 10);
  const changeFilter = (setter: (values: string[]) => void) => (values: string[]) => { setter(values); setPage(1); };
  const exportData = () => {
    if (exportState === 'downloading') return;
    if (exportTimer.current) clearTimeout(exportTimer.current);
    setExportState('downloading');
    exportTimer.current = setTimeout(() => { setExportState('complete'); exportTimer.current = setTimeout(() => setExportState('idle'), 4000); }, 1200);
  };
  const cards = [{ icon: 'total', value: totals.total, label: 'Total classes' }, { icon: 'scheduled', value: formatHours(totals.scheduled), label: 'Scheduled hours' }, { icon: 'actual', value: formatHours(totals.actual), label: 'Actual hours' }, { icon: 'substitutions', value: totals.substitutions, label: 'Substitutions' }, { icon: 'absences', value: totals.absent, label: 'Absences' }, { icon: 'flagged', value: totals.flagged, label: 'Flagged classes' }];
  const emptyTitle = !sessions.length ? 'No classes yet' : !periodRows.length ? 'No classes in this period' : 'No matching classes';
  const emptyDescription = !sessions.length ? 'Teacher hours will appear here once classes are scheduled.' : !periodRows.length ? <>There are no classes scheduled for the selected period.<br />Try a different date range.</> : <>No classes match the selected filters.<br />Adjust your filters or date range.</>;
  return <section className="teacher-hours" aria-label="Teacher Hours">
    <header className="teacher-hours__header resources-header"><div><h1>Teacher Hours</h1><p>Review scheduled and actual teacher hours, attendance, substitutions, and sessions that need attention.</p></div></header>
    <div className="teacher-hours__filters" aria-label="Teacher Hours filters">
      <TeacherHoursPeriod preset={period} range={range} onChange={(next, dates) => { setPeriod(next); setRange(dates); setPage(1); }} />
      <MultiFilter label="Teachers" allLabel="All teachers" icon="teacher" options={options.teachers} value={teachers} onChange={changeFilter(setTeachers)} />
      <MultiFilter label="Groups" allLabel="All groups" icon="groups" options={options.groups} value={groups} onChange={changeFilter(setGroups)} />
      <MultiFilter label="Students" allLabel="All students" icon="student" options={options.students} value={students} onChange={changeFilter(setStudents)} />
      <MultiFilter label="Statuses" allLabel="All statuses" icon="status" options={options.statuses} value={statuses} onChange={changeFilter(setStatuses)} />
      <button type="button" className="teacher-hours__export" aria-label={exportState === 'downloading' ? 'Simulating download' : 'Export teacher hours'} title="Export teacher hours" disabled={!rows.length || exportState === 'downloading'} aria-busy={exportState === 'downloading'} onClick={exportData}>{exportState === 'downloading' ? <span className="teacher-hours__spinner" /> : <DesignIcon name="export" />}</button>
    </div>
    <div className="teacher-hours__summary" aria-label="Period summary">{cards.map(card => <Card key={card.icon}><DesignIcon name={card.icon} /><div><strong>{card.value}</strong><span>{card.label}</span></div></Card>)}</div>
    {rows.length ? <section className="teacher-hours__sessions" aria-label="Class sessions"><div className="teacher-hours__table-scroll"><table><colgroup>{[128, 80, 111, 147, 150, 150, 122, 109].map((width, index) => <col key={index} style={{ width }} />)}<col /></colgroup><thead><tr><th aria-sort={ascending ? 'ascending' : 'descending'}><button type="button" onClick={() => { setAscending(value => !value); setPage(1); }}>Date<DesignIcon name="sort" /></button></th><th>Duration</th><th>Time in class</th><th>Class / Group</th><th>Scheduled teacher</th><th>Actual teacher</th><th>Class status</th><th>Attendance</th><th>Observations</th></tr></thead><tbody>{visibleRows.map(session => <tr key={session.id} tabIndex={0} onClick={() => setSelected(session)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelected(session); } }} className={session.flags.length ? 'is-flagged' : ''} aria-label={`${dateLabel(session.scheduledDate)}, ${session.classOrGroup.name}${session.flags.length ? `, flagged: ${session.flags.join(', ')}` : ''}`}><td><span>{dateLabel(session.scheduledDate)}</span><small>{formatTime(session.scheduled.startMinutes)}–{formatTime(session.scheduled.endMinutes)}</small></td><td>{formatMinutes(session.scheduled.durationMinutes)}</td><td><TimeCell session={session} /></td><td>{session.classOrGroup.name}</td><td>{session.scheduled.teacher.name}</td><td><span>{session.actual.teacher?.name ?? '—'}</span>{session.classType === 'substitution' ? <small className="teacher-hours__substitution">Substitution</small> : null}</td><td><StatusBadge value={session.actual.sessionStatus} /></td><td><AttendanceBadge value={session.actual.attendance} /></td><td><span className="teacher-hours__notes" title={session.observations ?? undefined}>{session.observations ?? '—'}</span></td></tr>)}</tbody></table></div><footer><span>Showing {visibleRows.length} of {rows.length}</span><div><button type="button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}><DesignIcon name="previous" />Previous</button><span aria-current="page">{currentPage}</span><button type="button" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>Next<DesignIcon name="next" /></button></div></footer></section> : <div className="teacher-hours__empty" role="status"><div><span className="teacher-hours__empty-icon"><DesignIcon name="empty" /></span><h2>{emptyTitle}</h2><p>{emptyDescription}</p></div></div>}
    {selected ? <SessionDialog session={selected} onClose={() => setSelected(null)} /> : null}
    {exportState !== 'idle' ? <div className="teacher-hours__toast" role="status" aria-live="polite">{exportState === 'downloading' ? <span className="teacher-hours__spinner" /> : <Check size={16} />}<span><strong>{exportState === 'downloading' ? 'Simulating download…' : 'Download simulation complete'}</strong><small>{exportState === 'downloading' ? `${rows.length} classes selected.` : 'Demo export — no report file was generated.'}</small></span></div> : null}
  </section>;
}
