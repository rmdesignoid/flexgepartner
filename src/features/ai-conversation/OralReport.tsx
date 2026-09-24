"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BookOpenText, Check, ChevronDown, CircleCheck, ClipboardCheck, ExternalLink, Eye, FileText, Goal, LockKeyhole, MessageSquareText, Mic2, Minus, Pencil, Send, Sparkles, Star, Target, TrendingDown, TrendingUp, UserRound, X } from "lucide-react";
import { Button, Input, Textarea } from "../../design-system";
import type { Attempt, ConversationState, Practice } from "./types";
import { attemptScore, performanceComparisons, resolvedDimensions } from "./report-analytics";
import { SavedRecording } from "./AudioPlayer";
import "./oral-production-refinements.css";

type Dimension = NonNullable<Attempt["evaluation"]>["dimensions"][number];

export function OralReport({ practice, submission, state, onUpdate, onReturn }: { practice: Practice; submission: Attempt; state: ConversationState; onUpdate: (value: Attempt) => void; onReturn: () => void }) {
  const [editing, setEditing] = useState(false);
  const [comment, setComment] = useState(submission.teacherComment ?? "");
  const evaluation = submission.evaluation;
  const dimensions = resolvedDimensions(submission);
  const score = attemptScore(submission);
  const comparisons = performanceComparisons(state, submission.student, submission);
  const reviewed = submission.reviewStatus === "Completed";
  const date = new Date(submission.completedAt);
  const completedDate = Number.isNaN(date.getTime()) ? submission.completedAt : date.toLocaleDateString("en-GB");
  const studentPhoto = evaluation?.mode === "simulated" && submission.student === "Anna Johnson"
    ? "/student-avatars/anna-johnson-demo.png"
    : undefined;
  const studentInitials = submission.student.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  const highlights = [
    { title: "How you did", items: evaluation?.howYouDid, Icon: ClipboardCheck, tone: "effort" },
    { title: "What you did well", items: evaluation?.strengths, Icon: CircleCheck, tone: "strength" },
    { title: "Areas for improvement", items: evaluation?.growthAreas, Icon: Target, tone: "growth" },
  ];
  return <section className="ai-result-view op-report">
    <div className="ai-result-hero">
      <div className="op-report-identity">
        <div className="op-student-avatar" aria-hidden="true">{studentPhoto ? <img src={studentPhoto} alt="" /> : <span>{studentInitials}</span>}</div>
        <div className="op-report-identity__copy">
          <span className="ai-step-label">{practice.title}</span>
          <h2>{submission.student}</h2>
          <p className="op-report-identity__context"><span>Oral production</span><span>{practice.level}</span></p>
          <div className="op-report-identity__meta">
            <span>{completedDate} · Completed · {submission.duration}</span>
            <span className={`op-review-status${reviewed ? " is-complete" : ""}`}>{reviewed ? "Completed" : "Pending"}</span>
            <a className="op-profile-link" href={`/students/oral-production?student=${encodeURIComponent(submission.student)}`} target="_blank" rel="noopener noreferrer"><UserRound size={15} aria-hidden="true" />View student performance<ExternalLink size={13} aria-hidden="true" /></a>
          </div>
        </div>
      </div>
      <div className="op-report-score-panel"><div className="ai-result-score"><strong>{score ?? "—"}</strong><span>{score === null ? "Not scored" : "out of 100"}</span></div><div className="op-report-comparisons" aria-label="Performance comparisons">{comparisons.previousDelta !== null ? <PerformanceDelta label="vs. previous activity" delta={comparisons.previousDelta} /> : null}{comparisons.averageDelta !== null ? <PerformanceDelta label="vs. Oral Production average" delta={comparisons.averageDelta} /> : null}</div></div>
    </div>
    <section className="ai-report-section op-student-feedback">
      <header className="op-report-section-banner"><div className="op-report-section-banner__icon"><UserRound size={20} /></div><div><h3>Student – Instant feedback</h3><p>{practice.instantFeedback === false ? "Instant feedback is off for this activity. Teacher-only analysis remains private." : "This is the feedback the student can see in the Student App."}</p></div><span className="op-audience-indicator"><Eye size={14} />{practice.instantFeedback === false ? "Not shown to student" : "Visible to the student"}</span></header>
      <details className="op-report-disclosure"><summary><span className="op-report-disclosure__icon"><FileText size={17} /></span><span>Instructions</span><ChevronDown size={17} /></summary><div className="op-report-disclosure__content">{practice.imageDataUrl ? <img className="op-report-image" src={practice.imageDataUrl} alt={`Activity visual: ${practice.title}`} /> : null}<p className="op-instructions">{practice.activityInstructions || practice.goal}</p></div></details>
      <section className="op-report-nested-section"><h4><span className="op-report-section-icon"><Mic2 size={17} /></span>Student response</h4><SavedRecording key={submission.audioId ?? submission.id} audioId={submission.audioId} audioUrl={submission.audioUrl} duration={submission.duration.split(":").reduce((total, part) => total * 60 + (Number(part) || 0), 0)} /></section>
      <section className="op-report-nested-section op-report-summary"><h4><span className="op-report-section-icon op-report-section-icon--purple"><Sparkles size={17} /></span>Summary</h4><p>{evaluation?.summary ?? "The recording has been submitted for teacher review. Automatic speech analysis is not available for this response."}</p><div className="ai-report-highlights op-highlights">{highlights.map(({ title, items, Icon, tone }) => <section className={`op-highlight-card op-highlight-card--${tone}`} key={title}><h5><span className="op-highlight-card__icon"><Icon size={16} aria-hidden="true" /></span><span>{title}</span></h5>{Array.isArray(items) && items.length ? <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p>Analysis unavailable</p>}</section>)}</div></section>
      <details className="op-report-disclosure"><summary><span className="op-report-disclosure__icon op-report-section-icon--green"><Goal size={17} /></span><span>Next steps</span><ChevronDown size={17} /></summary><div className="op-report-disclosure__content"><p>{evaluation?.growthOpportunities ?? "Available when this response has been evaluated."}</p></div></details>
    </section>
    <section className="ai-report-section op-teacher-analysis">
      <header className="op-report-section-banner op-report-section-banner--private"><div className="op-report-section-banner__icon"><LockKeyhole size={20} /></div><div><h3>Teacher-only analysis</h3><p>This information is visible only to you and is not shared with the student.</p></div><span className="op-audience-indicator op-audience-indicator--private"><LockKeyhole size={13} />Teacher only</span></header>
      <section className="op-report-nested-section op-speaking-skills"><div className="op-section-heading"><h4><Star size={17} />Speaking skills</h4><Button variant="ghost" size="sm" disabled={!evaluation} onClick={() => setEditing(true)} aria-label="Edit speaking skills"><Pencil size={16} />Edit</Button></div>{dimensions.length ? <div className="op-speaking-skills__layout"><div className="op-speaking-skills__criteria">{dimensions.map((item) => <div className="op-skill" key={item.label}><div><strong>{item.label}</strong><span>{item.score}/100</span>{submission.teacherCorrections?.some((correction) => correction.label === item.label) ? <small>Edited</small> : null}</div><progress max={100} value={item.score} aria-label={`${item.label} score`} /><p>{item.evidence}</p></div>)}</div><div className="op-speaking-skills__chart"><RadarChart dimensions={dimensions} /></div></div> : <p>Skill scores are not available for this recording.</p>}</section>
      <div className="op-report-grid op-teacher-insights"><section className="op-report-nested-section"><h4><span className="op-report-section-icon op-report-section-icon--purple"><Goal size={17} /></span>Communicative goal</h4><p>{evaluation?.communicativeGoal ?? "Not evaluated yet."}</p></section><section className="op-report-nested-section"><h4><span className="op-report-section-icon"><BookOpenText size={17} /></span>Language observations</h4><p><strong>Repeated words:</strong> {evaluation ? evaluation.repeatedWords?.join(", ") || "—" : "Analysis unavailable"}</p><p><strong>False cognates:</strong> {evaluation ? evaluation.falseCognates?.join(", ") || "—" : "Analysis unavailable"}</p></section></div>
      <section className="op-report-nested-section op-send-comment"><h4><span className="op-report-section-icon op-report-section-icon--purple"><MessageSquareText size={17} /></span><span><label htmlFor="teacher-comment">Send a comment to the student</label></span></h4><p className="op-send-comment__helper">Only this comment will be shared with the student, in addition to feedback already available in the Student App.</p><Textarea id="teacher-comment" maxLength={500} value={comment} readOnly={reviewed} placeholder="Share feedback with the student…" onChange={(event) => setComment(event.target.value)} /><div className="op-send-comment__footer"><span>{comment.length}/500</span><div className="op-comment-actions">{reviewed ? <span role="status"><Check size={16} />Completed</span> : <Button disabled={!comment.trim()} onClick={() => onUpdate({ ...submission, teacherComment: comment.trim(), reviewStatus: "Completed" })}><Send size={15} />Send comment</Button>}</div></div></section>
    </section>
    <Button variant="ghost" onClick={onReturn}><ArrowLeft size={16} />Return</Button>
    {editing && evaluation ? <CorrectionDialog original={evaluation.dimensions} values={dimensions} onCancel={() => setEditing(false)} onSave={(values) => { const teacherCorrections = values.filter((value, index) => value.score !== evaluation.dimensions[index].score || value.evidence !== evaluation.dimensions[index].evidence); const overall = Math.round(values.reduce((total, value) => total + value.score, 0) / values.length); onUpdate({ ...submission, teacherCorrections, evaluation: { ...evaluation, overall } }); setEditing(false); }} /> : null}
  </section>;
}

