import type { Practice } from "./types";

type Turn = { speaker: "AI" | "Student"; text: string; note?: string };
const SCRIPT: Turn[] = [
  { speaker: "AI", text: "Hi! Welcome to The Daily Dish. Are you ready to order?" },
  { speaker: "Student", text: "Yes, I'd like a burger." },
  { speaker: "AI", text: "Sure. Would you like fries or a salad with that?" },
  { speaker: "Student", text: "Fries, please." },
  { speaker: "AI", text: "Great. Would you like something to drink?" },
  { speaker: "Student", text: "I'd like some water, please." },
  { speaker: "AI", text: "Of course. Anything else?" },
  { speaker: "Student", text: "No, thank you. What do you recommend for dessert?" },
];
const RETRY_SCRIPT: Turn[] = [
  { speaker: "AI", text: "Hello! Welcome to The Daily Dish. What can I get for you today?" },
  { speaker: "Student", text: "I'd like the grilled chicken, please." },
  { speaker: "AI", text: "Good choice. Would you like a side dish?" },
  { speaker: "Student", text: "Could I have a salad, please?" },
  { speaker: "AI", text: "Of course. Would you like something to drink?" },
  { speaker: "Student", text: "Could I have some water, please?" },
  { speaker: "AI", text: "Certainly. Would you like to see the dessert menu?" },
  { speaker: "Student", text: "Yes, please. What do you recommend?" },
];
const HOTEL_SCRIPT: Turn[] = [
  { speaker: "AI", text: "Welcome to the Grand Hotel. Do you have a reservation?" },
  { speaker: "Student", text: "Yes, I have a reservation." },
  { speaker: "AI", text: "Great. Could I have your name, please?" },
  { speaker: "Student", text: "It's Anna Johnson." },
  { speaker: "AI", text: "Thank you. Would you like some help with your bags?" },
  { speaker: "Student", text: "No, thank you. What time is breakfast?" },
  { speaker: "AI", text: "Breakfast starts at seven on the first floor." },
  { speaker: "Student", text: "Thank you. Is there Wi-Fi in the room?" },
];
const DIRECTIONS_SCRIPT: Turn[] = [
  { speaker: "AI", text: "Hello! Can I help you find something?" },
  { speaker: "Student", text: "Excuse me, how do I get to the train station?" },
  { speaker: "AI", text: "Go straight ahead and turn left at the next street." },
  { speaker: "Student", text: "Turn left at the next street?" },
  { speaker: "AI", text: "That's right. The station is next to the park." },
  { speaker: "Student", text: "Is it far from here?" },
  { speaker: "AI", text: "No, it's about a five-minute walk." },
  { speaker: "Student", text: "Thank you for your help!" },
];

export function scriptForPractice(practice: Practice, attempt: number): Turn[] {
  const topic = `${practice.title} ${practice.topic}`.toLowerCase();
  if (topic.includes("hotel")) return HOTEL_SCRIPT;
  if (topic.includes("direction") || topic.includes("town")) return DIRECTIONS_SCRIPT;
  if (topic.includes("restaurant") || topic.includes("food") || practice.id === "practice-restaurant") return attempt % 2 === 0 ? SCRIPT : RETRY_SCRIPT;
  return [
    { speaker: "AI", text: `Hello! Let's talk about ${practice.topic.toLowerCase()}. What would you like to do?` },
    { speaker: "Student", text: "I'd like some information, please." },
    { speaker: "AI", text: "Of course. What would you like to know?" },
    { speaker: "Student", text: "Could you tell me a little more?" },
    { speaker: "AI", text: "Sure. Is there anything else you'd like to ask?" },
    { speaker: "Student", text: "Yes, what do you recommend?" },
    { speaker: "AI", text: "That's a good question. Is there anything else?" },
    { speaker: "Student", text: "No, thank you. That's all for now." },
  ];
}
