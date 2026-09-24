"use client";

import {
  AlignJustify,
  AlignLeft,
  Bell,
  Bold,
  BookCheck,
  BookOpen,
  BookOpenCheck,
  BookOpenText,
  Calendar1,
  
  CalendarDays,
  CalendarClock,
  CalendarSync,
  CalendarX2,
  Check,
  Clock3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  AudioLines,
  Crown,
  Download,
  Maximize2,
  FileBadge2,
  FileText,
  ListFilter,
  Flag,
  Folder,
  FolderOpen,
  FolderPlus,
  GalleryThumbnails,
  Grid2X2,
  GraduationCap,
  Hand,
  ImagePlay,
  ImagePlus,
  Inbox,
  Info,
  Italic,
  LayoutDashboard,
  LetterText,
  LifeBuoy,
  List,
  ListTodo,
  ListVideo,
  LoaderCircle,
  Link,
  Megaphone,
  MessageSquare,
  Monitor,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Pencil,
  Paperclip,
  Settings,
  Search,
  Smartphone,
  Strikethrough,
  SwatchBook,
  SunMoon,
  Trash2,
  Target,
  Underline,
  User,
  UserRoundCog,
  UserRoundX,
  Users,
  Video,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent, MouseEvent, PointerEvent } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties } from "react";
import * as Popover from "@radix-ui/react-popover";
import { TeacherHoursView } from "../src/features/teacher-hours/TeacherHoursView";
import { AIConversationView } from "../src/features/ai-conversation/AIConversationView";

type PlannerEvent = {
  id: string | number;
  title: string;
  day: number;
  startMinutes: number;
  duration: number;
  allDay?: boolean;
  color: string;
  status: EventStatus;
  classStatus?: ClassStatus;
  weekOffset: number;
  kind?: "group" | "individual" | "custom" | "task" | "away" | "other";
  studentName?: string;
  description?: string;
  observation?: string;
  classPlanId?: string;
  scheduledDate?: string;
  studentEmails?: string[];
  teacherNames?: string[];
  groupName?: string;
  updatedAt?: string;
  isPending?: boolean;
  recurrence?: Pick<ScheduleDraft, "repeats" | "repeatDays" | "repeatInterval" | "repeatUnit" | "endsOn" | "endDate"> & { seriesId?: string };
};

type ClassPlan = {
  id: string;
  title: string;
  classGoal: string;
  grammarTopics: string[];
  resourceTitles: string[];
  procedures: string;
};

type ClassPlanLoadState = "loading" | "success" | "empty" | "error";

type EventStatus = "To Plan" | "Planning" | "Planned" | "Taught";
type ClassStatus = "Scheduled" | "Reschedule pending" | "Rescheduled" | "Student no-show" | "Canceled";
type CalendarFilters = {
  group: string[];
  teacher: string[];
  student: string[];
  classStatus: string[];
  planningStatus: string[];
};
type CalendarToast = { message: string; detail?: string; tone?: "success" | "error" | "info"; action?: { label: string; onClick: () => void } };
type ModuleView = "planner" | "plannerFullEnglish" | "classReporting" | "teacherHours" | "resources" | "resourcesV2" | "students" | "studentApp" | "aiConversation";
type ResourceRecord = {
  title: string;
  level: string;
  grammar: string;
  tags: string[];
  type: string;
  size: string;
  source?: string;
  instructions?: string;
};

type StudentRecord = {
  id: number;
  name: string;
  email: string;
  status: "Enabled" | "Disabled";
  level: string;
  progress: number;
  studyTime: string;
  weeklyGoal: string;
  lastSeen: string;
  attendance: ("present" | "absent")[];
};

type GrammarPerformance = {
  grammar: string;
  attempts: number;
  error: string;
};

type ResourceMultiSelectProps = {
  placeholder: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  allowCreate?: boolean;
};

type ResourceFilterDropdownProps = {
  label: string;
  allLabel: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  wide?: boolean;
};

function ResourceMultiSelect({ placeholder, options, value, onChange, allowCreate = false }: ResourceMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const availableOptions = Array.from(new Set([...options, ...value]));
  const filteredOptions = availableOptions.filter((option) => option.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function toggleOption(option: string) {
    onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option]);
  }

  const normalizedQuery = query.trim();
  const canCreate = allowCreate && normalizedQuery.length > 0 && !availableOptions.some((option) => option.toLowerCase() === normalizedQuery.toLowerCase());

  function createOption() {
    if (!canCreate) return;
    onChange([...value, normalizedQuery]);
    setQuery("");
  }

  function selectOnlyFilteredOption() {
    if (filteredOptions.length !== 1) return false;
    const option = filteredOptions[0];
    if (!value.includes(option)) onChange([...value, option]);
    setQuery("");
    return true;
  }

  return (
    <div className="resource-multiselect" ref={rootRef}>
      <button className={`resource-multiselect__trigger ${open ? "is-open" : ""}`} type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <Search size={15} />
        <span className={`resource-multiselect__value ${value.length ? "has-value" : ""}`}>{value.length ? value.map((item) => <span className="resource-multiselect__badge" key={item}>{item}<span className="resource-multiselect__badge-remove" role="button" tabIndex={0} aria-label={`Remove ${item}`} onClick={(event) => { event.stopPropagation(); onChange(value.filter((selected) => selected !== item)); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); onChange(value.filter((selected) => selected !== item)); } }}>×</span></span>) : placeholder}</span>
        <ChevronDown size={15} />
      </button>
      {open ? <div className="resource-multiselect__popover" role="listbox" aria-multiselectable="true">
        <div className="resource-multiselect__search"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key !== "Enter") return; if (selectOnlyFilteredOption() || canCreate) { event.preventDefault(); event.stopPropagation(); if (filteredOptions.length !== 1) createOption(); } }} placeholder="Search options" /></div>
        <div className="resource-multiselect__options">{filteredOptions.map((option) => <label className="resource-multiselect__option" key={option}><input type="checkbox" checked={value.includes(option)} onChange={() => toggleOption(option)} /><span>{option}</span>{value.includes(option) ? <Check size={14} /> : null}</label>)}{canCreate ? <button className="resource-multiselect__create" type="button" onClick={() => { onChange([...value, normalizedQuery]); setQuery(""); }}><Plus size={14} /><span>Create “{normalizedQuery}”</span></button> : null}{!filteredOptions.length && !canCreate ? <span className="resource-multiselect__empty">No options found</span> : null}</div>
      </div> : null}
    </div>
  );
}

function ResourceFilterDropdown({ label, allLabel, options, value, onChange, wide = false }: ResourceFilterDropdownProps) {
  function toggleOption(option: string) {
    onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option]);
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          className={`resources-filter-button${wide ? " resources-filter-button--wide" : ""}${value.length ? " is-active" : ""}`}
          type="button"
          aria-label={value.length ? `${label}: ${value.length} selected` : allLabel}
        >
          <span className="resources-filter-button__label">{value.length ? label : allLabel}</span>
          <span className="resources-filter-button__end">
            {value.length ? <span className="resources-filter-button__count" aria-hidden="true">{value.length}</span> : null}
            <ChevronDown className="resources-filter-button__chevron" size={15} aria-hidden="true" />
          </span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="resources-filter-popover" side="bottom" align="start" sideOffset={6} collisionPadding={12}>
          <div className="resources-filter-popover__header">
            <strong>{label}</strong>
            <button type="button" onClick={() => onChange([])} disabled={!value.length}>Clear</button>
          </div>
          <div className="resources-filter-popover__options" role="menu" aria-label={`${label} filters`}>
            {options.map((option) => {
              const selected = value.includes(option);
              return (
                <button
                  className={`resources-filter-option${selected ? " is-selected" : ""}`}
                  type="button"
                  role="menuitemcheckbox"
                  aria-checked={selected}
                  key={option}
                  onClick={() => toggleOption(option)}
                >
                  <span className="resources-filter-option__indicator" aria-hidden="true">{selected ? <Check size={13} /> : null}</span>
                  <span>{option}</span>
                </button>
              );
            })}
          </div>
          <Popover.Arrow className="resources-filter-popover__arrow" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function statusSlug(status: EventStatus) {
  return status.toLowerCase().replace(/\s+/g, "-");
}

const classStatusConfig: Record<ClassStatus, { Icon: typeof CalendarDays; tone: string }> = {
  Scheduled: { Icon: Calendar1, tone: "scheduled" },
  "Reschedule pending": { Icon: CalendarClock, tone: "reschedule-pending" },
  Rescheduled: { Icon: CalendarSync, tone: "rescheduled" },
  "Student no-show": { Icon: UserRoundX, tone: "student-no-show" },
  Canceled: { Icon: CalendarX2, tone: "canceled" },
};

function ClassStatusIndicator({ status, showLabel = false }: { status?: ClassStatus; showLabel?: boolean }) {
  if (!status) return null;
  const { Icon, tone } = classStatusConfig[status];
  const label = status === "Student no-show" ? "No-show" : status;
  return (
    <span className={`class-status class-status--${tone}`} title={label} aria-label={`Class status: ${label}`}>
      <Icon size={16} strokeWidth={1.9} aria-hidden="true" />
      {showLabel ? <span>{label}</span> : null}
    </span>
  );
}

function ClassStatusSelect({ status, onChange }: { status?: ClassStatus; onChange: (status: ClassStatus) => void }) {
  const current = status ?? "Scheduled";
  return <Popover.Root><Popover.Trigger asChild><button type="button" className={`class-status-select-trigger class-status--${statusSlug(current)}`} aria-label="Change class status" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}><ClassStatusIndicator status={current} showLabel /><ChevronDown size={14} aria-hidden="true" /></button></Popover.Trigger><Popover.Portal><Popover.Content className="class-status-select-menu" side="bottom" align="start" sideOffset={6} onPointerDown={(event) => event.stopPropagation()}>{(Object.keys(classStatusConfig) as ClassStatus[]).map((option) => { const Icon = classStatusConfig[option].Icon; const selected = option === current; return <button type="button" key={option} className={`class-status-select-option class-status--${statusSlug(option)}${selected ? " is-selected" : ""}`} onClick={(event) => { event.stopPropagation(); onChange(option); }}><Icon size={15} aria-hidden="true" /><span>{option === "Student no-show" ? "No-show" : option}</span>{selected ? <Check size={15} aria-hidden="true" /> : null}</button>; })}</Popover.Content></Popover.Portal></Popover.Root>;
}

function PlanningStatusIndicator({ status }: { status: EventStatus }) {
  const { Icon } = planningStatusConfig[status];
  return (
    <span className={`planning-status-icon planning-status-icon--${statusSlug(status)}`} title={status} aria-label={`Planning status: ${status}`}>
      <Icon size={16} strokeWidth={1.9} aria-hidden="true" />
    </span>
  );
}

const planningStatusConfig: Record<EventStatus, { Icon: typeof BookOpen }> = {
  "To Plan": { Icon: BookOpen },
  Planning: { Icon: BookOpenText },
  Planned: { Icon: BookOpenCheck },
  Taught: { Icon: BookCheck },
};

function PlanningStatusBadge({ status }: { status: EventStatus }) {
  return <span className={`planning-status planning-status--${statusSlug(status)}`}><PlanningStatusIndicator status={status} />{status}</span>;
}

function eventDisplayName(event: PlannerEvent) {
  return event.kind === "individual" ? event.studentName ?? event.title : event.title;
}

function EventIdentity({ event, compact = false }: { event: PlannerEvent; compact?: boolean }) {
  if (event.kind === "individual") return <StudentAvatar name={event.studentName ?? "Student"} className={compact ? "event-card__student-avatar" : "event-card__student-avatar"} />;
  if (event.kind === "group" || !event.kind) return <span className="event-card__event-marker" style={{ background: event.color }} aria-hidden="true" />;
  const Icon = event.kind === "task" ? ListTodo : event.kind === "away" ? CalendarX2 : event.kind === "custom" ? UserRoundCog : CalendarDays;
  return <span className={`event-card__event-icon event-card__event-icon--${event.kind}`} style={{ color: event.color }} aria-hidden="true"><Icon size={12} strokeWidth={2} /></span>;
}

function ReportingEventIdentity({ event }: { event: PlannerEvent }) {
  if (event.kind === "individual") return <StudentAvatar name={event.studentName ?? "Student"} className="class-reporting__student-avatar" />;
  if (event.kind === "group" || !event.kind) return <span className="class-reporting__group-marker" style={{ background: event.color }} aria-hidden="true" />;
  const Icon = event.kind === "custom" ? UserRoundCog : event.kind === "task" ? ListTodo : event.kind === "away" ? CalendarX2 : CalendarDays;
  return <span className={`class-reporting__event-identity class-reporting__event-identity--${event.kind}`} style={{ color: event.color, background: `color-mix(in srgb, ${event.color} 14%, white)` }} aria-hidden="true"><Icon size={14} strokeWidth={2} /></span>;
}

function isClassEvent(event: PlannerEvent) {
  return !event.kind || event.kind === "individual" || event.kind === "group" || event.kind === "custom";
}

function isReportableClassEvent(event: PlannerEvent) {
  return isClassEvent(event) && event.kind !== "custom";
}

function matchesReportEventType(event: PlannerEvent, eventType: string) {
  if (eventType === "all") return true;
  if (eventType === "classes") return isClassEvent(event);
  return event.kind === eventType;
}

function PopoverEventIcon({ event }: { event: PlannerEvent }) {
  if (event.kind === "individual") return <StudentAvatar name={event.studentName ?? "Student"} className="event-popover__student-avatar" />;
  if (isClassEvent(event)) return <span className="event-popover__group-marker" style={{ background: event.color }} aria-label="Group class" />;
  const Icon = event.kind === "task" ? ListTodo : event.kind === "away" ? CalendarX2 : CalendarDays;
  return <span className="event-popover__group-marker event-popover__event-icon" style={{ color: event.color, background: `color-mix(in srgb, ${event.color} 14%, white)` }} aria-hidden="true"><Icon size={16} /></span>;
}

function classPlanForEvent(event: PlannerEvent) {
  const seededEvent = initialEvents.find((item) => String(item.id) === String(event.id).replace("seed-", ""));
  return initialClassPlans.find((plan) => plan.id === (event.classPlanId ?? seededEvent?.classPlanId));
}

function lessonLogDetails(event: PlannerEvent) {
  const plan = classPlanForEvent(event);
  if (plan) return { goal: plan.classGoal, grammars: plan.grammarTopics, summary: plan.procedures };
  if (/b1/i.test(event.title) || /b1/i.test(event.groupName ?? "")) return {
    goal: "Build confidence using the present simple in everyday conversations.",
    grammars: ["Present Simple", "Adverbs of frequency"],
    summary: "Students practiced routine questions, compared weekly habits, and shared short answers with peer feedback.",
  };
  if (event.kind === "individual" || event.studentName) return {
    goal: "Use familiar vocabulary to communicate personal ideas with clarity.",
    grammars: ["Simple Past", "Time expressions"],
    summary: "Reviewed the target language, completed guided speaking prompts, and agreed on a next-step practice activity.",
  };
  return { goal: event.description ?? "—", grammars: [] as string[], summary: event.description ?? "" };
}

const navGroups = [
  {
    label: "Overview",
    items: [
      ["Dashboard", LayoutDashboard],
      ["Learning Analytics", GraduationCap],
    ],
  },
  {
    label: "Class Management",
    items: [
      ["Planner", CalendarDays],
      ["Planner FullEnglish", CalendarDays],
      ["My Lesson Plans", GalleryThumbnails],
      ["My Resources", ImagePlay],
      ["My Resources v2", FolderOpen],
      ["Flexge Lessons", SwatchBook],
      ["Lesson Log", List],
    ],
  },
  {
    label: "Students Management",
    items: [
      ["Students", User],
      ["Groups", Users],
      ["Student App", Smartphone],
      ["AI Studio", AudioLines],
      ["Messages", MessageSquare],
      ["Ranking", Crown],
      ["Certificates", FileBadge2],
    ],
  },
  {
    label: "Class Observation",
    items: [
      ["Teacher Hours", Clock3],
    ],
  },
  {
    label: "Assessments",
    items: [
      ["Placement Tests", ListTodo],
      ["4 Abilities Tests", ListVideo],
    ],
  },
] as const;

const initialEvents: PlannerEvent[] = [
  { id: 1, title: "B1 Class", day: 2, startMinutes: 8 * 60, duration: 30, color: "#f97316", status: "To Plan", classStatus: "Scheduled", weekOffset: 0 },
  { id: 2, title: "B1 Class", day: 3, startMinutes: 8 * 60 + 30, duration: 30, color: "#fb923c", status: "Planning", classStatus: "Reschedule pending", weekOffset: 0, classPlanId: "b1-travel" },
  { id: 3, title: "B1 Class", day: 3, startMinutes: 9 * 60, duration: 60, color: "#f97316", status: "Planned", classStatus: "Scheduled", weekOffset: 0, classPlanId: "b1-routines" },
  { id: 4, title: "B1 Class", day: 4, startMinutes: 9 * 60, duration: 60, color: "#f97316", status: "Planned", classStatus: "Rescheduled", weekOffset: 0, classPlanId: "b1-storytelling" },
  { id: 5, title: "Individual class", day: 1, startMinutes: 10 * 60, duration: 60, color: "#285d8d", status: "Planning", classStatus: "Student no-show", weekOffset: 0, kind: "individual", studentName: "Lucas Almeida", classPlanId: "lucas-preferences" },
  { id: 6, title: "Conversation Lab", day: 5, startMinutes: 14 * 60 + 30, duration: 45, color: "#fb923c", status: "Planned", classStatus: "Canceled", weekOffset: 0, kind: "group", classPlanId: "conversation-city" },
  { id: 7, title: "Individual class", day: 6, startMinutes: 16 * 60, duration: 60, color: "#285d8d", status: "Taught", classStatus: "Scheduled", weekOffset: 0, kind: "individual", studentName: "Mariana Costa", classPlanId: "mariana-reflection" },
  { id: 8, title: "Individual class", day: 3, startMinutes: 10 * 60 + 30, duration: 15, color: "#285d8d", status: "To Plan", classStatus: "Rescheduled", weekOffset: 0, kind: "individual", studentName: "Gabriel Santos" },
  { id: 16, title: "Prepare lesson materials", description: "Review and organize next week's lesson materials.", day: 1, startMinutes: 13 * 60, duration: 45, color: "#d97706", status: "To Plan", classStatus: "Scheduled", weekOffset: 0, kind: "task" },
  { id: 17, title: "Away", description: "Unavailable for classes.", day: 4, startMinutes: 11 * 60, duration: 60, color: "#64748b", status: "Planned", classStatus: "Scheduled", weekOffset: 0, kind: "away" },
  { id: 18, title: "Team meeting", description: "Weekly teaching team sync.", day: 5, startMinutes: 12 * 60 + 30, duration: 30, color: "#0f766e", status: "Planning", classStatus: "Scheduled", weekOffset: 0, kind: "other" },
  { id: 19, title: "Custom workshop", day: 2, startMinutes: 15 * 60, duration: 45, color: "#65a30d", status: "To Plan", classStatus: "Scheduled", weekOffset: 0, kind: "custom" },
  { id: 9, title: "A2 Class", day: 2, startMinutes: 9 * 60, duration: 60, color: "#14b8a6", status: "Taught", classStatus: "Scheduled", weekOffset: -9, classPlanId: "a2-feelings" },
  { id: 10, title: "Individual class", day: 4, startMinutes: 17 * 60, duration: 45, color: "#285d8d", status: "Taught", classStatus: "Scheduled", weekOffset: -9, kind: "individual", studentName: "Ana Ribeiro", classPlanId: "ana-routines" },
  { id: 11, title: "A2 Class", day: 1, startMinutes: 8 * 60 + 30, duration: 60, color: "#14b8a6", status: "Planned", classStatus: "Scheduled", weekOffset: -5, classPlanId: "a2-city" },
  { id: 12, title: "B2 Class", day: 3, startMinutes: 18 * 60, duration: 60, color: "#8b5cf6", status: "Planned", classStatus: "Scheduled", weekOffset: -5, classPlanId: "b2-modals" },
  { id: 13, title: "Conversation Lab", day: 2, startMinutes: 14 * 60, duration: 60, color: "#fb923c", status: "Planning", classStatus: "Scheduled", weekOffset: 1, classPlanId: "conversation-city" },
  { id: 14, title: "B1 Class", day: 4, startMinutes: 8 * 60, duration: 60, color: "#f97316", status: "To Plan", classStatus: "Scheduled", weekOffset: 1 },
  { id: 15, title: "Individual class", day: 5, startMinutes: 16 * 60, duration: 45, color: "#285d8d", status: "Planning", classStatus: "Rescheduled", weekOffset: 3, kind: "individual", studentName: "Diego Alves", classPlanId: "diego-can" },
];

const initialClassPlans: ClassPlan[] = [
  { id: "a2-feelings", title: "Express feelings with confidence", classGoal: "Identify common feelings and use short sentences to describe how people feel.", grammarTopics: ["To Be", "Adjectives"], resourceTitles: ["Feelings picture cards", "Vocabulary warm-up"], procedures: "Start with a picture-card warm-up. Model the target adjectives with To Be, then guide pair work where students describe each card. Finish with a quick speaking round." },
  { id: "ana-routines", title: "Talk about everyday routines", classGoal: "Describe Ana's daily routine using the present simple and time expressions.", grammarTopics: ["Present Simple", "Adverbs of frequency"], resourceTitles: ["Everyday routines", "Vocabulary warm-up"], procedures: "Review key routine verbs. Read the worksheet together, then ask Ana to create five sentences about her week. End by comparing weekday and weekend routines." },
  { id: "a2-city", title: "Describe places in the city", classGoal: "Use there is / there are and location vocabulary to describe a neighborhood.", grammarTopics: ["There is / There are", "Prepositions of place"], resourceTitles: ["City photo prompts", "Conversation starters"], procedures: "Show the city prompts and elicit vocabulary. In pairs, students describe a photo using there is / there are. Close with a short map-based speaking task." },
  { id: "b1-routines", title: "Practice daily routines", classGoal: "Discuss daily routines and habits using present simple and frequency adverbs.", grammarTopics: ["Present Simple", "Adverbs of frequency"], resourceTitles: ["Vocabulary warm-up", "Everyday routines", "Conversation starters"], procedures: "Open with a two-minute routine poll. Review frequency adverbs, then complete the worksheet in pairs. Use the conversation prompts for a final discussion and feedback round." },
  { id: "b1-travel", title: "Plan a weekend trip", classGoal: "Make suggestions and agree on a simple weekend travel plan.", grammarTopics: ["Going to", "Suggestions"], resourceTitles: ["Conversation starters", "City photo prompts"], procedures: "Introduce the trip scenario. Brainstorm activities, then have pairs choose a destination and create a short itinerary. Share plans and give peer feedback." },
  { id: "b1-storytelling", title: "Tell a memorable story", classGoal: "Sequence events in a short story using past simple time markers.", grammarTopics: ["Past Simple", "Time expressions"], resourceTitles: ["Clothes and preferences", "Project reflection sheet"], procedures: "Review past simple markers. Students order a model story, then write and share a personal three-part story. Collect a brief reflection at the end." },
  { id: "b2-modals", title: "Give advice with modal verbs", classGoal: "Give and justify advice for common workplace situations.", grammarTopics: ["Modal verbs", "Conditionals"], resourceTitles: ["Modal verbs mini-guide", "Conversation starters"], procedures: "Read the mini-guide and highlight modal verb differences. Teams solve workplace scenarios, present their advice, and compare alternative solutions." },
  { id: "conversation-city", title: "City life conversation lab", classGoal: "Sustain a conversation about city life and personal preferences.", grammarTopics: ["Conversation", "Present Simple"], resourceTitles: ["City photo prompts", "Listening lab playlist", "Conversation starters"], procedures: "Listen to a short audio prompt, discuss the city images in pairs, and rotate through conversation stations. Close with one takeaway from each student." },
  { id: "lucas-preferences", title: "Talk about likes and preferences", classGoal: "Talk about likes, dislikes, and preferences about clothes with clear reasons.", grammarTopics: ["Like + ing", "Simple Past"], resourceTitles: ["Clothes and preferences", "Vocabulary warm-up"], procedures: "Review clothing vocabulary with flashcards. Model preference questions, then guide Lucas through a short interview. Finish with a comparison activity and corrections." },
  { id: "mariana-reflection", title: "Reflect on learning progress", classGoal: "Review recent learning and set one practical goal for next week.", grammarTopics: ["Present Perfect", "Goal setting"], resourceTitles: ["Project reflection sheet", "Conversation starters"], procedures: "Discuss recent achievements. Complete the reflection sheet together, identify one challenge, and agree on a measurable study goal for the following week." },
  { id: "diego-can", title: "Talk about abilities", classGoal: "Use can and can't to describe abilities and give simple examples.", grammarTopics: ["Can / Can't", "Imperatives"], resourceTitles: ["Vocabulary warm-up", "Conversation starters"], procedures: "Warm up with ability mime cards. Review can and can't, then have Diego describe skills and create simple instructions for a partner activity." },
];

function reportingDateKey(event: PlannerEvent) {
  return event.scheduledDate ?? isoDate(addDays(startOfWeek(new Date()), event.weekOffset * 7 + event.day));
}

function reportingDate(event: PlannerEvent) {
  return new Date(`${reportingDateKey(event)}T12:00:00`);
}

function compareReportingEventsDescending(left: PlannerEvent, right: PlannerEvent) {
  const dateComparison = reportingDateKey(right).localeCompare(reportingDateKey(left));
  return dateComparison || right.startMinutes - left.startMinutes;
}

