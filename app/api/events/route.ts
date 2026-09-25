import { getD1 } from "../../../db";

const eventTypes = new Set(["group", "individual", "custom", "task", "away", "other"]);

type EventPayload = {
  id: string;
  title: string;
  eventType: string;
  scheduledDate: string;
  startMinutes: number;
  duration: number;
  color: string;
  planningStatus?: string;
  classStatus?: string | null;
  studentName?: string | null;
  groupName?: string | null;
  description?: string | null;
  observation?: string | null;
  classPlanId?: string | null;
  studentEmails?: string[];
  teacherNames?: string[];
  recurrence?: Record<string, unknown>;
};

function validEvent(input: unknown): EventPayload | null {
  if (!input || typeof input !== "object") return null;
  const value = input as Partial<EventPayload>;
  if (!value.id || !value.title?.trim() || !value.scheduledDate || !eventTypes.has(value.eventType ?? "") || !Number.isInteger(value.startMinutes) || !Number.isInteger(value.duration) || value.duration < 0 || !value.color) return null;
  return {
    id: value.id, title: value.title.trim(), eventType: value.eventType!, scheduledDate: value.scheduledDate.slice(0, 10),
    startMinutes: value.startMinutes, duration: value.duration, color: value.color,
    planningStatus: value.planningStatus ?? "To Plan", classStatus: value.classStatus ?? null,
    studentName: value.studentName ?? null, groupName: value.groupName ?? null, description: value.description ?? null,
    observation: typeof value.observation === "string" ? value.observation.trim().slice(0, 2000) || null : null,
    classPlanId: value.classPlanId ?? null,
    studentEmails: Array.isArray(value.studentEmails) ? value.studentEmails.filter((item): item is string => typeof item === "string") : [],
    teacherNames: Array.isArray(value.teacherNames) ? value.teacherNames.filter((item): item is string => typeof item === "string") : [],
    recurrence: value.recurrence && typeof value.recurrence === "object" ? value.recurrence : {},
  };
}

function rowToEvent(row: Record<string, unknown>) {
  return {
    id: row.id, title: row.title, eventType: row.event_type, scheduledDate: String(row.scheduled_date).slice(0, 10),
    startMinutes: row.start_minutes, duration: row.duration, color: row.color,
    planningStatus: row.planning_status, classStatus: row.class_status, studentName: row.student_name,
    groupName: row.group_name, description: row.description, observation: row.observation,
    classPlanId: row.class_plan_id,
    studentEmails: JSON.parse(String(row.student_emails ?? "[]")), teacherNames: JSON.parse(String(row.teacher_names ?? "[]")),
    recurrence: JSON.parse(String(row.recurrence ?? "{}")), updatedAt: row.updated_at,
  };
}

const columns = "id, title, event_type, scheduled_date, start_minutes, duration, color, planning_status, class_status, student_name, group_name, description, observation, class_plan_id, student_emails, teacher_names, recurrence";
const legacyColumns = "id, title, event_type, scheduled_date, start_minutes, duration, color, planning_status, class_status, student_name, group_name, description, observation, student_emails, teacher_names, recurrence";
const columnsWithUpdatedAt = `${columns}, updated_at`;
const legacyColumnsWithUpdatedAt = `${legacyColumns}, updated_at`;
const isMissingClassPlanColumn = (error: unknown) => error instanceof Error && error.message.includes("class_plan_id");

export async function GET() {
  try {
    const db = getD1();
    let rows;
    try {
      rows = await db.prepare(`SELECT ${columnsWithUpdatedAt} FROM calendar_events ORDER BY scheduled_date, start_minutes`).all();
    } catch (error) {
      if (!isMissingClassPlanColumn(error)) throw error;
      rows = await db.prepare(`SELECT ${legacyColumnsWithUpdatedAt} FROM calendar_events ORDER BY scheduled_date, start_minutes`).all();
    }
    return Response.json({ events: rows.results.map((row) => rowToEvent(row as Record<string, unknown>)) });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to load calendar events" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const event = validEvent(await request.json());
    if (!event) return Response.json({ error: "Invalid event payload" }, { status: 400 });
    const db = getD1();
    const insertVerb = /^seed-\d+$/.test(event.id) ? "INSERT OR IGNORE" : "INSERT";
    try {
      await db.prepare(`${insertVerb} INTO calendar_events (${columns}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(event.id, event.title, event.eventType, event.scheduledDate, event.startMinutes, event.duration, event.color, event.planningStatus, event.classStatus, event.studentName, event.groupName, event.description, event.observation, event.classPlanId, JSON.stringify(event.studentEmails), JSON.stringify(event.teacherNames), JSON.stringify(event.recurrence)).run();
    } catch (error) {
      if (!isMissingClassPlanColumn(error)) throw error;
      await db.prepare(`${insertVerb} INTO calendar_events (${legacyColumns}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(event.id, event.title, event.eventType, event.scheduledDate, event.startMinutes, event.duration, event.color, event.planningStatus, event.classStatus, event.studentName, event.groupName, event.description, event.observation, JSON.stringify(event.studentEmails), JSON.stringify(event.teacherNames), JSON.stringify(event.recurrence)).run();
    }
    return Response.json({ event: { ...event, updatedAt: new Date().toISOString() } }, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to save calendar event" }, { status: 500 }); }
}

export async function PUT(request: Request) {
  try {
    const event = validEvent(await request.json());
    if (!event) return Response.json({ error: "Invalid event payload" }, { status: 400 });
    const db = getD1();
    let result;
    try {
      result = await db.prepare("UPDATE calendar_events SET title = ?, scheduled_date = ?, start_minutes = ?, duration = ?, color = ?, planning_status = ?, class_status = ?, student_name = ?, group_name = ?, description = ?, observation = ?, class_plan_id = ?, student_emails = ?, teacher_names = ?, recurrence = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND event_type = ?")
        .bind(event.title, event.scheduledDate, event.startMinutes, event.duration, event.color, event.planningStatus, event.classStatus, event.studentName, event.groupName, event.description, event.observation, event.classPlanId, JSON.stringify(event.studentEmails), JSON.stringify(event.teacherNames), JSON.stringify(event.recurrence), event.id, event.eventType).run();
    } catch (error) {
      if (!isMissingClassPlanColumn(error)) throw error;
      result = await db.prepare("UPDATE calendar_events SET title = ?, scheduled_date = ?, start_minutes = ?, duration = ?, color = ?, planning_status = ?, class_status = ?, student_name = ?, group_name = ?, description = ?, observation = ?, student_emails = ?, teacher_names = ?, recurrence = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND event_type = ?")
        .bind(event.title, event.scheduledDate, event.startMinutes, event.duration, event.color, event.planningStatus, event.classStatus, event.studentName, event.groupName, event.description, event.observation, JSON.stringify(event.studentEmails), JSON.stringify(event.teacherNames), JSON.stringify(event.recurrence), event.id, event.eventType).run();
    }
    if (!result.meta.changes) return Response.json({ error: "Event not found or its type changed" }, { status: 404 });
    return Response.json({ event: { ...event, updatedAt: new Date().toISOString() } });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to update calendar event" }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const id = params.get("id");
    if (params.get("all") === "true") {
      await getD1().prepare("DELETE FROM calendar_events").run();
      return new Response(null, { status: 204 });
    }
    if (!id) return Response.json({ error: "id is required" }, { status: 400 });
    await getD1().prepare("DELETE FROM calendar_events WHERE id = ?").bind(id).run();
    return new Response(null, { status: 204 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Unable to delete calendar event" }, { status: 500 }); }
}
