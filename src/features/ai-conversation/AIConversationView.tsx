"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, ArrowUpRight, BookOpen, ChevronDown, ChevronRight, ClipboardList, Mic2, Pencil, Plus, Search, Trash2, Users, X, Activity, CircleCheck, Clock3, UserRoundCheck, Smartphone, ImagePlus, XCircle } from "lucide-react";
import { Badge, Button, EmptyState, FormField, Input, Select, Textarea } from "../../design-system";
import { GROUPS, INITIAL_STATE, responseTime, readState, saveState, STORAGE_KEY, type Attempt, type ConversationState, type Practice } from "./types";
import "./ai-conversation.css";
import "./teacher-tools.css";
import "./components.css";
import "./oral-production-revision.css";
import { ConversationBreadcrumb } from "./ConversationBreadcrumb";
import { OralReport } from "./OralReport";

type Stage = "list" | "type" | "review" | "assign" | "details" | "result";
const shortDate = (value?: string) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "No due date";
const STUDENT_NAMES = ["Anna Johnson", "Lucas Martins", "Emily Chen", "Daniel Costa", "Sofia Almeida", "Noah Williams", "Beatriz Santos", "Oliver Brown", "Isabella Chen", "Mateus Oliveira", "Mia Garcia", "Ethan Davis", "Camila Rodrigues", "Liam Wilson", "Alice Pereira", "Benjamin Taylor", "Laura Fernandes", "James Anderson", "Valentina Silva", "Henry Thomas", "Mariana Souza", "Alexander Moore", "Chloe Martin", "Gabriel Lima", "Sophie White", "David Thompson", "Helena Ribeiro", "Michael Lee", "Julia Carvalho", "Sebastian Clark", "Clara Mendes", "Samuel Walker"];
const STUDENT_DIRECTORY = STUDENT_NAMES.map((name, index) => ({
  name,
  group: GROUPS[index % GROUPS.length],
  level: ["A1", "A2", "B1", "B2"][index % 4],
  courseProgress: [18, 32, 46, 57, 64, 72, 81, 93][index % 8],
}));
const completedStudents = (practice: Practice, attempts: Attempt[]) => new Set(attempts.filter((attempt) => attempt.completed !== false && attempt.practiceId === practice.id && practice.students.includes(attempt.student)).map((attempt) => attempt.student));
const isOverdue = (practice: Practice, student: string, attempts: Attempt[], today: string) => !!practice.dueDate && practice.dueDate < today && !attempts.some((attempt) => attempt.completed !== false && attempt.practiceId === practice.id && attempt.student === student);
const practiceStatus = (practice: Practice) => practice.status;