function formatLastUpdated(value?: string) {
  if (!value) return null;
  const normalizedValue = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  const updatedAt = new Date(normalizedValue);
  if (Number.isNaN(updatedAt.getTime())) return null;
  return `${updatedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · ${updatedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

function reportingStatus(event: PlannerEvent) {
  return event.kind === "custom" ? null : event.status;
}

function ReportingSelect({ value, onChange, options, ariaLabel }: { value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; ariaLabel: string }) {
  const selected = options.find((option) => option.value === value)?.label ?? options[0]?.label;
  return <Popover.Root><Popover.Trigger asChild><button type="button" className="class-reporting-select-trigger" aria-label={ariaLabel}><span className="class-reporting-select-value"><span className="class-reporting-select-avatar" aria-hidden="true">{selected?.charAt(0)}</span><span>{selected}</span></span><ChevronDown size={15} aria-hidden="true" /></button></Popover.Trigger><Popover.Portal><Popover.Content className="class-reporting-select-menu" side="bottom" align="start" sideOffset={6} collisionPadding={8}><div role="listbox" aria-label={ariaLabel}>{options.map((option) => <button type="button" role="option" aria-selected={option.value === value} className={option.value === value ? "is-selected" : ""} key={option.value} onClick={() => onChange(option.value)}><span className="class-reporting-select-value"><span className="class-reporting-select-avatar" aria-hidden="true">{option.label?.charAt(0)}</span><span>{option.label}</span></span>{option.value === value ? <Check size={15} aria-hidden="true" /> : null}</button>)}</div></Popover.Content></Popover.Portal></Popover.Root>;
}

function ClassReportingView({ events, onOpenInPlanner }: { events: PlannerEvent[]; onOpenInPlanner: (event: PlannerEvent) => void }) {
  const [query, setQuery] = useState("");
  const [selectedStudentFilters, setSelectedStudentFilters] = useState<string[]>([]);
  const [selectedGroupFilters, setSelectedGroupFilters] = useState<string[]>([]);
  const [selectedGrammarFilters, setSelectedGrammarFilters] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [selectedReportEvent, setSelectedReportEvent] = useState<PlannerEvent | null>(null);
  const [isExportingLog, setIsExportingLog] = useState(false);
  const classEvents = useMemo(() => events.filter(isClassEvent), [events]);
  const reportEvents = useMemo(() => events.filter(isClassEvent), [events]);
  const plansByEvent = useMemo(() => new Map(classEvents.map((event) => [String(event.id), classPlanForEvent(event)])), [classEvents]);
  const students = useMemo(() => Array.from(new Set(reportEvents.map((event) => event.studentName).filter((value): value is string => Boolean(value)))).sort(), [reportEvents]);
  const groups = useMemo(() => Array.from(new Set(classEvents.map((event) => event.groupName).filter((value): value is string => Boolean(value)))).sort(), [classEvents]);
  const grammars = useMemo(() => Array.from(new Set(Array.from(plansByEvent.values()).flatMap((plan) => plan?.grammarTopics ?? []))).sort(), [plansByEvent]);
  const rows = useMemo(() => reportEvents.filter((event) => {
    const plan = plansByEvent.get(String(event.id));
    const eventStudents = [event.studentName, ...(event.studentEmails ?? [])].filter(Boolean);
    const normalizedQuery = query.trim().toLowerCase();
    const searchableValues = [eventDisplayName(event), event.description, plan?.title, plan?.classGoal, plan?.procedures, ...(plan?.grammarTopics ?? [])];
    if (normalizedQuery && !searchableValues.some((value) => value?.toLowerCase().includes(normalizedQuery))) return false;
    if (selectedStudentFilters.length && !selectedStudentFilters.some((value) => eventStudents.includes(value))) return false;
    if (selectedGroupFilters.length && !selectedGroupFilters.includes(event.groupName ?? "")) return false;
    if (selectedGrammarFilters.length && !selectedGrammarFilters.some((value) => plan?.grammarTopics.includes(value))) return false;
    const dateKey = reportingDateKey(event);
    if (fromDate && dateKey < fromDate) return false;
    if (toDate && dateKey > toDate) return false;
    return true;
  }).sort(compareReportingEventsDescending), [fromDate, plansByEvent, query, reportEvents, selectedGrammarFilters, selectedGroupFilters, selectedStudentFilters, toDate]);
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  useEffect(() => { setPage(1); }, [query, selectedStudentFilters, selectedGroupFilters, selectedGrammarFilters, fromDate, toDate]);
  const visibleRows = rows.slice((page - 1) * pageSize, page * pageSize);
  const dayGroups = useMemo(() => visibleRows.reduce<Array<{ key: string; date: Date; events: PlannerEvent[] }>>((groups, event) => {
    const key = reportingDateKey(event);
    const previousGroup = groups.at(-1);
    if (previousGroup?.key === key) previousGroup.events.push(event);
    else groups.push({ key, date: reportingDate(event), events: [event] });
    return groups;
  }, []), [visibleRows]);

  function exportLog() {
    setIsExportingLog(true);
    window.setTimeout(() => setIsExportingLog(false), 2600);
  }

  const selectedPlan = selectedReportEvent ? plansByEvent.get(String(selectedReportEvent.id)) : null;
  const selectedDate = selectedReportEvent ? reportingDate(selectedReportEvent) : null;
  const selectedReportIndex = selectedReportEvent ? rows.findIndex((event) => String(event.id) === String(selectedReportEvent.id)) : -1;
  const activeFilterCount = selectedStudentFilters.length + selectedGroupFilters.length + selectedGrammarFilters.length + [fromDate, toDate].filter(Boolean).length;
  const totalClasses = rows.length;
  const taughtClasses = rows.filter((event) => event.status === "Taught").length;
  const canceledClasses = rows.filter((event) => event.classStatus === "Canceled").length;
  const rescheduledClasses = rows.filter((event) => event.classStatus?.toLowerCase().includes("resched")).length;
  const reschedulePendingClasses = rows.filter((event) => event.classStatus === "Reschedule pending").length;
  const noShowClasses = rows.filter((event) => event.classStatus === "Student no-show").length;
  const clearFilters = () => {
    setSelectedStudentFilters([]);
    setSelectedGroupFilters([]);
    setSelectedGrammarFilters([]);
    setFromDate("");
    setToDate("");
  };
  return <section className="class-reporting" aria-label="Lesson Log">
    <header className="resources-header class-reporting__header"><div className="resources-header__title-row"><div><h1>Lesson Log</h1><p>Review your class history and statuses in one place.</p></div></div><button type="button" className="outline-button" onClick={exportLog}><Download size={16} />Export log</button></header>
    <div className="class-reporting__filters resources-toolbar" aria-label="Lesson Log filters">
      <label className="resources-search class-reporting__search"><Search size={16} aria-hidden="true" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by class or content" aria-label="Search Lesson Log" />{query ? <button className="resources-search__clear" type="button" aria-label="Clear Lesson Log search" onClick={() => setQuery("")}><X size={15} aria-hidden="true" /></button> : null}</label>
      <span className="class-reporting__select"><ResourceFilterDropdown label="Students" allLabel="All students" options={students} value={selectedStudentFilters} onChange={setSelectedStudentFilters} wide /></span>
      <span className="class-reporting__select"><ResourceFilterDropdown label="Groups" allLabel="All groups" options={groups} value={selectedGroupFilters} onChange={setSelectedGroupFilters} /></span>
      <span className="class-reporting__select class-reporting__grammar-select"><ResourceFilterDropdown label="Grammars" allLabel="All grammars" options={grammars} value={selectedGrammarFilters} onChange={setSelectedGrammarFilters} wide /></span>
      <div className="class-reporting__date-range class-reporting__date-range--toolbar" aria-label="Filter by date"><label><span>From</span><ScheduleDatePicker value={fromDate} onChange={(value) => { setFromDate(value); if (toDate && value > toDate) setToDate(""); }} label="Pick a date from" placeholder="Pick a date" maxValue={toDate || undefined} /></label><label><span>To</span><ScheduleDatePicker value={toDate} onChange={setToDate} label="Pick a date to" placeholder="Pick a date" minValue={fromDate || undefined} /></label></div>
      {activeFilterCount ? <button type="button" className="class-reporting__clear-filters" onClick={clearFilters}>Clear</button> : null}
    </div>
    <div className="class-reporting__kpis" aria-label="Lesson Log overview">
      <div className="class-reporting__kpi"><span className="class-reporting__kpi-icon"><CalendarDays size={17} aria-hidden="true" /></span><span><strong>{totalClasses}</strong><small>Total classes</small></span></div>
      <div className="class-reporting__kpi"><span className="class-reporting__kpi-icon class-reporting__kpi-icon--taught"><BookCheck size={17} aria-hidden="true" /></span><span><strong>{taughtClasses}</strong><small>Classes taught</small></span></div>
      <div className="class-reporting__kpi"><span className="class-reporting__kpi-icon class-reporting__kpi-icon--canceled"><CalendarX2 size={17} aria-hidden="true" /></span><span><strong>{canceledClasses}</strong><small>Classes canceled</small></span></div>
      <div className="class-reporting__kpi"><span className="class-reporting__kpi-icon class-reporting__kpi-icon--rescheduled"><CalendarSync size={17} aria-hidden="true" /></span><span><strong>{rescheduledClasses}</strong><small>Rescheduled</small></span></div>
      <div className="class-reporting__kpi"><span className="class-reporting__kpi-icon class-reporting__kpi-icon--reschedule-pending"><CalendarClock size={17} aria-hidden="true" /></span><span><strong>{reschedulePendingClasses}</strong><small>Reschedule pending</small></span></div>
      <div className="class-reporting__kpi"><span className="class-reporting__kpi-icon class-reporting__kpi-icon--no-show"><UserRoundX size={17} aria-hidden="true" /></span><span><strong>{noShowClasses}</strong><small>Student no-show</small></span></div>
    </div>
    <div className="class-reporting__content">
      <div className="class-reporting__timeline">
        <div className="class-reporting__column-labels" aria-hidden="true">
          <span>Date</span>
          <span>Time</span>
          <span>Class</span>
          <span>Lesson Goal</span>
          <span>Grammars</span>
          <span>Lesson Summary</span>
          <span>Status</span>
        </div>
        {dayGroups.map(({ key, date, events: dayEvents }) => (
          <section className="class-reporting__day" key={key}>
            <header className="class-reporting__day-header">
              <strong>{date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</strong>
            </header>
            <div className="class-reporting__day-events">
              {dayEvents.map((event) => {
                const eventDate = reportingDate(event);
                const lesson = lessonLogDetails(event);
                return <button className="class-reporting__timeline-row" type="button" key={event.id} onClick={() => onOpenInPlanner(event)} aria-label={`Open details for ${eventDisplayName(event)}`}>
                  <span className="class-reporting__date">{eventDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  <span className="class-reporting__time"><strong>{formatTime(event.startMinutes)}</strong><span>{formatTime(event.startMinutes + event.duration)}</span></span>
                  <span className="class-reporting__session">
                    <span className="class-reporting__session-heading"><ReportingEventIdentity event={event} /><strong>{eventDisplayName(event)}</strong></span>
                  </span>
                  <span className="class-reporting__lesson-goal" title={lesson.goal}>{lesson.goal}</span>
                  <span className="class-reporting__grammar-topics">{lesson.grammars.length ? lesson.grammars.slice(0, 2).map((topic) => <span className="topic-badge" key={topic}>{topic}</span>) : <span className="class-reporting__empty-cell">—</span>}</span>
                  <span className={`class-reporting__summary${lesson.summary ? "" : " is-empty"}`}>{lesson.summary || "—"}</span>
                  {event.classStatus ? <span className="class-reporting__status-group"><ClassStatusIndicator status={event.classStatus} showLabel /></span> : null}
                  <ChevronRight className="class-reporting__open" size={18} aria-hidden="true" />
                </button>;
              })}
            </div>
          </section>
        ))}
        {!rows.length ? <div className="class-reporting__empty">No classes match these filters.</div> : null}
      </div>
    <footer className="class-reporting__footer"><span>Showing {Math.min(page * pageSize, rows.length)} of {rows.length}</span><div className="class-reporting__pagination"><button type="button" className="pagination-button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button><button type="button" className="pagination-button is-current" aria-current="page">{page}</button><button type="button" className="pagination-button" disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</button></div></footer></div>
    {selectedReportEvent ? <div className="class-reporting-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedReportEvent(null); }}><section className="class-reporting-dialog" role="dialog" aria-modal="true" aria-labelledby="class-reporting-detail-title"><aside className="class-reporting-dialog__timeline" aria-label="Class history by date"><span>Class history</span><div>{rows.map((event) => { const date = reportingDate(event); const selected = String(event.id) === String(selectedReportEvent.id); return <button className={selected ? "is-active" : ""} type="button" key={event.id} onClick={() => setSelectedReportEvent(event)}><strong>{date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</strong><span>{formatTime(event.startMinutes)} · {eventDisplayName(event)}</span></button>; })}</div></aside><div className="class-reporting-dialog__main"><header><div><span>Class details</span><h2 id="class-reporting-detail-title">{eventDisplayName(selectedReportEvent)}</h2><p>{selectedDate?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} · {formatTime(selectedReportEvent.startMinutes)}–{formatTime(selectedReportEvent.startMinutes + selectedReportEvent.duration)}</p></div><button type="button" className="icon-button icon-button--quiet" onClick={() => setSelectedReportEvent(null)} aria-label="Close class details" autoFocus><X size={18} /></button></header><div className="class-reporting-dialog__body"><div className="class-reporting-dialog__status">{reportingStatus(selectedReportEvent) ? <span className={`class-reporting__status is-${statusSlug(selectedReportEvent.status)}`}><PlanningStatusIndicator status={selectedReportEvent.status} />{selectedReportEvent.status}</span> : <span className="class-reporting__status is-not-applicable">—</span>}{selectedReportEvent.classStatus ? <ClassStatusIndicator status={selectedReportEvent.classStatus} showLabel /> : null}</div><section><span>Lesson goal</span><p>{selectedPlan?.classGoal ?? selectedReportEvent.description ?? "No class goal recorded."}</p></section><section><span>Grammar</span>{selectedPlan?.grammarTopics.length ? <div className="topic-list">{selectedPlan.grammarTopics.map((topic) => <span className="topic-badge" key={topic}>{topic}</span>)}</div> : <p>No grammar topics recorded.</p>}</section><section><span>Lesson resources</span>{selectedPlan?.resourceTitles.length ? <ul className="class-reporting-dialog__resources">{selectedPlan.resourceTitles.map((resource) => <li key={resource}><Paperclip size={15} />{resource}</li>)}</ul> : <p>No lesson resources recorded.</p>}</section><section><span>Procedures &amp; lesson content</span><p className="class-reporting-dialog__procedures">{selectedPlan?.procedures ?? selectedReportEvent.description ?? "No lesson content recorded."}</p></section><section><span>Participants</span><p>{selectedReportEvent.studentName ?? selectedReportEvent.groupName ?? selectedReportEvent.studentEmails?.join(", ") ?? "No participant recorded"}</p></section></div><footer><span>{selectedReportIndex + 1} of {rows.length} classes</span><div><button type="button" className="outline-button" onClick={() => setSelectedReportEvent(null)}>Close</button><button type="button" className="primary-button" onClick={() => onOpenInPlanner(selectedReportEvent)}>Open in Planner<ChevronRight size={16} /></button></div></footer></div></section></div> : null}
    {isExportingLog ? <div className="calendar-toast calendar-toast--success" role="status" aria-live="polite"><span className="calendar-toast__icon" aria-hidden="true"><Check size={16} strokeWidth={2.5} /></span><div className="calendar-toast__copy"><strong>Log is being prepared</strong><span>Your class report will be ready shortly.</span></div></div> : null}
  </section>;
}

const classPlanCache = new Map<number, ClassPlan | null>();

function fetchClassPlanForEvent(event: PlannerEvent, signal?: AbortSignal) {
  const cachedPlan = classPlanCache.get(event.id);
  if (classPlanCache.has(event.id)) return Promise.resolve(cachedPlan);

  const delay = 420 + (event.id % 4) * 140;
  return new Promise<ClassPlan | null>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      const plan = classPlanForEvent(event) ?? null;
      classPlanCache.set(event.id, plan);
      resolve(plan);
    }, delay);

    signal?.addEventListener("abort", () => {
      window.clearTimeout(timeout);
      reject(new DOMException("Class plan request cancelled", "AbortError"));
    }, { once: true });
  });
}

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
type NationalHoliday = { date: string; name: string; type: string };

function holidayDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const defaultResourcePreviewImage = "https://www.figma.com/api/mcp/asset/0ff82c3c-f799-4970-902a-caa2082dc49e.png";
const resourcePreviewImages: Record<string, string> = {
  "Vocabulary warm-up": "/resources/classroom-vocabulary.png",
  "Clothes and preferences": "/resources/clothing-flashcards.png",
  "Conversation starters": "/resources/grammar-notes.png",
  "City photo prompts": "/resources/city-prompts.png",
  "Feelings picture cards": "/resources/clothing-flashcards.png",
  "Listening lab playlist": "/resources/listening-lab.png",
  "Modal verbs mini-guide": "/resources/grammar-notes.png",
  "Project reflection sheet": "/resources/grammar-notes.png",
};

function resourceValues(value: string) {
  const normalized = value?.trim();
  if (!normalized || normalized === "—" || normalized === "â€”") return [];
  return normalized.split(",").map((item) => item.trim()).filter(Boolean);
}

function resourcePreviewSource(resource: ResourceRecord) {
  if (resourcePreviewImages[resource.title]) return resourcePreviewImages[resource.title];
  const isImage = /^(PNG|JPG|JPEG|Image)$/i.test(resource.type) || /\.(png|jpe?g)(\?.*)?$/i.test(resource.source ?? "");
  return isImage && resource.source ? resource.source : defaultResourcePreviewImage;
}

function resourceListPreviewSource(resource: ResourceRecord) {
  return resourcePreviewImages[resource.title];
}

function ResourceGrammarSummary({ value }: { value: string }) {
  const grammars = resourceValues(value);
  if (!grammars.length) return null;
  const visibleGrammars = grammars.slice(0, 2);
  const hiddenCount = Math.max(grammars.length - visibleGrammars.length, 0);
  const fullLabel = `Grammars: ${grammars.join(", ")}`;

  return <span className="resource-list-item__grammar" title={hiddenCount > 0 ? fullLabel : undefined} aria-label={fullLabel} data-tooltip={hiddenCount > 0 ? fullLabel : undefined} tabIndex={hiddenCount > 0 ? 0 : undefined}>
    <span className="resource-list-item__grammar-text resource-list-item__badge-group">
      {visibleGrammars.map((grammar) => <span className="resource-list-item__meta-badge" key={grammar}>{grammar}</span>)}
      {hiddenCount > 0 ? <b className="resource-list-item__grammar-more">+{hiddenCount}</b> : null}
    </span>
  </span>;
}

function ResourceLevelSummary({ value }: { value: string }) {
  const levels = resourceValues(value);
  if (!levels.length) return null;
  return <span className="resource-list-item__level" aria-label={`Levels: ${levels.join(", ")}`}>
    <span className="resource-list-item__badge-group">{levels.map((level) => <span className="resource-list-item__meta-badge" key={level}>{level}</span>)}</span>
  </span>;
}

function resourceSourceLabel(resource: ResourceRecord) {
  if (!resource.source) return resource.size;
  if (/^https?:\/\//i.test(resource.source)) return resource.type === "Web link" || resource.type === "Interactive" ? "Online resource" : `${resource.type} preview`;
  return resource.source;
}

function ResourceTypeIcon({ type }: { type: string }) {
  if (/link|interactive/i.test(type)) return <Link size={20} strokeWidth={1.5} />;
  if (/png|jpe?g|image/i.test(type)) return <ImagePlay size={20} strokeWidth={1.5} />;
  if (/pdf|docx|document/i.test(type)) return <FileText size={20} strokeWidth={1.5} />;
  return <FileBadge2 size={20} strokeWidth={1.5} />;
}

function ResourcePreviewImage({ resource, detail = false }: { resource: ResourceRecord; detail?: boolean }) {
  const source = resourcePreviewSource(resource);
  const [hasError, setHasError] = useState(false);
  const fallbackClass = `${detail ? "resource-detail-preview__fallback" : "resource-list-item__thumb--" + resourceThumbTone(resource.type)}`;
  if (hasError || !source) return <div className={fallbackClass} aria-hidden="true"><ResourceTypeIcon type={resource.type} /></div>;
  return <img src={source} alt={detail ? `${resource.title} preview` : ""} onError={() => setHasError(true)} />;
}

function resourceThumbTone(type: string) {
  if (/link|interactive/i.test(type)) return "link";
  if (/png|jpe?g|image/i.test(type)) return "image";
  if (/pdf/i.test(type)) return "pdf";
  if (/docx|document/i.test(type)) return "document";
  return "file";
}

const initialResources: ResourceRecord[] = [
  { title: "Vocabulary warm-up", level: "A1", grammar: "Present Simple", tags: ["Flashcards", "Classroom"], type: "PDF", size: "200 kb", source: "Vocabulary warm-up.pdf", instructions: "Use the cards for a quick five-minute vocabulary review." },
  { title: "Clothes and preferences", level: "A1, A2", grammar: "Past Simple", tags: ["Lesson material", "Speaking"], type: "PDF", size: "320 kb", source: "Clothes and preferences.pdf", instructions: "Pair students and ask them to compare past clothing choices." },
  { title: "Conversation starters", level: "B1, B2", grammar: "Conversation", tags: ["Activity", "Pair work"], type: "Interactive", size: "Link", source: "https://example.com/conversation-starters", instructions: "Open the activity and let each pair choose three prompts." },
  { title: "Circus Wonders", level: "Y2", grammar: "Vocabulary", tags: ["Game", "Warm-up"], type: "Web link", size: "Link", source: "https://example.com/circus-wonders", instructions: "Use the game as a playful warm-up before the lesson." },
  { title: "Everyday routines", level: "A2", grammar: "Present Continuous", tags: ["Worksheet", "Grammar"], type: "DOCX", size: "180 kb", source: "Everyday routines.docx", instructions: "Print one worksheet per student and review answers together." },
  { title: "City photo prompts", level: "A2, B1", grammar: "Present Simple, Vocabulary, Conversation, Past Simple", tags: ["Speaking", "Activity"], type: "PNG", size: "1.2 MB", source: defaultResourcePreviewImage, instructions: "Ask students to describe what they can see in each photo." },
  { title: "Feelings picture cards", level: "A1, A2", grammar: "Vocabulary", tags: ["Flashcards"], type: "JPG", size: "860 kb", source: defaultResourcePreviewImage, instructions: "Use the pictures to practice basic feelings and short sentences." },
  { title: "Modal verbs mini-guide", level: "B2", grammar: "", tags: ["Grammar"], type: "PDF", size: "410 kb", source: "Modal verbs mini-guide.pdf", instructions: "Use the examples as a reference during the grammar activity." },
  { title: "Listening lab playlist", level: "", grammar: "Conversation", tags: [], type: "Web link", size: "Link", source: "https://example.com/listening-lab", instructions: "Play one track and ask students to note key expressions." },
  { title: "Project reflection sheet", level: "", grammar: "", tags: [], type: "DOCX", size: "96 kb", source: "Project reflection sheet.docx", instructions: "Give students time to complete the reflection at the end of class." },
];
const initialStudents: StudentRecord[] = [
  { id: 1, name: "Student sem Grupo", email: "stdnt.sm.grp@email.com", status: "Enabled", level: "A1", progress: 0, studyTime: "00:00 hr", weeklyGoal: "00:00 hr / 01 hr", lastSeen: "-", attendance: ["absent", "absent", "absent", "absent"] },
  { id: 2, name: "Student 1", email: "1@student.com", status: "Enabled", level: "A2+", progress: 0, studyTime: "00:00 hr", weeklyGoal: "00:00 hr / 01 hr", lastSeen: "4 hours ago", attendance: ["absent", "absent", "absent", "absent"] },
  { id: 3, name: "Student 2", email: "2@student.com", status: "Enabled", level: "A1", progress: 8, studyTime: "01 min", weeklyGoal: "00:00 hr / 01 hr", lastSeen: "a month ago", attendance: ["present", "present", "absent", "present"] },
  { id: 4, name: "Teste Desabilitar", email: "testedeshabilitar@flexge.com", status: "Disabled", level: "A1", progress: 0, studyTime: "00:00 hr", weeklyGoal: "00:00 hr / 01 hr", lastSeen: "-", attendance: ["absent", "absent", "absent", "absent"] },
];
const resourceTagOptions = ["Flashcards", "Classroom", "Lesson material", "Speaking", "Activity", "Pair work", "Game", "Warm-up", "Worksheet", "Grammar"];
const hours = Array.from({ length: 24 }, (_, index) => index);
const calendarHourHeight = 88;

function appNow() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    hour12: false,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return new Date(Number(value.year), Number(value.month) - 1, Number(value.day), Number(value.hour), Number(value.minute), Number(value.second));
}

function layoutOverlappingEvents(items: PlannerEvent[]) {
  const sorted = [...items].sort((left, right) => left.startMinutes - right.startMinutes);
  const groups: PlannerEvent[][] = [];
  let currentGroup: PlannerEvent[] = [];
  let groupEnd = -1;

  sorted.forEach((item) => {
    const itemEnd = item.startMinutes + item.duration;
    if (currentGroup.length && item.startMinutes >= groupEnd) {
      groups.push(currentGroup);
      currentGroup = [];
      groupEnd = -1;
    }
    currentGroup.push(item);
    groupEnd = Math.max(groupEnd, itemEnd);
  });
  if (currentGroup.length) groups.push(currentGroup);

  return groups.flatMap((group) => group.map((item, stackIndex) => ({ item, stackIndex, overlapCount: group.length })));
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - copy.getDay());
  return copy;
}

function addDays(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function formatTime(totalMinutes: number) {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatHourLabel(hour: number) {
  const displayHour = hour % 12 || 12;
  return `${String(displayHour).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
}

const studentAvatarImages: Record<string, string> = {
  "Ana Martins": "/avatar-photo.png",
  "Gabriel Santos": "/avatar-photo-gabriel.png",
  "Lucas Almeida": "/avatar-photo-gabriel.png",
  "Mariana Costa": "/avatar-photo-mariana.png",
  "Ana Beatriz Costa": "/student-avatars/ana-beatriz-costa.png",
  "Camila Pereira": "/student-avatars/camila-pereira.png",
  "Gabriel Santos": "/student-avatars/gabriel-santos.png",
  "Lucas Oliveira": "/student-avatars/lucas-oliveira.png",
  "Mariana Silva": "/student-avatars/mariana-silva.png",
  "Rafael Souza": "/student-avatars/rafael-souza.png",
};

function StudentAvatar({ name, className }: { name: string; className: string }) {
  const image = studentAvatarImages[name];

  if (image) {
    return <img className={className} src={image} alt="" aria-hidden="true" />;
  }

  return <span className={className}>{name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span>;
}

function DesktopOnly() {
  return (
    <main className="desktop-only">
      <div className="desktop-only__icon"><Monitor size={30} /></div>
      <span className="eyebrow">Planner</span>
      <h1>Disponível apenas no desktop</h1>
      <p>Para visualizar e organizar seu calendário, acesse esta página em uma tela com pelo menos 1024 px de largura.</p>
    </main>
  );
}

const participants = [
  "Gabriel Santos",
  "Mariana Costa",
  "Rafael Paz da Silva",
  "Ana Martins",
  "Bruno Lima",
  "Camila Rocha",
  "Diego Alves",
];

const participantPerformance: Record<string, GrammarPerformance[]> = {
  "Gabriel Santos": [
    { grammar: "To Be - Present Tense", attempts: 3, error: "0%" },
    { grammar: "Possessive Adjectives", attempts: 1, error: "0%" },
  ],
  "Mariana Costa": [
    { grammar: "Present Simple", attempts: 4, error: "25%" },
    { grammar: "Subject Pronouns", attempts: 2, error: "0%" },
  ],
  "Rafael Paz da Silva": [
    { grammar: "Past Simple", attempts: 3, error: "17%" },
    { grammar: "To Be - Past Tense", attempts: 2, error: "0%" },
  ],
  "Ana Martins": [
    { grammar: "There is / There are", attempts: 2, error: "0%" },
    { grammar: "Prepositions of Place", attempts: 3, error: "33%" },
  ],
  "Bruno Lima": [
    { grammar: "To Be - Present Tense", attempts: 3, error: "0%" },
    { grammar: "Possessive Adjectives", attempts: 1, error: "0%" },
  ],
  "Camila Rocha": [
  ],
  "Diego Alves": [
    { grammar: "Can / Can't", attempts: 2, error: "0%" },
    { grammar: "Imperatives", attempts: 1, error: "0%" },
  ],
};

function EventDetailPopover({
  event,
  date,
  onClose,
  onViewPlan,
  onEdit,
  onDelete,
  onStatusChange,
  isFullEnglish = false,
}: {
  event: PlannerEvent;
  date: Date;
  onClose: () => void;
  onViewPlan: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange?: (status: ClassStatus) => void;
  isFullEnglish?: boolean;
}) {
  const [resourcesExpanded, setResourcesExpanded] = useState(true);
  const [expandedParticipants, setExpandedParticipants] = useState<string[]>(["Bruno Lima"]);
  const dateLabel = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const classPlan = classPlanForEvent(event);
  const teacherNames = event.teacherNames?.filter(Boolean) ?? [];
  const teacherLabel = teacherNames.length ? teacherNames.join(", ") : "No teacher assigned";
  const savedParticipants = (event.studentEmails ?? []).map((email) => scheduleStudents.find((student) => student.email === email)?.name ?? email);
  const visibleParticipants = event.kind === "group" ? participants : savedParticipants;
  const participantLabel = event.groupName ?? (event.kind === "custom" ? "Custom class" : event.kind === "other" ? "Participants" : "No participants");

  return (
    <div className={`event-popover event-popover--status-${statusSlug(event.status)} ${event.kind === "individual" ? "event-popover--individual" : ""} ${isClassEvent(event) ? "" : "event-popover--nonclass"}`} role="dialog" aria-labelledby={`event-popover-title-${event.id}`}>
      <header className="event-popover__header">
        <div className="event-popover__topline">
          <div className="event-popover__actions">
            <button type="button" aria-label="Edit event" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onEdit(); }}><Pencil size={14} /></button>
            <button type="button" aria-label="Delete event" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onDelete(); }}><Trash2 size={14} /></button>
            <button type="button" aria-label="Close class details" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); onClose(); }}><X size={15} /></button>
          </div>
        </div>
        <div className="event-popover__identity">
          <PopoverEventIcon event={event} />
          <div className="event-popover__title">
            <h2 id={`event-popover-title-${event.id}`}>{eventDisplayName(event)}</h2>
            <p>{dateLabel} · {formatTime(event.startMinutes)}-{formatTime(event.startMinutes + event.duration)}</p>
          </div>
        </div>
        {isClassEvent(event) ? <div className="event-popover__statuses">
          {onStatusChange ? <ClassStatusSelect status={event.classStatus} onChange={onStatusChange} /> : <ClassStatusIndicator status={event.classStatus} showLabel />}
          <div className={`event-popover__status event-popover__status--${statusSlug(event.status)}`}><span><PlanningStatusIndicator status={event.status} />{event.status}</span></div>
        </div> : null}
      </header>

      <div className="event-popover__body">
        {!isClassEvent(event) ? <section className="event-popover__event-summary"><p className="event-popover__event-type">{event.kind === "task" ? "Task" : event.kind === "away" ? "Away" : "Other event"}</p>{event.description ? <p>{event.description}</p> : null}</section> : null}
        {isFullEnglish && isClassEvent(event) && event.observation ? <section className="detail-section event-popover__observation"><FileText size={18} aria-hidden="true" /><div className="detail-section__content"><p className="detail-objective">Observation</p><p>{event.observation}</p></div></section> : null}
        <section className="detail-section detail-section--meeting">
          <Video size={19} />
          {isFullEnglish && event.id === 5 ? <div className="detail-meeting-unavailable" tabIndex={0} aria-describedby="meeting-unavailable-message">
            <button type="button" className="detail-link detail-link--disabled" disabled aria-describedby="meeting-unavailable-message">Join Google Meet<ChevronRight size={14} /></button>
            <span id="meeting-unavailable-message" role="tooltip">Lesson unavailable at the moment</span>
          </div> : <>
            <div>
              <button type="button" className="detail-link">Join Google Meet<ChevronRight size={14} /></button>
              <p>meet.google.com/qez-aaa-bbb</p>
            </div>
            <button type="button" className="mini-action" aria-label="Copy meeting link"><Copy size={15} /></button>
          </>}
        </section>

        <div className="detail-separator" />

        {classPlan ? <>
          <section className="detail-section detail-section--plan">
            <Target size={18} />
            <div className="detail-section__content">
              <p className="detail-objective">{classPlan.classGoal}</p>
              <div className="topic-list" aria-label="Grammar topics">{classPlan.grammarTopics.map((topic) => <span className="topic-badge" key={topic}>{topic}</span>)}</div>
              <button
                type="button"
                className="resource-heading"
                aria-expanded={resourcesExpanded}
                aria-controls={`resource-list-${event.id}`}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => { event.stopPropagation(); setResourcesExpanded((current) => !current); }}
              >
                <Paperclip size={16} /><span>{classPlan.resourceTitles.length} Resources</span><ChevronDown className="resource-heading__chevron" size={15} />
              </button>
              <div className={`resource-accordion ${resourcesExpanded ? "is-expanded" : ""}`} id={`resource-list-${event.id}`}>
                <ul className="resource-list">
                  {classPlan.resourceTitles.map((title) => {
                    const resource = initialResources.find((item) => item.title === title);
                    return <li key={title}><FileText size={15} /><span>{title}{resource ? <small>&middot; {resource.type} &middot; {resource.size}</small> : null}</span></li>;
                  })}
                </ul>
              </div>
            </div>
          </section>

          <div className="detail-separator" />
        </> : null}

        {isFullEnglish ? <>
          <section className="attendance-section" aria-label="Lesson Attendance">
            <Hand className="attendance-section__icon" size={20} aria-hidden="true" />
            <div className="attendance-section__content">
              <p className="attendance-section__title">Lesson Attendance</p>
              <div className="attendance-section__stats">
                <div><span>Average attendance</span><strong>0% · 0 / 20</strong><em>Small</em></div>
                <div><span>Previous lessons</span><p className="attendance-section__previous-classes" aria-label="Four previous lessons"><i className="is-neutral" /><i className="is-present" /><i className="is-present" /><i className="is-absent" /></p></div>
              </div>
            </div>
          </section>
          <div className="detail-separator" />
        </> : null}

        <section className="people-section">
          <div className="people-row">
            <User size={18} />
            <p><span>Teacher</span> {teacherLabel}</p>
          </div>
          {event.kind === "individual" ? (
            <div className="individual-student-card">
              <StudentAvatar name={event.studentName ?? "Student"} className="student-avatar student-avatar--primary" />
              <span>{event.studentName ?? "Student"}</span>
            </div>
          ) : <div className="people-heading">
            <span className="group-indicator" aria-hidden="true" />
            <span className="people-heading__label">{participantLabel} <small>&middot; {visibleParticipants.length} {visibleParticipants.length === 1 ? "Student" : "Students"}</small></span>
          </div>}
          {event.kind !== "individual" && <div className="student-list" id={`student-list-${event.id}`}>
            {visibleParticipants.map((name, index) => {
                const isExpanded = expandedParticipants.includes(name);
                const performance = participantPerformance[name] ?? [];
                const performanceId = `student-performance-${event.id}-${index}`;
                const attendance = index % 3 === 0 ? ["present", "present", "absent", "present"] : index % 3 === 1 ? ["present", "absent", "present", "present"] : ["absent", "present", "absent", "present"];

                return (
                  <div className={`student-entry ${isExpanded ? "is-expanded" : ""}`} key={name}>
                    <button
                      className={`student-row${isFullEnglish ? " student-row--attendance" : ""}`}
                      type="button"
                      aria-expanded={isExpanded}
                      aria-controls={performanceId}
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => { event.stopPropagation(); setExpandedParticipants((current) => current.includes(name) ? current.filter((participant) => participant !== name) : [...current, name]); }}
                    >
                      <StudentAvatar name={name} className={`student-avatar student-avatar--${index + 1}`} />
                      <span>{name}</span>
                      {isFullEnglish ? <span className="student-row__attendance" aria-label="Attendance for four previous lessons">{attendance.map((status, attendanceIndex) => <span key={attendanceIndex} className={`student-row__attendance-mark student-row__attendance-mark--${status}`} title={status === "present" ? "Present" : "Absent"}>{status === "present" ? <Check size={11} aria-hidden="true" /> : <X size={11} aria-hidden="true" />}</span>)}</span> : null}
                      <ChevronDown className="student-row__chevron" size={14} />
                    </button>
                    <div className={`student-performance ${isExpanded ? "is-visible" : ""}`} id={performanceId} aria-hidden={!isExpanded}>
                      <div className="student-performance__inner">
                        {performance.length ? <table className="student-performance__table">
                            <thead><tr><th scope="col">Grammar</th><th scope="col">Attempts</th><th scope="col">% Error</th></tr></thead>
                            <tbody>{performance.map((item) => <tr key={item.grammar}><td>{item.grammar}</td><td>{item.attempts}</td><td>{item.error}</td></tr>)}</tbody>
                          </table> : <div className="student-performance__empty" role="status">
                            <Inbox size={24} strokeWidth={1.7} aria-hidden="true" />
                            <p>No grammars studied since the last meeting.</p>
                          </div>}
                      </div>
                    </div>
                  </div>
                );
            })}
          </div>}
        </section>
      </div>

      <footer className="event-popover__footer">
        <button type="button" onClick={onViewPlan}>{classPlan ? "View Lesson Plan" : "Create Lesson Plan"}<ChevronRight size={16} /></button>
      </footer>
    </div>
  );
}

