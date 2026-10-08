"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CalendarDays, ChevronRight, Clock3, ExternalLink, Mic2, UserRound } from "lucide-react";
import { OralReport } from "./OralReport";
import { StudentPerformance } from "./StudentPerformance";
import { INITIAL_STATE, readState, saveState, STORAGE_KEY, type Attempt, type ConversationState } from "./types";
import { attemptScore, oralProductionHistory } from "./report-analytics";
import "./oral-production-revision.css";
import "./student-oral-history.css";
import "./oral-production-refinements.css";

export function StudentOralProductionHistory({ embedded = false, studentName = "", studentEmail = "", onReturn }: { embedded?: boolean; studentName?: string; studentEmail?: string; onReturn?: () => void }) {
  const [student, setStudent] = useState(studentName);
  const [email, setEmail] = useState(studentEmail);
  const [fromStudents, setFromStudents] = useState(false);
  const [state, setState] = useState<ConversationState>(INITIAL_STATE);
  const [loaded, setLoaded] = useState(false);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // This effect hydrates query parameters and persisted prototype data after the SSR pass.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStudent(studentName || params.get("student")?.trim() || "");
    setEmail(studentEmail || params.get("email")?.trim() || "");
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
  const PageContainer = embedded ? "div" : "main";

  function updateAttempt(updated: Attempt) {
    const next = { ...state, attempts: state.attempts.map((attempt) => attempt.id === updated.id ? updated : attempt) };
    setState(next);
    saveState(next);
  }

  return <PageContainer className={`student-history-page${embedded ? " student-history-page--embedded" : ""}`}>
    {embedded ? <header className="student-history-context"><nav aria-label="Breadcrumb">{onReturn ? <button type="button" onClick={onReturn}>Students</button> : <Link href="/?module=students">Students</Link>}<ChevronRight size={14} aria-hidden="true" /><span>{student || "Student profile"}</span><ChevronRight size={14} aria-hidden="true" /><strong>Oral Production</strong></nav><span className="student-history-context__caption">Student profile and learning history</span></header> : <header className="student-history-topbar">
      <Link className="student-history-brand" href="/" aria-label="Flexge dashboard">flexge<span aria-hidden="true">◆</span></Link>
      {fromStudents && student ? <Link className="student-history-back" href="/?module=students"><ArrowLeft size={17} /><span>Students</span></Link> : <Link className="student-history-back" href="/"><ArrowLeft size={17} /><span>Dashboard</span></Link>}
    </header>}

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
        {loaded && student ? <StudentPerformance embedded state={state} student={student} onReport={(entry) => setSelectedAttemptId(entry.attempt.id)} onReturn={() => undefined} /> : null}
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
  </PageContainer>;
}