export function AIConversationView() {
  const [state, setState] = useState<ConversationState>(INITIAL_STATE);
  const [stage, setStage] = useState<Stage>("list");
  const [practiceId, setPracticeId] = useState("practice-restaurant");
  const [studentName, setStudentName] = useState("Anna Johnson");
  const [search, setSearch] = useState("");
  const [levelFilters, setLevelFilters] = useState<string[]>([]);
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [practice, setPractice] = useState<Practice | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentGroupFilter, setStudentGroupFilter] = useState("");
  const [notice, setNotice] = useState("");
  const [highlightedPracticeId, setHighlightedPracticeId] = useState<string | null>(null);
  const highlightedPracticeRef = useRef<HTMLButtonElement | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [themeInput, setThemeInput] = useState("");
  const [confirmation, setConfirmation] = useState<{ title: string; message: string; action: () => void } | null>(null);
  const [deleted, setDeleted] = useState<{ practice: Practice; attempts: Attempt[] } | null>(null);
  const editingExisting = !!practice && state.practices.some((item) => item.id === practice.id);
  const validPractice = !!practice && [practice.title, practice.activityInstructions ?? practice.goal].every((value) => value.trim()) && (practice.minResponseTime ?? 1) >= 1 && (practice.maxResponseTime ?? 2) >= (practice.minResponseTime ?? 1) && (practice.maxResponseTime ?? 2) <= 5;
  const hasContent = !!practice && !!(practice.title.trim() || (practice.activityInstructions ?? practice.goal).trim() || practice.imageDataUrl || practice.tags?.length || themeInput.trim() || practice.level !== "A2" || (practice.minResponseTime ?? 1) !== 1 || (practice.maxResponseTime ?? 2) !== 2 || practice.instantFeedback === false);
  const selectedPractice = state.practices.find((item) => item.id === practiceId) ?? state.practices[0];
  const selectedAttempts = state.attempts.filter((item) => item.practiceId === practiceId && item.student === studentName && item.completed !== false);
  const selectedAttempt = selectedAttempts[0];
  const today = new Date().toLocaleDateString("en-CA");
  const assignedPractices = state.practices.filter((item) => item.students.length > 0);
  const assignmentCount = assignedPractices.reduce((total, item) => total + item.students.length, 0);
  const completedAssignmentCount = assignedPractices.reduce((total, item) => total + completedStudents(item, state.attempts).size, 0);
  const assignedStudentNames = new Set(assignedPractices.flatMap((item) => item.students));
  const practicedStudentNames = new Set(state.attempts.filter((attempt) => attempt.completed !== false && assignedStudentNames.has(attempt.student) && assignedPractices.some((item) => item.id === attempt.practiceId && item.students.includes(attempt.student))).map((attempt) => attempt.student));
  const activePracticeCount = assignedPractices.filter((item) => completedStudents(item, state.attempts).size < item.students.length).length;
  const overdueAssignmentCount = assignedPractices.reduce((total, item) => total + item.students.filter((student) => isOverdue(item, student, state.attempts, today)).length, 0);
  const visiblePractices = useMemo(() => state.practices.filter((item) => {
    const query = search.trim().toLowerCase();
    return (!query || item.title.toLowerCase().includes(query))
      && (!levelFilters.length || levelFilters.includes(item.level))
      && (!tagFilters.length || (item.tags ?? []).some((value) => tagFilters.includes(value)));
  }), [state.practices, search, levelFilters, tagFilters]);
  const visibleStudents = useMemo(() => STUDENT_DIRECTORY.filter((student) =>
    student.name.toLowerCase().includes(studentSearch.trim().toLowerCase())
    && (student.level === practice?.level || !!practice?.students.includes(student.name))
    && (!studentGroupFilter || student.group === studentGroupFilter)
  ).sort((a, b) => Number(practice?.students.includes(a.name)) - Number(practice?.students.includes(b.name))), [studentSearch, studentGroupFilter, practice]);
  const tagOptions = useMemo(() => Array.from(new Set(state.practices.flatMap((item) => item.tags ?? []))).sort(), [state.practices]);

  useEffect(() => {
    // Read the local prototype store after hydration so server and client markup begin identically.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(readState());
    const onStorage = (event: StorageEvent) => { if (!event.key || event.key === STORAGE_KEY) setState(readState()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (stage !== "list" || !highlightedPracticeId) return;
    const frame = window.requestAnimationFrame(() => highlightedPracticeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
    const timeout = window.setTimeout(() => setHighlightedPracticeId(null), 3200);
    return () => { window.cancelAnimationFrame(frame); window.clearTimeout(timeout); };
  }, [stage, highlightedPracticeId]);

  function commit(next: ConversationState) { setState(next); saveState(next); }
  function openPractice(id: string) { setPracticeId(id); setStage("details"); }
  function beginOralPractice() {
    const template = INITIAL_STATE.practices[0];
    const next: Practice = {
      ...template, isExample: false, id: `practice-${Date.now()}`, title: "", topic: "", scenario: "", goal: "", activityInstructions: "", imageDataUrl: undefined, role: "Conversation partner",
      expressions: [], focus: [...template.focus], questions: [], grammars: [], tags: [], students: [], status: "Draft", completed: 0,
      dueDate: undefined, instructions: undefined, createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
    setThemeInput(""); setPractice(next);
    setSelectedStudents([]); setDueDate(""); setStage("review");
  }
  function saveDraft(publish = false) {
    if (!practice) return;
    if (publish ? !validPractice : !hasContent) return;
    if (practice.students.length) return;
    const activityInstructions = (practice.activityInstructions ?? practice.goal).trim();
    const saved = { ...practice, status: publish ? "Published" as const : practice.status, tags: pendingThemes(), title: practice.title.trim() || "Untitled activity", activityInstructions, goal: activityInstructions, expressions: practice.expressions.map((value) => value.trim()).filter(Boolean), focus: practice.focus.map((value) => value.trim()).filter(Boolean) };
    commit({ ...state, practices: editingExisting ? state.practices.map((item) => item.id === saved.id ? saved : item) : [saved, ...state.practices] });
    setPracticeId(saved.id);
    if (publish) { setStage("details"); setNotice("Activity published"); }
    else if (editingExisting) { setStage("details"); setNotice("Practice updated"); }
    else { setStage("list"); setHighlightedPracticeId(saved.id); setNotice("Draft saved"); }
  }
  function assignPractice() {
    if (!practice || practice.status !== "Published" || !selectedStudents.length) return;
    const assigned = { ...practice, students: Array.from(new Set([...practice.students, ...selectedStudents])), status: "Published" as const, dueDate: dueDate || undefined, instructions: undefined };
    commit({ ...state, practices: [assigned, ...state.practices.filter((item) => item.id !== practice.id)] });
    setPracticeId(practice.id); setPractice(assigned); setStage("details"); setHighlightedPracticeId(practice.id); setNotice("Practice assigned successfully");
  }
  function pendingThemes() {
    return Array.from(new Map([...(practice?.tags ?? []), ...themeInput.split(",")].map((item) => item.trim()).filter(Boolean).map((item) => [item.toLowerCase(), item])).values());
  }
  function addThemes() {
    if (!practice) return;
    setPractice({ ...practice, tags: pendingThemes() }); setThemeInput("");
  }
  function cancelEdit() {
    const action = () => editingExisting ? openPractice(practice!.id) : setStage("type");
    if (hasContent) setConfirmation({ title: "Discard changes?", message: "Unsaved activity details will be discarded.", action }); else action();
  }
  function leaveAssignment() {
    const action = () => openPractice(practice!.id);
    if (selectedStudents.length) setConfirmation({ title: "Discard selection?", message: "The selected students will not receive this activity.", action }); else action();
  }

  function editPractice() {
    if (selectedPractice.students.length) return;
    setThemeInput("");
    setPractice({ ...selectedPractice, expressions: [...selectedPractice.expressions], focus: [...selectedPractice.focus] });
    setStage("review");
  }
  function manageStudents(item: Practice) {
    if (item.status !== "Published") return;
    setPractice(item); setSelectedStudents([]); setDueDate(item.dueDate ?? "");
    setStudentSearch(""); setStudentGroupFilter(""); setStage("assign");
  }
  function deletePractice() {
    setDeleted({ practice: selectedPractice, attempts: state.attempts.filter((item) => item.practiceId === selectedPractice.id) });
    commit({ practices: state.practices.filter((item) => item.id !== selectedPractice.id), attempts: state.attempts.filter((item) => item.practiceId !== selectedPractice.id) });
    setDeleteOpen(false); setPractice(null); setStage("list"); setNotice("Practice deleted");
  }
  function undoDelete() {
    if (!deleted) return;
    commit({ practices: [deleted.practice, ...state.practices], attempts: [...deleted.attempts, ...state.attempts] });
    setDeleted(null); setNotice("Practice restored");
  }

  const pageTitle = stage === "type" ? "Create a practice" : stage === "details" ? selectedPractice.title : stage === "result" ? studentName : stage === "review" ? editingExisting ? "Edit practice" : "Create Oral Production" : stage === "assign" ? "Assign practice" : "AI Studio";
  const pageDescription = stage === "list"
    ? `${state.practices.length} practices · Create and manage guided speaking activities for your students.`
    : stage === "details"
      ? `${selectedPractice.level} · ${practiceStatus(selectedPractice)} · ${completedStudents(selectedPractice, state.attempts).size}/${selectedPractice.students.length} students completed · ${selectedPractice.dueDate ? `Due ${shortDate(selectedPractice.dueDate)}` : "No due date"}`
      : stage === "result"
        ? `${selectedPractice.level} · Completed ${selectedAttempt?.completedAt ?? ""} · ${selectedAttempt?.duration ?? ""}`
        : stage === "review" ? (editingExisting ? `${practice?.level} · Update this activity and its student instructions.` : "Set the activity context and the instructions students will follow.")
        : stage === "assign" ? `Select students for “${practice?.title ?? "this practice"}”.`
        : stage === "type" ? "Choose the kind of practice you want to build."
        : "Create and manage guided speaking activities for your students.";
  const showStudentPreview = stage === "details";
  const trialPractice = selectedPractice;
  const trialUrl = trialPractice ? `/conversation/preview?practiceId=${encodeURIComponent(trialPractice.id)}` : "#";

  return <>
  <div className={`ai-teacher ai-teacher--${stage}`}>
    <header className="ai-topline">
      <div className="ai-header-context">
        <ConversationBreadcrumb current={pageTitle} items={[
          ...(stage !== "list" ? [{ label: "AI Studio", onNavigate: () => setStage("list") }] : []),
          ...(stage === "result" ? [{ label: selectedPractice.title, onNavigate: () => setStage("details") }] : []),
          ...(["review", "assign"].includes(stage) ? [{ label: editingExisting ? practice!.title : "New practice", onNavigate: () => editingExisting ? openPractice(practice!.id) : setStage("type") }] : []),
          ...(stage === "assign" && !editingExisting ? [{ label: "Practice setup", onNavigate: () => setStage("review") }] : []),
        ]} />
        <p>{pageDescription}</p>
      </div>
      <div className="ai-header-actions">
        {stage === "list" ? <Button onClick={() => setStage("type")}><Plus size={16} />Create practice</Button> : null}
        {showStudentPreview && selectedPractice.status === "Published" ? <a className="ds-button ds-button--secondary ds-button--md" href={trialUrl} target="_blank" rel="noreferrer" title="Preview this activity without changing student progress">Try as a student <ArrowUpRight size={15} /></a> : null}
        {showStudentPreview && selectedPractice.status === "Draft" ? <span title="Publish the activity to view it as a student."><Button variant="secondary" disabled>Try as a student</Button></span> : null}
        {stage === "details" ? <>
          {!selectedPractice.students.length ? <Button variant="secondary" onClick={editPractice}><Pencil size={15} />{selectedPractice.status === "Draft" ? "Continue creating" : "Edit practice"}</Button> : null}
          {selectedPractice.status === "Published" ? <Button onClick={() => manageStudents(selectedPractice)}><Users size={15} />Send to students</Button> : null}
          <Button variant="ghost" className="ai-delete-action" onClick={() => setDeleteOpen(true)} aria-label="Delete practice"><Trash2 size={16} /></Button>
        </> : null}
      </div>
    </header>


    {stage === "list" ? <>
      <section className="ai-dashboard-kpis" aria-label="Current assignment KPIs">
        <span className="ai-dashboard-kpi-scope">Current assignments</span>
        <article className="ai-kpi-card ai-kpi-card--blue"><span className="ai-kpi-icon"><Activity size={17} /></span><span className="ai-kpi-copy"><span>Active practices</span><strong>{activePracticeCount}</strong><small>with students still to complete</small></span></article>
        <article className="ai-kpi-card ai-kpi-card--violet"><span className="ai-kpi-icon"><UserRoundCheck size={17} /></span><span className="ai-kpi-copy"><span>Students practiced</span><strong>{practicedStudentNames.size}<small> / {assignedStudentNames.size}</small></strong><small>unique assigned students</small></span></article>
        <article className="ai-kpi-card ai-kpi-card--green"><span className="ai-kpi-icon"><CircleCheck size={17} /></span><span className="ai-kpi-copy"><span>Completion rate</span><strong>{assignmentCount ? `${Math.round((completedAssignmentCount / assignmentCount) * 100)}%` : "—"}</strong><small>{completedAssignmentCount} of {assignmentCount} assignments</small></span></article>
        <article className="ai-kpi-card ai-kpi-card--amber"><span className="ai-kpi-icon"><Clock3 size={17} /></span><span className="ai-kpi-copy"><span>Overdue assignments</span><strong>{overdueAssignmentCount}</strong><small>past due and still incomplete</small></span></article>
      </section>
      <div className="ai-studio-filters" aria-label="Filter practices">
        <label className="ai-studio-search"><span aria-hidden="true">⌕</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name" aria-label="Search practices by name" /></label>
        <FilterMenu label="Levels" options={Array.from(new Set(state.practices.map((item) => item.level))).sort()} value={levelFilters} onChange={setLevelFilters} />
        <FilterMenu label="Themes" options={tagOptions} value={tagFilters} onChange={setTagFilters} />
        {search || levelFilters.length || tagFilters.length ? <button type="button" className="ai-clear-filters" onClick={() => { setSearch(""); setLevelFilters([]); setTagFilters([]); }}>Clear filters</button> : null}
      </div>
      {visiblePractices.length ? <div className="ai-practice-list ai-practice-table"><div className="ai-practice-table__header" aria-hidden="true"><span>Practice</span><span>Level</span><span>Students</span><span>Progress</span><span>Status</span><span>Creation date</span><span /></div>{visiblePractices.map((item) => { const completed = completedStudents(item, state.attempts).size; const status = practiceStatus(item); return <button ref={highlightedPracticeId === item.id ? highlightedPracticeRef : undefined} data-practice-id={item.id} className={`ai-practice-row${highlightedPracticeId === item.id ? " is-highlighted" : ""}`} type="button" key={item.id} onClick={() => openPractice(item.id)} aria-label={`Open ${item.title}, ${status}`}>
        <span className="ai-practice-main"><span className={`ai-practice-type-icon ai-practice-type-icon--${item.practiceType ?? "oral-production"}`} title={item.practiceType === "ai-exercise" ? "AI Exercise" : "Oral Production"} aria-label={item.practiceType === "ai-exercise" ? "AI Exercise" : "Oral Production"}>{item.practiceType === "ai-exercise" ? <ClipboardList size={17} /> : <Mic2 size={17} />}</span><span className="ai-practice-main-copy"><strong>{item.title}</strong><span className="ai-practice-tags">{(item.tags ?? []).slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}{(item.tags?.length ?? 0) > 2 ? <span className="ai-practice-tag-overflow">+{item.tags!.length - 2}</span> : null}</span></span></span><Badge>{item.level}</Badge><span className="ai-practice-students"><Users size={15} />{item.students.length ? `${item.students.length} assigned` : "No students"}</span><span className="ai-progress-count">{completed}/{item.students.length} completed</span><span className={`ai-status ai-status--${status.toLowerCase().replaceAll(" ", "-")}`}>{status}</span><span className="ai-practice-date">{item.createdAt}</span><ChevronRight size={17} className="ai-chevron" />
      </button>; })}</div> : <EmptyState title="No practices found" description="Try changing your search or filters." action={<Button variant="secondary" onClick={() => { setSearch(""); setLevelFilters([]); setTagFilters([]); }}>Clear filters</Button>} />}
    </> : null}

    {stage === "type" ? <section className="ai-flow"><div className="ai-type-grid">
      <button type="button" className="ai-type-card ai-type-card--active" onClick={beginOralPractice}><span className="ai-type-icon"><Mic2 size={22} /></span><strong>Oral Production</strong><small>Create a speaking activity with student instructions and an optional image.</small><span className="ai-option-link">Create Oral Production <ArrowRight size={14} /></span></button>
      <article className="ai-type-card ai-type-card--soon" aria-label="AI Exercise, Coming Soon"><span className="ai-type-icon ai-type-icon--muted"><BookOpen size={22} /></span><span className="ai-coming-soon">Coming Soon</span><strong>AI Exercise</strong><small>Additional AI-powered exercise formats will be available here in a future update.</small></article>
    </div></section> : null}

    {stage === "review" && practice ? <section className="ai-flow"><div className="ai-review-layout"><div className="ai-review-card">
      <div className="ai-review-title"><div><span className="ai-step-label">ORAL PRODUCTION</span><h2>{editingExisting ? "Edit practice" : "Set up your practice"}</h2><p>{editingExisting ? "Update the activity details, instructions and image." : "Set the activity context and instructions students will follow."}</p></div></div>
      <FormField label="Activity title" required><Input value={practice.title} onChange={(event) => setPractice({ ...practice, title: event.target.value })} /></FormField>
      <FormField label="Instructions" required hint="Tell the student what to talk about in their recording."><Textarea value={practice.activityInstructions ?? practice.goal} onChange={(event) => setPractice({ ...practice, activityInstructions: event.target.value, goal: event.target.value })} placeholder="e.g. Describe your ideal weekend and explain why you would enjoy it." /></FormField>
      <FormField label="Activity image (optional)" hint="JPG, PNG or WebP. The image appears in the center of the student activity."><div className="ai-image-upload">{practice.imageDataUrl ? <div className="ai-image-upload__preview"><img src={practice.imageDataUrl} alt="Uploaded activity visual" /><button type="button" onClick={() => setPractice({ ...practice, imageDataUrl: undefined })} aria-label="Remove activity image"><XCircle size={18} /></button></div> : <label className="ai-image-upload__drop"><ImagePlus size={19} /><span>Add an image</span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={async (event) => { const input = event.currentTarget; const file = input.files?.[0]; if (!file) return; try { const imageDataUrl = await optimizeActivityImage(file); setPractice((current) => current ? { ...current, imageDataUrl } : current); } catch (error) { setNotice(error instanceof Error ? error.message : "Could not load this image."); } input.value = ""; }} /></label>}</div></FormField>
      <FormField label="CEFR level" required><Select value={practice.level} onChange={(event) => setPractice({ ...practice, level: event.target.value })}>{["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => <option key={level}>{level}</option>)}</Select></FormField>
      <fieldset className="op-time-range"><legend>Response time</legend><strong className="op-time-summary">{responseTime(practice)}</strong><div className="op-time-control-grid">
        <div className="op-time-choice" role="group" aria-label="Minimum response time"><span className="op-time-choice__label">Minimum time</span><div className="op-time-choice__options">{[1, 2, 3, 4, 5].map((minutes) => <button type="button" key={minutes} aria-label={`Minimum ${minutes} minutes`} aria-pressed={(practice.minResponseTime ?? 1) === minutes} onClick={() => setPractice({ ...practice, minResponseTime: minutes, maxResponseTime: Math.max(minutes, practice.maxResponseTime ?? 2) })}><span>{minutes}</span><small>min</small></button>)}</div></div>
        <div className="op-time-choice" role="group" aria-label="Maximum response time"><span className="op-time-choice__label">Maximum time</span><div className="op-time-choice__options">{[1, 2, 3, 4, 5].map((minutes) => <button type="button" key={minutes} aria-label={`Maximum ${minutes} minutes`} aria-pressed={(practice.maxResponseTime ?? 2) === minutes} onClick={() => setPractice({ ...practice, maxResponseTime: minutes, minResponseTime: Math.min(minutes, practice.minResponseTime ?? 1) })}><span>{minutes}</span><small>min</small></button>)}</div></div>
      </div><small className="op-time-hint">Choose a minimum and maximum from 1 to 5 minutes.</small></fieldset>
      <div className="ds-field"><label className="ds-field__label" htmlFor="practice-themes">Themes (optional)</label><div className="op-themes">{(practice.tags ?? []).map((tag) => <span key={tag}>{tag}<button type="button" aria-label={`Remove theme ${tag}`} onClick={() => setPractice({ ...practice, tags: practice.tags?.filter((item) => item !== tag) })}><X size={13} /></button></span>)}</div><div className="op-theme-input"><Input id="practice-themes" aria-describedby="theme-hint" value={themeInput} onChange={(event) => setThemeInput(event.target.value)} onBlur={addThemes} onKeyDown={(event) => { if (event.key === "Enter" || event.key === ",") { event.preventDefault(); addThemes(); } }} placeholder="e.g. Travel, Everyday English" /><Button variant="secondary" onClick={addThemes} disabled={!themeInput.trim()}>Add</Button></div><span className="ds-field__hint" id="theme-hint">Press Enter or use commas to add themes.</span></div>
      <div className="ai-toggle-row"><input id="instant-feedback" type="checkbox" role="switch" checked={practice.instantFeedback ?? true} onChange={(event) => setPractice({ ...practice, instantFeedback: event.target.checked })} /><div><label htmlFor="instant-feedback"><strong>Instant feedback</strong><small>Show AI feedback after the student submits their response.</small></label><span className="op-tooltip"><button type="button" aria-label="About instant feedback" aria-describedby="feedback-tooltip">?</button><span role="tooltip" id="feedback-tooltip">When enabled, students receive AI-generated feedback after submitting their recording, including a performance summary, strengths, and areas for improvement. Your review is still available regardless of this setting.</span></span></div></div>
      <div className="ai-form-footer">
        <Button variant="secondary" onClick={cancelEdit}>Cancel</Button><Button variant="secondary" onClick={() => saveDraft()} disabled={!hasContent || (practice.status === "Published" && !validPractice)}>{practice.status === "Published" ? "Save changes" : "Save as draft"}</Button>{practice.status === "Draft" ? <Button onClick={() => saveDraft(true)} disabled={!validPractice}>Publish <ArrowRight size={15} /></Button> : null}
      </div>
    </div><aside className="ai-student-preview-card"><div className="ai-student-preview-head"><span><Smartphone size={16} /></span><div><strong>Student app</strong></div></div><div className="ai-preview-activity"><h3>{practice.title || "Activity title"}</h3><section className="ai-preview-instructions"><strong>Instructions</strong><p>{practice.activityInstructions || practice.goal || "Student instructions will appear here."}</p></section>{practice.imageDataUrl ? <img className="ai-preview-image" src={practice.imageDataUrl} alt="Activity visual" /> : null}<p className="op-preview-time"><Clock3 size={14} />Response time: {responseTime(practice)}</p><div className="ai-preview-record-button"><Mic2 size={15} />Record response</div></div></aside></div></section> : null}

    {stage === "assign" && practice ? <section className="ai-flow"><div className="ai-form-card ai-assign-card">
      <div className="ai-assign-heading"><div><h2>Select students</h2><p>Assign “{practice.title}” to individual students or filter your roster by group.</p></div><span>{selectedStudents.length} selected</span></div>
      <div className="ai-student-filters"><label className="ai-student-search"><span aria-hidden="true">⌕</span><input type="search" value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder="Search students by name" aria-label="Search students by name" /></label><label className="ai-group-filter"><span>Group</span><Select value={studentGroupFilter} onChange={(event) => setStudentGroupFilter(event.target.value)}><option value="">All groups</option>{GROUPS.map((group) => <option key={group}>{group}</option>)}</Select></label></div>
      <div className="ai-student-selection-tools"><span>{visibleStudents.length} {visibleStudents.length === 1 ? "student" : "students"} found</span><button type="button" onClick={() => setSelectedStudents((current) => Array.from(new Set([...current, ...visibleStudents.filter((student) => !practice.students.includes(student.name)).map((student) => student.name)])))} disabled={!visibleStudents.length || visibleStudents.every((student) => practice.students.includes(student.name) || selectedStudents.includes(student.name))}>Select visible</button><button type="button" onClick={() => setSelectedStudents([])} disabled={!selectedStudents.length}>Clear selection</button></div>
      <div className="ai-student-roster" role="group" aria-label="Student roster">{visibleStudents.map((student) => <label className={`ai-student-option${selectedStudents.includes(student.name) ? " is-selected" : ""}`} key={student.name}><input type="checkbox" disabled={practice.students.includes(student.name)} checked={practice.students.includes(student.name) || selectedStudents.includes(student.name)} onChange={() => setSelectedStudents((current) => current.includes(student.name) ? current.filter((name) => name !== student.name) : [...current, student.name])} /><span className="ai-student-initials">{student.name.split(" ").map((part) => part[0]).join("")}</span><span className="ai-student-identity"><strong>{student.name}</strong><small>{student.group} <i>·</i> Level {student.level}</small>{practice.students.includes(student.name) ? <small>Activity already sent to this student.</small> : null}</span><span className="ai-course-progress"><span><span>Course progress</span><strong>{student.courseProgress}%</strong></span><i><i style={{ width: `${student.courseProgress}%` }} /></i></span></label>)}{!visibleStudents.length ? <div className="ai-roster-empty">No students match these filters.</div> : null}</div>
      <FormField label="Due date" hint="Choose when students should complete this practice."><Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></FormField>
      <div className="ai-form-footer"><Button variant="secondary" onClick={leaveAssignment}>Back</Button><Button onClick={() => setConfirmation({ title: "Send activity?", message: `Send “${practice.title}” to: ${selectedStudents.join(", ")}.`, action: assignPractice })} disabled={!selectedStudents.length}>Save assignments</Button></div>
    </div></section> : null}

    {stage === "details" ? <section className="ai-detail-view" aria-label="Assigned students">
      <div className="ai-practice-list ai-student-table"><div className="ai-student-table__header" aria-hidden="true"><span>Student</span><span>Status</span><span>Completion date</span><span /></div>{(selectedPractice.students.length ? selectedPractice.students : []).map((student) => { const attempts = state.attempts.filter((item) => item.practiceId === selectedPractice.id && item.student === student); const attempt = attempts.find((item) => item.completed !== false) ?? attempts[0]; const completed = completedStudents(selectedPractice, state.attempts).has(student); const progress = completed ? "Completed" : "Not started"; return <div className="ai-student-result-row" key={student}><span className="ai-student-initials">{student.split(" ").map((part) => part[0]).join("")}</span><strong>{student}</strong><span className={`ai-status ai-status--${progress.toLowerCase().replaceAll(" ", "-")}`}>{progress}</span><small>{completed ? attempt?.completedAt ?? "—" : "—"}</small>{completed ? <button className="ai-row-action" type="button" onClick={() => { setPracticeId(selectedPractice.id); setStudentName(student); setStage("result"); }}>View result <ChevronRight size={15} /></button> : <span className="ai-row-action ai-row-action--muted">{attempt ? "No result yet" : "No result yet"}</span>}</div>; })}{!selectedPractice.students.length ? <EmptyState title={selectedPractice.status === "Draft" ? "Activity creation in progress" : "No students assigned"} description={selectedPractice.status === "Draft" ? "Your activity is still a draft. Finish editing it so it can be sent to students." : "Send this activity to students to start collecting responses."} action={<Button onClick={() => selectedPractice.status === "Draft" ? editPractice() : manageStudents(selectedPractice)}>{selectedPractice.status === "Draft" ? "Continue creating" : "Send to students"}</Button>} /> : null}</div>
    </section> : null}

    {stage === "result" && selectedAttempt ? <OralReport key={selectedAttempt.id} practice={selectedPractice} submission={selectedAttempt} onReturn={() => setStage("details")} onUpdate={(submission) => commit({ ...state, attempts: state.attempts.map((item) => item.id === submission.id ? submission : item) })} /> : null}
    {confirmation ? <ConfirmDialog title={confirmation.title} message={confirmation.message} onCancel={() => setConfirmation(null)} onConfirm={() => { confirmation.action(); setConfirmation(null); }} /> : null}
    {deleteOpen ? <DeletePracticeDialog title={selectedPractice.title} onCancel={() => setDeleteOpen(false)} onConfirm={deletePractice} /> : null}
  </div>
  {notice ? createPortal(<div className="ai-notice" role="status" aria-live="polite">{notice}{deleted && notice === "Practice deleted" ? <button type="button" onClick={undoDelete}>Undo</button> : null}<button type="button" aria-label="Dismiss" onClick={() => setNotice("")}><X size={14} /></button></div>, document.body) : null}
  </>;
}

function DeletePracticeDialog({ title, onCancel, onConfirm }: { title: string; onCancel: () => void; onConfirm: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.showModal();
    return () => previous?.focus();
  }, []);
  return <dialog ref={dialogRef} className="ai-delete-dialog" onCancel={onCancel} aria-labelledby="delete-practice-title">
    <span className="ai-delete-symbol"><Trash2 size={22} /></span>
    <h2 id="delete-practice-title">Delete practice?</h2>
    <p>“{title}” and its assignments and results will be removed. You can restore it from the confirmation notice.</p>
    <div><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button variant="danger" onClick={onConfirm}>Delete practice</Button></div>
  </dialog>;
}

async function optimizeActivityImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  if (file.size > 12 * 1024 * 1024) throw new Error("Choose an image smaller than 12 MB.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1280 / bitmap.width, 900 / bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const imageDataUrl = canvas.toDataURL("image/webp", 0.76);
  if (imageDataUrl.length > 600_000) throw new Error("This image is still too large after optimization. Try a smaller image.");
  return imageDataUrl;
}

function ConfirmDialog({ title, message, onCancel, onConfirm }: { title: string; message: string; onCancel: () => void; onConfirm: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const previous = document.activeElement as HTMLElement | null; ref.current?.showModal(); return () => previous?.focus(); }, []);
  return <dialog ref={ref} className="ai-delete-dialog" aria-labelledby="confirmation-title" onCancel={onCancel}><h2 id="confirmation-title">{title}</h2><p>{message}</p><div><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button onClick={onConfirm}>Confirm</Button></div></dialog>;
}

function FilterMenu({ label, options, value, onChange }: { label: string; options: string[]; value: string[]; onChange: (value: string[]) => void }) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const [query, setQuery] = useState("");
  const filteredOptions = options.filter((option) => option.toLowerCase().includes(query.trim().toLowerCase()));
  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => { if (event.target instanceof Node && !menuRef.current?.contains(event.target)) menuRef.current?.removeAttribute("open"); };
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape" && menuRef.current?.open) { menuRef.current.open = false; menuRef.current.querySelector("summary")?.focus(); } };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => { document.removeEventListener("pointerdown", closeOnOutsideClick); document.removeEventListener("keydown", closeOnEscape); };
  }, []);
  return <details ref={menuRef} className={`ai-studio-filter${value.length ? " has-selection" : ""}`}>
    <summary>{label}{value.length ? <span>{value.length}</span> : null}<ChevronDown size={14} /></summary>
    <div className="ai-studio-filter-menu">
      <label className="ai-filter-search"><Search size={14} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${label.toLowerCase()}`} aria-label={`Search ${label.toLowerCase()}`} /></label>
      <div className="ai-filter-options">{filteredOptions.length ? filteredOptions.map((option) => <label key={option}><input type="checkbox" checked={value.includes(option)} onChange={() => onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option])} /><span>{option}</span></label>) : <small>{options.length ? "No matches" : `No ${label.toLowerCase()} available yet`}</small>}</div>
      {value.length ? <button type="button" onClick={() => { onChange([]); setQuery(""); }}>Clear {label.toLowerCase()}</button> : null}
    </div>
  </details>;
}