const planningTools = [
  ["Analytics", "/planning-tool-analytics.svg"],
  ["Lessons", "/planning-tool-upcoming.svg"],
  ["Notes", "/planning-tool-notes.svg"],
] as const;
const editorTools = [Bold, Italic, Underline, Strikethrough, AlignLeft, AlignJustify, Link] as const;
type CalendarPresentation = "calendar" | "schedule";

function CalendarViewTabs({ value, onValueChange }: { value: CalendarPresentation; onValueChange: (value: CalendarPresentation) => void }) {
  return <label className="calendar-view-select" aria-label="Planner view">
    <CalendarDays size={16} aria-hidden="true" />
    <select value={value} onChange={(event) => onValueChange(event.target.value as CalendarPresentation)}>
      <option value="calendar">Week</option>
      <option value="schedule">Schedule</option>
    </select>
    <ChevronDown size={15} aria-hidden="true" />
  </label>;
}

function StackedClassCard({ item, date, selectedEvent, onSelectedEventChange, onViewPlan, onEdit, onDelete, onStatusChange, isFullEnglish = false }: { item: PlannerEvent; date: Date; selectedEvent: PlannerEvent | null; onSelectedEventChange: (event: PlannerEvent | null) => void; onViewPlan: (event: PlannerEvent, date: Date) => void; onEdit: (event: PlannerEvent) => void; onDelete: (event: PlannerEvent) => void; onStatusChange?: (status: ClassStatus) => void; isFullEnglish?: boolean }) {
  const classPlan = classPlanForEvent(item);
  const isIndividual = item.kind === "individual";
  const displayTitle = eventDisplayName(item);
  const timeLabel = `${formatTime(item.startMinutes)} – ${formatTime(item.startMinutes + item.duration)}`;

  return <Popover.Root open={selectedEvent?.id === item.id} onOpenChange={(open) => onSelectedEventChange(open ? item : null)}>
    <Popover.Trigger asChild>
      <button type="button" className={`class-stack-card class-stack-card--status-${statusSlug(item.status)}`} aria-haspopup="dialog" aria-expanded={selectedEvent?.id === item.id}>
        <span className="class-stack-card__metadata">
          <span className="class-stack-card__identity">
            {isIndividual ? <StudentAvatar name={item.studentName ?? "Student"} className="class-stack-card__avatar" /> : <span className="class-stack-card__marker" style={{ background: item.color }} />}
            <span className="class-stack-card__name">{displayTitle}</span>
          </span>
          <span className="class-stack-card__time">{timeLabel}</span>
        </span>
        {isClassEvent(item) ? <span className="class-stack-card__statuses"><ClassStatusIndicator status={item.classStatus} showLabel /><span className="event-card__status-separator" aria-hidden="true" /><span className={`planning-status-label planning-status-label--${statusSlug(item.status)}`}><PlanningStatusIndicator status={item.status} /><span>{item.status}</span></span></span> : null}
        <span className="class-stack-card__divider" aria-hidden="true" />
        {classPlan ? <>
        <span className="class-stack-card__plan">
          <span className="class-stack-card__plan-title"><Target size={16} aria-hidden="true" /><span>{classPlan.title}</span></span>
          <span className="class-stack-card__topics">{classPlan.grammarTopics.slice(0, 2).map((topic) => <span key={topic}>{topic}</span>)}</span>
          <span className="class-stack-card__resources"><Paperclip size={16} aria-hidden="true" />{classPlan.resourceTitles.length} Resources</span>
        </span></> : <span className="class-stack-card__empty-plan">No lesson plan yet</span>}
      </button>
    </Popover.Trigger>
    <Popover.Portal>
      <Popover.Content className="event-popover-positioner" side="left" align="center" sideOffset={8} collisionPadding={16} sticky="always" avoidCollisions hideWhenDetached>
        <EventDetailPopover event={item} date={date} onClose={() => onSelectedEventChange(null)} onViewPlan={() => { onSelectedEventChange(null); onViewPlan(item, date); }} onEdit={() => onEdit(item)} onDelete={() => onDelete(item)} onStatusChange={onStatusChange} isFullEnglish={isFullEnglish} />
      </Popover.Content>
    </Popover.Portal>
  </Popover.Root>;
}

function EditorToolbar() {
  return <div className="class-plan-editor__toolbar" aria-label="Text formatting">
    {editorTools.map((Icon, index) => <button type="button" key={index} aria-label="Formatting option"><Icon size={15} /></button>)}
  </div>;
}

function PlanningTools({ activeTool, onToolChange }: { activeTool: string | null; onToolChange: (tool: string) => void }) {
  return <aside className="planning-tools" aria-label="Planning tools">
    {planningTools.map(([label, iconSrc]) => (
      <button type="button" className={`planning-tool ${activeTool === label ? "is-active" : ""}`} key={label} aria-label={label} aria-pressed={activeTool === label} onClick={() => onToolChange(activeTool === label ? "" : label)}>
        <img src={iconSrc} alt="" width="24" height="24" aria-hidden="true" />
        <span>{label}</span>
      </button>
    ))}
  </aside>;
}

function ScheduleAgendaView({ days, events, weekOffset, selectedEvent, onSelectedEventChange, onViewPlan, onEdit, onDelete, onStatusChange, isFullEnglish = false }: { days: { date: Date; index: number }[]; events: PlannerEvent[]; weekOffset: number; selectedEvent: PlannerEvent | null; onSelectedEventChange: (event: PlannerEvent | null) => void; onViewPlan: (event: PlannerEvent, date: Date) => void; onEdit: (event: PlannerEvent) => void; onDelete: (event: PlannerEvent) => void; onStatusChange: (event: PlannerEvent, status: ClassStatus) => void; isFullEnglish?: boolean }) {
  const dayGroups = days.map(({ date, index }) => ({ date, index, events: events.filter((event) => event.weekOffset === weekOffset && event.day === index).sort((left, right) => left.startMinutes - right.startMinutes) })).filter((group) => group.events.length);
  return <section className="schedule-agenda schedule-agenda--enter" id="schedule-view-panel" role="tabpanel" aria-labelledby="schedule-view-tab">
    {dayGroups.length ? dayGroups.map(({ date, index, events: dayEvents }) => <section className="schedule-agenda__day" key={date.toISOString()} aria-label={date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}>
      <header className="schedule-agenda__date"><strong>{date.getDate()}</strong><span>{date.toLocaleDateString("en-US", { weekday: "short", month: "short" })}</span></header>
      <div className="schedule-agenda__events">{dayEvents.map((event) => {
        const allDay = event.allDay || event.duration >= 24 * 60;
        const detail = event.studentName ?? event.groupName ?? event.teacherNames?.[0] ?? event.description;
        return <Popover.Root key={event.id} open={selectedEvent?.id === event.id} onOpenChange={(open) => onSelectedEventChange(open ? event : null)}><Popover.Trigger asChild><button type="button" className={`schedule-agenda__row schedule-agenda__row--status-${statusSlug(event.status)}`} aria-haspopup="dialog" aria-expanded={selectedEvent?.id === event.id}>
          <span className="schedule-agenda__identity"><EventIdentity event={event} compact /></span>
          <span className="schedule-agenda__time">{allDay ? "All day" : `${formatTime(event.startMinutes)} – ${formatTime(event.startMinutes + event.duration)}`}</span>
          <span className="schedule-agenda__title"><strong>{eventDisplayName(event)}</strong></span>
          <span className="schedule-agenda__detail">{detail ?? "—"}</span>
          {isClassEvent(event) ? <span className="schedule-agenda__statuses"><ClassStatusIndicator status={event.classStatus} showLabel /><span className={`planning-status-label planning-status-label--${statusSlug(event.status)}`}><PlanningStatusIndicator status={event.status} /><span>{event.status}</span></span></span> : null}
        </button></Popover.Trigger><Popover.Portal><Popover.Content className="event-popover-positioner event-popover-positioner--agenda" side="bottom" align="end" sideOffset={8} collisionPadding={16} sticky="always" avoidCollisions hideWhenDetached><EventDetailPopover event={event} date={date} onClose={() => onSelectedEventChange(null)} onViewPlan={() => { onSelectedEventChange(null); onViewPlan(event, date); }} onEdit={() => onEdit(event)} onDelete={() => onDelete(event)} onStatusChange={(status) => onStatusChange(event, status)} isFullEnglish={isFullEnglish} /></Popover.Content></Popover.Portal></Popover.Root>;
      })}</div>
    </section>) : <div className="schedule-agenda__empty">No events in this period.</div>}
  </section>;
}

function LessonsPanelSkeleton() {
  return <div className="planning-classes-skeleton" aria-hidden="true">
    <span className="planning-classes-skeleton__month" />
    {[1, 2, 3].map((item) => <span className="planning-classes-skeleton__card" key={item}><i /><b /><em /></span>)}
    <span className="planning-classes-skeleton__month planning-classes-skeleton__month--short" />
    {[1, 2].map((item) => <span className="planning-classes-skeleton__card" key={`next-${item}`}><i /><b /><em /></span>)}
  </div>;
}

function ClassPlanSkeleton() {
  return <main className="class-plan-main class-plan-loading" aria-busy="true" aria-live="polite" aria-label="Loading lesson plan">
    <div className="class-plan-form class-plan-skeleton">
      <div className="class-plan-form__actions"><span className="class-plan-skeleton__line class-plan-skeleton__line--button" /><span className="class-plan-skeleton__line class-plan-skeleton__line--button" /></div>
      <div className="class-plan-fields">
        {[["goal", "field"], ["grammar", "field"], ["resources", "tags"], ["procedures", "editor"]].map(([key, kind]) => <div className="class-plan-field" key={key}>
          <span className="class-plan-skeleton__line class-plan-skeleton__line--label" />
          <span className={`class-plan-skeleton__${kind}`} />
        </div>)}
      </div>
    </div>
    <span className="sr-only">Loading lesson plan</span>
  </main>;
}

function ClassPlanErrorState({ onRetry }: { onRetry: () => void }) {
  return <main className="class-plan-main class-plan-state" role="alert">
    <div className="class-plan-state__content">
      <Inbox size={24} aria-hidden="true" />
      <h3>We could not load this Lesson Plan</h3>
      <p>Please try again. Your current lesson selection is still available.</p>
      <button type="button" className="outline-button" onClick={onRetry}>Try again</button>
    </div>
  </main>;
}

const lessonGrammarOptions = ["Present Simple", "Past Simple", "Present Continuous", "Present Perfect", "Past Simple", "Future forms", "Can / Can't", "Imperatives", "There is / There are", "Prepositions of place", "Adverbs of frequency", "Going to", "Suggestions", "Time expressions", "Modal verbs", "Conditionals", "Conversation", "Like + ing", "To Be", "Adjectives", "Goal setting"];

function GrammarMultiSelect({ topics, readOnly = false }: { topics?: string[]; readOnly?: boolean }) {
  const [selectedTopics, setSelectedTopics] = useState<string[]>(topics ?? []);

  useEffect(() => {
    setSelectedTopics(topics ?? []);
  }, [topics]);

  return <Popover.Root>
    <Popover.Trigger asChild>
      <button type="button" className={`class-plan-select${readOnly ? " is-read-only" : ""}`} aria-label="Grammar topics" aria-readonly={readOnly} disabled={readOnly}>
        <Search size={20} aria-hidden="true" />
        <span className="class-plan-select__value">
          {selectedTopics.length ? selectedTopics.map((topic) => <span className="class-plan-grammar-badge" key={topic}>
            <span>{topic}</span>
            {!readOnly ? <span role="button" tabIndex={0} aria-label={`Remove ${topic}`} onClick={(event) => { event.stopPropagation(); setSelectedTopics((current) => current.filter((item) => item !== topic)); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); setSelectedTopics((current) => current.filter((item) => item !== topic)); } }}><X size={12} /></span> : null}
          </span>) : <span className="class-plan-select__placeholder">Select grammar topics</span>}
        </span>
        {!readOnly ? <ChevronDown size={16} aria-hidden="true" /> : null}
      </button>
    </Popover.Trigger>
    {!readOnly ? <Popover.Portal><Popover.Content className="class-plan-grammar-menu" side="bottom" align="start" sideOffset={6} onPointerDown={(event) => event.stopPropagation()}><div className="class-plan-grammar-menu__header"><strong>Grammar topics</strong>{selectedTopics.length ? <button type="button" onClick={() => setSelectedTopics([])}>Clear</button> : null}</div>{lessonGrammarOptions.map((topic) => { const selected = selectedTopics.includes(topic); return <button type="button" key={topic} className={selected ? "is-selected" : ""} onClick={() => setSelectedTopics((current) => selected ? current.filter((item) => item !== topic) : [...current, topic])}><span className="class-plan-grammar-menu__check">{selected ? <Check size={14} /> : null}</span><span>{topic}</span></button>; })}</Popover.Content></Popover.Portal> : null}
  </Popover.Root>;
}

function ClassPlanContent({ classPlan, loadState, onRetry, readOnly = false }: { classPlan?: ClassPlan; loadState: ClassPlanLoadState; onRetry: () => void; readOnly?: boolean }) {
  if (loadState === "loading") return <ClassPlanSkeleton />;
  if (loadState === "error") return <ClassPlanErrorState onRetry={onRetry} />;

  return (
    <main className="class-plan-main">
      <form className={`class-plan-form${readOnly ? " is-read-only" : ""}`} aria-readonly={readOnly}>
          {!readOnly ? <div className="class-plan-form__actions">
            <button type="button" className="class-plan-small-button">Import Lesson Plan<ChevronDown size={13} /></button>
            <button type="button" className="class-plan-small-button"><ImagePlus size={14} />Add Cover</button>
          </div> : null}

          <div className="class-plan-fields">
            <div className="class-plan-field">
              <span className="class-plan-field__label"><Target size={16} />Lesson goal</span>
              <input type="text" defaultValue={classPlan?.classGoal ?? ""} placeholder="What should students be able to do by the end of this class?" readOnly={readOnly} />
            </div>

            <div className="class-plan-field">
              <span className="class-plan-field__label"><LetterText size={16} />Grammar</span>
              <GrammarMultiSelect topics={classPlan?.grammarTopics} readOnly={readOnly} />
            </div>

            <div className="class-plan-field">
              <span className="class-plan-field__label"><Paperclip size={16} />Lesson resources</span>
              {classPlan ? <div className="class-plan-resource-list">{classPlan.resourceTitles.map((resource) => <span key={resource}>{resource}</span>)}</div> : readOnly ? <p className="class-plan-empty-value">No lesson resources recorded.</p> : <button type="button" className="class-plan-add-button"><Plus size={15} />Add<ChevronDown size={14} /></button>}
            </div>

            <div className="class-plan-field class-plan-field--editor">
              <span className="class-plan-field__label"><ListTodo size={16} />Procedures</span>
              <div className="class-plan-editor">
                {!readOnly ? <EditorToolbar /> : null}
                <textarea aria-label="Lesson procedures" defaultValue={classPlan?.procedures ?? ""} placeholder="Describe the teaching steps, activities, and estimated time for each part of the lesson." readOnly={readOnly} />
              </div>
            </div>
          </div>
      </form>
    </main>
  );
}

function ClassSummaryContent({ readOnly = false }: { readOnly?: boolean }) {
  return (
    <main className="class-summary-main">
      <div className="class-summary-content">
        <header className="class-summary-header">
          <img src="/class-summary-document.svg" alt="" width="48" height="48" aria-hidden="true" />
          <div>
            <h3>Lesson summary</h3>
            <p>Document the key points and outcomes of this lesson</p>
          </div>
        </header>
        <div className="class-plan-editor class-summary-editor">
          {!readOnly ? <EditorToolbar /> : null}
          <textarea aria-label="Lesson summary" placeholder="Example: Start with a warm-up question, review key vocabulary, practice the target grammar, and finish with a speaking activity." readOnly={readOnly} />
        </div>
        <div className="class-summary-resources" aria-hidden="true" />
      </div>
    </main>
  );
}