function PerformanceDelta({ label, delta }: { label: string; delta: number }) {
  const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const tone = delta > 0 ? "up" : delta < 0 ? "down" : "steady";
  return <div className={`op-report-comparison op-report-comparison--${tone}`}><Icon size={16} aria-hidden="true" /><div><strong>{delta > 0 ? "+" : ""}{delta} pts</strong><span>{label}</span></div></div>;
}

function CorrectionDialog({ original, values, onCancel, onSave }: { original: Dimension[]; values: Dimension[]; onCancel: () => void; onSave: (values: Dimension[]) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(values.map((value) => ({ ...value, scoreText: String(value.score) })));
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
      previous?.focus();
    };
  }, []);
  const valid = draft.every((item) => item.scoreText.trim() !== "" && Number.isFinite(Number(item.scoreText)) && Number(item.scoreText) >= 0 && Number(item.scoreText) <= 100);
  return <dialog ref={ref} className="op-correction-dialog" onCancel={onCancel} aria-labelledby="correction-title">
    <div className="op-correction-dialog__header"><h2 id="correction-title">Edit speaking skills</h2><Button variant="ghost" onClick={onCancel} aria-label="Close correction"><X size={20} /></Button></div>
    <p className="op-correction-dialog__intro">AI correction · Review the suggested scores and comments.</p>
    <div className="op-correction-dialog__body">{draft.map((item, index) => { const changed = item.scoreText !== String(original[index].score) || item.evidence !== original[index].evidence; return <section className="op-correction" key={item.label}><h3>{item.label} {changed ? <small>Edited</small> : null}</h3><div className="op-original">{changed ? <del>AI suggested score: {original[index].score}/100 — {original[index].evidence}</del> : <span>AI suggested score: {original[index].score}/100 — {original[index].evidence}</span>}</div><label htmlFor={`score-${index}`}>Teacher’s score (0–100)</label><Input id={`score-${index}`} type="number" min="0" max="100" value={item.scoreText} onChange={(event) => setDraft(draft.map((value, i) => i === index ? { ...value, scoreText: event.target.value } : value))} /><label htmlFor={`evidence-${index}`}>Teacher’s comment</label><Textarea id={`evidence-${index}`} value={item.evidence ?? ""} onChange={(event) => setDraft(draft.map((value, i) => i === index ? { ...value, evidence: event.target.value } : value))} /></section>; })}<p className="op-correction-dialog__score-note">The overall score is recalculated as the rounded average of these speaking skills.</p></div>
    <div className="op-correction-dialog__footer"><div className="op-comment-actions"><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button disabled={!valid} onClick={() => onSave(draft.map(({ scoreText, ...item }) => ({ ...item, score: Number(scoreText) })))}>Save</Button></div></div>
  </dialog>;
}

