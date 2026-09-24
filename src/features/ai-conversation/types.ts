import { EXAMPLE_PRACTICES, EXAMPLE_ATTEMPTS, EXAMPLE_PACK_VERSION } from "./example-practices";

export type PracticeStatus = "Draft" | "Published";
export type PracticeType = "oral-production" | "ai-exercise";

export type Practice = {
  id: string;
  practiceType?: PracticeType;
  isExample?: boolean;
  title: string;
  topic: string;
  scenario: string;
  goal: string;
  /** Canonical prompt shown to learners; legacy goal remains as a read fallback. */
  activityInstructions?: string;
  /** Compressed image data for this local prototype's same-browser experience. */
  imageDataUrl?: string;
  role: string;
  level: string;
  duration: string;
  expressions: string[];
  focus: string[];
  students: string[];
  dueDate?: string;
  instructions?: string;
  questions?: string[];
  maxResponseTime?: number;
  minResponseTime?: number;
  instantFeedback?: boolean;
  grammars?: string[];
  tags?: string[];
  status: PracticeStatus;
  completed: number;
  createdAt: string;
};

export type Attempt = {
  id: string;
  practiceId: string;
  student: string;
  completedAt: string;
  duration: string;
  transcript: Array<{ speaker: "AI" | "Student"; text: string; note?: string }>;
  improved?: string;
  audioId?: string;
  audioUrl?: string;
  syntheticAudio?: boolean;
  reviewStatus?: "Pending" | "Completed";
  teacherComment?: string;
  teacherCorrections?: Array<{ label: string; score: number; evidence?: string }>;
  evaluation?: {
    mode: "simulated";
    overall: number;
    dimensions: Array<{ label: string; score: number; evidence?: string }>;
    strengths: string[];
    growthAreas: string[];
    summary?: string;
    howYouDid?: string[];
    growthOpportunities?: string;
    communicativeGoal?: string;
    repeatedWords?: string[];
    falseCognates?: string[];
  };
  /** False indicates an attempt ended without submission. */
  completed?: boolean;
};

export type ConversationState = {
  samplePackVersion?: number;
  practices: Practice[];
  attempts: Attempt[];
};

export const STORAGE_KEY = "flexge-ai-conversation-v1";
export const STUDENTS = ["Anna Johnson", "Lucas Martins", "Emily Chen", "Daniel Costa"];
export const GROUPS = ["A2 Group", "B1 Group", "Conversation Club"];

const starterPractice: Practice = {
  id: "practice-restaurant",
  practiceType: "oral-production",
  title: "Ordering at a restaurant",
  topic: "Ordering food at a restaurant",
  scenario: "You're at a casual restaurant and want to order dinner.",
  goal: "Order a meal, respond to the server's questions and ask at least one question.",
  role: "Restaurant server",
  level: "A2",
  duration: "3–4 min",
  expressions: ["I'd like…", "Could I have…?", "What do you recommend?", "Can I get…?"],
  focus: ["Interaction", "Vocabulary", "Question formation", "Clarity"],
  questions: ["What would you like to order?", "How would you ask about the available options?", "What would you say if you needed more information about your meal?"],
  minResponseTime: 1,
  maxResponseTime: 2,
  instantFeedback: true,
  grammars: ["Question formation", "Polite requests"],
  tags: ["Food", "Everyday English"],
  students: ["Anna Johnson", "Lucas Martins", "Emily Chen", "Daniel Costa"],
  dueDate: "2026-10-02",
  status: "Published",
  completed: 2,
  createdAt: "Sep 18, 2026",
};