function PlanningView({ event, date, classEvents, onSelectClass, onBack, mode = "edit", onNavigateReport }: { event: PlannerEvent; date: Date; classEvents: PlannerEvent[]; onSelectClass: (event: PlannerEvent) => void; onBack: () => void; mode?: "edit" | "report"; onNavigateReport?: (event: PlannerEvent) => void }) {
  const [activeTab, setActiveTab] = useState("Lesson Plan");
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [planLoadState, setPlanLoadState] = useState<ClassPlanLoadState>("loading");
  const [loadedClassPlan, setLoadedClassPlan] = useState<ClassPlan | undefined>();
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [fixedMonthKey, setFixedMonthKey] = useState<string | null>(null);
  const [selectedClassOutOfView, setSelectedClassOutOfView] = useState(false);
  const [classesPanelLoading, setLessonsPanelLoading] = useState(false);
  const classesPanelLoadTimerRef = useRef<number | null>(null);
  const classesPanelBodyRef = useRef<HTMLDivElement>(null);
  const dateLabel = date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const tabs = [
    ["Lesson Plan", GraduationCap],
    ["Lesson Summary", FileText],
    ["Homework", ListTodo],
    ["Whiteboard", Monitor],
  ] as const;
  // Keep the detail navigation in the same newest-first order used by Lesson Log.
  // This makes the first row the first item in history, with no previous item above it.
  const reportHistory = useMemo(() => classEvents.filter(isClassEvent).sort(compareReportingEventsDescending), [classEvents]);
  const reportHistoryIndex = reportHistory.findIndex((item) => String(item.id) === String(event.id));
  const previousReportEvent = reportHistoryIndex > 0 ? reportHistory[reportHistoryIndex - 1] : undefined;
  const nextReportEvent = reportHistoryIndex >= 0 && reportHistoryIndex < reportHistory.length - 1 ? reportHistory[reportHistoryIndex + 1] : undefined;

  useEffect(() => {
    const body = classesPanelBodyRef.current;
    if (!body) return;
    const updateScrollState = () => {
      if (body.scrollTop <= 0) { setFixedMonthKey(null); return; }
      const bodyTop = body.getBoundingClientRect().top;
      const headings = Array.from(body.querySelectorAll<HTMLElement>(".planning-classes-month__title"));
      const fixed = headings.filter((heading) => heading.getBoundingClientRect().top <= bodyTop + 1).at(-1);
      setFixedMonthKey(fixed?.dataset.monthKey ?? null);
    };
    updateScrollState();
    body.addEventListener("scroll", updateScrollState, { passive: true });
    return () => body.removeEventListener("scroll", updateScrollState);
  }, [activeTool]);

  useEffect(() => {
    if (activeTab !== "Lesson Plan") setActiveTool(null);
  }, [activeTab]);

  useEffect(() => {
    if (mode !== "report") return;
    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.altKey || keyboardEvent.ctrlKey || keyboardEvent.metaKey || keyboardEvent.shiftKey) return;
      if (keyboardEvent.key === "ArrowLeft" && previousReportEvent) onNavigateReport?.(previousReportEvent);
      if (keyboardEvent.key === "ArrowRight" && nextReportEvent) onNavigateReport?.(nextReportEvent);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, nextReportEvent, onNavigateReport, previousReportEvent]);

  useEffect(() => () => {
    if (classesPanelLoadTimerRef.current !== null) window.clearTimeout(classesPanelLoadTimerRef.current);
  }, []);

  function handleToolChange(tool: string) {
    const nextTool = tool || null;
    if (classesPanelLoadTimerRef.current !== null) window.clearTimeout(classesPanelLoadTimerRef.current);
    if (nextTool === "Lessons" && activeTool !== "Lessons") {
      setLessonsPanelLoading(true);
      classesPanelLoadTimerRef.current = window.setTimeout(() => setLessonsPanelLoading(false), 320);
    } else {
      setLessonsPanelLoading(false);
    }
    setActiveTool(nextTool);
  }

  useEffect(() => {
    const body = classesPanelBodyRef.current;
    if (!body || !activeTool) { setSelectedClassOutOfView(false); return; }
    const selected = body.querySelector<HTMLElement>(`[data-class-id="${event.id}"]`);
    if (!selected) { setSelectedClassOutOfView(false); return; }
    const observer = new IntersectionObserver(([entry]) => setSelectedClassOutOfView(!entry.isIntersecting || entry.intersectionRatio < 0.9), { root: body, threshold: [0, 0.9, 1] });
    observer.observe(selected);
    return () => observer.disconnect();
  }, [activeTool, event.id, classEvents]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setPlanLoadState("loading");
    setLoadedClassPlan(undefined);

    fetchClassPlanForEvent(event, controller.signal)
      .then((plan) => {
        if (cancelled) return;
        setLoadedClassPlan(plan ?? undefined);
        setPlanLoadState(plan ? "success" : "empty");
      })
      .catch((error: unknown) => {
        if (!cancelled && !(error instanceof DOMException && error.name === "AbortError")) setPlanLoadState("error");
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [event.id, loadAttempt]);
  const classGroups = [...classEvents]
    .map((item) => ({ item, itemDate: addDays(startOfWeek(date), (item.weekOffset - event.weekOffset) * 7 + item.day) }))
    .sort((a, b) => a.itemDate.getTime() - b.itemDate.getTime() || a.item.startMinutes - b.item.startMinutes)
    .reduce<Array<{ key: string; label: string; items: Array<{ item: PlannerEvent; itemDate: Date }> }>>((groups, entry) => {
      const key = `${entry.itemDate.getFullYear()}-${entry.itemDate.getMonth()}`;
      const group = groups.find((candidate) => candidate.key === key);

      if (group) {
        group.items.push(entry);
      } else {
        groups.push({
          key,
          label: entry.itemDate.toLocaleDateString("en-US", { month: "long" }),
          items: [entry],
        });
      }

      return groups;
    }, []);

  return (
    <section className={`planning-screen${mode === "report" ? " planning-screen--modal" : ""}`} aria-label="Lesson planning" role={mode === "report" ? "presentation" : undefined} onMouseDown={mode === "report" ? (mouseEvent) => { if (mouseEvent.target === mouseEvent.currentTarget) onBack(); } : undefined}>
      <div className="planning-panel" role={mode === "report" ? "dialog" : undefined} aria-modal={mode === "report" || undefined} aria-label={mode === "report" ? `${eventDisplayName(event)} lesson details` : undefined}>
        <header className="planning-header">
          <div className="planning-header__content">
            {mode === "report" ? <div className="planning-header__report-navigation" aria-label="Class history navigation"><button type="button" className="icon-button icon-button--quiet" aria-label="Previous class" disabled={!previousReportEvent} onClick={() => previousReportEvent && onNavigateReport?.(previousReportEvent)}><ChevronUp size={15} /></button><span>{reportHistoryIndex + 1} of {reportHistory.length}</span><button type="button" className="icon-button icon-button--quiet" aria-label="Next class" disabled={!nextReportEvent} onClick={() => nextReportEvent && onNavigateReport?.(nextReportEvent)}><ChevronDown size={15} /></button></div> : <button className="planning-header__back" type="button" onClick={onBack} aria-label="Back to calendar"><ChevronLeft size={17} /></button>}
            <div className="planning-header__copy">
              <h2>{eventDisplayName(event)}</h2>
              <div className="planning-header__details">
                <span>{dateLabel} · {formatTime(event.startMinutes)}–{formatTime(event.startMinutes + event.duration)}</span>
                <PlanningStatusBadge status={event.status} />
                <ClassStatusIndicator status={event.classStatus} showLabel />
                {formatLastUpdated(event.updatedAt) ? <span className="planning-save"><Clock3 size={14} aria-hidden="true" />Last updated {formatLastUpdated(event.updatedAt)}</span> : null}
              </div>
            </div>
          </div>
          {mode === "report" ? <button className="planning-header__back planning-header__close" type="button" onClick={onBack} aria-label="Close lesson details"><X size={17} /></button> : null}
        </header>

        <nav className="planning-tabs" aria-label="Lesson plan sections">
          <div className="planning-tabs__list">
            {tabs.map(([label, Icon]) => (
              <button key={label} type="button" className={`planning-tab ${activeTab === label ? "is-active" : ""}`} onClick={() => setActiveTab(label)} aria-current={activeTab === label ? "page" : undefined}>
                <Icon size={20} strokeWidth={1.8} />{label}
              </button>
            ))}
          </div>
          {mode === "edit" ? <div className="planning-actions">
            <button className="outline-button planning-action" type="button"><Users size={15} />Share with students</button>
            <button className="primary-button planning-action" type="button"><Check size={15} />Finish Planning</button>
          </div> : null}
        </nav>

        <div className="planning-content">
          <div className="class-plan-layout">
            {activeTab === "Lesson Plan" ? <ClassPlanContent classPlan={loadedClassPlan} loadState={planLoadState} onRetry={() => setLoadAttempt((attempt) => attempt + 1)} readOnly={mode === "report"} /> : null}
            {activeTab === "Lesson Summary" ? <ClassSummaryContent readOnly={mode === "report"} /> : null}
            {mode === "edit" && activeTab === "Lesson Plan" && activeTool === "Lessons" && <section className="planning-tool-panel planning-classes-panel" aria-label="Lessons">
              <header className="planning-tool-panel__header">
                <div><h2>Lessons</h2><p>Review past and upcoming lessons</p></div>
                <button type="button" className="planning-tool-panel__close" onClick={() => setActiveTool(null)} aria-label="Close Lessons"><X size={18} /></button>
              </header>
              <div className="planning-classes-panel__body" ref={classesPanelBodyRef} aria-busy={classesPanelLoading}>
                {classesPanelLoading ? <LessonsPanelSkeleton /> : <div className="planning-classes-list">
                  {classGroups.map((group) => (
                    <section className="planning-classes-month" key={group.key} aria-labelledby={`classes-month-${group.key}`}>
                      <h3 id={`classes-month-${group.key}`} data-month-key={group.key} className={`planning-classes-month__title${fixedMonthKey === group.key ? " is-fixed" : ""}`}>{group.label}</h3>
                      {group.items.map(({ item, itemDate }) => {
                        const isSelected = item.id === event.id;
                        const timeLabel = `${formatTime(item.startMinutes)} – ${formatTime(item.startMinutes + item.duration)}`;
                        const planPreview = classPlanForEvent(item);
                        return <button type="button" key={item.id} data-class-id={item.id} className={`planning-class-item ${isSelected ? "is-selected" : ""}`} aria-current={isSelected ? "true" : undefined} onClick={() => onSelectClass(item)}>
                          <span className="planning-class-item__overview">
                            <span className="planning-class-item__date">{itemDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} · {timeLabel}</span>
                            <span className="planning-class-item__status-row">
                              <ClassStatusIndicator status={item.classStatus} showLabel />
                              <PlanningStatusBadge status={item.status} />
                            </span>
                          </span>
                          <span className="planning-class-item__divider" aria-hidden="true" />
                          <span className="planning-class-item__plan">
                            {planPreview ? <>
                              <span className="planning-class-item__plan-title"><Target size={16} aria-hidden="true" />{planPreview.title}</span>
                              <span className="planning-class-item__topics">{planPreview.grammarTopics.map((topic) => <span key={topic}>{topic}</span>)}</span>
                              <span className="planning-class-item__resources"><Paperclip size={16} aria-hidden="true" />{planPreview.resourceTitles.length} Resources</span>
                            </> : <span className="planning-class-item__empty-plan">No lesson plan yet</span>}
                          </span>
                        </button>;
                      })}
                    </section>
                  ))}
                </div>}
                {!classesPanelLoading && selectedClassOutOfView ? <button className="planning-selected-class-badge" type="button" onClick={() => { const selected = classesPanelBodyRef.current?.querySelector<HTMLElement>(`[data-class-id="${event.id}"]`); selected?.scrollIntoView({ behavior: "smooth", block: "center" }); }} aria-label="Go to selected lesson"><CalendarDays size={15} />Go to selected lesson</button> : null}
              </div>
            </section>}
            {mode === "edit" ? <PlanningTools activeTool={activeTool} onToolChange={handleToolChange} /> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

type ResourceV2Folder = { id: string; name: string; parentId?: string; color?: string };
type ResourceV2Record = ResourceRecord & { id: string; folderId?: string; updatedAt: number };

const initialResourceV2Folders: ResourceV2Folder[] = [
  { id: "general-english", name: "General English" },
  { id: "general-a1", name: "A1 Foundations", parentId: "general-english" },
  { id: "general-a2", name: "A2 Everyday life", parentId: "general-english" },
  { id: "conversation", name: "Conversation" },
  { id: "conversation-city", name: "City life", parentId: "conversation" },
  { id: "teacher-toolkit", name: "Teacher toolkit" },
];

const resourceV2FolderByTitle: Record<string, string | undefined> = {
  "Vocabulary warm-up": "general-a1",
  "Clothes and preferences": "general-a2",
  "Conversation starters": "conversation",
  "Circus Wonders": "general-a1",
  "Everyday routines": "general-a2",
  "City photo prompts": "conversation-city",
  "Feelings picture cards": "general-a1",
  "Modal verbs mini-guide": "teacher-toolkit",
  "Listening lab playlist": "conversation",
};

const resourceV2FolderColors = ["#2563eb", "#7c3aed", "#db2777", "#ea580c", "#16a34a", "#0891b2", "#ca8a04", "#64748b"];

function ResourcesV2View() {
  const [resources, setResources] = useState<ResourceV2Record[]>(() => initialResources.map((resource, index) => ({
    ...resource,
    id: `resource-${index + 1}`,
    folderId: resourceV2FolderByTitle[resource.title],
    updatedAt: 10 - index,
  })));
  const [folders, setFolders] = useState<ResourceV2Folder[]>(initialResourceV2Folders);
  const [location, setLocation] = useState<string>("all");
  const [view, setView] = useState<"list" | "grid">("list");
  const [query, setQuery] = useState("");
  const [levelFilters, setLevelFilters] = useState<string[]>([]);
  const [grammarFilters, setGrammarFilters] = useState<string[]>([]);
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
  const [isCreatingResource, setIsCreatingResource] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createLevels, setCreateLevels] = useState<string[]>([]);
  const [createGrammars, setCreateGrammars] = useState<string[]>([]);
  const [createTags, setCreateTags] = useState<string[]>([]);
  const [createInstructions, setCreateInstructions] = useState("");
  const [createSource, setCreateSource] = useState<"file" | "link">("file");
  const [createSourceValue, setCreateSourceValue] = useState("");
  const [createSourceFile, setCreateSourceFile] = useState<File | null>(null);
  const [createErrors, setCreateErrors] = useState<{ title?: string; source?: string }>({});
  const [editingResource, setEditingResource] = useState<ResourceV2Record | null>(null);
  const [isDuplicatingResource, setIsDuplicatingResource] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editLevel, setEditLevel] = useState("");
  const [editGrammar, setEditGrammar] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editInstructions, setEditInstructions] = useState("");
  const [editFolderId, setEditFolderId] = useState("");
  const [folderName, setFolderName] = useState("");
  const [folderError, setFolderError] = useState("");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [pendingDeleteFolder, setPendingDeleteFolder] = useState<string | null>(null);
  const [pendingDeleteResource, setPendingDeleteResource] = useState<ResourceV2Record | null>(null);
  const [renamingFolder, setRenamingFolder] = useState<ResourceV2Folder | null>(null);
  const [movingFolder, setMovingFolder] = useState<ResourceV2Folder | null>(null);
  const [movingResource, setMovingResource] = useState<ResourceV2Record | null>(null);
  const [moveDestination, setMoveDestination] = useState("");
  const createTitleRef = useRef<HTMLInputElement>(null);
  const createSourceRef = useRef<HTMLInputElement>(null);

  const selectedFolder = folders.find((folder) => folder.id === location);
  const selectedResource = resources.find((resource) => resource.id === selectedResourceId) ?? null;
  const levelOptions = useMemo(() => Array.from(new Set(resources.flatMap((resource) => resourceValues(resource.level)))).sort(), [resources]);
  const grammarOptions = useMemo(() => Array.from(new Set(resources.flatMap((resource) => resourceValues(resource.grammar)))).sort(), [resources]);
  const tagOptions = useMemo(() => Array.from(new Set(resources.flatMap((resource) => resource.tags))).sort(), [resources]);
  const normalizedQuery = query.trim().toLowerCase();
  const hasActiveFilters = Boolean(normalizedQuery || levelFilters.length || grammarFilters.length || tagFilters.length);
  function folderPath(folder?: ResourceV2Folder) {
    const path: ResourceV2Folder[] = [];
    let current = folder;
    while (current) { path.unshift(current); current = folders.find((candidate) => candidate.id === current?.parentId); }
    return path;
  }
  function resourceLocationLabel(resource: ResourceV2Record) {
    const path = folderPath(folders.find((folder) => folder.id === resource.folderId));
    return path.length ? path.map((folder) => folder.name).join(" / ") : "Resource library";
  }

  const currentResources = useMemo(() => resources.filter((resource) => {
    const matchesLocation = Boolean(normalizedQuery) || location === "all" || resource.folderId === location;
    const searchable = [resource.title, resource.type, resource.grammar, resource.level, resource.tags.join(" "), resource.instructions ?? "", resourceLocationLabel(resource)].join(" ").toLowerCase();
    const matchesSearch = !normalizedQuery || searchable.includes(normalizedQuery);
    const matchesLevel = !levelFilters.length || resourceValues(resource.level).some((level) => levelFilters.includes(level));
    const matchesGrammar = !grammarFilters.length || resourceValues(resource.grammar).some((grammar) => grammarFilters.includes(grammar));
    const matchesTag = !tagFilters.length || resource.tags.some((tag) => tagFilters.includes(tag));
    return matchesLocation && matchesSearch && matchesLevel && matchesGrammar && matchesTag;
  }), [resources, folders, location, normalizedQuery, levelFilters, grammarFilters, tagFilters]);

  const visibleFolders = normalizedQuery ? [] : location === "all" ? folders.filter((folder) => !folder.parentId) : selectedFolder ? folders.filter((folder) => folder.parentId === selectedFolder.id) : [];
  const searchFolders = useMemo(() => !normalizedQuery ? [] : folders.filter((folder) => [folder.name, folderPath(folder).map((item) => item.name).join(" ")].join(" ").toLowerCase().includes(normalizedQuery)), [folders, normalizedQuery]);
  const displayedFolders = normalizedQuery ? searchFolders : visibleFolders;
  const resourceCount = (folderId?: string) => resources.filter((resource) => resource.folderId === folderId).length;
  const folderDescendants = (folderId: string): string[] => folders.flatMap((folder) => folder.parentId === folderId ? [folder.id, ...folderDescendants(folder.id)] : []);

  function selectLocation(nextLocation: string) {
    setLocation(nextLocation);
    if (normalizedQuery) setQuery("");
    setSelectedResourceId(null);
    setPendingDeleteFolder(null);
  }

  function createFolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = folderName.trim();
    const parentId = selectedFolder?.id;
    if (!name) { setFolderError("Enter a folder name."); return; }
    if (folders.some((folder) => folder.parentId === parentId && folder.name.localeCompare(name, undefined, { sensitivity: "accent" }) === 0)) { setFolderError("A folder with this name already exists here."); return; }
    const id = `folder-${Date.now()}`;
    setFolders((current) => [...current, { id, name, parentId }]);
    setFolderName(""); setFolderError(""); setIsCreatingFolder(false); selectLocation(id);
  }

  function renameFolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!renamingFolder) return;
    const name = folderName.trim();
    if (!name) { setFolderError("Enter a folder name."); return; }
    if (folders.some((folder) => folder.id !== renamingFolder.id && folder.parentId === renamingFolder.parentId && folder.name.localeCompare(name, undefined, { sensitivity: "accent" }) === 0)) { setFolderError("A folder with this name already exists here."); return; }
    setFolders((current) => current.map((folder) => folder.id === renamingFolder.id ? { ...folder, name } : folder));
    setRenamingFolder(null); setFolderName(""); setFolderError("");
  }

  function openMoveFolder(folder: ResourceV2Folder) {
    setMovingFolder(folder); setMovingResource(null); setMoveDestination(folder.parentId ?? "");
  }

  function openMoveResource(resource: ResourceV2Record) {
    setMovingResource(resource); setMovingFolder(null); setMoveDestination(resource.folderId ?? "");
  }

  function confirmMove() {
    if (movingFolder) {
      const blockedDestinations = new Set([movingFolder.id, ...folderDescendants(movingFolder.id)]);
      if (blockedDestinations.has(moveDestination)) return;
      setFolders((current) => current.map((folder) => folder.id === movingFolder.id ? { ...folder, parentId: moveDestination || undefined } : folder));
      setMovingFolder(null);
    }
    if (movingResource) {
      setResources((current) => current.map((resource) => resource.id === movingResource.id ? { ...resource, folderId: moveDestination || undefined, updatedAt: 11 } : resource));
      setMovingResource(null);
    }
  }

  function downloadResource(resource: ResourceV2Record) {
    if (/^https?:\/\//i.test(resource.source ?? "")) { window.open(resource.source, "_blank", "noopener,noreferrer"); return; }
    const link = document.createElement("a");
    link.href = resourcePreviewSource(resource);
    link.download = resource.source || `${resource.title}.${resource.type.toLowerCase()}`;
    document.body.appendChild(link); link.click(); link.remove();
  }

  function deleteFolder(folderId: string) {
    const folder = folders.find((item) => item.id === folderId);
    if (!folder) return;
    const removedIds = new Set([folderId, ...folderDescendants(folderId)]);
    setResources((current) => current.map((resource) => removedIds.has(resource.folderId ?? "") ? { ...resource, folderId: folder.parentId } : resource));
    setFolders((current) => current.filter((item) => !removedIds.has(item.id)));
    setPendingDeleteFolder(null);
    selectLocation(folder.parentId ?? "all");
  }

  function clearFilters() {
    setQuery("");
    setLevelFilters([]);
    setGrammarFilters([]);
    setTagFilters([]);
  }

  function deleteResource(resourceId: string) {
    setResources((current) => current.filter((resource) => resource.id !== resourceId));
    if (selectedResourceId === resourceId) setSelectedResourceId(null);
    setPendingDeleteResource(null);
  }

  function requestDeleteResource(resource: ResourceV2Record) {
    setPendingDeleteResource(resource);
  }

  function openResourceEditor(resource: ResourceV2Record, duplicate = false) {
    setEditingResource(resource);
    setIsDuplicatingResource(duplicate);
    setEditTitle(`${resource.title}${duplicate ? " (Copy)" : ""}`);
    setEditLevel(resource.level === "—" ? "" : resource.level);
    setEditGrammar(resource.grammar === "—" ? "" : resource.grammar);
    setEditTags(resource.tags.join(", "));
    setEditInstructions(resource.instructions ?? "");
    setEditFolderId(resource.folderId ?? "");
    setSelectedResourceId(null);
  }

  function closeResourceEditor() {
    setEditingResource(null);
    setIsDuplicatingResource(false);
  }

  function saveResourceEditor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingResource || !editTitle.trim()) return;
    const nextResource: ResourceV2Record = {
      ...editingResource,
      id: isDuplicatingResource ? `resource-${Date.now()}` : editingResource.id,
      title: editTitle.trim(),
      level: editLevel.trim() || "—",
      grammar: editGrammar.trim() || "—",
      tags: editTags.split(",").map((tag) => tag.trim()).filter(Boolean),
      instructions: editInstructions.trim() || undefined,
      folderId: editFolderId || undefined,
      updatedAt: 11,
    };
    setResources((current) => isDuplicatingResource ? [nextResource, ...current] : current.map((resource) => resource.id === nextResource.id ? nextResource : resource));
    closeResourceEditor();
  }

  function openNewResource() {
    setCreateTitle(""); setCreateLevels([]); setCreateGrammars([]); setCreateTags([]); setCreateInstructions("");
    setCreateSource("file"); setCreateSourceValue(""); setCreateSourceFile(null); setCreateErrors({});
    setSelectedResourceId(null); setIsCreatingResource(true);
  }

  function closeNewResource() {
    setIsCreatingResource(false); setCreateErrors({});
  }

  function saveNewResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors: { title?: string; source?: string } = {};
    if (!createTitle.trim()) errors.title = "Informe o nome do recurso.";
    if (!createSourceValue.trim()) errors.source = createSource === "link" ? "Informe um link para continuar." : "Adicione um arquivo para continuar.";
    else if (createSource === "file" && createSourceFile) {
      if (!/\.(pdf|docx?|pptx?|mp4|mp3|png|jpe?g)$/i.test(createSourceFile.name)) errors.source = "Use PDF, DOC, PPT, MP4, MP3 ou imagens.";
      else if (createSourceFile.size > 10 * 1024 * 1024) errors.source = "O arquivo deve ter no máximo 10 MB.";
    } else if (createSource === "link") {
      try { new URL(createSourceValue); } catch { errors.source = "Informe um link válido."; }
    }
    setCreateErrors(errors);
    if (Object.keys(errors).length) { if (errors.title) createTitleRef.current?.focus(); else createSourceRef.current?.focus(); return; }
    const extension = createSourceFile?.name.split(".").pop()?.toUpperCase() || "FILE";
    setResources((current) => [{
      id: `resource-${Date.now()}`,
      title: createTitle.trim(),
      level: createLevels.join(", ") || "—",
      grammar: createGrammars.join(", ") || "—",
      tags: createTags.slice(0, 5),
      type: createSource === "link" ? "Web link" : extension,
      size: createSource === "link" ? "Link" : `${Math.max(1, Math.round((createSourceFile?.size ?? 0) / 1024))} kb`,
      source: createSourceValue.trim(),
      instructions: createInstructions.trim() || undefined,
      updatedAt: 11,
      folderId: selectedFolder?.id,
    }, ...current]);
    closeNewResource();
  }

  return <section className="resources-screen resources-v2-screen" aria-label="My Resources version 2">
    <div className="resources-v2-layout">
      <main className="resources-v2-main">
        <div className="resources-v2-global-searchbar"><label className="resources-search"><Search size={17} aria-hidden="true" /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search all resources" aria-label="Search all resources" />{normalizedQuery ? <button className="resources-search__clear" type="button" aria-label="Clear search" onClick={() => setQuery("")}><X size={15} aria-hidden="true" /></button> : null}</label><div className="resources-v2-global-actions"><button className="resources-v2-upload-button" type="button" onClick={openNewResource}><Plus size={15} />New Resource</button><button type="button" onClick={() => { setFolderName(""); setFolderError(""); setIsCreatingFolder(true); }}><FolderPlus size={15} />{selectedFolder ? "New subfolder" : "New folder"}</button></div></div>
        <section className="resources-v2-context-filters">
        <header className="resources-v2-contextbar">
          {normalizedQuery ? <div className="resources-v2-global-search-status resources-v2-global-search-status--context" role="status"><span>Results in all resources for “{query.trim()}”</span></div> : <nav className="resources-v2-breadcrumb" aria-label="Resource library navigation"><button className="resources-v2-breadcrumb__root" type="button" onClick={() => selectLocation("all")}><FolderOpen size={15} />Resource library</button>{folderPath(selectedFolder).map((folder, index, path) => <span className="resources-v2-breadcrumb__segment" key={folder.id} aria-current={index === path.length - 1 ? "page" : undefined}><ChevronRight size={14} /><button type="button" onClick={() => selectLocation(folder.id)}>{folder.name}</button><Popover.Root><Popover.Trigger asChild><button className="resources-v2-breadcrumb__more" type="button" aria-label={`Folder actions for ${folder.name}`}><MoreHorizontal size={16} /></button></Popover.Trigger><Popover.Portal><Popover.Content className="resource-v2-card__action-menu resources-v2-folder-card__menu" side="bottom" align="start" sideOffset={6}><button type="button" onClick={() => { setRenamingFolder(folder); setFolderName(folder.name); setFolderError(""); }}><Pencil size={15} />Rename</button><button type="button" onClick={() => openMoveFolder(folder)}><Folder size={15} />Move</button><span className="resources-v2-folder-card__menu-label">Folder color</span><div className="resources-v2-folder-card__colors"><button className={!folder.color ? "is-active" : ""} type="button" onClick={() => setFolders((current) => current.map((item) => item.id === folder.id ? { ...item, color: undefined } : item))} aria-label="Default folder color" />{resourceV2FolderColors.map((color) => <button className={folder.color === color ? "is-active" : ""} type="button" key={color} onClick={() => setFolders((current) => current.map((item) => item.id === folder.id ? { ...item, color } : item))} style={{ "--folder-color-choice": color } as CSSProperties} aria-label={`Set folder color ${color}`} />)}</div><button className="is-destructive" type="button" onClick={() => setPendingDeleteFolder(folder.id)}><Trash2 size={15} />Delete</button></Popover.Content></Popover.Portal></Popover.Root></span>)}</nav>}
        </header>
        <div className="resources-v2-toolbar">
          <ResourceFilterDropdown label="Levels" allLabel="All levels" options={levelOptions} value={levelFilters} onChange={setLevelFilters} />
          <ResourceFilterDropdown label="Grammar" allLabel="All grammar" options={grammarOptions} value={grammarFilters} onChange={setGrammarFilters} wide />
          <ResourceFilterDropdown label="Tags" allLabel="All tags" options={tagOptions} value={tagFilters} onChange={setTagFilters} wide />
          {hasActiveFilters ? <button className="resources-v2-clear-filters" type="button" onClick={clearFilters}>Clear filters</button> : null}
          <div className="resources-v2-view-toggle" aria-label="Resource view"><button className={view === "list" ? "is-active" : ""} type="button" onClick={() => setView("list")} aria-label="List view"><List size={17} /></button><button className={view === "grid" ? "is-active" : ""} type="button" onClick={() => setView("grid")} aria-label="Card view"><Grid2X2 size={16} /></button></div>
        </div>
        </section>
        {normalizedQuery && displayedFolders.length ? <div className="resources-v2-title-row resources-v2-search-section-title"><div><h2>Folders</h2><span>{displayedFolders.length}</span></div></div> : null}
        {displayedFolders.length ? <div className="resources-v2-folder-grid">{displayedFolders.map((folder) => <article className="resources-v2-folder-card" key={folder.id} style={{ "--folder-accent": folder.color ?? "#94a3b8" } as CSSProperties}><button className="resources-v2-folder-card__main" type="button" onClick={() => selectLocation(folder.id)}><span className="resources-v2-folder-card__icon"><FolderOpen size={22} /></span><span>{folder.name}</span><small>{resourceCount(folder.id)} resources</small></button><Popover.Root><Popover.Trigger asChild><button className="resources-v2-folder-card__more" type="button" aria-label={`Organize ${folder.name}`}><MoreHorizontal size={18} /></button></Popover.Trigger><Popover.Portal><Popover.Content className="resource-v2-card__action-menu resources-v2-folder-card__menu" side="bottom" align="end" sideOffset={6}><button type="button" onClick={() => { setRenamingFolder(folder); setFolderName(folder.name); setFolderError(""); }}><Pencil size={15} />Rename</button><button type="button" onClick={() => openMoveFolder(folder)}><Folder size={15} />Move</button><span className="resources-v2-folder-card__menu-label">Folder color</span><div className="resources-v2-folder-card__colors"><button className={!folder.color ? "is-active" : ""} type="button" onClick={() => setFolders((current) => current.map((item) => item.id === folder.id ? { ...item, color: undefined } : item))} aria-label="Default folder color" /><>{resourceV2FolderColors.map((color) => <button className={folder.color === color ? "is-active" : ""} type="button" key={color} onClick={() => setFolders((current) => current.map((item) => item.id === folder.id ? { ...item, color } : item))} style={{ "--folder-color-choice": color } as CSSProperties} aria-label={`Set folder color ${color}`} />)}</></div><button className="is-destructive" type="button" onClick={() => setPendingDeleteFolder(folder.id)}><Trash2 size={15} />Delete</button></Popover.Content></Popover.Portal></Popover.Root></article>)}</div> : null}
        {currentResources.length ? <div className={`resources-v2-items resources-v2-items--${view}`}>{currentResources.map((resource) => <article className={`resource-v2-card ${selectedResourceId === resource.id ? "is-selected" : ""}`} key={resource.id}>
          <button type="button" className="resource-v2-card__main" onClick={() => setSelectedResourceId(resource.id)}>
            {view === "list" ? <>
              <div className={`resource-v2-card__thumb resource-list-item__thumb${resourceListPreviewSource(resource) ? "" : ` resource-list-item__thumb--${resourceThumbTone(resource.type)}`}`} aria-hidden="true">{resourceListPreviewSource(resource) ? <img src={resourceListPreviewSource(resource)} alt="" /> : <ResourceTypeIcon type={resource.type} />}</div>
              <div className="resource-list-item__details">
                <div className="resource-list-item__title-row"><h2>{resource.title}</h2><span>·</span>{resource.type === "Interactive" ? <small>Link</small> : <small>{resource.type}</small>}</div>
                {(resource.level || resourceValues(resource.grammar).length) ? <div className="resource-list-item__meta"><ResourceLevelSummary value={resource.level} />{resource.level && resourceValues(resource.grammar).length ? <i>·</i> : null}<ResourceGrammarSummary value={resource.grammar} /></div> : null}
                {resource.tags.length ? <div className="resource-list-item__tags" aria-label={`Tags: ${resource.tags.join(", ")}`}>{resource.tags.map((tag) => <span key={tag}>{tag}</span>)}</div> : null}
                {normalizedQuery ? <span className="resource-v2-card__location">In {resourceLocationLabel(resource)}</span> : null}
              </div>
            </> : <>
              <div className={`resource-v2-card__thumb${resourceListPreviewSource(resource) ? "" : ` resource-list-item__thumb--${resourceThumbTone(resource.type)}`}`}>{resourceListPreviewSource(resource) ? <img src={resourceListPreviewSource(resource)} alt="" /> : <ResourceTypeIcon type={resource.type} />}</div>
              <div className="resource-v2-card__copy"><div><h3>{resource.title}</h3><span>{resource.type} · {resource.size}</span></div><div className="resource-v2-card__meta"><ResourceLevelSummary value={resource.level} /><ResourceGrammarSummary value={resource.grammar} /></div>{resource.tags.length ? <div className="resource-v2-card__tags">{resource.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}{resource.tags.length > 2 ? <span>+{resource.tags.length - 2}</span> : null}</div> : null}</div>
            </>}
          </button>
          <div className="resource-v2-card__quick-actions"><button type="button" onClick={() => openResourceEditor(resource)} aria-label={`Edit ${resource.title}`}><Pencil size={16} /></button><button type="button" onClick={() => downloadResource(resource)} aria-label={/^https?:\/\//i.test(resource.source ?? "") ? `Open ${resource.title}` : `Download ${resource.title}`}>{/^https?:\/\//i.test(resource.source ?? "") ? <Link size={16} /> : <Download size={16} />}</button><Popover.Root><Popover.Trigger asChild><button className="resource-v2-card__more" type="button" aria-label={`More actions for ${resource.title}`}><MoreHorizontal size={18} /></button></Popover.Trigger><Popover.Portal><Popover.Content className="resource-v2-card__action-menu" side="bottom" align="end" sideOffset={6}><button type="button" onClick={() => openMoveResource(resource)}><Folder size={15} />Move</button><button type="button" className="is-destructive" onClick={() => requestDeleteResource(resource)}><Trash2 size={15} />Delete</button></Popover.Content></Popover.Portal></Popover.Root></div>
        </article>)}</div> : <div className="resources-filter-empty" role="status"><strong>{normalizedQuery ? "No files match this search" : hasActiveFilters ? "No resources match these filters" : selectedFolder ? "This folder is empty" : "No resources found"}</strong><span>{normalizedQuery ? "Try another term or clear the current search." : hasActiveFilters ? "Clear filters to see all available resources." : selectedFolder ? `Create a resource in ${selectedFolder.name}.` : "Create a resource or create your first folder."}</span>{hasActiveFilters ? <button type="button" className="outline-button" onClick={clearFilters}>Clear filters</button> : selectedFolder ? <div><button type="button" className="primary-button" onClick={openNewResource}><Plus size={15} />New Resource</button></div> : null}</div>}
      </main>
    </div>
    {isCreatingResource ? <div className="resource-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeNewResource(); }}>
      <form className="resource-modal" onSubmit={saveNewResource} role="dialog" aria-modal="true" aria-labelledby="resource-v2-create-title">
        <header className="resource-modal__header"><h1 id="resource-v2-create-title">New Resource</h1></header>
        <div className="resource-modal__body">
          <div className="resource-modal__row"><div className="resource-modal__label"><FileText size={16} />File or Link <b>*</b></div><div className="resource-modal__field"><div className="resource-radio-group"><label><input type="radio" checked={createSource === "file"} onChange={() => { setCreateSource("file"); setCreateSourceValue(""); setCreateSourceFile(null); setCreateErrors((current) => ({ ...current, source: undefined })); }} />From my computer</label><label><input type="radio" checked={createSource === "link"} onChange={() => { setCreateSource("link"); setCreateSourceValue(""); setCreateSourceFile(null); setCreateErrors((current) => ({ ...current, source: undefined })); }} />Link</label></div>{createSource === "file" ? <label className={`resource-file-input ${createErrors.source ? "has-error" : ""}`}><strong>Choose File</strong><span>{createSourceValue || "No file chosen"}</span><input ref={createSourceRef} type="file" aria-invalid={Boolean(createErrors.source)} aria-describedby={createErrors.source ? "resource-v2-source-error" : undefined} onChange={(event) => { const file = event.target.files?.[0] ?? null; setCreateSourceFile(file); setCreateSourceValue(file?.name ?? ""); setCreateErrors((current) => ({ ...current, source: undefined })); }} /></label> : <div className={`resource-input-with-icon ${createErrors.source ? "has-error" : ""}`}><Link size={15} /><input ref={createSourceRef} value={createSourceValue} aria-invalid={Boolean(createErrors.source)} aria-describedby={createErrors.source ? "resource-v2-source-error" : undefined} onChange={(event) => { setCreateSourceValue(event.target.value); setCreateErrors((current) => ({ ...current, source: undefined })); }} placeholder="https://" /></div>}{createErrors.source ? <p className="resource-field-error" id="resource-v2-source-error">{createErrors.source}</p> : <small className="resource-modal__hint">Use PDF, DOC, PPT, MP4, MP3 or images (max 10MB)</small>}</div></div>
          <div className="resource-modal__row"><div className="resource-modal__label"><ImagePlus size={16} />Name <b>*</b></div><div className="resource-modal__field"><input ref={createTitleRef} value={createTitle} aria-invalid={Boolean(createErrors.title)} aria-describedby={createErrors.title ? "resource-v2-title-error" : undefined} className={createErrors.title ? "has-error" : ""} onChange={(event) => { setCreateTitle(event.target.value); setCreateErrors((current) => ({ ...current, title: undefined })); }} placeholder="Enter a resource name" />{createErrors.title ? <p className="resource-field-error" id="resource-v2-title-error">{createErrors.title}</p> : null}</div></div>
          <div className="resource-modal__divider" />
          <div className="resource-modal__row"><div className="resource-modal__label"><GraduationCap size={16} />Level</div><div className="resource-modal__field"><ResourceMultiSelect placeholder="Select Levels" options={["A1", "A2", "B1", "B2", "Y2"]} value={createLevels} onChange={setCreateLevels} /></div></div>
          <div className="resource-modal__row"><div className="resource-modal__label"><LetterText size={16} />Grammars</div><div className="resource-modal__field"><ResourceMultiSelect placeholder="Select Grammars" options={["Present Simple", "Past Simple", "Present Continuous", "Conversation", "Vocabulary"]} value={createGrammars} onChange={setCreateGrammars} /></div></div>
          <div className="resource-modal__row"><div className="resource-modal__label"><Paperclip size={16} />Tags</div><div className="resource-modal__field"><ResourceMultiSelect placeholder="Select Tags" options={resourceTagOptions} value={createTags} onChange={setCreateTags} allowCreate /></div></div>
          <div className="resource-modal__divider" />
          <div className="resource-modal__row resource-modal__row--instructions"><div className="resource-modal__label"><ListTodo size={16} />Instructions</div><div className="resource-modal__field"><div className="resource-editor"><div className="resource-editor__toolbar"><Bold size={15} /><Italic size={15} /><Underline size={15} /><Strikethrough size={15} /><AlignLeft size={15} /><Link size={15} /><Paperclip size={15} /></div><textarea value={createInstructions} onChange={(event) => setCreateInstructions(event.target.value)} placeholder="Describe how this resource should be used in class. You can also include links to external materials." /></div></div></div>
        </div>
        <footer className="resource-modal__footer"><button className="outline-button" type="button" onClick={closeNewResource}>Cancel</button><button className="primary-button" type="submit"><Check size={16} />Save Resource</button></footer>
      </form>
    </div> : null}
    {selectedResource ? <div className="resource-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedResourceId(null); }}>
      <section className="resource-modal resource-detail-modal" role="dialog" aria-modal="true" aria-labelledby="resource-details-title">
        <header className="resource-modal__header resource-detail-modal__header"><h1 id="resource-details-title">{selectedResource.title}</h1><div className="resource-detail-modal__actions"><button className="outline-button" type="button" onClick={() => openResourceEditor(selectedResource)}><Pencil size={15} />Edit Resource</button><button className="resource-detail-close" type="button" onClick={() => setSelectedResourceId(null)} aria-label="Close resource details"><X size={16} /></button></div></header>
        <div className="resource-modal__body resource-detail-modal__body">
          <div className="resource-detail-preview">
            <div className="resource-detail-preview__media"><ResourcePreviewImage resource={selectedResource} detail /></div>
            <div className="resource-detail-preview__info">
              <div className="resource-detail-preview__meta"><strong>{selectedResource.type === "Interactive" ? "Link resource" : `${selectedResource.type} resource`}</strong><span><FileText size={16} strokeWidth={1.6} />{resourceSourceLabel(selectedResource)}{selectedResource.size !== "Link" ? ` · ${selectedResource.size}` : ""}</span></div>
              <div className="resource-detail-preview__actions"><button type="button" aria-label="Expand resource preview"><Maximize2 size={15} /></button><button type="button" aria-label="Download resource"><Download size={15} /></button></div>
            </div>
          </div>
          <div className="resource-detail-section"><span className="resource-detail-label"><ListTodo size={15} />Instructions</span><p className="resource-detail-empty">{selectedResource.instructions || "Describe how this resource should be used in class. You can also include links to external materials."}</p></div>
          <div className="resource-detail-meta">
            <div className="resource-detail-meta__top"><ResourceLevelSummary value={selectedResource.level} />{resourceValues(selectedResource.level).length && resourceValues(selectedResource.grammar).length ? <span className="resource-detail-meta__separator">·</span> : null}<ResourceGrammarSummary value={selectedResource.grammar} /></div>
            <div className="resource-detail-meta__tags">{selectedResource.tags.length ? selectedResource.tags.map((tag) => <span key={tag}>{tag}</span>) : <small className="resource-detail-muted">No tags added</small>}</div>
            <div className="resource-detail-meta__footer"><span className="resource-detail-meta__divider" /><span>Created Mar 13, 2026 · Updated Mar 17, 2026</span></div>
          </div>
        </div>
      </section>
    </div> : null}
    {editingResource ? <div className="resource-modal-backdrop" role="presentation"><form className="resource-modal" onSubmit={saveResourceEditor} role="dialog" aria-modal="true" aria-labelledby="resource-v2-editor-title"><header className="resource-modal__header"><h1 id="resource-v2-editor-title">{isDuplicatingResource ? "Duplicate Resource" : "Edit Resource"}</h1></header><div className="resource-modal__body"><div className="resource-modal__row"><div className="resource-modal__label"><ImagePlus size={16} />Name <b>*</b></div><div className="resource-modal__field"><input autoFocus value={editTitle} onChange={(event) => setEditTitle(event.target.value)} placeholder="Enter a resource name" /></div></div><div className="resource-modal__divider" /><div className="resource-modal__row"><div className="resource-modal__label"><GraduationCap size={16} />Level</div><div className="resource-modal__field"><ResourceMultiSelect placeholder="Select Levels" options={["A1", "A2", "B1", "B2", "Y2"]} value={resourceValues(editLevel)} onChange={(value) => setEditLevel(value.join(", "))} /></div></div><div className="resource-modal__row"><div className="resource-modal__label"><LetterText size={16} />Grammars</div><div className="resource-modal__field"><ResourceMultiSelect placeholder="Select Grammars" options={["Present Simple", "Past Simple", "Present Continuous", "Conversation", "Vocabulary"]} value={resourceValues(editGrammar)} onChange={(value) => setEditGrammar(value.join(", "))} /></div></div><div className="resource-modal__row"><div className="resource-modal__label"><Paperclip size={16} />Tags</div><div className="resource-modal__field"><ResourceMultiSelect placeholder="Select Tags" options={resourceTagOptions} value={editTags.split(",").map((tag) => tag.trim()).filter(Boolean)} onChange={(value) => setEditTags(value.join(", "))} allowCreate /></div></div><div className="resource-modal__row"><div className="resource-modal__label"><Folder size={16} />Folder</div><div className="resource-modal__field"><select value={editFolderId} onChange={(event) => setEditFolderId(event.target.value)}><option value="">Root</option>{folders.map((folder) => <option value={folder.id} key={folder.id}>{folderPath(folder).map((item) => item.name).join(" / ")}</option>)}</select></div></div><div className="resource-modal__divider" /><div className="resource-modal__row resource-modal__row--instructions"><div className="resource-modal__label"><ListTodo size={16} />Instructions</div><div className="resource-modal__field"><div className="resource-editor"><textarea value={editInstructions} onChange={(event) => setEditInstructions(event.target.value)} placeholder="Describe how this resource should be used in class." /></div></div></div></div><footer className="resource-modal__footer"><button className="outline-button" type="button" onClick={closeResourceEditor}>Cancel</button><button className="primary-button" type="submit"><Check size={16} />{isDuplicatingResource ? "Save Resource" : "Save Changes"}</button></footer></form></div> : null}
    {isCreatingFolder ? <div className="resource-modal-backdrop" role="presentation"><form className="resources-v2-folder-dialog" onSubmit={createFolder} role="dialog" aria-modal="true" aria-labelledby="folder-dialog-title"><header><div><h2 id="folder-dialog-title">New folder</h2><p>{selectedFolder ? `Inside ${selectedFolder.name}` : "At the top level"}</p></div><button type="button" onClick={() => setIsCreatingFolder(false)} aria-label="Close"><X size={16} /></button></header><label>Folder name<input autoFocus value={folderName} onChange={(event) => { setFolderName(event.target.value); setFolderError(""); }} placeholder="e.g. Travel and transport" /></label>{folderError ? <p className="resource-field-error">{folderError}</p> : null}<footer><button className="outline-button" type="button" onClick={() => setIsCreatingFolder(false)}>Cancel</button><button className="primary-button" type="submit">Create folder</button></footer></form></div> : null}
    {renamingFolder ? <div className="resource-modal-backdrop" role="presentation"><form className="resources-v2-folder-dialog" onSubmit={renameFolder} role="dialog" aria-modal="true" aria-labelledby="rename-folder-title"><header><div><h2 id="rename-folder-title">Rename folder</h2><p>Choose a clear, recognizable name.</p></div><button type="button" onClick={() => setRenamingFolder(null)} aria-label="Close"><X size={16} /></button></header><label>Folder name<input autoFocus value={folderName} onChange={(event) => { setFolderName(event.target.value); setFolderError(""); }} /></label>{folderError ? <p className="resource-field-error">{folderError}</p> : null}<footer><button className="outline-button" type="button" onClick={() => setRenamingFolder(null)}>Cancel</button><button className="primary-button" type="submit">Save name</button></footer></form></div> : null}
    {movingFolder || movingResource ? <div className="resource-modal-backdrop" role="presentation"><section className="resources-v2-folder-dialog" role="dialog" aria-modal="true" aria-labelledby="move-item-title"><header><div><h2 id="move-item-title">Move {movingFolder ? "folder" : "resource"}</h2><p>{movingFolder?.name ?? movingResource?.title}</p></div><button type="button" onClick={() => { setMovingFolder(null); setMovingResource(null); }} aria-label="Close"><X size={16} /></button></header><label>Destination folder<select value={moveDestination} onChange={(event) => setMoveDestination(event.target.value)}><option value="">Resource library</option>{folders.filter((folder) => !movingFolder || (folder.id !== movingFolder.id && !folderDescendants(movingFolder.id).includes(folder.id))).map((folder) => <option value={folder.id} key={folder.id}>{folderPath(folder).map((item) => item.name).join(" / ")}</option>)}</select></label><footer><button className="outline-button" type="button" onClick={() => { setMovingFolder(null); setMovingResource(null); }}>Cancel</button><button className="primary-button" type="button" onClick={confirmMove}>Move here</button></footer></section></div> : null}
    {pendingDeleteResource ? <div className="resource-modal-backdrop" role="presentation"><section className="resources-v2-folder-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-resource-title"><header><div><h2 id="delete-resource-title">Delete resource?</h2><p>{pendingDeleteResource.title} will be permanently removed.</p></div><button type="button" onClick={() => setPendingDeleteResource(null)} aria-label="Close"><X size={16} /></button></header><footer><button className="outline-button" type="button" onClick={() => setPendingDeleteResource(null)}>Cancel</button><button className="primary-button resources-v2-delete-button" type="button" onClick={() => deleteResource(pendingDeleteResource.id)}>Delete resource</button></footer></section></div> : null}
    {pendingDeleteFolder ? <div className="resource-modal-backdrop" role="presentation"><section className="resources-v2-folder-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-folder-title"><header><div><h2 id="delete-folder-title">Delete folder?</h2><p>Resources and subfolders will move to the parent folder, or to All files when this is a top-level folder.</p></div><button type="button" onClick={() => setPendingDeleteFolder(null)} aria-label="Close"><X size={16} /></button></header><footer><button className="outline-button" type="button" onClick={() => setPendingDeleteFolder(null)}>Cancel</button><button className="primary-button resources-v2-delete-button" type="button" onClick={() => deleteFolder(pendingDeleteFolder)}>Delete folder</button></footer></section></div> : null}
  </section>;
}

