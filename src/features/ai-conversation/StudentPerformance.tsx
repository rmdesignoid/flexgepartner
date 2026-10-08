"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Mic2 } from "lucide-react";
import { Button } from "../../design-system";
import { SavedRecording } from "./AudioPlayer";
import { SKILL_LABELS, type ConversationState } from "./types";
import { performanceScore, communicativeGoal, pedagogicalSummary, effectiveSkills, hasEvaluation, performanceDate, performanceSlice, recurringDifficulties, studentHistory, type PerformanceEntry } from "./performance";
import "./student-performance.css";

const COLORS = ["#7854c7", "#2682ba", "#229272", "#cb8130", "#c35783"];

export function StudentPerformance({ state, student, onReport, onReturn, active = true, embedded = false }: { embedded?: boolean; active?: boolean; state: ConversationState; student: string; onReport: (entry: PerformanceEntry) => void; onReturn: () => void }) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [comparisonId, setComparisonId] = useState("");
  const [mode, setMode] = useState<"overall" | "criteria">("overall");
  const [highlight, setHighlight] = useState<string | null>(null);
  const history = studentHistory(state, student);
  const invalid = !!start && !!end && start > end;
  const slice = invalid ? [] : performanceSlice(history, start, end);
  const evaluated = slice.filter(hasEvaluation);
  const first = slice.find((e) => e.attempt.id === comparisonId) ?? slice[0];
  const latest = slice[slice.length - 1];
  const patterns = recurringDifficulties(evaluated);
  function resetComparison() { setComparisonId(""); }
  return <section className="op-performance">
    {!embedded ? <><header className="op-profile"><span className="op-profile-avatar" aria-hidden="true">{student.split(" ").map((s) => s[0]).join("")}</span><div className="op-profile-info"><h2>{student}</h2><p>Speaking performance · Individual activity history</p></div><span className="op-report-count"><Mic2 size={15} aria-hidden="true" />{history.length} oral reports</span></header>
    <div className="op-performance-tab"><Mic2 size={17} /> Oral Production</div></> : null}
    <div className="op-period"><strong>Period</strong><label>From<input type="date" value={start} max={end || undefined} onChange={(e) => { setStart(e.target.value); resetComparison(); }} /></label><label>To<input type="date" value={end} min={start || undefined} onChange={(e) => { setEnd(e.target.value); resetComparison(); }} /></label>{start || end ? <Button variant="ghost" size="sm" onClick={() => { setStart(""); setEnd(""); resetComparison(); }}>Clear period</Button> : null}<span>{start || end ? "All practices in the selected period" : "Latest 10 completed practices"}</span></div>
    {invalid ? <p role="alert">The end date must be on or after the start date.</p> : <section className="op-evolution"><div className="op-evolution-heading"><h2>Skills overview - Speaking</h2><span>{slice.length} practices · {evaluated.length} with feedback</span></div>
      {!slice.length ? <p role="status" className="op-performance-empty">No oral production practices found in this period.</p> : <div className="op-evolution-grid"><div className="op-evolution-main"><div className="op-chart-heading"><h3>Scores over time</h3><div className="op-chart-toggle" role="group" aria-label="Chart view"><button type="button" aria-pressed={mode === "overall"} onClick={() => setMode("overall")}>Overall</button><button type="button" aria-pressed={mode === "criteria"} onClick={() => setMode("criteria")}>By criterion</button></div></div>
        {evaluated.length ? <><EvolutionChart entries={evaluated} mode={mode} highlight={highlight} />{mode === "criteria" ? <div className="op-chart-legend" role="group" aria-label="Highlight speaking skill">{SKILL_LABELS.map((label, i) => <button type="button" key={label} aria-pressed={highlight === label} onClick={() => setHighlight(highlight === label ? null : label)} style={{ opacity: highlight && highlight !== label ? .45 : 1 }}><i style={{ background: COLORS[i] }} />{label}</button>)}</div> : null}<details className="op-chart-data"><summary>View score table</summary><div className="op-table-scroll"><table><thead><tr><th>Activity</th><th>Completed</th><th>Overall</th>{SKILL_LABELS.map((s) => <th key={s}>{s}</th>)}</tr></thead><tbody>{evaluated.map(({ attempt, practice }) => <tr key={attempt.id}><th>{practice.title}</th><td>{performanceDate(attempt.completedAt)}</td><td>{performanceScore(attempt)}</td>{SKILL_LABELS.map((s) => <td key={s}>{effectiveSkills(attempt).find((v) => v.label === s)?.score ?? "—"}</td>)}</tr>)}</tbody></table></div></details></> : <p className="op-performance-empty" role="status">Feedback is pending. These recordings are available below; pending feedback is not a score of zero.</p>}
        <section className="op-audio-comparison"><h3>Speech comparison</h3><p>Compare practices with similar goals and levels. A more complex task may have a lower score even when communication has developed.</p>{active && first && latest ? <div className="op-comparison-grid"><AudioComparison key={`first-${first.attempt.id}`} entry={first} label="Selected practice" selector={<label className="op-comparison-select">Activity and completion date<select value={first.attempt.id} onChange={(e) => setComparisonId(e.target.value)}>{slice.map((entry) => <option key={entry.attempt.id} value={entry.attempt.id}>{entry.practice.title} · {performanceDate(entry.attempt.completedAt)}</option>)}</select></label>} /><AudioComparison key={`latest-${latest.attempt.id}`} entry={latest} label="Most recent practice" /></div> : null}{slice.length === 1 ? <small>Only one practice is available; both players refer to the same recording.</small> : null}</section>
      </div><aside className="op-pedagogy" aria-label="Pedagogical analysis">
        <h3>Summary</h3>
        {evaluated.some((e) => e.attempt.evaluation?.mode === "simulated") ? <span className="ai-report-simulated">Includes illustrative feedback · not a real assessment</span> : null}
        <p role="status">{pedagogicalSummary(evaluated)}</p>
        <h3>Recurring difficulties</h3>
        {evaluated.length < 2 ? <p>At least two practices with feedback are needed to examine recurring difficulties.</p> : patterns.length ? <ul>{patterns.map((pattern) => <li key={pattern.key}>{pattern.text}<small>Observed in: {pattern.entries.map((entry) => `${entry.practice.title} (${performanceDate(entry.attempt.completedAt)})`).join("; ")}</small></li>)}</ul> : <p>No recurring communicative difficulties were identified in the practices analyzed.</p>}
        <h3>Growth opportunities</h3>
        {patterns.length ? <ul>{patterns.map((pattern) => <li key={pattern.key}><p>{pattern.recommendation}</p><small>Adapt to: {[...new Set(pattern.entries.map((entry) => entry.practice.level))].join(", ")} · {pattern.entries.map((entry) => entry.practice.title).join("; ")}</small></li>)}</ul> : <p>There is insufficient evidence of recurring difficulties to recommend a targeted next task.</p>}
      </aside></div>}
    </section>}
    {!embedded ? <><section className="op-history"><div className="op-evolution-heading"><h2>All oral reports</h2><span>{history.length} reports · Complete history</span></div>{history.length ? [...history].reverse().map((entry) => <article key={entry.attempt.id}><div><strong>{entry.practice.title}</strong><span>{performanceDate(entry.attempt.completedAt)} · {entry.practice.level} · {entry.attempt.duration}</span></div><span>{hasEvaluation(entry) ? `${performanceScore(entry.attempt)}/100` : "Feedback pending"}</span><Button variant="ghost" size="sm" onClick={() => onReport(entry)}>View report <ArrowRight size={15} /></Button></article>) : <p>No completed oral productions yet.</p>}</section>
    <Button variant="ghost" onClick={onReturn}><ArrowLeft size={16} />Return to practice</Button></> : null}
  </section>;
}

