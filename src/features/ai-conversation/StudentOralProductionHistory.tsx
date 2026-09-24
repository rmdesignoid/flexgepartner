"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CalendarDays, Clock3, ExternalLink, Mic2, UserRound } from "lucide-react";
import { OralReport } from "./OralReport";
import { INITIAL_STATE, readState, saveState, STORAGE_KEY, type Attempt, type ConversationState } from "./types";
import { attemptScore, oralProductionHistory, type OralHistoryItem } from "./report-analytics";
import "./oral-production-revision.css";
import "./student-oral-history.css";
import "./oral-production-refinements.css";

export function StudentOralProductionHistory() {
  const [student, setStudent] = useState("");
  const [email, setEmail] = useState("");
  const [fromStudents, setFromStudents] = useState(false);
  const [state, setState] = useState<ConversationState>(INITIAL_STATE);
  const [loaded, setLoaded] = useState(false);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // This effect hydrates query parameters and persisted prototype data after the SSR pass.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStudent(params.get("student")?.trim() ?? "");
    setEmail(params.get("email")?.trim() ?? "");
    setFromStudents(params.get("from") === "students");
    setSelectedAttemptId(params.get("attemptId"));
    setState(readState());
    setLoaded(true);
    const sync = (event: StorageEvent) => {
      if (!event.key || event.key === STORAGE_KEY) setState(readState());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const history = useMemo(() => oralProductionHistory(state, student).reverse(), [state, student]);

  const selected = history.find(({ attempt }) => attempt.id === selectedAttemptId);
  const studentPhoto = student === "Anna Johnson" ? "/student-avatars/anna-johnson-demo.png" : undefined;

  function updateAttempt(updated: Attempt) {
    const next = { ...state, attempts: state.attempts.map((attempt) => attempt.id === updated.id ? updated : attempt) };
    setState(next);
    saveState(next);
  }

  return <main className="student-history-page">
    <header className="student-history-topbar">
      <Link className="student-history-brand" href="/" aria-label="Flexge dashboard">flexge<span aria-hidden="true">◆</span></Link>
      <Link className="student-history-back" href="/" aria-label={fromStudents ? "Back to students" : "Back to dashboard"} onClick={(event) => { if (fromStudents) { event.preventDefault(); window.history.back(); } }}><ArrowLeft size={17} /><span>{fromStudents ? "Students" : "Dashboard"}</span></Link>
    </header>

    <section className="student-history-profile" aria-labelledby="student-history-name">
      <div className="student-history-avatar" aria-hidden="true">{studentPhoto ? <Image src={studentPhoto} alt="" width={66} height={66} /> : student ? student.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase() : <UserRound size={25} />}</div>
      <div className="student-history-profile__text">
        <span className="student-history-eyebrow">Student profile</span>
        <h1 id="student-history-name">{student || (loaded ? "Student not specified" : "Loading student…")}</h1>
        {email ? <p>{email}</p> : null}
      </div>
      <div className="student-history-profile__count"><strong>{history.length}</strong><span>{history.length === 1 ? "oral report" : "oral reports"}</span></div>
    </section>

    <nav className="student-history-tabs" aria-label="Student profile sections">
      <span className="student-history-tab" role="tab" aria-selected="true"><Mic2 size={16} />Oral Production</span>
    </nav>

    <section className="student-history-content" role="tabpanel" aria-label="Oral Production history">
      {selected ? <OralReport practice={selected.practice} submission={selected.attempt} state={state} onUpdate={updateAttempt} onReturn={() => setSelectedAttemptId(null)} /> : <>
        <div className="student-history-section-heading"><div><span className="student-history-eyebrow">Learning history</span><h2>Oral Production</h2></div><p>Completed speaking activities and feedback</p></div>
        {history.length ? <PerformanceTimeline history={history} /> : null}
        {!loaded ? <div className="student-history-empty"><span className="student-history-spinner" aria-hidden="true" /><p>Loading student history…</p></div> : history.length ? <div className="student-history-list">{history.map(({ attempt, practice }) => {
          const date = new Date(attempt.completedAt);
          const formattedDate = Number.isNaN(date.getTime()) ? attempt.completedAt : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
          const score = attemptScore(attempt);
          return <article className="student-history-report" key={attempt.id}>
            <div className="student-history-report__icon"><Mic2 size={19} /></div>
            <div className="student-history-report__main"><span className="student-history-eyebrow">{practice.level} · Oral production</span><h3>{practice.title}</h3><div className="student-history-report__meta"><span><CalendarDays size={14} />{formattedDate}</span><span><Clock3 size={14} />{attempt.duration}</span><span className={`student-history-status${attempt.reviewStatus === "Completed" ? " is-reviewed" : ""}`}>{attempt.reviewStatus === "Completed" ? "Completed" : "Pending"}</span></div></div>
            <div className="student-history-report__result">{score !== null ? <><strong>{score}</strong><span>out of 100</span></> : <span>Not scored</span>}</div>
            <a className="student-history-open" href={`/students/oral-production?student=${encodeURIComponent(student)}&email=${encodeURIComponent(email)}&attemptId=${encodeURIComponent(attempt.id)}`} target="_blank" rel="noopener noreferrer">View report<ExternalLink size={14} /></a>
          </article>;
        })}</div> : <div className="student-history-empty"><div className="student-history-empty__icon"><Mic2 size={22} /></div><h3>No Oral Production history yet</h3><p>Completed speaking activities and their reports will appear here for this student.</p><Link href="/" className="student-history-empty__link">Return to AI Studio<ExternalLink size={14} /></Link></div>}
      </>}
    </section>
    <footer className="student-history-footer">Flexge · Student learning history</footer>
  </main>;
}

function PerformanceTimeline({ history }: { history: OralHistoryItem[] }) {
  const scored = [...history].reverse().map((item) => ({ ...item, score: attemptScore(item.attempt) })).filter((item): item is OralHistoryItem & { score: number } => item.score !== null);
  const chart = { left: 52, right: 738, top: 18, bottom: 188 };
  const dates = scored.map((item) => Date.parse(item.attempt.completedAt)).filter(Number.isFinite);
  const minDate = dates.length ? Math.min(...dates) : 0;
  const maxDate = dates.length ? Math.max(...dates) : 0;
  const points = scored.map((item, index) => {
    const timestamp = Date.parse(item.attempt.completedAt);
    const x = scored.length < 2 ? (chart.left + chart.right) / 2 : maxDate > minDate && Number.isFinite(timestamp)
      ? chart.left + ((timestamp - minDate) / (maxDate - minDate)) * (chart.right - chart.left)
      : chart.left + (index / (scored.length - 1)) * (chart.right - chart.left);
    return { ...item, x, y: chart.bottom - (item.score / 100) * (chart.bottom - chart.top) };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  return <section className="student-history-timeline" aria-labelledby="student-history-timeline-title">
    <header className="student-history-timeline__header"><div><span className="student-history-eyebrow">Progress</span><h3 id="student-history-timeline-title">Performance over time</h3></div><span>{scored.length} scored {scored.length === 1 ? "activity" : "activities"}</span></header>
    {!scored.length ? <div className="student-history-timeline__empty">No scored activities to plot yet. Scores will appear here as reports are evaluated.</div> : <>
      <div className="student-history-chart-wrap"><svg className="student-history-chart" viewBox="0 0 760 228" role="img" aria-label={`Oral Production scores over time: ${points.map((point) => `${point.practice.title}, ${point.score} points`).join("; ")}`}>
        {[0, 25, 50, 75, 100].map((value) => { const y = chart.bottom - (value / 100) * (chart.bottom - chart.top); return <g key={value}><line x1={chart.left} y1={y} x2={chart.right} y2={y} className="student-history-chart__grid" /><text x={chart.left - 12} y={y + 4} textAnchor="end" className="student-history-chart__axis-label">{value}</text></g>; })}
        <line x1={chart.left} y1={chart.bottom} x2={chart.right} y2={chart.bottom} className="student-history-chart__axis" />
        {points.length > 1 ? <polyline points={line} className="student-history-chart__line" /> : null}
        {points.map((point, index) => {
          const date = new Date(point.attempt.completedAt);
          const dateLabel = Number.isNaN(date.getTime()) ? point.attempt.completedAt : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
          const delta = index ? point.score - points[index - 1].score : null;
          return <g key={point.attempt.id}><circle cx={point.x} cy={point.y} r="5" className="student-history-chart__point" tabIndex={0} role="img" aria-label={`${point.practice.title}: ${point.score} out of 100 on ${dateLabel}${delta === null ? "" : `, ${delta > 0 ? "+" : ""}${delta} points from previous scored activity`}`}><title>{point.practice.title} · {dateLabel} · {point.score}/100{delta === null ? "" : ` · ${delta > 0 ? "+" : ""}${delta} pts`}</title></circle><text x={point.x} y={point.y - 11} textAnchor="middle" className="student-history-chart__score">{point.score}</text><text x={point.x} y={chart.bottom + 23} textAnchor="middle" className="student-history-chart__date">{dateLabel}</text></g>;
        })}
      </svg></div>
      {scored.length === 1 ? <p className="student-history-timeline__note">Only one scored activity so far; complete another activity to see a progress trend.</p> : <div className="student-history-timeline__deltas" aria-label="Score changes between scored activities">{points.slice(1).map((point, index) => { const delta = point.score - points[index].score; return <span key={point.attempt.id} className={delta > 0 ? "is-up" : delta < 0 ? "is-down" : "is-steady"}>{delta > 0 ? "↑" : delta < 0 ? "↓" : "→"} {delta > 0 ? "+" : ""}{delta} pts · {point.practice.title}</span>; })}</div>}
    </>}
  </section>;
}