function ResourcesView() {
  const [query, setQuery] = useState("");
  const [resources, setResources] = useState<ResourceRecord[]>(initialResources);
  const [selectedLevelFilters, setSelectedLevelFilters] = useState<string[]>([]);
  const [selectedGrammarFilters, setSelectedGrammarFilters] = useState<string[]>([]);
  const [selectedTagFilters, setSelectedTagFilters] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceRecord | null>(null);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [selectedResource, setSelectedResource] = useState<ResourceRecord | null>(null);
  const [title, setTitle] = useState("");
  const [levels, setLevels] = useState<string[]>([]);
  const [grammars, setGrammars] = useState<string[]>([]);
  const [resourceType, setResourceType] = useState("PDF");
  const [source, setSource] = useState<"file" | "link">("file");
  const [sourceValue, setSourceValue] = useState("");
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [instructions, setInstructions] = useState("");
  const [isResourceListScrolled, setIsResourceListScrolled] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; source?: string }>({});
  const titleRef = useRef<HTMLInputElement>(null);
  const sourceRef = useRef<HTMLInputElement>(null);
  const resourcesContentRef = useRef<HTMLDivElement>(null);
  const levelFilterOptions = useMemo(() => {
    const levelOrder = ["A1", "A2", "B1", "B2", "Y2"];
    return Array.from(new Set(resources.flatMap((resource) => resourceValues(resource.level)).filter((value) => value !== "—")))
      .sort((a, b) => {
        const aIndex = levelOrder.indexOf(a);
        const bIndex = levelOrder.indexOf(b);
        if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
  }, [resources]);
  const grammarFilterOptions = useMemo(() => Array.from(new Set(resources.flatMap((resource) => resourceValues(resource.grammar)).filter((value) => value !== "—"))).sort((a, b) => a.localeCompare(b)), [resources]);
  const tagFilterOptions = useMemo(() => Array.from(new Set(resources.flatMap((resource) => resource.tags))).sort((a, b) => a.localeCompare(b)), [resources]);
  const normalizedQuery = query.trim().toLowerCase();
  const visibleResources = resources.filter((resource) => {
    const matchesQuery = !normalizedQuery || resource.title.toLowerCase().includes(normalizedQuery);
    const matchesLevels = !selectedLevelFilters.length || resourceValues(resource.level).some((level) => selectedLevelFilters.includes(level));
    const matchesGrammars = !selectedGrammarFilters.length || resourceValues(resource.grammar).some((grammar) => selectedGrammarFilters.includes(grammar));
    const matchesTags = !selectedTagFilters.length || resource.tags.some((tag) => selectedTagFilters.includes(tag));
    return matchesQuery && matchesLevels && matchesGrammars && matchesTags;
  });
  const hasActiveResourceFilters = Boolean(query || selectedLevelFilters.length || selectedGrammarFilters.length || selectedTagFilters.length);

  function clearResourceFilters() {
    setQuery("");
    setSelectedLevelFilters([]);
    setSelectedGrammarFilters([]);
    setSelectedTagFilters([]);
  }

  useEffect(() => {
    const node = resourcesContentRef.current;
    if (!node) return;
    const updateScrollState = () => setIsResourceListScrolled(node.scrollTop > 2);
    updateScrollState();
    node.addEventListener("scroll", updateScrollState, { passive: true });
    return () => node.removeEventListener("scroll", updateScrollState);
  }, []);

  useEffect(() => {
    if (!isCreating && !selectedResource) return;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isCreating) {
          resetForm();
          setIsCreating(false);
        } else {
          setSelectedResource(null);
        }
      }
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isCreating, selectedResource]);

  function resetForm() {
    setTitle(""); setLevels([]); setGrammars([]); setResourceType("PDF");
    setSource("file"); setSourceValue(""); setSourceFile(null); setSelectedTags([]); setInstructions(""); setFieldErrors({});
  }

  function closeResourceForm() {
    resetForm();
    setEditingResource(null);
    setIsDuplicating(false);
    setIsCreating(false);
  }

  function openResourceForm(resource?: ResourceRecord, duplicate = false) {
    if (!resource) {
      resetForm();
      setEditingResource(null);
      setIsDuplicating(false);
    } else {
      setTitle(`${resource.title}${duplicate ? " (Copy)" : ""}`);
      setLevels(resourceValues(resource.level));
      setGrammars(resourceValues(resource.grammar));
      setResourceType(resource.type === "Web link" || resource.type === "Interactive" ? "PDF" : resource.type);
      setSource(/^https?:\/\//i.test(resource.source ?? "") ? "link" : "file");
      setSourceValue(resource.source ?? "");
      setSourceFile(null);
      setSelectedTags(resource.tags);
      setInstructions(resource.instructions ?? "");
      setFieldErrors({});
      setEditingResource(resource);
      setIsDuplicating(duplicate);
    }
    setSelectedResource(null);
    setIsCreating(true);
  }

  function deleteResource(resource: ResourceRecord) {
    setResources((current) => current.filter((item) => item !== resource));
    if (selectedResource === resource) setSelectedResource(null);
  }

  function saveResource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors: { title?: string; source?: string } = {};
    if (!title.trim()) errors.title = "Informe o nome do recurso.";
    if (!sourceValue.trim()) errors.source = source === "link" ? "Informe um link para continuar." : "Adicione um arquivo para continuar.";
    else if (source === "file" && sourceFile) {
      if (!/\.(pdf|docx?|pptx?|mp4|mp3|png|jpe?g)$/i.test(sourceFile.name)) errors.source = "Use PDF, DOC, PPT, MP4, MP3 ou imagens.";
      else if (sourceFile.size > 10 * 1024 * 1024) errors.source = "O arquivo deve ter no máximo 10 MB.";
    }
    else if (source === "link") {
      try { new URL(sourceValue); } catch { errors.source = "Informe um link válido."; }
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      if (errors.title) titleRef.current?.focus();
      else sourceRef.current?.focus();
      return;
    }
    const nextTags = selectedTags.slice(0, 5);
    const nextResource: ResourceRecord = {
      title: title.trim(),
      level: levels.join(", ") || "—",
      grammar: grammars.join(", ") || "—",
      tags: nextTags,
      type: editingResource ? editingResource.type : source === "link" ? "Web link" : resourceType,
      size: source === "link" ? editingResource?.size || "Link" : sourceFile ? `${Math.max(1, Math.round(sourceFile.size / 1024))} kb` : editingResource?.size || "New file",
      source: sourceValue.trim(),
      instructions: instructions.trim() || undefined,
    };
    setResources((current) => {
      if (editingResource && !isDuplicating) return current.map((item) => item === editingResource ? nextResource : item);
      return [nextResource, ...current];
    });
    closeResourceForm();
  }

  const resourceModal = isCreating && typeof document !== "undefined" ? createPortal((
      <div className="resource-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { resetForm(); setIsCreating(false); } }}>
        <form className="resource-modal" id="resource-create-form" onSubmit={saveResource} role="dialog" aria-modal="true" aria-labelledby="resource-modal-title">
          <header className="resource-modal__header"><h1 id="resource-modal-title">{isDuplicating ? "Duplicate Resource" : editingResource ? "Edit Resource" : "New Resource"}</h1></header>
          <div className="resource-modal__body">
            <div className="resource-modal__row"><div className="resource-modal__label"><FileText size={16} />File or Link <b>*</b></div><div className="resource-modal__field"><div className="resource-radio-group"><label><input type="radio" checked={source === "file"} onChange={() => { setSource("file"); setSourceValue(""); setSourceFile(null); setFieldErrors((current) => ({ ...current, source: undefined })); }} />From my computer</label><label><input type="radio" checked={source === "link"} onChange={() => { setSource("link"); setSourceValue(""); setSourceFile(null); setFieldErrors((current) => ({ ...current, source: undefined })); }} />Link</label></div>{source === "file" ? <label className={`resource-file-input ${fieldErrors.source ? "has-error" : ""}`}><strong>Choose File</strong><span>{sourceValue || "No file chosen"}</span><input ref={sourceRef} type="file" aria-invalid={Boolean(fieldErrors.source)} aria-describedby={fieldErrors.source ? "resource-source-error" : undefined} onChange={(event) => { const file = event.target.files?.[0] ?? null; setSourceFile(file); setSourceValue(file?.name ?? ""); setFieldErrors((current) => ({ ...current, source: undefined })); }} /></label> : <div className={`resource-input-with-icon ${fieldErrors.source ? "has-error" : ""}`}><Link size={15} /><input ref={sourceRef} value={sourceValue} aria-invalid={Boolean(fieldErrors.source)} aria-describedby={fieldErrors.source ? "resource-source-error" : undefined} onChange={(event) => { setSourceValue(event.target.value); setFieldErrors((current) => ({ ...current, source: undefined })); }} placeholder="https://" /></div>}{fieldErrors.source ? <p className="resource-field-error" id="resource-source-error">{fieldErrors.source}</p> : <small className="resource-modal__hint">Use PDF, DOC, PPT, MP4, MP3 or images (max 10MB)</small>}</div></div>
             <div className="resource-modal__row"><div className="resource-modal__label"><ImagePlus size={16} />Name <b>*</b></div><div className="resource-modal__field"><input ref={titleRef} value={title} aria-invalid={Boolean(fieldErrors.title)} aria-describedby={fieldErrors.title ? "resource-title-error" : undefined} className={fieldErrors.title ? "has-error" : ""} onChange={(event) => { setTitle(event.target.value); setFieldErrors((current) => ({ ...current, title: undefined })); }} placeholder="Enter a resource name" />{fieldErrors.title ? <p className="resource-field-error" id="resource-title-error">{fieldErrors.title}</p> : null}</div></div>
            <div className="resource-modal__divider" />
            <div className="resource-modal__row"><div className="resource-modal__label"><GraduationCap size={16} />Level</div><div className="resource-modal__field"><ResourceMultiSelect placeholder="Select Levels" options={["A1", "A2", "B1", "B2", "Y2"]} value={levels} onChange={setLevels} /></div></div>
            <div className="resource-modal__row"><div className="resource-modal__label"><LetterText size={16} />Grammars</div><div className="resource-modal__field"><ResourceMultiSelect placeholder="Select Grammars" options={["Present Simple", "Past Simple", "Present Continuous", "Conversation", "Vocabulary"]} value={grammars} onChange={setGrammars} /></div></div>
            <div className="resource-modal__row"><div className="resource-modal__label"><Paperclip size={16} />Tags</div><div className="resource-modal__field"><ResourceMultiSelect placeholder="Select Tags" options={resourceTagOptions} value={selectedTags} onChange={setSelectedTags} allowCreate /></div></div>
            <div className="resource-modal__divider" />
            <div className="resource-modal__row resource-modal__row--instructions"><div className="resource-modal__label"><ListTodo size={16} />Instructions</div><div className="resource-modal__field"><div className="resource-editor"><div className="resource-editor__toolbar"><Bold size={15} /><Italic size={15} /><Underline size={15} /><Strikethrough size={15} /><AlignLeft size={15} /><Link size={15} /><Paperclip size={15} /></div><textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} placeholder="Describe how this resource should be used in class. You can also include links to external materials." /></div></div></div>
          </div>
          <footer className="resource-modal__footer"><button className="outline-button" type="button" onClick={closeResourceForm}>Cancel</button><button className="primary-button" type="submit"><Check size={16} />{editingResource && !isDuplicating ? "Save Changes" : "Save Resource"}</button></footer>
        </form>
      </div>
    ), document.body) : null;

  const resourceDetailModal = selectedResource && typeof document !== "undefined" ? createPortal((
    <div className="resource-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedResource(null); }}>
      <section className="resource-modal resource-detail-modal" role="dialog" aria-modal="true" aria-labelledby="resource-detail-title">
        <header className="resource-modal__header resource-detail-modal__header"><h1 id="resource-detail-title">Flexge&nbsp; Resource</h1><div className="resource-detail-modal__actions"><button className="outline-button" type="button" onClick={() => openResourceForm(selectedResource)}><Pencil size={15} />Edit Resource</button><button className="resource-detail-close" type="button" onClick={() => setSelectedResource(null)} aria-label="Close resource details"><X size={16} /></button></div></header>
        <div className="resource-modal__body resource-detail-modal__body">
          <div className="resource-detail-preview">
            <div className="resource-detail-preview__media"><ResourcePreviewImage resource={selectedResource} detail /></div>
            <div className="resource-detail-preview__info">
              <div className="resource-detail-preview__meta"><strong>{selectedResource.type === "Interactive" ? "Link resource" : `${selectedResource.type} resource`}</strong><span><FileText size={16} strokeWidth={1.6} />{resourceSourceLabel(selectedResource)}{selectedResource.size !== "Link" ? ` · ${selectedResource.size}` : ""}</span></div>
              <div className="resource-detail-preview__actions"><button type="button" aria-label="Expand resource preview"><Maximize2 size={15} /></button><button type="button" aria-label="Download resource"><Download size={15} /></button></div>
            </div>
          </div>
          <div className="resource-detail-section"><span className="resource-detail-label"><ListTodo size={15} />Instructions</span><p className="resource-detail-empty">{selectedResource.instructions || "Describe how this resource should be used in class. You can also include links to external materials."}</p></div>
          <div className="resource-detail-meta">
            <div className="resource-detail-meta__top">
              <ResourceLevelSummary value={selectedResource.level} />
              {resourceValues(selectedResource.level).length && resourceValues(selectedResource.grammar).length ? <span className="resource-detail-meta__separator">·</span> : null}
              <ResourceGrammarSummary value={selectedResource.grammar} />
            </div>
            <div className="resource-detail-meta__tags">{selectedResource.tags.length ? selectedResource.tags.map((tag) => <span key={tag}>{tag}</span>) : <small className="resource-detail-muted">No tags added</small>}</div>
            <div className="resource-detail-meta__footer"><span className="resource-detail-meta__divider" /><span>Created Mar 13, 2026 · Updated Mar 17, 2026</span></div>
          </div>
        </div>
      </section>
    </div>
  ), document.body) : null;

  return (
    <>
    <section className="resources-screen" aria-label="Resources">
      <header className="resources-header">
        <div className="resources-header__title-row">
          <div>
            <h1>My Resources</h1>
            <p>Create, organize, and manage lesson resources for your classes.</p>
          </div>
        </div>
        <button className="primary-button" type="button" onClick={() => openResourceForm()}><Plus size={16} />New Resource</button>
      </header>

      <div className={`resources-toolbar${isResourceListScrolled ? " is-scrolled" : ""}`} aria-label="Resource list tools">
        <label className="resources-search">
          <Search size={16} aria-hidden="true" />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name" aria-label="Search resources" />
        </label>
        <ResourceFilterDropdown label="Levels" allLabel="All Levels" options={levelFilterOptions} value={selectedLevelFilters} onChange={setSelectedLevelFilters} />
        <ResourceFilterDropdown label="Grammars" allLabel="All Grammars" options={grammarFilterOptions} value={selectedGrammarFilters} onChange={setSelectedGrammarFilters} wide />
        <ResourceFilterDropdown label="Tags" allLabel="All Tags" options={tagFilterOptions} value={selectedTagFilters} onChange={setSelectedTagFilters} wide />
      </div>

      <div ref={resourcesContentRef} className="resources-content resources-content--list">
        <div className="resources-table">
          <div className="resources-table__header"><span>Resources <AlignJustify size={14} /></span></div>
          {visibleResources.map((resource, index) => (
          <article className="resource-list-item" key={`${resource.title}-${index}`}>
              <button className="resource-list-item__main" type="button" onClick={() => setSelectedResource(resource)}>
                <div className={`resource-list-item__thumb${resourceListPreviewSource(resource) ? "" : ` resource-list-item__thumb--${resourceThumbTone(resource.type)}`}`} aria-hidden="true">{resourceListPreviewSource(resource) ? <img src={resourceListPreviewSource(resource)} alt="" /> : <ResourceTypeIcon type={resource.type} />}</div>
                <div className="resource-list-item__details">
                  <div className="resource-list-item__title-row"><h2>{resource.title}</h2><span>·</span>{resource.type === "Interactive" ? <small>Link</small> : <small>{resource.type}</small>}</div>
                  {(resource.level || resourceValues(resource.grammar).length) ? <div className="resource-list-item__meta">
                    <ResourceLevelSummary value={resource.level} />
                    {resource.level && resourceValues(resource.grammar).length ? <i>·</i> : null}
                    <ResourceGrammarSummary value={resource.grammar} />
                  </div> : null}
                  {resource.tags.length ? <div className="resource-list-item__tags" aria-label={`Tags: ${resource.tags.join(", ")}`}>{resource.tags.map((tag) => <span key={tag}>{tag}</span>)}</div> : null}
                </div>
              </button>
              <div className="resource-list-item__actions"><button className="icon-button" type="button" aria-label={`Edit ${resource.title}`} onClick={(event) => { event.stopPropagation(); openResourceForm(resource); }}><Pencil size={15} /></button><button className="icon-button" type="button" aria-label={`Duplicate ${resource.title}`} onClick={(event) => { event.stopPropagation(); openResourceForm(resource, true); }}><Copy size={15} /></button><button className="icon-button" type="button" aria-label={`Delete ${resource.title}`} onClick={(event) => { event.stopPropagation(); deleteResource(resource); }}><Trash2 size={15} /></button></div>
            </article>
          ))}
          {!visibleResources.length ? <div className="resources-filter-empty" role="status"><strong>No resources found</strong><span>Try changing your search or filters.</span>{hasActiveResourceFilters ? <button type="button" onClick={clearResourceFilters}>Clear filters</button> : null}</div> : null}
          <footer className="resources-table__footer"><span>Showing {visibleResources.length} of {resources.length}</span><div><button className="pagination-button" disabled>Previous</button><button className="pagination-button is-current">1</button><button className="pagination-button" disabled>Next</button></div></footer>
        </div>
      </div>
    </section>
    {resourceModal}
    {resourceDetailModal}
    </>
  );
}

function StudentsView() {
  const [query, setQuery] = useState("");
  const students = useMemo(() => initialStudents.filter((student) => `${student.name} ${student.email}`.toLowerCase().includes(query.toLowerCase())), [query]);

  return (
    <section className="students-screen" aria-label="Students">
      <header className="students-header">
        <div className="students-header__title-row"><div><h1>Students</h1><p>Manage your students and track their progress.</p></div></div>
        <button className="primary-button" type="button"><User size={15} />New Student</button>
      </header>
      <div className="students-toolbar">
        <label className="students-search"><Search size={16} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or e-mail" aria-label="Search students" /></label>
        <button className="outline-button" type="button" disabled aria-disabled="true"><Filter size={15} />More filters</button>
        <div className="students-toolbar__spacer" />
        <button className="outline-button" type="button"><Download size={15} />Export</button>
      </div>
      <div className="students-table-wrap">
        <div className="students-table-scroll">
        <table className="students-table">
          <thead><tr><th scope="col" className="students-table__check"><input type="checkbox" aria-label="Select all students" /></th><th scope="col">Student <ChevronDown size={13} /></th><th scope="col">Course <ChevronDown size={13} /></th><th scope="col">Weekly goal <ChevronDown size={13} /></th><th scope="col">Last seen <ChevronDown size={13} /></th><th scope="col">Actions</th></tr></thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} className={student.status === "Disabled" ? "is-disabled" : ""}>
                <td className="students-table__check"><input type="checkbox" aria-label={`Select ${student.name}`} /></td>
                 <td><div className="student-cell"><StudentAvatar name={student.name} className={`student-avatar student-avatar--${student.id}`} /><div><div className="student-name-row"><button className="student-name-button" type="button">{student.name}</button><span className={`student-status student-status--${student.status.toLowerCase()}`}>{student.status}</span></div><small>{student.email}</small></div></div></td>
                <td><div className="course-cell"><span className="course-badge">{student.level}</span><div><small>Progress</small><span>{student.progress}% <b>|</b> {student.studyTime}</span></div></div></td>
                <td><div className="goal-cell"><span>{student.weeklyGoal}</span><div className="goal-bar"><i style={{ width: `${Math.min(student.progress, 100)}%` }} /></div><div className="attendance-row" aria-label="Last four weeks attendance">{student.attendance.map((value, index) => <span key={index} className={`attendance-dot attendance-dot--${value}`} title={value === "present" ? "Present" : "Absent"}>{value === "present" ? "✓" : "×"}</span>)}</div><small>Last 4 weeks</small></div></td>
                <td className="last-seen">{student.lastSeen}</td>
                <td><button className="student-actions-button" type="button" aria-label={`Actions for ${student.name}`}>Actions<ChevronDown size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <footer className="students-table__footer"><span>Total: {students.length}</span><div><button className="pagination-button" disabled>‹</button><button className="pagination-button is-current">1</button><button className="pagination-button" disabled>›</button></div></footer>
      </div>
    </section>
  );
}