export const INITIAL_STATE: ConversationState = {
  samplePackVersion: EXAMPLE_PACK_VERSION,
  practices: [
    ...EXAMPLE_PRACTICES,
    starterPractice,
    { ...starterPractice, id: "practice-hotel", title: "At the hotel", topic: "Checking into a hotel", scenario: "You're checking into a hotel and need to ask about your room and breakfast.", goal: "Check in, answer the receptionist's questions and ask for information.", role: "Hotel receptionist", level: "A2", expressions: ["I have a reservation…", "Could you tell me…?", "What time is…?"], grammars: ["Polite requests", "There is / there are"], tags: ["Travel", "Accommodation"], students: ["Anna Johnson", "Lucas Martins"], status: "Published", completed: 0, dueDate: undefined, createdAt: "Sep 16, 2026" },
    { ...starterPractice, id: "practice-directions", title: "Asking for directions", topic: "Finding your way around town", scenario: "You're in town and need to find the train station.", goal: "Ask for directions and check that you understood them.", role: "Local resident", level: "A1", expressions: ["Excuse me…", "How do I get to…?", "Is it far?"], grammars: ["Imperatives", "Prepositions of place"], tags: ["Travel", "City life"], students: ["Emily Chen", "Daniel Costa", "Anna Johnson"], status: "Published", completed: 3, dueDate: undefined, createdAt: "Sep 12, 2026" },
    { ...starterPractice, id: "practice-interview", title: "Job interview", topic: "Talking about work experience", scenario: "You're meeting a recruiter for an interview about a new role.", goal: "Introduce yourself, describe your experience and ask one question about the role.", role: "Recruiter", level: "B1", grammars: ["Past simple", "Present perfect"], tags: ["Work", "Career"], students: [], status: "Draft", completed: 0, dueDate: undefined, createdAt: "Sep 10, 2026" },
  ],
  attempts: [
    ...EXAMPLE_ATTEMPTS,
    {
      id: "attempt-anna-1", practiceId: "practice-restaurant", student: "Anna Johnson", completedAt: "Sep 20, 2026", duration: "3:42",
      evaluation: { ...sampleEvaluation(), overall: 82 },
      transcript: [
        { speaker: "AI", text: "Hi! Welcome to The Daily Dish. Are you ready to order?" },
        { speaker: "Student", text: "Yes, I'd like a burger." },
        { speaker: "AI", text: "Sure. Would you like fries or a salad with that?" },
        { speaker: "Student", text: "Fries, please." },
        { speaker: "AI", text: "Great. Would you like something to drink?" },
        { speaker: "Student", text: "I want water.", note: "Try: “I'd like some water, please.”" },
        { speaker: "AI", text: "Of course. Anything else?" },
        { speaker: "Student", text: "No, thank you. What do you recommend for dessert?" },
      ],
    },
    { id: "attempt-anna-0", practiceId: "practice-restaurant", student: "Anna Johnson", completedAt: "Sep 18, 2026", duration: "3:18", improved: "Asked a complete question in the latest attempt.", transcript: [] },
    { id: "attempt-lucas-1", practiceId: "practice-restaurant", student: "Lucas Martins", completedAt: "Sep 19, 2026", duration: "3:56", improved: "Asked for a recommendation using a complete question.", transcript: [] },
    { id: "attempt-directions-1", practiceId: "practice-directions", student: "Emily Chen", completedAt: "Sep 19, 2026", duration: "4:05", transcript: [] },
    { id: "attempt-directions-2", practiceId: "practice-directions", student: "Daniel Costa", completedAt: "Sep 19, 2026", duration: "3:51", transcript: [] },
    { id: "attempt-directions-3", practiceId: "practice-directions", student: "Anna Johnson", completedAt: "Sep 20, 2026", duration: "3:37", transcript: [] },
  ],
};

