"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, CircleCheck, ClipboardCheck, Pencil, Send, Star, Target, X } from "lucide-react";
import { Button, Input, Textarea } from "../../design-system";
import type { Attempt, Practice } from "./types";
import { SavedRecording } from "./AudioPlayer";

type Dimension = NonNullable<Attempt["evaluation"]>["dimensions"][number];

export function OralReport({ practice, submission, onUpdate, onReturn }: { practice: Practice; submission: Attempt; onUpdate: (value: Attempt) => void; onReturn: () => void }) {
  const [editing, setEditing] = useState(false);
  const [comment, setComment] = useState(submission.teacherComment ?? "");
  const evaluation = submission.evaluation;
  const dimensions = evaluation?.dimensions.map((item) => submission.teacherCorrections?.find((correction) => correction.label === item.label) ?? item) ?? [];
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
        <div className="op-student-avatar" aria-hidden="true">
          {studentPhoto ? <img src={studentPhoto} alt="" /> : <span>{studentInitials}</span>}
        </div>
        <div className="op-report-identity__copy">
          <span className="ai-step-label">{practice.title}</span>
          <h2>{submission.student}</h2>
          <p className="op-report-identity__context"><span>Oral production</span><span>{practice.level}</span></p>
          <div className="op-report-identity__meta">
            <span>{completedDate} · Completed · {submission.duration}</span>
            <span className={`op-review-status${reviewed ? " is-complete" : ""}`}>{reviewed ? "Reviewed" : "Pending review"}</span>
          </div>
        </div>
      </div>
      <div className="ai-result-score"><strong>{evaluation?.overall ?? "—"}</strong><span>{evaluation ? "out of 100" : "not scored"}</span></div>
    </div>
    <section className="ai-report-section"><h3>Instructions</h3>{practice.imageDataUrl ? <img className="op-report-image" src={practice.imageDataUrl} alt={`Activity visual: ${practice.title}`} /> : null}<p className="op-instructions">{practice.activityInstructions || practice.goal}</p></section>
    <section className="ai-report-section"><h3>Summary</h3><p>{evaluation?.summary ?? "The recording has been submitted for teacher review. Automatic speech analysis is not available for this response."}</p><div className="ai-report-highlights op-highlights">{highlights.map(({ title, items, Icon, tone }) => <section className={`op-highlight-card op-highlight-card--${tone}`} key={title}><h4><span className="op-highlight-card__icon"><Icon size={16} aria-hidden="true" /></span><span>{title}</span></h4>{Array.isArray(items) && items.length ? <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p>Analysis unavailable</p>}</section>)}</div></section>
    <section className="ai-report-section"><h3>Growth opportunities</h3><p>{evaluation?.growthOpportunities ?? "Available when this response has been evaluated."}</p></section>
    <div className="op-report-grid"><section className="ai-report-section"><div className="op-section-heading"><h3><Star size={17} /> Speaking skills</h3><Button variant="ghost" size="sm" disabled={!evaluation} onClick={() => setEditing(true)} aria-label="Edit speaking skills"><Pencil size={16} /></Button></div>{dimensions.length ? dimensions.map((item) => <div className="op-skill" key={item.label}><div><strong>{item.label}</strong><span>{item.score}/100</span>{submission.teacherCorrections?.some((correction) => correction.label === item.label) ? <small>Edited</small> : null}</div><progress max={100} value={item.score} aria-label={`${item.label} score`} /><p>{item.evidence}</p></div>) : <p>Skill scores are not available for this recording.</p>}</section>
    <section className="ai-report-section"><h3>Skills overview</h3>{dimensions.length ? <><button type="button" className="op-radar-button" onClick={() => setEditing(true)} aria-label="View assessment details"><RadarChart dimensions={dimensions} /></button><Button variant="ghost" onClick={() => setEditing(true)}>View details</Button></> : <p>The chart will appear when skill scores are available.</p>}</section></div>
    <section className="ai-report-section"><h3>Was the communicative goal achieved?</h3><p>{evaluation?.communicativeGoal ?? "Not evaluated yet."}</p></section>
    <div className="op-report-grid op-response-grid"><section className="ai-report-section"><h3>Student response</h3><SavedRecording key={submission.audioId ?? submission.id} audioId={submission.audioId} audioUrl={submission.audioUrl} duration={submission.duration.split(":").reduce((total, part) => total * 60 + (Number(part) || 0), 0)} /></section><section className="ai-report-section"><h3>Repeated words / false cognates</h3><p><strong>Repeated words:</strong> {evaluation ? evaluation.repeatedWords?.join(", ") || "—" : "Analysis unavailable"}</p><p><strong>False cognates:</strong> {evaluation ? evaluation.falseCognates?.join(", ") || "—" : "Analysis unavailable"}</p></section></div>
    <section className="ai-report-section"><h3><label htmlFor="teacher-comment">Add comments</label></h3><Textarea id="teacher-comment" value={comment} readOnly={reviewed} placeholder="Share feedback with the student…" onChange={(event) => setComment(event.target.value)} /><div className="op-comment-actions">{reviewed ? <span role="status"><Check size={16} /> Sent</span> : <Button disabled={!comment.trim()} onClick={() => onUpdate({ ...submission, teacherComment: comment.trim(), reviewStatus: "Completed" })}><Send size={15} />Send</Button>}</div></section>
    <Button variant="ghost" onClick={onReturn}><ArrowLeft size={16} />Return</Button>
    {editing && evaluation ? <CorrectionDialog original={evaluation.dimensions} values={dimensions} onCancel={() => setEditing(false)} onSave={(values) => { onUpdate({ ...submission, teacherCorrections: values.filter((value, index) => value.score !== evaluation.dimensions[index].score || value.evidence !== evaluation.dimensions[index].evidence) }); setEditing(false); }} /> : null}
  </section>;
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
    <div className="op-correction-dialog__body">{draft.map((item, index) => { const changed = item.scoreText !== String(original[index].score) || item.evidence !== original[index].evidence; return <section className="op-correction" key={item.label}><h3>{item.label} {changed ? <small>Edited</small> : null}</h3><div className="op-original">{changed ? <del>AI suggested score: {original[index].score}/100 — {original[index].evidence}</del> : <span>AI suggested score: {original[index].score}/100 — {original[index].evidence}</span>}</div><label htmlFor={`score-${index}`}>Teacher’s score (0–100)</label><Input id={`score-${index}`} type="number" min="0" max="100" value={item.scoreText} onChange={(event) => setDraft(draft.map((value, i) => i === index ? { ...value, scoreText: event.target.value } : value))} /><label htmlFor={`evidence-${index}`}>Teacher’s comment</label><Textarea id={`evidence-${index}`} value={item.evidence ?? ""} onChange={(event) => setDraft(draft.map((value, i) => i === index ? { ...value, evidence: event.target.value } : value))} /></section>; })}<p className="op-original">The overall score is preserved independently of these criteria.</p></div>
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