function StudentAppView() {
  return (
    <section className="student-app-screen" aria-label="Student App">
      <header className="student-app-header">
        <div className="student-app-header__copy">
          <h1>Student App</h1>
          <p>Ambiente de estudo dos seus alunos (Web e Mobile)</p>
        </div>
        <div className="student-app-header__actions">
          <button className="student-app-header__icon" type="button" aria-label="Notifications"><Bell size={16} /></button>
          <button className="student-app-header__icon" type="button" aria-label="Student App settings"><Settings size={16} /></button>
          <button className="student-app-header__profile" type="button" aria-label="Open profile menu"><span className="avatar">AM</span><ChevronDown size={13} /></button>
        </div>
      </header>
      <div className="student-app-screen__body">
        <div className="student-app-content">
          <div className="student-app-hero-area">
          <section className="student-app-hero" aria-labelledby="student-app-hero-title">
            <div className="student-app-hero__copy">
              <h2 id="student-app-hero-title">Everything your students need<br />to keep learning</h2>
              <p>The Student App is your students’ learning environment. They can access their course, join live classes, track their progress, and review available lessons and activities—all in one place.</p>
              <div className="student-app-hero__actions">
                <button className="student-app-button student-app-button--primary" type="button">Open Student App Web</button>
                <button className="student-app-button student-app-button--outline" type="button">Preview as a student</button>
              </div>
              <section className="student-app-hero__share" aria-labelledby="student-app-share-title">
                <h3 id="student-app-share-title">Share the Student App with your students</h3>
                <div className="student-app-hero__share-list" aria-label="Student App access links">
                  <article className="student-app-hero__share-row">
                    <div className="student-app-hero__share-details"><span className="student-app-hero__share-icon"><img src="/student-app/figma-apple-logo.svg" alt="" /></span><span><strong>Download for iOS</strong><small>Share the App Store download link</small></span></div>
                    <button className="student-app-hero__copy-button" type="button"><Copy size={14} />Copy App Store link</button>
                  </article>
                  <article className="student-app-hero__share-row">
                    <div className="student-app-hero__share-details"><span className="student-app-hero__share-icon"><img src="/student-app/figma-android-logo.svg" alt="" /></span><span><strong>Download for Android</strong><small>Share the App Store download link</small></span></div>
                    <button className="student-app-hero__copy-button" type="button"><Copy size={14} />Copy Google Play link</button>
                  </article>
                  <article className="student-app-hero__share-row">
                    <div className="student-app-hero__share-details"><span className="student-app-hero__share-icon student-app-hero__share-icon--web"><Monitor size={16} /></span><span><strong>Access on the Web</strong><small>Share the Web App link</small></span></div>
                    <button className="student-app-hero__copy-button" type="button"><Copy size={14} />Copy web access link</button>
                  </article>
                </div>
              </section>
            </div>
            <div className="student-app-hero__visual" aria-hidden="true">
              <img className="student-app-hero__composite" src="/student-app/student-app-hero-composite.png" alt="" />
            </div>
          </section>
          </div>

          <section className="student-app-course-library" aria-labelledby="student-app-course-library-title">
            <div className="student-app-course-library__tabs" role="tablist" aria-label="Student App content areas">
              <button className="student-app-course-library__tab is-active" type="button" role="tab" aria-selected="true">Flexge Courses</button>
              <button className="student-app-course-library__tab" type="button" role="tab" aria-selected="false">Exercise library</button>
              <button className="student-app-course-library__tab" type="button" role="tab" aria-selected="false">AI-Exercises Studio <span className="student-app-beta">BETA</span></button>
            </div>
            <div className="student-app-course-library__heading">
              <div>
                <h2 id="student-app-course-library-title">Teens/Adults courses</h2>
                <p>Choose a level to preview the learning path available to your students.</p>
              </div>
              <div className="student-app-course-library__audience">Kids courses</div>
            </div>
            <div className="student-app-levels" role="tablist" aria-label="Course levels">
              {['PRE A1', 'A1', 'A1+', 'A2', 'A2+', 'B1', 'B1+', 'B2', 'B2+', 'C1', 'C2', 'D', 'A'].map((level, index) => (
                <button key={level} className={`student-app-level${index === 0 ? ' is-active' : ''}`} type="button" role="tab" aria-selected={index === 0}>{index === 0 ? <><small>PRE</small>A1</> : level}</button>
              ))}
            </div>
            <div className="student-app-course-summary">
              <div><strong>Average Course duration: 30h</strong><p>To understand very basic structures of the language, such as greetings, numbers, and personal information. Develop skills such as asking for information, buying and ordering items from a shop or restaurant, and responding to simple questions with short answers.</p></div>
              <div className="student-app-course-summary__actions"><button className="outline-button" type="button"><FileText size={14} />Academic Plans</button><button className="outline-button" type="button"><FileText size={14} />Lesson Plans</button></div>
            </div>
            <div className="student-app-modules">
              {[['Module 1', 'Let’s Practice English!', 'linear-gradient(135deg, #dff4ff, #91c7eb)'], ['Module 2', 'More About Us', 'linear-gradient(135deg, #f3e8ff, #c4b5fd)'], ['Module 3', 'Greetings and Introductions', 'linear-gradient(135deg, #e0f2fe, #60a5fa)'], ['Module 4', 'How Many Meals Do You Eat per Day?', 'linear-gradient(135deg, #dcfce7, #86efac)']].map(([label, title, background]) => (
                <article className="student-app-module-card" key={label}>
                  <button className="student-app-module-card__toggle" type="button" aria-label={`Expand ${label}`}><ChevronDown size={18} /></button>
                  <div className="student-app-module-card__copy"><span>{label}</span><h3>{title}</h3></div>
                  <div className="student-app-module-card__art" style={{ background }} aria-hidden="true"><div /><div /><div /></div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

type ScheduleDraft = { type: "individual" | "group" | "custom" | "task" | "away" | "other"; student: { name: string; email: string } | null; group: { name: string; students: number } | null; customStudents: string[]; otherStudents: string[]; otherTeachers: string[]; title: string; taskDescription: string; observation: string; teacher: string; date: string; start: string; end: string; allDay: boolean; allDayEndDate: string; repeats: boolean; repeatDays: string[]; repeatInterval: number; repeatUnit: "Week" | "Month"; endsOn: boolean; endDate: string };
const emptyScheduleDraft = (date = "2026-09-02", start = "12:00"): ScheduleDraft => ({ type: "individual", student: null, group: null, customStudents: [], otherStudents: [], otherTeachers: [], title: "", taskDescription: "", observation: "", teacher: "", date, start, end: minutesToScheduleTime(Math.min(scheduleTimeToMinutes(start) + 60, 21 * 60)), allDay: false, allDayEndDate: date, repeats: false, repeatDays: ["W-3"], repeatInterval: 1, repeatUnit: "Week", endsOn: false, endDate: "" });
const scheduleStudents = [
  { name: "Ana Beatriz Costa", email: "ana.costa@email.com.br", group: "B1 Group" }, { name: "Camila Pereira", email: "camila.pereira@email.com.br", group: "B1 Group" }, { name: "Gabriel Santos", email: "gabriel.santos@email.com.br", group: "A2 Group" }, { name: "Lucas Oliveira", email: "lucas.oliveira@email.com.br", group: "A2 Group" }, { name: "Mariana Silva", email: "mariana.silva@email.com.br", group: "A2 Group" }, { name: "Rafael Souza", email: "rafael.souza@email.com.br", group: "A1 Group" },
];
const scheduleGroups = [{ name: "B1 Group", students: 12, color: "#d97706" }, { name: "A2 Group", students: 8, color: "#6d28d9" }, { name: "Conversation Club", students: 10, color: "#0f766e" }];
const scheduleTeachers = ["André Martins", "Mariana Costa", "Lucas Almeida"];

function draftFromPlannerEvent(event: PlannerEvent): ScheduleDraft {
  const defaultDraft = emptyScheduleDraft();
  const [startHours, startMinutes] = [Math.floor(event.startMinutes / 60), event.startMinutes % 60];
  const endTotal = event.startMinutes + event.duration;
  const [endHours, endMinutes] = [Math.floor(endTotal / 60), endTotal % 60];
  const recurrence = event.recurrence;
  const student = scheduleStudents.find((candidate) => candidate.name === event.studentName) ?? null;
  const group = scheduleGroups.find((candidate) => candidate.name === event.groupName || event.title.includes(candidate.name)) ?? null;
  return {
    ...defaultDraft,
    type: event.kind ?? "group",
    student,
    group,
    customStudents: event.studentEmails ?? [],
    otherStudents: event.kind === "other" ? event.studentEmails ?? [] : [],
    otherTeachers: event.kind === "other" ? event.teacherNames ?? [] : [],
    title: event.title,
    taskDescription: event.description ?? "",
    observation: event.observation ?? "",
    teacher: event.teacherNames?.[0] ?? "",
    date: event.scheduledDate ?? defaultDraft.date,
    start: `${String(startHours).padStart(2, "0")}:${String(startMinutes).padStart(2, "0")}`,
    end: event.kind !== "away" && event.duration >= 24 * 60 ? minutesToScheduleTime(Math.min(event.startMinutes + 60, 21 * 60)) : `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}`,
    allDay: event.kind === "away" && (event.allDay ?? event.duration >= 24 * 60),
    allDayEndDate: event.scheduledDate ?? defaultDraft.date,
    repeats: recurrence?.repeats ?? false,
    repeatDays: recurrence?.repeatDays ?? defaultDraft.repeatDays,
    repeatInterval: recurrence?.repeatInterval ?? 1,
    repeatUnit: recurrence?.repeatUnit ?? "Week",
    endsOn: recurrence?.endsOn ?? false,
    endDate: recurrence?.endDate ?? "",
  };
}

function formatScheduleDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }).format(new Date(year, month - 1, day));
}

function isoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatScheduleTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(2026, 0, 1, hours, minutes));
}

function scheduleTimeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToScheduleTime(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function ScheduleDatePicker({ value, onChange, disabled = false, label = "Choose class date", placeholder = "Select a date", minValue, maxValue }: { value: string; onChange: (value: string) => void; disabled?: boolean; label?: string; placeholder?: string; minValue?: string; maxValue?: string }) {
  const selected = value ? new Date(`${value}T12:00:00`) : new Date(2026, 8, 2);
  const [month, setMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1));
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const cells = Array.from({ length: monthStart.getDay() + monthEnd.getDate() }, (_, index) => index < monthStart.getDay() ? null : new Date(month.getFullYear(), month.getMonth(), index - monthStart.getDay() + 1));
  const toValue = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const minMonth = minValue ? new Date(`${minValue}T12:00:00`) : null;
  const maxMonth = maxValue ? new Date(`${maxValue}T12:00:00`) : null;
  const isBeforeMinMonth = Boolean(minMonth && monthStart < new Date(minMonth.getFullYear(), minMonth.getMonth(), 1));
  const isAfterMaxMonth = Boolean(maxMonth && monthStart > new Date(maxMonth.getFullYear(), maxMonth.getMonth(), 1));

  return <Popover.Root><Popover.Trigger asChild><button className="schedule-picker-trigger" type="button" aria-label={label} disabled={disabled} onPointerDown={(event) => event.stopPropagation()}><span className={value ? "" : "is-placeholder"}>{value ? formatScheduleDate(value) : placeholder}</span><CalendarDays size={16} aria-hidden="true" /></button></Popover.Trigger><Popover.Portal><Popover.Content className="schedule-picker-popover schedule-date-picker" side="bottom" align="start" sideOffset={6} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}><div className="schedule-picker-header"><button type="button" disabled={isBeforeMinMonth} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month"><ChevronLeft size={16} /></button><strong>{month.toLocaleString("en-US", { month: "long", year: "numeric" })}</strong><button type="button" disabled={isAfterMaxMonth} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month"><ChevronRight size={16} /></button></div><div className="schedule-calendar-weekdays">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => <span key={day}>{day}</span>)}</div><div className="schedule-calendar-days">{cells.map((date, index) => { if (!date) return <span key={`empty-${index}`} />; const dateValue = toValue(date); const outOfRange = (minValue && dateValue < minValue) || (maxValue && dateValue > maxValue); return <button type="button" key={date.toISOString()} className={toValue(date) === value ? "is-selected" : ""} disabled={outOfRange} onClick={(event) => { event.stopPropagation(); if (!outOfRange) onChange(dateValue); }}>{date.getDate()}</button>; })}</div></Popover.Content></Popover.Portal></Popover.Root>;
}

function ScheduleTimePicker({ value, onChange, label, minMinutes = 8 * 60, maxMinutes = 21 * 60 }: { value: string; onChange: (value: string) => void; label: string; minMinutes?: number; maxMinutes?: number }) {
  const times = Array.from({ length: 53 }, (_, index) => {
    const minutes = 8 * 60 + index * 15;
    return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  }).filter((time) => {
    const minutes = scheduleTimeToMinutes(time);
    return minutes >= minMinutes && minutes <= maxMinutes;
  });
  const valueMinutes = scheduleTimeToMinutes(value);
  if (valueMinutes >= minMinutes && valueMinutes <= maxMinutes && !times.includes(value)) {
    times.push(value);
    times.sort((first, second) => scheduleTimeToMinutes(first) - scheduleTimeToMinutes(second));
  }
  return <Popover.Root><Popover.Trigger asChild><button className="schedule-picker-trigger" type="button" aria-label={`Choose ${label.toLowerCase()}`} onPointerDown={(event) => event.stopPropagation()}><span>{formatScheduleTime(value)}</span><Clock3 size={16} aria-hidden="true" /></button></Popover.Trigger><Popover.Portal><Popover.Content className="schedule-picker-popover schedule-time-picker" side="bottom" align="start" sideOffset={6} onPointerDown={(event) => event.stopPropagation()} onClick={(event) => event.stopPropagation()}><div className="schedule-time-options" role="listbox" aria-label={label}>{times.map((time) => <button type="button" role="option" aria-selected={time === value} className={time === value ? "is-selected" : ""} key={time} onClick={(event) => { event.stopPropagation(); onChange(time); }}>{formatScheduleTime(time)}</button>)}</div></Popover.Content></Popover.Portal></Popover.Root>;
}

function ScheduleRepeatUnitSelect({ value, onChange }: { value: ScheduleDraft["repeatUnit"]; onChange: (value: ScheduleDraft["repeatUnit"]) => void }) {
  return <Popover.Root><Popover.Trigger asChild><button className="schedule-select-trigger" type="button" aria-label="Repeat unit"><span>{value}</span><ChevronDown size={16} aria-hidden="true" /></button></Popover.Trigger><Popover.Portal><Popover.Content className="schedule-select-menu" side="bottom" align="start" sideOffset={6}><div role="listbox" aria-label="Repeat unit">{(["Week", "Month"] as const).map((unit) => <button key={unit} type="button" role="option" aria-selected={unit === value} className={unit === value ? "is-selected" : ""} onClick={() => onChange(unit)}>{unit}{unit === value ? <Check size={16} aria-hidden="true" /> : null}</button>)}</div></Popover.Content></Popover.Portal></Popover.Root>;
}

const emptyCalendarFilters: CalendarFilters = { group: [], teacher: [], student: [], classStatus: [], planningStatus: [] };

function CalendarFilterSelect({ icon: Icon, label, value, options, onChange }: { icon: typeof Users; label: string; value: string[]; options: string[]; onChange: (value: string[]) => void }) {
  const displayValue = !value.length ? label : value.length === 1 ? value[0] : `${value.length} selected`;
  const toggleOption = (option: string) => onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option]);
  return <Popover.Root><Popover.Trigger asChild><button className="calendar-filter-select" type="button" aria-label={label}><Icon size={17} aria-hidden="true" /><span>{displayValue}</span><ChevronDown size={17} aria-hidden="true" /></button></Popover.Trigger><Popover.Portal><Popover.Content className="calendar-filter-options" side="bottom" align="start" sideOffset={4}><div role="listbox" aria-label={label} aria-multiselectable="true"><button type="button" role="option" aria-selected={!value.length} className={!value.length ? "is-selected" : ""} onClick={() => onChange([])}><span className="calendar-filter-options__check" aria-hidden="true">{!value.length ? <Check size={13} /> : null}</span>{label}</button>{options.map((option) => <button key={option} type="button" role="option" aria-selected={value.includes(option)} className={value.includes(option) ? "is-selected" : ""} onClick={() => toggleOption(option)}><span className="calendar-filter-options__check" aria-hidden="true">{value.includes(option) ? <Check size={13} /> : null}</span>{option}</button>)}</div></Popover.Content></Popover.Portal></Popover.Root>;
}