export function readState({ persistMigration = true }: { persistMigration?: boolean } = {}): ConversationState {
  if (typeof window === "undefined") return INITIAL_STATE;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return INITIAL_STATE;
    const parsed = JSON.parse(saved) as ConversationState;
    const demoDefaults = new Map(INITIAL_STATE.practices.map((practice) => [practice.id, practice]));
    const practices: Practice[] = Array.isArray(parsed.practices) ? parsed.practices.map((practice: Practice): Practice => {
      const demo = demoDefaults.get(practice.id);
      return {
      ...practice,
      status: practice.status === "Draft" && !practice.students.length ? "Draft" : "Published",
      practiceType: practice.practiceType ?? "oral-production",
      questions: practice.questions?.length ? practice.questions : [
        `What would you say first when ${practice.topic.toLowerCase()}?`,
        `What question could help you achieve this goal: ${practice.goal}?`,
        `How would you respond to a follow-up question about ${practice.topic.toLowerCase()}?`,
      ],
      minResponseTime: Math.max(1, Math.min(5, practice.minResponseTime ?? 1)),
      maxResponseTime: Math.max(Math.max(1, Math.min(5, practice.minResponseTime ?? 1)), Math.min(5, practice.maxResponseTime ?? 2)),
      instantFeedback: practice.instantFeedback ?? true,
      grammars: practice.grammars?.length ? practice.grammars : demo?.grammars ?? [],
      tags: practice.tags ?? demo?.tags ?? [],
    };}) : INITIAL_STATE.practices;
    const demoAttempts = new Map(INITIAL_STATE.attempts.map((attempt) => [attempt.id, attempt]));
    const attempts = Array.isArray(parsed.attempts) ? parsed.attempts.map((attempt: Attempt) => ({ ...demoAttempts.get(attempt.id), ...attempt })) : INITIAL_STATE.attempts;
    if ((parsed.samplePackVersion ?? 0) < EXAMPLE_PACK_VERSION) {
      practices.unshift(...EXAMPLE_PRACTICES.filter((demo) => !practices.some((item) => item.id === demo.id)));
      attempts.push(...EXAMPLE_ATTEMPTS.filter((demo) => practices.some((practice) => practice.id === demo.practiceId && practice.isExample) && !attempts.some((item) => item.practiceId === demo.practiceId && item.student === demo.student)));
    }
    const next: ConversationState = { samplePackVersion: EXAMPLE_PACK_VERSION, practices: practices as Practice[], attempts: attempts.map((attempt) => ({ ...attempt, evaluation: attempt.evaluation && !attempt.evaluation.dimensions.every((dimension) => SKILL_LABELS.includes(dimension.label)) ? (demoAttempts.get(attempt.id)?.evaluation ? { ...demoAttempts.get(attempt.id)!.evaluation!, overall: attempt.evaluation.overall } : undefined) : attempt.evaluation })) };
    if (persistMigration && (parsed.samplePackVersion ?? 0) < EXAMPLE_PACK_VERSION) saveState(next);
    return next;
  } catch {
    return INITIAL_STATE;
  }
}

export function saveState(state: ConversationState) {
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, samplePackVersion: EXAMPLE_PACK_VERSION }));
}

export const SKILL_LABELS = ["Pronunciation", "Speech Rhythm", "Use of Vocabulary", "Topic Adherence", "Use of Grammar"];

/** Demonstration content only; never attach this evaluation to a real recording. */
export function sampleEvaluation(): NonNullable<Attempt["evaluation"]> {
  return {
    mode: "simulated", overall: 89,
    summary: "You communicated your main ideas clearly and used relevant language to complete the speaking task.",
    howYouDid: ["Communicated the main message clearly", "Developed ideas with some supporting detail"],
    strengths: ["Used relevant vocabulary", "Connected ideas in a logical order"],
    growthAreas: ["Vary repeated words", "Use pauses to make longer sentences easier to follow"],
    growthOpportunities: "Practise extending each idea with a reason and an example. Try alternative expressions and leave short pauses between ideas.",
    communicativeGoal: "The response addresses the main task. More supporting details would make the message more complete.",
    repeatedWords: ["good", "like"], falseCognates: [],
    dimensions: [
      { label: "Pronunciation", score: 88, evidence: "Most words are clear. Practise word stress in longer words." },
      { label: "Speech Rhythm", score: 91, evidence: "A steady pace helps the listener follow your ideas." },
      { label: "Use of Vocabulary", score: 79, evidence: "Relevant words convey the message. Try a wider range of expressions." },
      { label: "Topic Adherence", score: 68, evidence: "The response addresses the task but could include more specific details." },
      { label: "Use of Grammar", score: 84, evidence: "Sentence structure is mostly clear. Review agreement in longer sentences." },
    ],
  };
}

export function responseTime(practice: Practice) {
  return `${practice.minResponseTime ?? 1}–${practice.maxResponseTime ?? 2} minutes`;
}

export function hasSubmitted(state: ConversationState, practiceId: string, student: string) {
  return state.attempts.some((item) => item.practiceId === practiceId && item.student === student && item.completed !== false);
}