function AudioComparison({ entry, label, selector }: { entry: PerformanceEntry; label: string; selector?: React.ReactNode }) {
  const { practice, attempt } = entry;
  return <article className="op-comparison-card"><span className="ai-step-label">{label}</span>{selector}<h4>{practice.title}</h4><small>{performanceDate(attempt.completedAt)} · Level {practice.level}</small><p><strong>Communicative goal</strong><br />{communicativeGoal(practice)}</p><SavedRecording audioId={attempt.audioId} audioUrl={attempt.audioUrl} duration={attempt.duration.split(":").reduce((sum, p) => sum * 60 + (Number(p) || 0), 0)} />{attempt.syntheticAudio ? <small>Example · synthetic audio</small> : null}</article>;
}

function EvolutionChart({ entries, mode, highlight }: { entries: PerformanceEntry[]; mode: "overall" | "criteria"; highlight: string | null }) {
  const [hover, setHover] = useState<string | null>(null);
  const width = Math.max(560, entries.length * 48);
  const left = 42, right = width - 26, top = 24, bottom = 240;
  // Each chronological activity gets its own position, including equal completion dates.
  const x = (i: number) => entries.length === 1 ? (left + right) / 2 : left + (right - left) * i / (entries.length - 1);
  const y = (score: number) => bottom - (bottom - top) * score / 100;
  const series = mode === "overall" ? ["Overall"] : SKILL_LABELS;
  const score = (entry: PerformanceEntry, label: string) => label === "Overall" ? performanceScore(entry.attempt) : effectiveSkills(entry.attempt).find((s) => s.label === label)?.score;
  const hovered = entries.find((e) => e.attempt.id === hover);
  return <div className="op-chart-wrap"><div className="op-chart-scroll"><svg width={width} viewBox={`0 0 ${width} 292`} role="group" aria-label="Individual speaking scores from zero to one hundred">
    {[0, 25, 50, 75, 100].map((s) => <g key={s}><line x1={left} x2={right} y1={y(s)} y2={y(s)} className="op-chart-grid" /><text x={left - 10} y={y(s) + 4} textAnchor="end">{s}</text></g>)}
    {series.map((label, index) => { const color = COLORS[index]; return <g key={label} opacity={mode === "criteria" && highlight && highlight !== label ? .18 : 1}>{entries.map((entry, i) => { const value = score(entry, label); const previous = i ? score(entries[i - 1], label) : undefined; return typeof value === "number" && Number.isFinite(value) ? <g key={entry.attempt.id}>{i > 0 && typeof previous === "number" && Number.isFinite(previous) ? <line x1={x(i - 1)} y1={y(previous)} x2={x(i)} y2={y(value)} stroke={color} strokeWidth={2} /> : null}<circle cx={x(i)} cy={y(value)} r={5} fill={color} stroke="var(--ds-surface)" strokeWidth={2} tabIndex={0} role="button" aria-label={`${entry.practice.title}, ${performanceDate(entry.attempt.completedAt)}, ${label}: ${value}. ${entry.attempt.evaluation?.summary || "Summary unavailable"}`} onMouseEnter={() => setHover(entry.attempt.id)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(entry.attempt.id)} onBlur={() => setHover(null)} onClick={() => setHover(entry.attempt.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setHover(entry.attempt.id); } if (e.key === "Escape") setHover(null); }}><title>{entry.practice.title}: {value}/100</title></circle></g> : null; })}</g>; })}
    {entries.map((entry, i) => (i === 0 || i === entries.length - 1 || (entries.length <= 8 && entries[i].time !== entries[i - 1]?.time)) ? <text key={entry.attempt.id} x={x(i)} y={268} textAnchor="middle">{new Date(entry.attempt.completedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</text> : null)}
  </svg></div>{hovered ? <div className="op-chart-tooltip" role="status"><strong>{hovered.practice.title}</strong><small>{performanceDate(hovered.attempt.completedAt)}</small><p>{hovered.attempt.evaluation?.summary || "Summary unavailable"}</p></div> : null}</div>;
}