function CalendarFilterPopover({ filters, onApply }: { filters: CalendarFilters; onApply: (filters: CalendarFilters) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(filters);
  const selectedCount = Object.values(filters).flat().length;
  const update = (key: keyof CalendarFilters, value: string[]) => setDraft((current) => ({ ...current, [key]: value }));
  const reset = () => { setDraft(emptyCalendarFilters); onApply(emptyCalendarFilters); };
  const apply = () => { onApply(draft); setOpen(false); };
  return <Popover.Root open={open} onOpenChange={(next) => { if (next) setDraft(filters); setOpen(next); }}><Popover.Trigger asChild><button className={`outline-button calendar-filter-button${selectedCount ? " is-active" : ""}`} type="button"><ListFilter size={16} strokeWidth={1.8} />Filter{selectedCount ? <span>{selectedCount}</span> : null}</button></Popover.Trigger><Popover.Portal><Popover.Content className="calendar-filter-menu" side="bottom" align="end" sideOffset={6} aria-label="Filter lessons"><div className="calendar-filter-groups"><section className="calendar-filter-group" aria-labelledby="calendar-filter-people"><h2 id="calendar-filter-people">People</h2><CalendarFilterSelect icon={Users} label="All Groups" value={draft.group} options={["B1 Group", "A2 Group", "Conversation Club"]} onChange={(value) => update("group", value)} /><CalendarFilterSelect icon={User} label="All Teachers" value={draft.teacher} options={["Mariana Costa", "Lucas Almeida"]} onChange={(value) => update("teacher", value)} /><CalendarFilterSelect icon={GraduationCap} label="All Students" value={draft.student} options={["Ana Beatriz Costa", "Camila Pereira", "Gabriel Santos", "Mariana Silva"]} onChange={(value) => update("student", value)} /></section><section className="calendar-filter-group" aria-labelledby="calendar-filter-status"><h2 id="calendar-filter-status">Class status</h2><CalendarFilterSelect icon={CalendarDays} label="All Class Status" value={draft.classStatus} options={["Scheduled", "Rescheduled", "Canceled", "Student no-show"]} onChange={(value) => update("classStatus", value)} /><CalendarFilterSelect icon={BookOpen} label="All Planning Status" value={draft.planningStatus} options={["To Plan", "Planning", "Planned", "Taught"]} onChange={(value) => update("planningStatus", value)} /></section></div><div className="calendar-filter-menu__actions"><button type="button" onClick={reset}>Clear Filter</button><button type="button" onClick={apply}>Apply</button></div></Popover.Content></Popover.Portal></Popover.Root>;
}

function OtherEventSelection({ query, setQuery, students, selectedStudents, selectedTeachers, onStudentsChange, onTeachersChange, onBack }: { query: string; setQuery: (value: string) => void; students: typeof scheduleStudents; selectedStudents: string[]; selectedTeachers: string[]; onStudentsChange: (values: string[]) => void; onTeachersChange: (values: string[]) => void; onBack: () => void }) {
  const [tab, setTab] = useState<"students" | "teachers">("students");
  const filteredStudents = students.filter((student) => `${student.name} ${student.email}`.toLowerCase().includes(query.toLowerCase()));
  const filteredTeachers = scheduleTeachers.filter((teacher) => teacher.toLowerCase().includes(query.toLowerCase()));
  return <div className="schedule-other-selection"><div className="schedule-modal__intro"><button type="button" className="schedule-back" onClick={onBack} aria-label="Back to event type"><ChevronLeft size={16} /></button><span>Select the students and/or teachers for this event</span></div><div className="schedule-other-tabs" role="tablist"><button type="button" className={tab === "students" ? "is-active" : ""} role="tab" aria-selected={tab === "students"} onClick={() => { setTab("students"); setQuery(""); }}>Students <span aria-label={`${selectedStudents.length} students selected`}>{selectedStudents.length}</span></button><button type="button" className={tab === "teachers" ? "is-active" : ""} role="tab" aria-selected={tab === "teachers"} onClick={() => { setTab("teachers"); setQuery(""); }}>Teachers <span aria-label={`${selectedTeachers.length} teachers selected`}>{selectedTeachers.length}</span></button></div><div className="schedule-custom-student-controls"><label className="schedule-search"><Search size={16} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or email" /></label>{tab === "students" ? <select aria-label="Student group filter"><option>All Students</option><option>B1 Group</option><option>A2 Group</option><option>A1 Group</option></select> : null}</div><div className="schedule-student-list schedule-custom-student-list">{tab === "students" ? filteredStudents.map((student) => { const selected = selectedStudents.includes(student.email); return <label className={selected ? "is-selected" : ""} key={student.email}><input type="checkbox" checked={selected} onChange={() => onStudentsChange(selected ? selectedStudents.filter((email) => email !== student.email) : [...selectedStudents, student.email])} /><StudentAvatar name={student.name} className="schedule-student-avatar" /><span><strong>{student.name}</strong><small>{student.group}</small></span></label>; }) : filteredTeachers.map((teacher) => { const selected = selectedTeachers.includes(teacher); return <label className={selected ? "is-selected" : ""} key={teacher}><input type="checkbox" checked={selected} onChange={() => onTeachersChange(selected ? selectedTeachers.filter((name) => name !== teacher) : [...selectedTeachers, teacher])} /><StudentAvatar name={teacher} className="schedule-student-avatar" /><span><strong>{teacher}</strong><small>Teacher</small></span></label>; })}</div></div>;
}

function ScheduleEventModal({ onClose, onSave, onScheduleChange, editingEvent, defaultDate, defaultStart = "12:00", defaultDuration = 60, defaultType, scheduledEvents, variant = "modal", contextLabel, isSaving = false, isFullEnglish = false }: { onClose: () => void; onSave: (draft: ScheduleDraft, editingEvent?: PlannerEvent) => Promise<void> | void; onScheduleChange?: (values: { date: string; start: string; end: string; allDay?: boolean; allDayEndDate?: string }) => void; editingEvent?: PlannerEvent | null; defaultDate: string; defaultStart?: string; defaultDuration?: number; defaultType?: ScheduleDraft["type"]; scheduledEvents: PlannerEvent[]; variant?: "modal" | "popover"; contextLabel?: string; isSaving?: boolean; isFullEnglish?: boolean }) {
  const isEditing = Boolean(editingEvent);
  const [step, setStep] = useState<1 | 2 | 3>(() => editingEvent ? (editingEvent.kind === "task" || editingEvent.kind === "away" ? 3 : 2) : defaultType === "task" || defaultType === "away" ? 3 : defaultType ? 2 : 1);
  const [query, setQuery] = useState("");
  const [studentGroupFilter, setStudentGroupFilter] = useState("all");
  const [draft, setDraft] = useState<ScheduleDraft>(() => {
    if (editingEvent) return draftFromPlannerEvent(editingEvent);
    const initial = emptyScheduleDraft(defaultDate, defaultStart);
    const end = minutesToScheduleTime(Math.min(scheduleTimeToMinutes(defaultStart) + Math.max(defaultDuration, 15), 21 * 60));
    return { ...initial, type: defaultType ?? initial.type, title: defaultType === "away" ? "Away" : "", end };
  });
  // Keep the schedule fields aligned with the calendar selection while the
  // contextual popover remains open (for example after dragging/resizing).
  // Do not run this for edits, where the existing event is the source of truth.
  useEffect(() => {
    if (isEditing) return;
    const nextStartMinutes = scheduleTimeToMinutes(defaultStart);
    const nextEnd = minutesToScheduleTime(Math.min(nextStartMinutes + Math.max(defaultDuration, 15), 21 * 60));
    setDraft((current) => ({ ...current, date: defaultDate, start: defaultStart, end: nextEnd }));
  }, [defaultDate, defaultStart, defaultDuration, isEditing]);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [teacherMenuOpen, setTeacherMenuOpen] = useState(false);
  const update = (values: Partial<ScheduleDraft>) => setDraft((current) => ({ ...current, ...values }));
  const students = scheduleStudents.filter((student) => `${student.name} ${student.email}`.toLowerCase().includes(query.toLowerCase()));
  const customStudents = students.filter((student) => studentGroupFilter === "all" || student.group === studentGroupFilter);
  const titleInvalid = submitAttempted && !draft.title.trim();
  const teacherInvalid = (draft.type === "individual" || draft.type === "group") && submitAttempted && !draft.teacher;
  const canAccessScheduleDetails = draft.type === "custom" || draft.type === "other" || draft.type === "task" || draft.type === "away" || Boolean(draft.student) || Boolean(draft.group);
  const selectedGroupColor = scheduleGroups.find((group) => group.name === draft.group?.name)?.color ?? "#753fe5";
  const otherParticipantsSummary = `${draft.otherStudents.length} ${draft.otherStudents.length === 1 ? "Student" : "Students"} · ${draft.otherTeachers.length} ${draft.otherTeachers.length === 1 ? "Teacher" : "Teachers"}`;
  const canBeAllDay = draft.type === "away";
  const isAllDay = canBeAllDay && draft.allDay;
  const draftStartMinutes = isAllDay ? 0 : scheduleTimeToMinutes(draft.start);
  const draftEndMinutes = isAllDay ? 24 * 60 : scheduleTimeToMinutes(draft.end);
  const conflictingEvents = scheduledEvents.filter((event) => event.scheduledDate === draft.date && String(event.id) !== String(editingEvent?.id) && event.startMinutes < draftEndMinutes && event.startMinutes + event.duration > draftStartMinutes);
  const conflictNames = conflictingEvents.slice(0, 2).map(eventDisplayName);

  function submitEvent() {
    if (isSaving) return;
    if (!draft.title.trim() || ((draft.type === "individual" || draft.type === "group") && !draft.teacher)) {
      setSubmitAttempted(true);
      return;
    }

    void onSave(draft, editingEvent ?? undefined);
  }

  function chooseEventType(type: ScheduleDraft["type"]) {
    setSubmitAttempted(false);
    setTeacherMenuOpen(false);
    if (type === "custom" || type === "other" || type === "task" || type === "away") {
      update({ type, student: null, group: null, customStudents: [], otherStudents: [], otherTeachers: [], title: type === "away" ? "Away" : "", taskDescription: "", teacher: "" });
      setQuery("");
      setStudentGroupFilter("all");
      setStep(type === "custom" || type === "other" ? 2 : 3);
      return;
    }
    update({ type, student: null, group: null, customStudents: [], otherStudents: [], otherTeachers: [], title: "", teacher: "" });
    setStep(2);
  }

  function goToStep(target: 1 | 2 | 3) {
    if (target === 1 || target === 2 || (target === 3 && canAccessScheduleDetails)) {
      setStep(target);
    }
  }
  const stepItems = isEditing
    ? draft.type === "task" || draft.type === "away"
    ? [{ label: "Schedule Details", target: 3 as const }]
      : [{ label: "Event Details", target: 2 as const }, { label: "Schedule Details", target: 3 as const }]
    : step === 1
    ? [{ label: "Event Type", target: 1 as const }]
    : draft.type === "task" || draft.type === "away"
      ? [{ label: "Event Type", target: 1 as const }, { label: "Schedule Details", target: 3 as const }]
      : [{ label: "Event Type", target: 1 as const }, { label: "Event Details", target: 2 as const }, { label: "Schedule Details", target: 3 as const }];
  const dialog = <section className={`schedule-modal${variant === "popover" ? " schedule-modal--popover" : ""}`} role="dialog" aria-modal={variant === "popover" ? undefined : true} aria-labelledby="schedule-event-title">
    <header className="schedule-modal__header"><div><h2 id="schedule-event-title">{isEditing ? "Edit Schedule" : "New Schedule"}</h2>{contextLabel ? <span className="schedule-modal__context">{contextLabel}</span> : null}</div><button type="button" onClick={onClose} disabled={isSaving} aria-label="Close schedule event"><X size={16} /></button></header>
    <ol className="schedule-steps">{stepItems.map(({ label, target }) => { const disabled = target === 3 && !canAccessScheduleDetails; return <li key={label} className={step > target ? "is-complete" : step === target ? "is-current" : ""}><button type="button" disabled={disabled} onClick={() => goToStep(target)}><span>{step > target ? <Check size={13} /> : target === 3 && draft.type === "task" ? 2 : target}</span>{label}</button></li>; })}</ol>
    <div className={`schedule-modal__body${step === 2 && draft.type === "other" ? " is-other-selection" : ""}${isEditing ? " is-editing" : ""}`}>
      {step === 1 && !isEditing ? <div className="schedule-type-step"><p>What would you like to schedule?</p><div className="schedule-type-options"><button type="button" onClick={() => chooseEventType("individual")}><span className="schedule-type-icon"><User size={20} /></span><span className="schedule-type-copy"><strong>Individual Class</strong><small>Schedule a one-on-one class with a student.</small></span><ChevronRight size={20} /></button><button type="button" onClick={() => chooseEventType("group")}><span className="schedule-type-icon schedule-type-icon--group"><Users size={20} /></span><span className="schedule-type-copy"><strong>Group Class</strong><small>Schedule a class with multiple students.</small></span><ChevronRight size={20} /></button><button type="button" onClick={() => chooseEventType("custom")}><span className="schedule-type-icon schedule-type-icon--custom"><UserRoundCog size={20} /></span><span className="schedule-type-copy"><strong>Custom Class</strong><small>Create a class outside the regular course or group setup.</small></span><ChevronRight size={20} /></button><div className="schedule-type-section-label">Other events</div><button type="button" onClick={() => chooseEventType("task")}><span className="schedule-type-icon schedule-type-icon--task"><ListTodo size={20} /></span><span className="schedule-type-copy"><strong>Task</strong><small>Add a task or reminder to your calendar.</small></span><ChevronRight size={20} /></button><button type="button" onClick={() => chooseEventType("away")}><span className="schedule-type-icon schedule-type-icon--away"><CalendarX2 size={20} /></span><span className="schedule-type-copy"><strong>Away</strong><small>Block time when you are unavailable for classes.</small></span><ChevronRight size={20} /></button></div></div> : null}
      {step === 2 ? <div className={draft.type === "custom" ? "schedule-student-step schedule-custom-student-step" : "schedule-student-step"}><div className="schedule-modal__intro"><button type="button" className="schedule-back" onClick={() => { if (isEditing) onClose(); else setStep(1); }} aria-label={isEditing ? "Close edit event" : "Back to event type"}><ChevronLeft size={16} /></button><span>{draft.type === "individual" ? "Select the student for this class" : draft.type === "group" ? "Select the group for this class" : "Select the students for this class"}</span></div>{draft.type === "individual" ? <><label className="schedule-search"><Search size={16} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or email" /></label><div className="schedule-student-list">{students.map((student) => <button type="button" className={draft.student?.email === student.email ? "is-selected" : ""} key={student.email} onClick={() => { update({ student, title: `${student.name} Class` }); setStep(3); }}><StudentAvatar name={student.name} className="schedule-student-avatar" /><span><strong>{student.name}</strong><small>{student.email}</small></span>{draft.student?.email === student.email ? <Check size={16} /> : null}</button>)}</div></> : draft.type === "group" ? <div className="schedule-student-list schedule-group-list">{scheduleGroups.map((group) => <button type="button" className={draft.group?.name === group.name ? "is-selected" : ""} key={group.name} onClick={() => { update({ group, title: `${group.name} Class` }); setStep(3); }}><span className="schedule-group-swatch" style={{ backgroundColor: group.color }} aria-hidden="true" /><span><strong>{group.name}</strong><small>{group.students} Students</small></span>{draft.group?.name === group.name ? <Check size={16} /> : null}</button>)}</div> : <><div className="schedule-custom-student-controls"><label className="schedule-search"><Search size={16} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or email" /></label><select aria-label="Student group filter" value={studentGroupFilter} onChange={(event) => setStudentGroupFilter(event.target.value)}><option value="all">All Students</option><option value="B1 Group">B1 Group</option><option value="A2 Group">A2 Group</option><option value="A1 Group">A1 Group</option></select></div><div className="schedule-student-list schedule-custom-student-list">{customStudents.map((student) => { const selected = draft.customStudents.includes(student.email); return <label className={selected ? "is-selected" : ""} key={student.email}><input type="checkbox" checked={selected} onChange={() => update({ customStudents: selected ? draft.customStudents.filter((email) => email !== student.email) : [...draft.customStudents, student.email] })} /><StudentAvatar name={student.name} className="schedule-student-avatar" /><span><strong>{student.name}</strong><small>{student.group}</small></span></label>; })}</div></>}</div> : null}
      {step === 2 && draft.type === "other" ? <OtherEventSelection query={query} setQuery={setQuery} students={students} selectedStudents={draft.otherStudents} selectedTeachers={draft.otherTeachers} onStudentsChange={(otherStudents) => update({ otherStudents })} onTeachersChange={(otherTeachers) => update({ otherTeachers })} onBack={() => { if (isEditing) onClose(); else setStep(1); }} /> : null}
      {step === 3 ? (
        <div className={draft.type === "custom" ? "schedule-details-step schedule-details-step--custom" : "schedule-details-step"}>
          <div className="schedule-modal__intro">
            <button type="button" className="schedule-back" onClick={() => setStep(draft.type === "individual" || draft.type === "group" || draft.type === "custom" || draft.type === "other" ? 2 : 1)} aria-label={draft.type === "individual" || draft.type === "group" || draft.type === "custom" || draft.type === "other" ? "Back to event details" : "Back to event type"}><ChevronLeft size={16} /></button>
            <span className="schedule-event-summary">Resume Event: <b>{draft.type === "individual" ? "Individual Class" : draft.type === "group" ? "Group Class" : draft.type === "task" ? "Task" : draft.type === "away" ? "Away" : draft.type === "other" ? "Other" : "Class Custom"}</b>{draft.student ? <><span className="schedule-event-summary__dot" aria-hidden="true">·</span><StudentAvatar name={draft.student.name} className="schedule-event-summary__avatar" /><b>{draft.student.name}</b></> : draft.group ? <><span className="schedule-event-summary__dot" aria-hidden="true">·</span><span className="schedule-event-summary__group-dot" style={{ backgroundColor: selectedGroupColor }} aria-hidden="true" /><b>{draft.group.name} ({draft.group.students} Students)</b></> : draft.type === "custom" ? <b> · {draft.customStudents.length} {draft.customStudents.length === 1 ? "Student" : "Students"} selected</b> : draft.type === "other" ? <b> · {otherParticipantsSummary}</b> : null}</span>
          </div>
          <div className="schedule-form-row">
            <label className={titleInvalid ? "is-invalid" : ""}>
              <span className="schedule-form-label">Title <b>*</b></span>
              <input autoFocus={draft.type !== "away"} value={draft.title} aria-invalid={titleInvalid} onChange={(event) => update({ title: event.target.value })} placeholder="Add an event title" />
              {titleInvalid ? <small className="schedule-field-error">This is a required field</small> : null}
            </label>
            {(draft.type === "individual" || draft.type === "group") ? <label className={teacherInvalid ? "is-invalid" : ""}>
              <span className="schedule-form-label">Teacher <b>*</b></span>
              <div className="schedule-teacher-select">
                <button
                  className="schedule-teacher-trigger"
                  type="button"
                  aria-expanded={teacherMenuOpen}
                  aria-haspopup="listbox"
                  aria-invalid={teacherInvalid}
                  onClick={() => setTeacherMenuOpen((open) => !open)}
                >
                  <span className={draft.teacher ? "" : "is-placeholder"}>{draft.teacher || "Select a teacher"}</span>
                  <ChevronDown size={16} aria-hidden="true" />
                </button>
                {teacherMenuOpen ? (
                  <div className="schedule-teacher-menu" role="listbox" aria-label="Select a teacher">
                    {["André Martins", "Mariana Costa"].map((teacher) => (
                      <button
                        key={teacher}
                        type="button"
                        role="option"
                        aria-selected={draft.teacher === teacher}
                        onClick={() => { update({ teacher }); setTeacherMenuOpen(false); }}
                      >
                        {teacher}
                        {draft.teacher === teacher ? <Check size={16} aria-hidden="true" /> : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              {teacherInvalid ? <small className="schedule-field-error">This is a required field</small> : null}
            </label> : null}
          </div>
          {draft.type === "task" || draft.type === "away" ? <label className="schedule-task-description-field"><span className="schedule-form-label">{draft.type === "away" ? "Description" : "Task description"}</span><textarea autoFocus={draft.type === "away"} value={draft.taskDescription} onChange={(event) => update({ taskDescription: event.target.value })} placeholder={draft.type === "away" ? "Add a note about your unavailable time" : "Describe what needs to be done"} /></label> : null}
          {isFullEnglish && (draft.type === "individual" || draft.type === "group" || draft.type === "custom") ? <label className="schedule-task-description-field"><span className="schedule-form-label">Observation</span><textarea value={draft.observation} onChange={(event) => update({ observation: event.target.value })} placeholder="Add an observation for the institution" maxLength={2000} /></label> : null}
          <div className="schedule-divider" />
          {canBeAllDay ? <label className="schedule-all-day-toggle"><input type="checkbox" checked={isAllDay} onChange={(event) => { const allDay = event.target.checked; const allDayEndDate = allDay ? (draft.allDayEndDate || draft.date) : draft.allDayEndDate; update({ allDay, allDayEndDate }); onScheduleChange?.({ date: draft.date, start: draft.start, end: draft.end, allDay, allDayEndDate }); window.dispatchEvent(new CustomEvent("calendar-schedule-change", { detail: { date: draft.date, start: draft.start, end: draft.end, allDay, allDayEndDate } })); }} /><span>All day</span><small>Event lasts the entire day</small></label> : null}
          <div className="schedule-date-row">
            <label>{isAllDay ? "Start date" : "Class date"}<ScheduleDatePicker value={draft.date} onChange={(date) => { update({ date, allDayEndDate: draft.allDayEndDate < date ? date : draft.allDayEndDate }); onScheduleChange?.({ date, start: draft.start, end: draft.end }); window.dispatchEvent(new CustomEvent("calendar-schedule-change", { detail: { date, start: draft.start, end: draft.end } })); }} /></label>
            {isAllDay ? <label>End date<ScheduleDatePicker value={draft.allDayEndDate} minValue={draft.date} onChange={(allDayEndDate) => { update({ allDayEndDate }); onScheduleChange?.({ date: draft.date, start: draft.start, end: draft.end, allDay: true, allDayEndDate }); window.dispatchEvent(new CustomEvent("calendar-schedule-change", { detail: { date: draft.date, start: draft.start, end: draft.end, allDay: true, allDayEndDate } })); }} /></label> : null}
            {!isAllDay ? <><label>Start time<ScheduleTimePicker label="Start time" value={draft.start} maxMinutes={20 * 60 + 45} onChange={(start) => {
              // Keep start and end independent; only prevent a negative interval.
              const end = scheduleTimeToMinutes(draft.end) < scheduleTimeToMinutes(start) ? start : draft.end;
              update({ start, end });
              onScheduleChange?.({ date: draft.date, start, end });
              window.dispatchEvent(new CustomEvent("calendar-schedule-change", { detail: { date: draft.date, start, end } }));
            }} /></label><label>End time<ScheduleTimePicker label="End time" value={draft.end} minMinutes={scheduleTimeToMinutes(draft.start)} onChange={(end) => { update({ end }); onScheduleChange?.({ date: draft.date, start: draft.start, end }); window.dispatchEvent(new CustomEvent("calendar-schedule-change", { detail: { date: draft.date, start: draft.start, end } })); }} /></label></> : null}
          </div>
          {conflictingEvents.length ? <div className="schedule-time-conflict" role="status"><Info size={18} aria-hidden="true" /><span><strong>This time overlaps with {conflictNames.join(" and ")}{conflictingEvents.length > 2 ? ` and ${conflictingEvents.length - 2} more event${conflictingEvents.length - 2 === 1 ? "" : "s"}` : ""}.</strong></span></div> : null}
          <div className="schedule-recurrence" role="group" aria-labelledby="schedule-recurrence-label">
            <span id="schedule-recurrence-label" className="schedule-recurrence-label">Recurrence</span>
            <label><input type="radio" checked={!draft.repeats} onChange={() => update({ repeats: false })} /> Doesn’t repeat</label>
            <label><input type="radio" checked={draft.repeats} onChange={() => update({ repeats: true })} /> Repeats</label>
          </div>
          {draft.repeats ? (
            <div className="schedule-repeat-settings">
              <div className="schedule-repeat-control">
                <span>Every</span>
                <input
                  aria-label="Repeat interval"
                  type="number"
                  min="1"
                  value={draft.repeatInterval}
                  onChange={(event) => update({ repeatInterval: Math.max(1, Number(event.target.value) || 1) })}
                />
                <ScheduleRepeatUnitSelect value={draft.repeatUnit} onChange={(repeatUnit) => update({ repeatUnit })} />
              </div>
              <div className="schedule-repeat-days">
                <span>Repeats on</span>
                {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => {
                  const dayKey = `${day}-${index}`;
                  const isSelected = draft.repeatDays.includes(dayKey);
                  return <label key={dayKey}><input type="checkbox" checked={isSelected} onChange={() => update({ repeatDays: isSelected ? draft.repeatDays.filter((value) => value !== dayKey) : [...draft.repeatDays, dayKey] })} />{day}</label>;
                })}
              </div>
              <div className="schedule-repeat-end">
                <span>Ends on</span>
                <button className={draft.endsOn ? "is-on" : ""} type="button" role="switch" aria-checked={draft.endsOn} aria-label="Set recurrence end date" onClick={() => update({ endsOn: !draft.endsOn })}><span /></button>
                <ScheduleDatePicker value={draft.endDate} onChange={(endDate) => update({ endDate })} disabled={!draft.endsOn} label="Recurrence end date" placeholder="mm/dd/yyyy" />
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
    {step === 3 || (step === 2 && (draft.type === "custom" || draft.type === "other" || draft.type === "task" || draft.type === "away")) ? <footer className="schedule-modal__footer"><button className="schedule-save" type="button" disabled={isSaving} aria-busy={isSaving || undefined} onClick={step === 3 ? submitEvent : () => setStep(3)}>{isSaving ? <><LoaderCircle className="schedule-save__spinner" size={16} aria-hidden="true" />Saving…</> : step === 3 ? (isEditing ? "Save Changes" : "Save Event") : "Continue"}</button></footer> : null}
  </section>;
  return variant === "popover" ? dialog : <div className="schedule-modal-backdrop" onMouseDown={(event) => { if (!isSaving && event.target === event.currentTarget) onClose(); }}>{dialog}</div>;
}

export default function Home() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekMotionDirection, setWeekMotionDirection] = useState<"previous" | "next" | null>(null);
  const [plannerEvents, setPlannerEvents] = useState<PlannerEvent[]>([]);
  const events = plannerEvents;
  const [calendarFilters, setCalendarFilters] = useState<CalendarFilters>(emptyCalendarFilters);
  const filteredEvents = events.filter((event) => {
    if (calendarFilters.classStatus.length && (!event.classStatus || !calendarFilters.classStatus.includes(event.classStatus))) return false;
    if (calendarFilters.planningStatus.length && !calendarFilters.planningStatus.includes(event.status)) return false;
    if (calendarFilters.student.length && (!event.studentName || !calendarFilters.student.includes(event.studentName))) return false;
    if (calendarFilters.group.length && !calendarFilters.group.some((group) => event.title.toLowerCase().includes(group.replace(" Group", "").toLowerCase()))) return false;
    return true;
  });
  const [selectedEvent, setSelectedEvent] = useState<PlannerEvent | null>(null);
  const [calendarPresentation, setCalendarPresentation] = useState<CalendarPresentation>("calendar");
  const [showSaturday, setShowSaturday] = useState(true);
  const [showSunday, setShowSunday] = useState(true);
  const [showNationalHolidays, setShowNationalHolidays] = useState(false);
  const [nationalHolidays, setNationalHolidays] = useState<NationalHoliday[]>([]);
  const [planningSelection, setPlanningSelection] = useState<{ event: PlannerEvent; date: Date; source?: "report" } | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => typeof window !== "undefined" && window.localStorage.getItem("planner-sidebar") === "collapsed");
  const [darkMode, setDarkMode] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleView>("planner");
  const isFullEnglishPlanner = activeModule === "plannerFullEnglish";
  const [isSchedulingEvent, setIsSchedulingEvent] = useState(false);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<PlannerEvent | null>(null);
  const [newEventDefaults, setNewEventDefaults] = useState<{ date: string; start: string; duration: number; type?: ScheduleDraft["type"] } | null>(null);
  const [slotSelection, setSlotSelection] = useState<{ dayIndex: number; date: string; startMinutes: number; duration: number; allDay?: boolean; allDayEndDate?: string } | null>(null);
  useEffect(() => {
    const handleScheduleChange = (event: Event) => {
      const detail = (event as CustomEvent<{ date: string; start: string; end: string; allDay?: boolean; allDayEndDate?: string }>).detail;
      const daySpan = detail.allDay && detail.allDayEndDate ? Math.max(1, Math.round((new Date(`${detail.allDayEndDate}T12:00:00`).getTime() - new Date(`${detail.date}T12:00:00`).getTime()) / 86400000) + 1) : 1;
      setSlotSelection((current) => current ? { ...current, date: detail.date, startMinutes: detail.allDay ? 0 : scheduleTimeToMinutes(detail.start), duration: detail.allDay ? daySpan * 1440 : Math.max(scheduleTimeToMinutes(detail.end) - scheduleTimeToMinutes(detail.start), 0), allDay: detail.allDay, allDayEndDate: detail.allDayEndDate } : current);
    };
    window.addEventListener("calendar-schedule-change", handleScheduleChange);
    return () => window.removeEventListener("calendar-schedule-change", handleScheduleChange);
  }, []);
  const [slotDrag, setSlotDrag] = useState<{ dayIndex: number; mode: "move" | "resize"; offsetMinutes: number; columnTop: number } | null>(null);
  const [calendarToast, setCalendarToast] = useState<CalendarToast | null>(null);
  const [eventPendingDeletion, setEventPendingDeletion] = useState<PlannerEvent | null>(null);
  const [collapsedNavGroups, setCollapsedNavGroups] = useState<Set<string>>(() => new Set());
  const calendarBodyRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slotDragActiveRef = useRef(false);
  const suppressCalendarClickRef = useRef(false);

  function showCalendarToast(toast: CalendarToast) {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setCalendarToast(toast);
    toastTimeoutRef.current = setTimeout(() => setCalendarToast(null), toast.action ? 7000 : 4000);
  }

  useEffect(() => () => { if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current); }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const weekEvents = events.filter((event) => event.weekOffset === weekOffset);
      const firstStart = weekEvents.length ? Math.min(...weekEvents.map((event) => event.startMinutes)) : 8 * 60;
      const contextStart = Math.max(0, firstStart - 30);
      calendarBodyRef.current?.scrollTo({ top: (contextStart / 60) * calendarHourHeight, behavior: "auto" });
    });
    return () => cancelAnimationFrame(frame);
  }, [weekOffset]);

  useEffect(() => {
    if (window.localStorage.getItem("planner-calendar-view") === "classes") setCalendarPresentation("classes");
  }, []);

  useEffect(() => {
    document.body.classList.toggle("theme-dark", darkMode);
    return () => document.body.classList.remove("theme-dark");
  }, [darkMode]);

  function toggleSidebar() {
    setSidebarCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem("planner-sidebar", next ? "collapsed" : "expanded");
      return next;
    });
  }

  function toggleNavGroup(label: string) {
    setCollapsedNavGroups((current) => {
      const next = new Set(current);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  function changeCalendarPresentation(value: CalendarPresentation) {
    if (value === calendarPresentation) return;

    const updatePresentation = () => {
      setSelectedEvent(null);
      setCalendarPresentation(value);
      window.localStorage.setItem("planner-calendar-view", value);
    };
    const documentWithViewTransition = document as Document & { startViewTransition?: (update: () => void) => unknown };

    if (documentWithViewTransition.startViewTransition) documentWithViewTransition.startViewTransition(updatePresentation);
    else updatePresentation();
  }

  function changeWeek(delta: number) {
    setSelectedEvent(null);
    setWeekMotionDirection(delta > 0 ? "next" : "previous");
    setWeekOffset((current) => current + delta);
  }

  function returnToCurrentWeek() {
    if (weekOffset !== 0) setWeekMotionDirection(weekOffset < 0 ? "next" : "previous");
    setSelectedEvent(null);
    setWeekOffset(0);
  }

  function eventPayload(event: PlannerEvent) {
    return {
      id: String(event.id), title: event.title, eventType: event.kind ?? "group", scheduledDate: event.scheduledDate ?? "2026-09-02",
      startMinutes: event.startMinutes, duration: event.duration, color: event.color, planningStatus: event.status,
      classStatus: event.classStatus ?? null, studentName: event.studentName ?? null, groupName: event.groupName ?? null,
      description: event.description ?? null, observation: event.observation ?? null, classPlanId: event.classPlanId ?? null, studentEmails: event.studentEmails ?? [], teacherNames: event.teacherNames ?? [], recurrence: event.recurrence ?? {}, updatedAt: event.updatedAt,
    };
  }

  function plannerEventFromPayload(payload: ReturnType<typeof eventPayload>): PlannerEvent {
    const date = new Date(`${payload.scheduledDate}T12:00:00`);
    const weekStart = startOfWeek(today);
    const allDay = payload.eventType === "away" && (Boolean(payload.allDay) || payload.duration >= 24 * 60);
    return {
      id: payload.id, title: payload.title, scheduledDate: payload.scheduledDate, day: date.getDay(), startMinutes: payload.startMinutes,
      duration: payload.duration, color: payload.color, status: payload.planningStatus as EventStatus,
      // Older persisted all-day records do not carry a dedicated flag. A 24-hour
      // duration is the canonical representation, so restore it on read.
      allDay,
      classStatus: payload.eventType === "away" ? undefined : payload.classStatus as ClassStatus | undefined, kind: payload.eventType as PlannerEvent["kind"],
      studentName: payload.studentName ?? undefined, groupName: payload.groupName ?? undefined, description: payload.description ?? undefined, observation: payload.observation ?? undefined, classPlanId: payload.classPlanId ?? undefined,
      studentEmails: payload.studentEmails, teacherNames: payload.teacherNames, recurrence: payload.recurrence as PlannerEvent["recurrence"], updatedAt: payload.updatedAt,
      weekOffset: Math.round((startOfWeek(date).getTime() - weekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)),
    };
  }

  function recurrenceDates(draft: ScheduleDraft): string[] {
    if (draft.type === "away" && draft.allDay && !draft.repeats && draft.allDayEndDate && draft.allDayEndDate >= draft.date) {
      const dates: string[] = [];
      const cursor = new Date(`${draft.date}T12:00:00`);
      const end = new Date(`${draft.allDayEndDate}T12:00:00`);
      while (cursor <= end && dates.length < 366) {
        dates.push(isoDate(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
      return dates;
    }
    if (!draft.repeats) return [draft.date];
    const start = new Date(`${draft.date}T12:00:00`);
    const end = draft.endsOn && draft.endDate ? new Date(`${draft.endDate}T12:00:00`) : new Date(today.getFullYear(), 11, 31, 12);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [draft.date];
    const dates: string[] = [];
    const toValue = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    if (draft.repeatUnit === "Month") {
      const day = start.getDate();
      for (let cursor = new Date(start); cursor <= end && dates.length < 52; cursor = new Date(cursor.getFullYear(), cursor.getMonth() + Math.max(1, draft.repeatInterval), 1, 12)) {
        const monthDate = new Date(cursor.getFullYear(), cursor.getMonth(), Math.min(day, new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate()), 12);
        if (monthDate >= start && monthDate <= end) dates.push(toValue(monthDate));
      }
    } else {
      const selectedDays = draft.repeatDays.map((value) => Number(value.split("-").pop())).filter((value) => Number.isInteger(value) && value >= 0 && value <= 6);
      const weekdays = selectedDays.length ? new Set(selectedDays) : new Set([start.getDay()]);
      const interval = Math.max(1, draft.repeatInterval);
      for (let cursor = new Date(start); cursor <= end && dates.length < 52; cursor.setDate(cursor.getDate() + 1)) {
        const weeksSinceStart = Math.floor((cursor.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
        if (weeksSinceStart % interval === 0 && weekdays.has(cursor.getDay())) dates.push(toValue(cursor));
      }
    }
    return dates.length ? dates : [draft.date];
  }

  function createPlannerEvent(draft: ScheduleDraft, existing?: PlannerEvent, scheduledDate = draft.date, seriesId?: string): PlannerEvent {
    const date = new Date(`${scheduledDate}T12:00:00`);
    const allDay = draft.type === "away" && draft.allDay;
    const startMinutes = allDay ? 0 : Number(draft.start.slice(0, 2)) * 60 + Number(draft.start.slice(3));
    const endMinutes = allDay ? 24 * 60 : Number(draft.end.slice(0, 2)) * 60 + Number(draft.end.slice(3));
    const eventColor = draft.type === "individual" ? "#285d8d" : draft.type === "group" ? "#f97316" : draft.type === "task" ? "#d97706" : draft.type === "away" ? "#64748b" : draft.type === "other" ? "#0f766e" : "#65a30d";
    return {
      id: existing ? String(existing.id) : crypto.randomUUID(), title: draft.title.trim(), scheduledDate, day: date.getDay(),
      startMinutes, duration: Math.max(endMinutes - startMinutes, 0), allDay, color: eventColor, status: existing?.status ?? "To Plan",
      classStatus: isClassEvent({ ...existing, kind: draft.type } as PlannerEvent) ? existing?.classStatus ?? "Scheduled" : undefined,
      weekOffset: Math.round((startOfWeek(date).getTime() - startOfWeek(today).getTime()) / (7 * 24 * 60 * 60 * 1000)), kind: draft.type,
      studentName: draft.student?.name, groupName: draft.group?.name, description: draft.taskDescription || undefined,
      observation: isFullEnglishPlanner && (draft.type === "individual" || draft.type === "group" || draft.type === "custom") ? draft.observation.trim() || undefined : existing?.observation,
      classPlanId: existing?.classPlanId,
      studentEmails: draft.type === "other" ? draft.otherStudents : draft.customStudents,
      teacherNames: draft.type === "other" ? draft.otherTeachers : draft.teacher ? [draft.teacher] : [],
      recurrence: { repeats: draft.repeats, repeatDays: draft.repeatDays, repeatInterval: draft.repeatInterval, repeatUnit: draft.repeatUnit, endsOn: draft.endsOn, endDate: draft.endDate, ...(draft.repeats ? { seriesId: seriesId ?? existing?.recurrence?.seriesId ?? crypto.randomUUID() } : {}) }, updatedAt: new Date().toISOString(),
    };
  }

  async function saveScheduledEvent(draft: ScheduleDraft, existing?: PlannerEvent) {
    if (isSavingEvent) return;
    const occurrenceDates = existing ? [draft.date] : recurrenceDates(draft);
    const recurrenceSeriesId = draft.repeats ? existing?.recurrence?.seriesId ?? crypto.randomUUID() : undefined;
    const nextEvents = occurrenceDates.map((date) => createPlannerEvent(draft, existing, date, recurrenceSeriesId));
    const nextEvent = nextEvents[0];
    const eventDate = new Date(`${nextEvent.scheduledDate}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    // Optimistically render a clearly pending card. Keeping the form open until
    // persistence completes prevents ambiguous saves without blocking feedback.
    const previousEvents = plannerEvents;
    const pendingEvents = nextEvents.map((event) => ({ ...event, isPending: true }));
    setIsSavingEvent(true);
    setPlannerEvents((current) => existing ? current.map((event) => String(event.id) === String(existing.id) ? pendingEvents[0] : event) : [...current, ...pendingEvents]);

    try {
      const responses = await Promise.all(nextEvents.map((event) => fetch("/api/events", { method: existing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(eventPayload(event)) })));
      if (responses.some((response) => !response.ok)) throw new Error("Unable to persist event");
      setPlannerEvents((current) => existing ? current.map((event) => String(event.id) === String(nextEvent.id) ? nextEvent : event) : current.map((event) => { const saved = nextEvents.find((candidate) => String(candidate.id) === String(event.id)); return saved ?? event; }));
      showCalendarToast({ message: existing ? "Changes saved" : "Event created", detail: `${nextEvent.title} · ${eventDate} · ${formatTime(nextEvent.startMinutes)}–${formatTime(nextEvent.startMinutes + nextEvent.duration)}`, tone: "success" });
      setEditingEvent(null);
      setNewEventDefaults(null);
      setSlotSelection(null);
      setIsSchedulingEvent(false);
    } catch {
      setPlannerEvents(previousEvents);
      showCalendarToast({ message: "Couldn’t save event", detail: "Your changes are still in the form. Please try again.", tone: "error" });
    } finally {
      setIsSavingEvent(false);
    }
  }

  async function updateClassStatus(event: PlannerEvent, classStatus: ClassStatus) {
    const nextEvent = { ...event, classStatus, updatedAt: new Date().toISOString() };
    setPlannerEvents((current) => current.map((item) => String(item.id) === String(event.id) ? nextEvent : item));
    try {
      const response = await fetch("/api/events", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(eventPayload(nextEvent)) });
      if (!response.ok) throw new Error("Unable to persist status");
      showCalendarToast({ message: "Class status updated", detail: classStatus, tone: "success" });
    } catch {
      setPlannerEvents((current) => current.map((item) => String(item.id) === String(event.id) ? event : item));
      showCalendarToast({ message: "Couldn’t update class status", detail: "Please try again.", tone: "error" });
    }
  }

  async function deleteScheduledEvent(event: PlannerEvent, scope: "single" | "series" = "single") {
    const seriesId = event.recurrence?.seriesId;
    const targets = scope === "series" && event.recurrence?.repeats
      ? plannerEvents.filter((item) => item.recurrence?.repeats && (seriesId ? item.recurrence.seriesId === seriesId : item.title === event.title && item.startMinutes === event.startMinutes && item.duration === event.duration && item.kind === event.kind))
      : [event];
    const responses = await Promise.all(targets.map((target) => fetch(`/api/events?id=${encodeURIComponent(String(target.id))}`, { method: "DELETE" })));
    if (responses.some((response) => !response.ok)) return;
    const targetIds = new Set(targets.map((target) => String(target.id)));
    setPlannerEvents((current) => current.filter((item) => !targetIds.has(String(item.id))));
    setSelectedEvent(null);
    showCalendarToast({ message: scope === "series" ? "Recurring events deleted" : "Event deleted", detail: event.title, tone: "info" });
  }

  function requestDeleteEvent(event: PlannerEvent) {
    setSelectedEvent(null);
    setEventPendingDeletion(event);
  }

  function openEditEvent(event: PlannerEvent) {
    setNewEventDefaults(null);
    setEditingEvent(event);
    setSelectedEvent(null);
    setIsSchedulingEvent(true);
  }

  function getCalendarSlotStart(event: Pick<MouseEvent<HTMLDivElement>, "currentTarget" | "clientY">) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const clickedMinutes = ((event.clientY - bounds.top) / calendarHourHeight) * 60;
    const startMinutes = Math.round(clickedMinutes / 15) * 15;
    return startMinutes >= 8 * 60 && startMinutes <= 20 * 60 ? startMinutes : null;
  }

  function openNewEventAt(date: Date, dayIndex: number, event: MouseEvent<HTMLDivElement>) {
    if (selectedEvent) {
      setSelectedEvent(null);
      return;
    }
    const startMinutes = getCalendarSlotStart(event);
    if (startMinutes === null) return;
    setSelectedEvent(null);
    setSlotSelection({ dayIndex, date: isoDate(date), startMinutes, duration: 60, allDay: false });
  }

  function moveSlotSelection(clientY: number) {
    if (!slotDrag) return;
    const pointerMinutes = Math.round((((clientY - slotDrag.columnTop) / calendarHourHeight) * 60) / 15) * 15;
    setSlotSelection((current) => {
      if (!current || current.dayIndex !== slotDrag.dayIndex) return current;
      if (slotDrag.mode === "resize") {
        const duration = Math.max(15, Math.min(pointerMinutes - current.startMinutes, 21 * 60 - current.startMinutes));
        return { ...current, duration };
      }
      const maxStart = 21 * 60 - current.duration;
      const startMinutes = Math.max(8 * 60, Math.min(pointerMinutes - slotDrag.offsetMinutes, maxStart));
      return { ...current, startMinutes };
    });
  }

  const today = useMemo(() => appNow(), []);
  const [currentTime, setCurrentTime] = useState(() => appNow());
  useEffect(() => {
    const updateCurrentTime = () => setCurrentTime(appNow());
    updateCurrentTime();
    const interval = window.setInterval(updateCurrentTime, 30_000);
    return () => window.clearInterval(interval);
  }, []);
  useEffect(() => {
    let active = true;
    async function loadEvents() {
      try {
        const response = await fetch("/api/events");
        if (!response.ok) throw new Error("Unable to load calendar events");
        const data = await response.json() as { events?: ReturnType<typeof eventPayload>[] };
        if (active && data.events) setPlannerEvents(data.events.map(plannerEventFromPayload));
      } catch { if (active) setPlannerEvents([]); }
    }
    void loadEvents();
    return () => { active = false; };
  }, [today]);
  const visibleWeekStart = useMemo(
    () => addDays(startOfWeek(today), weekOffset * 7),
    [today, weekOffset],
  );
  const dates = useMemo(
    () => weekDays.map((_, index) => addDays(visibleWeekStart, index)),
    [visibleWeekStart],
  );
  const columnTop = calendarBodyRef.current?.getBoundingClientRect().top ?? 0;
  const visibleCalendarDays = useMemo(
    () => dates.map((date, index) => ({ date, index })).filter(({ index }) => (index !== 0 || showSunday) && (index !== 6 || showSaturday)),
    [dates, showSaturday, showSunday],
  );
  const editingDate = editingEvent ? editingEvent.scheduledDate || isoDate(addDays(startOfWeek(today), editingEvent.weekOffset * 7 + editingEvent.day)) : null;

  useEffect(() => {
    if (!showNationalHolidays) return;
    const controller = new AbortController();
    fetch(`https://brasilapi.com.br/api/feriados/v1/${visibleWeekStart.getFullYear()}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to load holidays")))
      .then((holidays: NationalHoliday[]) => setNationalHolidays(holidays))
      .catch((error: unknown) => { if (!(error instanceof DOMException && error.name === "AbortError")) setNationalHolidays([]); });
    return () => controller.abort();
  }, [showNationalHolidays, visibleWeekStart]);

  const holidaysByDate = useMemo(
    () => new Map(nationalHolidays.map((holiday) => [holiday.date, holiday.name])),
    [nationalHolidays],
  );
  const allDayAwayByDate = useMemo(() => new Map(visibleCalendarDays.map(({ date, index }) => [isoDate(date), filteredEvents.filter((event) => event.day === index && event.weekOffset === weekOffset && event.kind === "away" && (event.allDay || event.duration >= 24 * 60))])), [filteredEvents, visibleCalendarDays, weekOffset]);
  const hasAllDayContent = visibleCalendarDays.some(({ date }) => Boolean((showNationalHolidays && holidaysByDate.get(holidayDateKey(date))) || allDayAwayByDate.get(isoDate(date))?.length));

  const dateRange = `${dates[0].toLocaleDateString("en-US", { month: "long", day: "numeric" })} – ${dates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes() + currentTime.getSeconds() / 60;
  const todayColumn = dates.findIndex((date) => date.toDateString() === currentTime.toDateString());

  return (
    <>
      <DesktopOnly />
      <main className={`planner-shell ${sidebarCollapsed ? "is-sidebar-collapsed" : ""} ${activeModule === "aiConversation" ? "is-ai-studio" : ""} ${planningSelection && planningSelection.source !== "report" ? "is-planning" : ""} ${darkMode ? "theme-dark" : ""}`}>
        <aside className={`sidebar ${sidebarCollapsed ? "is-collapsed" : ""}`}>
          <div className="sidebar__main">
            <div className="brand-row">
              {sidebarCollapsed ? (
                <button className="brand-mark" onClick={toggleSidebar} aria-label="Expand sidebar" aria-expanded="false" data-tooltip="Expand menu">
                  <img className="brand-mark__logo" src="/flexge-mark.svg" alt="" aria-hidden="true" />
                  <PanelLeftOpen className="brand-mark__open" size={17} />
                </button>
              ) : (
                <>
                  <img className="brand-logo" src="/flexge-logo.svg" alt="Flexge" width="68" height="32" />
                  <button className="icon-button icon-button--quiet" onClick={toggleSidebar} aria-label="Collapse sidebar" aria-expanded="true"><PanelLeftClose size={16} /></button>
                </>
              )}
            </div>

            <button className="nav-item nav-item--standalone" aria-label="Get Started" data-tooltip="Get Started"><Flag size={19} /><span>Get Started</span></button>

            <nav className="nav-groups" aria-label="Main navigation">
              {navGroups.map((group) => (
                <section className="nav-group" key={group.label}>
                  <button
                    type="button"
                    className="nav-group__title"
                    aria-expanded={!collapsedNavGroups.has(group.label)}
                    aria-controls={`nav-group-${group.label.toLowerCase().replaceAll(" ", "-")}`}
                    onClick={() => toggleNavGroup(group.label)}
                  >
                    <span>{group.label}</span>
                    <ChevronDown size={13} />
                  </button>
                  <div
                    className={`nav-group__items ${collapsedNavGroups.has(group.label) ? "is-collapsed" : ""}`}
                    id={`nav-group-${group.label.toLowerCase().replaceAll(" ", "-")}`}
                  >
                    <div className="nav-group__items-inner">
                      {group.items.filter(([label]) => label !== "My Resources v2").map(([label, Icon]) => (
                        <button
                          className={`nav-item ${label === "Planner" && activeModule === "planner" ? "is-active" : ""} ${label === "Planner FullEnglish" && activeModule === "plannerFullEnglish" ? "is-active" : ""} ${label === "Lesson Log" && activeModule === "classReporting" ? "is-active" : ""} ${label === "Teacher Hours" && activeModule === "teacherHours" ? "is-active" : ""} ${label === "My Resources" && activeModule === "resources" ? "is-active" : ""} ${label === "My Resources v2" && activeModule === "resourcesV2" ? "is-active" : ""} ${label === "Students" && activeModule === "students" ? "is-active" : ""} ${label === "Student App" && activeModule === "studentApp" ? "is-active" : ""} ${label === "AI Studio" && activeModule === "aiConversation" ? "is-active" : ""}`}
                          key={label}
                          aria-label={label}
                          data-tooltip={label}
                          onClick={() => {
                            if (label === "Planner") {
                              setActiveModule("planner");
                              setSelectedEvent(null);
                            } else if (label === "Planner FullEnglish") {
                              setActiveModule("plannerFullEnglish");
                              setSelectedEvent(null);
                            } else if (label === "Lesson Log") {
                              setActiveModule("classReporting");
                              setSelectedEvent(null);
                              setPlanningSelection(null);
                            } else if (label === "Teacher Hours") {
                              setActiveModule("teacherHours");
                              setSelectedEvent(null);
                              setPlanningSelection(null);
                            }
                            if (label === "My Resources") {
                              setActiveModule("resources");
                              setSelectedEvent(null);
                              setPlanningSelection(null);
                            }
                            if (label === "My Resources v2") {
                              setActiveModule("resourcesV2");
                              setSelectedEvent(null);
                              setPlanningSelection(null);
                            }
                            if (label === "Students") {
                              setActiveModule("students");
                              setSelectedEvent(null);
                              setPlanningSelection(null);
                            }
                            if (label === "Student App") {
                              setActiveModule("studentApp");
                              setSelectedEvent(null);
                              setPlanningSelection(null);
                            }
                            if (label === "AI Studio") {
                              setActiveModule("aiConversation");
                              setSelectedEvent(null);
                              setPlanningSelection(null);
                            }
                          }}
                        >
                          <Icon size={18} strokeWidth={1.7} />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              ))}
            </nav>
          </div>

          <div className="sidebar__footer">
            <button className="profile-button" aria-label="Open profile menu"><span className="avatar avatar--photo"><img src="/teacher-avatar-andre.png" alt="André Martins" /></span><ChevronDown size={15} /></button>
            <div className="footer-actions">
              <button className="icon-button" aria-label="Support"><LifeBuoy size={17} /></button>
              <button className="icon-button" aria-label="Announcements"><Megaphone size={17} /></button>
              <button
                className="icon-button theme-toggle"
                type="button"
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                aria-pressed={darkMode}
                onClick={() => setDarkMode((value) => !value)}
              >
                <SunMoon size={17} />
              </button>
            </div>
          </div>
        </aside>

        <section className="workspace">
          {planningSelection?.source === "report" ? <>
            <ClassReportingView events={events} onOpenInPlanner={(event) => setPlanningSelection({ event, date: reportingDate(event), source: "report" })} />
            <PlanningView
              event={planningSelection.event}
              date={planningSelection.date}
              classEvents={events}
              onSelectClass={(item) => setPlanningSelection({ event: item, date: addDays(startOfWeek(planningSelection.date), (item.weekOffset - planningSelection.event.weekOffset) * 7 + item.day), source: "report" })}
              mode="report"
              onNavigateReport={(item) => setPlanningSelection({ event: item, date: reportingDate(item), source: "report" })}
              onBack={() => setPlanningSelection(null)}
            />
          </> : planningSelection ? (
            <PlanningView
              event={planningSelection.event}
              date={planningSelection.date}
              classEvents={events}
              onSelectClass={(item) => setPlanningSelection({ event: item, date: addDays(startOfWeek(planningSelection.date), (item.weekOffset - planningSelection.event.weekOffset) * 7 + item.day) })}
              mode={planningSelection.source === "report" ? "report" : "edit"}
              onNavigateReport={(item) => setPlanningSelection({ event: item, date: reportingDate(item), source: "report" })}
              onBack={() => setPlanningSelection(null)}
            />
          ) : activeModule === "aiConversation" ? <AIConversationView /> : activeModule === "classReporting" ? <ClassReportingView events={events} onOpenInPlanner={(event) => setPlanningSelection({ event, date: reportingDate(event), source: "report" })} /> : activeModule === "teacherHours" ? <TeacherHoursView /> : activeModule === "resources" ? <ResourcesView /> : activeModule === "resourcesV2" ? <ResourcesV2View /> : activeModule === "students" ? <StudentsView /> : activeModule === "studentApp" ? <StudentAppView /> : <>
          <div className="calendar-toolbar">
            <div className="toolbar-left">
              <CalendarViewTabs value={calendarPresentation} onValueChange={changeCalendarPresentation} />
              <button className="outline-button" onClick={returnToCurrentWeek}>Today</button>
              <div className="week-arrows">
                <button className="icon-button icon-button--plain" onClick={() => changeWeek(-1)} aria-label="Previous week"><ChevronLeft size={18} /></button>
                <button className="icon-button icon-button--plain" onClick={() => changeWeek(1)} aria-label="Next week"><ChevronRight size={18} /></button>
              </div>
              <button className="date-button">{dateRange}<ChevronDown size={15} /></button>
            </div>
            <div className="toolbar-right">
              <CalendarFilterPopover filters={calendarFilters} onApply={setCalendarFilters} />
              <button className="primary-button" type="button" onClick={() => { setEditingEvent(null); setNewEventDefaults(null); setIsSchedulingEvent(true); }}><Plus size={16} />New Schedule</button>
              <Popover.Root><Popover.Trigger asChild><button className="icon-button" aria-label="Planner settings"><Settings size={17} /></button></Popover.Trigger><Popover.Portal><Popover.Content className="planner-settings-menu" side="bottom" align="end" sideOffset={6} aria-label="Calendar settings"><span className="planner-settings-menu__label">Integrations</span><div className="planner-settings-menu__integrations"><button type="button"><img className="google-meet-integration-icon" src="/google-meet.svg" alt="" aria-hidden="true" /><span>Google Meet</span></button><button type="button"><span className="zoom-integration-icon" aria-hidden="true"><img src="/zoom-mark.svg" alt="" /><img src="/zoom-wordmark.svg" alt="" /></span><span>Zoom</span></button></div><div className="planner-settings-menu__divider" /><span className="planner-settings-menu__label">Weekend visibility</span><div className="planner-settings-menu__toggles"><button type="button" className="planner-settings-menu__toggle-row" onClick={() => setShowSaturday((value) => !value)}><span className={showSaturday ? "planner-switch is-on" : "planner-switch"} aria-hidden="true"><span /></span><span>Show Saturday</span></button><button type="button" className="planner-settings-menu__toggle-row" onClick={() => setShowSunday((value) => !value)}><span className={showSunday ? "planner-switch is-on" : "planner-switch"} aria-hidden="true"><span /></span><span>Show Sunday</span></button></div><div className="planner-settings-menu__divider" /><span className="planner-settings-menu__label">Calendar</span><div className="planner-settings-menu__toggles"><button type="button" className="planner-settings-menu__toggle-row" onClick={() => setShowNationalHolidays((value) => !value)}><span className={showNationalHolidays ? "planner-switch is-on" : "planner-switch"} aria-hidden="true"><span /></span><span>Show national holidays</span></button></div></Popover.Content></Popover.Portal></Popover.Root>
            </div>
          </div>

          {calendarPresentation === "calendar" ? <section
            className="calendar calendar--enter"
            id="calendar-view-panel"
            role="tabpanel"
            aria-label={`Week: ${dateRange}`}
            style={{ "--calendar-hour-size": `${calendarHourHeight}px`, "--calendar-visible-days": visibleCalendarDays.length } as CSSProperties}
          >
            <div className="calendar-header">
              <div className="time-gutter" />
              {visibleCalendarDays.map(({ date, index }) => {
                const isToday = date.toDateString() === currentTime.toDateString();
                return (
                  <div className="day-heading" key={date.toISOString()}>
                    <span>{weekDays[index]}</span>
                    <strong className={`day-number${isToday ? " is-today" : ""}${weekMotionDirection ? ` day-number--${weekMotionDirection}` : ""}`}>{date.getDate()}</strong>
                  </div>
                );
              })}
            </div>

            <div className={`calendar-body${hasAllDayContent ? " has-all-day" : ""}`} ref={calendarBodyRef}>
              <div className="hours-column">
                {hasAllDayContent ? <div className="calendar-all-day-gutter" aria-hidden="true" /> : null}
                {hours.map((hour) => <div className={`hour-label${hour === Math.floor(nowMinutes / 60) ? " is-current" : ""}`} key={hour}>{formatHourLabel(hour)}</div>)}
              </div>
              <div className="calendar-main-column">
                {hasAllDayContent ? <div className="calendar-all-day-row" aria-label="All-day events">
                  {visibleCalendarDays.map(({ date }) => {
                    const holidayName = showNationalHolidays ? holidaysByDate.get(holidayDateKey(date)) : undefined;
                    const awayEvents = allDayAwayByDate.get(isoDate(date)) ?? [];
                    return <div className="calendar-all-day-cell" key={date.toISOString()}>
                      {holidayName ? <span className="calendar-all-day-badge calendar-all-day-badge--holiday" title={holidayName}><CalendarDays size={13} aria-hidden="true" /><span>{holidayName}</span></span> : null}
                      {awayEvents.map((item) => <Popover.Root key={item.id} open={selectedEvent?.id === item.id} onOpenChange={(open) => setSelectedEvent(open ? item : null)}><Popover.Trigger asChild><button type="button" className="calendar-all-day-badge calendar-all-day-badge--away" aria-label={`${eventDisplayName(item)}, all day`}><CalendarX2 size={13} aria-hidden="true" /><span>{eventDisplayName(item)}</span></button></Popover.Trigger><Popover.Portal><Popover.Content className="event-popover-positioner" side="bottom" align="start" sideOffset={6} collisionPadding={16} sticky="always" avoidCollisions><EventDetailPopover event={item} date={date} onClose={() => setSelectedEvent(null)} onViewPlan={() => { setSelectedEvent(null); setPlanningSelection({ event: item, date }); }} onEdit={() => openEditEvent(item)} onDelete={() => requestDeleteEvent(item)} onStatusChange={(status) => void updateClassStatus(item, status)} isFullEnglish={isFullEnglishPlanner} /></Popover.Content></Popover.Portal></Popover.Root>)}
                    </div>;
                  })}
                </div> : null}
              <div className="days-grid">
                {visibleCalendarDays.map(({ date, index: dayIndex }) => (
                  <div className={`day-column${(allDayAwayByDate.get(isoDate(date))?.length ?? 0) > 0 ? " day-column--away-all-day" : ""}`} key={date.toISOString()} onPointerMove={(event) => moveSlotSelection(event.clientY)} onPointerUp={() => { slotDragActiveRef.current = false; setSlotDrag(null); }} onClick={(event) => {
                    if (suppressCalendarClickRef.current) { suppressCalendarClickRef.current = false; event.preventDefault(); return; }
                    if ((event.target as HTMLElement).closest(".event-card")) return;
                    if ((event.target as HTMLElement).closest(".calendar-slot-selection")) return;
                    if ((event.target as HTMLElement).closest(".calendar-schedule-popover")) return;
                    openNewEventAt(date, dayIndex, event);
                  }}>
                    {slotSelection?.dayIndex === dayIndex ? <Popover.Root open onOpenChange={() => undefined}><Popover.Anchor asChild><div className={`calendar-slot-selection${filteredEvents.some((item) => item.weekOffset === weekOffset && item.day === dayIndex && item.startMinutes < slotSelection.startMinutes + slotSelection.duration && item.startMinutes + item.duration > slotSelection.startMinutes) ? " is-overlapping" : ""}`} style={{ top: `${(slotSelection.startMinutes / 60) * calendarHourHeight + 2}px`, height: `${Math.max((slotSelection.duration / 60) * calendarHourHeight - 4, 20)}px` }} onPointerDown={(event) => { event.stopPropagation(); const column = event.currentTarget.closest(".day-column"); if (!column) return; const columnTop = column.getBoundingClientRect().top; const pointerMinutes = Math.round((((event.clientY - columnTop) / calendarHourHeight) * 60) / 15) * 15; slotDragActiveRef.current = true; event.currentTarget.setPointerCapture(event.pointerId); setSlotDrag({ dayIndex, mode: "move", columnTop, offsetMinutes: Math.max(0, pointerMinutes - slotSelection.startMinutes) }); }} onPointerMove={(event) => { event.stopPropagation(); moveSlotSelection(event.clientY); }} onPointerUp={(event) => { event.stopPropagation(); slotDragActiveRef.current = false; setSlotDrag(null); }} role="button" tabIndex={0} aria-label={`Selected ${minutesToScheduleTime(slotSelection.startMinutes)} time slot. Drag to move. Use the bottom handle to resize.`}><span>{formatTime(slotSelection.startMinutes)}</span><span className="calendar-slot-selection__duration">{slotSelection.duration} min</span><span className="calendar-slot-selection__resize-handle" onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); const column = event.currentTarget.closest(".day-column"); if (!column) return; const columnTop = column.getBoundingClientRect().top; slotDragActiveRef.current = true; suppressCalendarClickRef.current = true; event.currentTarget.setPointerCapture(event.pointerId); setSlotDrag({ dayIndex, mode: "resize", columnTop, offsetMinutes: 0 }); }} onPointerMove={(event) => { event.stopPropagation(); moveSlotSelection(event.clientY); }} onPointerUp={(event) => { event.stopPropagation(); slotDragActiveRef.current = false; setSlotDrag(null); }} role="separator" aria-label="Resize event duration" /></div></Popover.Anchor><Popover.Portal><Popover.Content className="calendar-schedule-popover" side="right" align="start" sideOffset={10} collisionPadding={16} onEscapeKeyDown={() => { if (!isSavingEvent) setSlotSelection(null); }} onPointerDownOutside={(event) => { event.preventDefault(); if (isSavingEvent) return; const target = event.detail.originalEvent.target as HTMLElement | null; if (target?.closest(".calendar-slot-selection")) return; event.detail.originalEvent.stopPropagation(); setSlotSelection(null); }} onFocusOutside={(event) => event.preventDefault()}><ScheduleEventModal variant="popover" onClose={() => setSlotSelection(null)} onSave={saveScheduledEvent} defaultDate={slotSelection.date} defaultStart={minutesToScheduleTime(slotSelection.startMinutes)} defaultDuration={slotSelection.duration} scheduledEvents={events} isSaving={isSavingEvent} isFullEnglish={isFullEnglishPlanner} contextLabel={`${new Date(`${slotSelection.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · ${formatTime(slotSelection.startMinutes)}–${formatTime(slotSelection.startMinutes + slotSelection.duration)} · ${slotSelection.duration} min`} /></Popover.Content></Popover.Portal></Popover.Root> : null}
                    {layoutOverlappingEvents(filteredEvents.filter((item) => item.weekOffset === weekOffset && item.day === dayIndex && !(item.kind === "away" && (item.allDay || item.duration >= 24 * 60)))).map(({ item, stackIndex, overlapCount }) => {
                      // Keep overlapping events layered, so each one retains a readable card
                      // silhouette and can be brought forward on hover, focus, or selection.
                      const allDay = item.allDay || item.duration >= 24 * 60;
                      const isAllDayAway = allDay && item.kind === "away";
                      const compact = !isAllDayAway && (item.duration <= 45 || overlapCount > 1);
                      const individual = item.kind === "individual";
                      const showClassStatuses = isClassEvent(item) && !allDay;
                      const displayTitle = eventDisplayName(item);
                      return (
                        <Popover.Root
                          key={item.id}
                          open={selectedEvent?.id === item.id}
                          onOpenChange={(open) => setSelectedEvent(open ? item : null)}
                        >
                          <Popover.Trigger asChild>
                            <button
                              className={`event-card event-card--status-${statusSlug(item.status)} ${allDay ? "event-card--all-day" : ""} ${isAllDayAway ? "event-card--away-all-day" : ""} ${compact ? "event-card--compact" : ""} ${overlapCount > 1 ? "event-card--overlapping" : ""} ${item.isPending ? "event-card--pending" : ""} ${individual ? `event-card--individual event-card--individual-${item.duration}` : ""}`}
                              style={{ top: isAllDayAway ? "0" : allDay ? "4px" : `${(item.startMinutes / 60) * calendarHourHeight + 4}px`, height: isAllDayAway ? "100%" : allDay ? "36px" : `${Math.max((item.duration / 60) * calendarHourHeight - 8, 28)}px`, left: isAllDayAway ? "0" : `calc(4px + ${stackIndex * 12}px)`, right: isAllDayAway ? "0" : `calc(4px + ${(overlapCount - 1 - stackIndex) * 12}px)`, zIndex: isAllDayAway ? 1 : 2 + stackIndex }}
                              aria-label={`${displayTitle}, ${allDay ? "all day" : `${formatTime(item.startMinutes)} to ${formatTime(item.startMinutes + item.duration)}`}${overlapCount > 1 ? ", overlaps another event" : ""}`}
                              aria-haspopup="dialog"
                              aria-busy={item.isPending || undefined}
                              aria-expanded={selectedEvent?.id === item.id}
                            >
                              {isAllDayAway ? <span className="event-card__all-day-badge"><CalendarX2 size={14} aria-hidden="true" /><span>{displayTitle}</span></span> : <><div className="event-card__title"><EventIdentity event={item} compact={compact} /><span className="event-card__name">{displayTitle}{compact ? "," : null}</span>{compact && <small>{formatTime(item.startMinutes)}</small>}</div>
                              {!compact && <div className="event-card__meta"><small>{allDay ? "All day" : `${formatTime(item.startMinutes)} – ${formatTime(item.startMinutes + item.duration)}`}</small></div>}
                              {!compact && showClassStatuses && <div className="event-card__statuses"><ClassStatusIndicator status={item.classStatus} showLabel /><span className="event-card__status-separator" aria-hidden="true" /><span className={`planning-status-label planning-status-label--${statusSlug(item.status)}`}><PlanningStatusIndicator status={item.status} /><span>{item.status}</span></span></div>}
                              {compact && showClassStatuses && (individual && item.duration >= 30 ? <b className="event-card__status-tag"><ClassStatusIndicator status={item.classStatus} />{item.classStatus ? <span className="event-card__status-separator" aria-hidden="true" /> : null}<PlanningStatusIndicator status={item.status} /></b> : <span className="event-card__compact-status"><ClassStatusIndicator status={item.classStatus} />{item.classStatus ? <span className="event-card__status-separator" aria-hidden="true" /> : null}<PlanningStatusIndicator status={item.status} /></span>)}</>}
                            </button>
                          </Popover.Trigger>
                          <Popover.Portal>
                            <Popover.Content
                              className="event-popover-positioner"
                              side="right"
                              align="center"
                              sideOffset={8}
                              collisionPadding={16}
                              sticky="always"
                              avoidCollisions
                              hideWhenDetached
                            >
                              <EventDetailPopover event={item} date={dates[item.day]} onClose={() => setSelectedEvent(null)} onViewPlan={() => { setSelectedEvent(null); setPlanningSelection({ event: item, date: dates[item.day] }); }} onEdit={() => openEditEvent(item)} onDelete={() => requestDeleteEvent(item)} onStatusChange={(status) => void updateClassStatus(item, status)} isFullEnglish={isFullEnglishPlanner} />
                            </Popover.Content>
                          </Popover.Portal>
                        </Popover.Root>
                      );
                    })}
                    {todayColumn === dayIndex && (
                      <div className="now-line" style={{ top: `${(nowMinutes / 60) * calendarHourHeight}px` }}><span /></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            </div>
          </section> : calendarPresentation === "schedule" ? <ScheduleAgendaView days={visibleCalendarDays} events={filteredEvents} weekOffset={weekOffset} selectedEvent={selectedEvent} onSelectedEventChange={setSelectedEvent} onViewPlan={(event, date) => setPlanningSelection({ event, date })} onEdit={openEditEvent} onDelete={requestDeleteEvent} onStatusChange={(event, status) => void updateClassStatus(event, status)} isFullEnglish={isFullEnglishPlanner} /> : <section className="classes-week classes-week--enter" id="classes-view-panel" role="tabpanel" aria-label={`Aulas para ${dateRange}`} style={{ "--calendar-visible-days": visibleCalendarDays.length } as CSSProperties}>
            <div className="classes-week__header">
              {visibleCalendarDays.map(({ date, index }) => {
                const isToday = date.toDateString() === currentTime.toDateString();
                return <div className="classes-week__day-heading" key={date.toISOString()}><span>{weekDays[index]}</span><strong className={`day-number${isToday ? " is-today" : ""}${weekMotionDirection ? ` day-number--${weekMotionDirection}` : ""}`}>{date.getDate()}</strong></div>;
              })}
            </div>
            <div className="classes-week__grid">
              {visibleCalendarDays.map(({ date, index: dayIndex }) => {
                const dayEvents = filteredEvents.filter((item) => item.weekOffset === weekOffset && item.day === dayIndex).sort((left, right) => left.startMinutes - right.startMinutes);
                return <section className="classes-week__day" key={date.toISOString()} aria-label={`${weekDays[dayIndex]}, ${date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}`}>
                  <div className="classes-week__cards">
                    {dayEvents.length ? dayEvents.map((item) => <StackedClassCard key={item.id} item={item} date={date} selectedEvent={selectedEvent} onSelectedEventChange={setSelectedEvent} onViewPlan={(selected, selectedDate) => setPlanningSelection({ event: selected, date: selectedDate })} onEdit={openEditEvent} onDelete={requestDeleteEvent} onStatusChange={(status) => void updateClassStatus(item, status)} isFullEnglish={isFullEnglishPlanner} />) : <p className="classes-week__empty">No lessons</p>}
                  </div>
                </section>;
              })}
            </div>
          </section>}
          </>}
        </section>
      </main>
      {calendarToast ? <div className={`calendar-toast calendar-toast--${calendarToast.tone ?? "success"}`} role="status" aria-live="polite"><span className="calendar-toast__icon" aria-hidden="true">{calendarToast.tone === "error" ? <X size={16} strokeWidth={2.5} /> : calendarToast.tone === "info" ? <Info size={16} strokeWidth={2.5} /> : <Check size={16} strokeWidth={2.5} />}</span><div className="calendar-toast__copy"><strong>{calendarToast.message}</strong>{calendarToast.detail ? <span>{calendarToast.detail}</span> : null}</div>{calendarToast.action ? <button type="button" onClick={() => { calendarToast.action?.onClick(); setCalendarToast(null); }}>{calendarToast.action.label}</button> : null}</div> : null}
      {eventPendingDeletion ? <div className="delete-event-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEventPendingDeletion(null); }} onKeyDown={(event) => { if (event.key === "Escape") setEventPendingDeletion(null); }}><section className="delete-event-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-event-title" aria-describedby="delete-event-description"><div className="delete-event-dialog__icon"><Trash2 size={20} /></div><div className="delete-event-dialog__content"><h2 id="delete-event-title">{eventPendingDeletion.recurrence?.repeats ? "Delete recurring event?" : "Delete event?"}</h2><p id="delete-event-description">{eventPendingDeletion.recurrence?.repeats ? "Choose whether to remove only this occurrence or the entire recurring series." : `“${eventPendingDeletion.title}” will be permanently removed from your calendar.`}</p></div><div className="delete-event-dialog__actions"><button type="button" autoFocus onClick={() => setEventPendingDeletion(null)}>Cancel</button>{eventPendingDeletion.recurrence?.repeats ? <><button className="is-secondary" type="button" onClick={() => { const event = eventPendingDeletion; setEventPendingDeletion(null); void deleteScheduledEvent(event, "single"); }}>Only this event</button><button className="is-destructive" type="button" onClick={() => { const event = eventPendingDeletion; setEventPendingDeletion(null); void deleteScheduledEvent(event, "series"); }}>All recurring events</button></> : <button className="is-destructive" type="button" onClick={() => { const event = eventPendingDeletion; setEventPendingDeletion(null); void deleteScheduledEvent(event); }}>Delete event</button>}</div></section></div> : null}
      {isSchedulingEvent ? <ScheduleEventModal onClose={() => { setEditingEvent(null); setNewEventDefaults(null); setIsSchedulingEvent(false); }} onSave={saveScheduledEvent} editingEvent={editingEvent} defaultDate={newEventDefaults?.date ?? isoDate(today)} defaultStart={newEventDefaults?.start} defaultDuration={newEventDefaults?.duration} defaultType={newEventDefaults?.type} scheduledEvents={events} isSaving={isSavingEvent} isFullEnglish={isFullEnglishPlanner} contextLabel={editingEvent && editingDate ? `${new Date(`${editingDate}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · ${formatTime(editingEvent.startMinutes)}–${formatTime(editingEvent.startMinutes + editingEvent.duration)} · ${editingEvent.duration} min` : undefined} /> : null}
    </>
  );
}
