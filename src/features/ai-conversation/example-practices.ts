import type { Attempt, Practice } from "./types";

export const EXAMPLE_PACK_VERSION = 1;
const scenarios = [
  {
    slug: "restaurant", title: "Dinner at a neighborhood restaurant", level: "A2", student: "Anna Johnson", duration: "1:06", scores: [86, 83, 88, 95, 88],
    themes: ["Food", "Everyday English"], grammar: ["Polite requests", "Question formation"],
    instructions: "Imagine you are at the restaurant in the picture. Order a meal and a drink, explain a dietary restriction, ask about dessert and request the bill. Use polite questions.",
    summary: "Anna completes a restaurant visit from requesting a table to paying the bill. Her response includes specific food choices, a peanut allergy and a clear time constraint.",
    how: ["Ordered chicken, rice, salad and water.", "Checked ingredients and explained a peanut allergy.", "Asked to share dessert and pay by card."],
    strengths: ["Uses polite requests such as ‘Could I have…?’", "Gives enough detail for the server to respond safely.", "Organizes the visit in a clear sequence."],
    areas: ["Vary repeated uses of ‘I would like’.", "Replace ‘good’ with more specific descriptions."],
    evidence: ["Practice stress in ‘allergic’ and ‘recommend’; this score is illustrative.", "Use short pauses between ordering, dietary needs and payment; this score is illustrative.", "Specific vocabulary includes dressing, peanuts and bill.", "Covers the meal, drink, restriction, dessert and payment.", "Uses modal questions and conditional requests consistently."],
    growth: "Repeat the activity using ‘May I order…?’ and ‘Could you bring…?’ Describe one dish as fresh, grilled or rich instead of good.",
    goal: "Achieved: the listener has the information needed to take the order, check the allergy and arrange payment.", repeated: ["would like", "good"], cognates: ["No false cognates in this example."], comment: "",
  },
  {
    slug: "hotel", title: "Checking in and planning your stay", level: "B1", student: "Lucas Martins", duration: "1:08", scores: [88, 86, 90, 96, 90],
    themes: ["Travel", "Accommodation"], grammar: ["Polite requests", "Indirect questions"],
    instructions: "You have arrived at the hotel in the picture. Introduce your reservation, request a quiet room, ask about breakfast and internet access, and check the options for a late checkout.",
    summary: "Lucas explains his reservation and links practical requests to his schedule. He asks about early check-in, breakfast, Wi-Fi, a local restaurant and late checkout.",
    how: ["Introduced the booking and offered identification.", "Explained why a quiet room and early breakfast matter.", "Checked availability and the cost of late checkout."],
    strengths: ["Uses indirect questions to sound polite.", "Explains the reason behind each request.", "Anticipates possible extra charges."],
    areas: ["Group related questions so the receptionist can answer in stages.", "Vary the openings ‘Could you’ and ‘I would like’."],
    evidence: ["Practice word stress in ‘reservation’ and ‘available’; illustrative score.", "Pause after each group of hotel questions; illustrative score.", "Uses reservation, confirmation, luggage and extra charge appropriately.", "Addresses all five parts of the hotel task with relevant details.", "Forms indirect questions accurately: ‘whether breakfast is included’."],
    growth: "Try a second role-play in which early check-in is unavailable. Acknowledge the answer, choose luggage storage and confirm a return time.",
    goal: "Achieved: the receptionist can locate the booking and explain the services needed for the stay.", repeated: ["could", "room"], cognates: ["No false cognates in this example."], comment: "Clear and considerate requests, Lucas. Next time, ask two related questions, pause for the answer, then move to the next topic.",
  },
  {
    slug: "weekend", title: "My ideal weekend outdoors", level: "A1", student: "Emily Chen", duration: "1:02", scores: [76, 74, 75, 90, 65],
    themes: ["Free time", "Family"], grammar: ["Present simple", "Likes and dislikes"],
    instructions: "Look at the picnic in the picture. Describe your ideal weekend: where you go, who you spend time with, what you do and why you enjoy it. Include one plan for next weekend.",
    summary: "Emily describes a family picnic, games, cooking and time at home. The response stays on topic and includes a future plan, with a useful opportunity to practice third-person verbs.",
    how: ["Described the park and the people who join her.", "Explained why she enjoys family activities.", "Added a plan to learn a cake recipe."],
    strengths: ["Uses familiar vocabulary to communicate a complete message.", "Links events with ‘after lunch’ and ‘then’.", "Gives reasons using ‘because’."],
    areas: ["Say ‘My sister likes’, adding the third-person -s.", "Vary ‘I like’ with ‘I enjoy’ when appropriate.", "Group short sentences about the same activity."],
    evidence: ["Practice clearly ending ‘likes’ and ‘brings’; illustrative score.", "Link short sentences into comfortable phrases; illustrative score.", "Uses accessible vocabulary for food, family and outdoor activities.", "Includes place, people, activities, reasons and a future plan.", "‘My sister like’ needs the third-person form ‘likes’."],
    growth: "Describe three family members using ‘he likes’ or ‘she likes’. Then give one reason for each activity using because.",
    goal: "Achieved: the listener can picture the weekend and understand why these activities matter to Emily.", repeated: ["like", "park", "family"], cognates: ["No false cognates in this example."], comment: "",
  },
  {
    slug: "interview", title: "A new role in project coordination", level: "B2", student: "Daniel Costa", duration: "1:15", scores: [90, 88, 82, 96, 94],
    themes: ["Work", "Career"], grammar: ["Present perfect", "Past simple"],
    instructions: "Imagine you are the candidate in the picture. Introduce your experience, describe a measurable achievement, explain a strength and an area for development, and ask the interviewer one question.",
    summary: "Daniel connects customer support experience to project coordination through a concrete achievement. He reflects on delegation and asks how success is measured. One false cognate changes the intended meaning.",
    how: ["Presented three years of relevant experience.", "Explained a process change and a 20% improvement.", "Discussed delegation and asked about success criteria."],
    strengths: ["Supports claims with a specific project and measurable result.", "Shows reflection on what made the change successful.", "Ends with a relevant question about the role."],
    areas: ["Use ‘sensitive to customers’ needs’ instead of ‘sensible to’.", "Connect the achievement more explicitly to the advertised position."],
    evidence: ["Practice stress in ‘coordination’ and ‘responsibilities’; illustrative score.", "Pause around the result so the percentage stands out; illustrative score.", "Strong professional vocabulary, with the false cognate ‘sensible’.", "Covers experience, achievement, strengths, development and a question.", "Uses present perfect for experience and past forms for the project."],
    growth: "Retell the achievement in four parts: situation, task, action and result. Replace ‘sensible’ with ‘sensitive’ and explain how this skill supports the new role.",
    goal: "Achieved: the interviewer receives a relevant introduction, evidence of impact and a thoughtful question about expectations.", repeated: ["I", "team"], cognates: ["sensible → sensitive: sensible means practical or reasonable; sensitive means aware of others’ feelings or needs."], comment: "Strong use of evidence, Daniel. Keep the measurable result and clarify the link to this role. Remember: sensitive to customers’ needs.",
  },
];
const labels = ["Pronunciation", "Speech Rhythm", "Use of Vocabulary", "Topic Adherence", "Use of Grammar"];
export const EXAMPLE_PRACTICES: Practice[] = scenarios.map((s) => ({
  id: `example-oral-${s.slug}-v1`, practiceType: "oral-production", isExample: true,
  title: s.title, topic: s.title, scenario: s.instructions, goal: s.instructions, activityInstructions: s.instructions,
  imageDataUrl: `/oral-production/examples/${s.slug}.png`, role: "Conversation partner", level: s.level,
  duration: "1–2 min", minResponseTime: 1, maxResponseTime: 2, instantFeedback: s.slug !== "hotel",
  expressions: [], focus: labels, grammars: s.grammar, tags: s.themes, students: [s.student],
  status: "Published", completed: 1, createdAt: "Sep 24, 2026",
}));
export const EXAMPLE_ATTEMPTS: Attempt[] = scenarios.map((s) => ({
  id: `example-response-${s.slug}-v1`, practiceId: `example-oral-${s.slug}-v1`, student: s.student,
  completedAt: "2026-09-24T12:00:00.000Z", duration: s.duration, completed: true, transcript: [],
  audioUrl: `/oral-production/examples/${s.slug}.wav`, syntheticAudio: true,
  reviewStatus: s.comment ? "Completed" : "Pending", teacherComment: s.comment,
  evaluation: { mode: "simulated", overall: Math.round(s.scores.reduce((a, b) => a + b, 0) / 5),
    dimensions: labels.map((label, i) => ({ label, score: s.scores[i], evidence: s.evidence[i] })),
    summary: s.summary, howYouDid: s.how, strengths: s.strengths, growthAreas: s.areas,
    growthOpportunities: s.growth, communicativeGoal: s.goal, repeatedWords: s.repeated, falseCognates: s.cognates,
  },
}));