function RadarChart({ dimensions }: { dimensions: Dimension[] }) {
  const point = (index: number, score: number) => { const angle = index * Math.PI * 2 / dimensions.length - Math.PI / 2; return { x: 180 + Math.cos(angle) * 82 * score / 100, y: 145 + Math.sin(angle) * 82 * score / 100 }; };
  const polygon = (score: number) => dimensions.map((_, index) => { const p = point(index, score); return `${p.x},${p.y}`; }).join(" ");
  return <svg className="ai-radar-chart" viewBox="0 0 360 290" role="img" aria-label={`Skills overview: ${dimensions.map((item) => `${item.label} ${item.score}`).join(", ")}`}>
    {[25, 50, 75, 100].map((score) => <polygon key={score} points={polygon(score)} fill="none" stroke="#dce8e4" />)}
    {dimensions.map((item, index) => { const p = point(index, 100); return <line key={item.label} x1={180} y1={145} x2={p.x} y2={p.y} stroke="#dce8e4" />; })}
    <polygon points={dimensions.map((item, index) => { const p = point(index, item.score); return `${p.x},${p.y}`; }).join(" ")} fill="#6ac49d33" stroke="#57af8c" strokeWidth="2" />
    {dimensions.map((item, index) => { const p = point(index, 135); return <text key={item.label} x={p.x} y={p.y} textAnchor="middle"><tspan x={p.x}>{item.label}</tspan><tspan x={p.x} dy={16}>{item.score}</tspan></text>; })}
  </svg>;
}
