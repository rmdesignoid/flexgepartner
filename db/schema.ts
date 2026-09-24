import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const calendarEvents = sqliteTable("calendar_events", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  eventType: text("event_type", { enum: ["group", "individual", "custom", "task", "away", "other"] }).notNull(),
  scheduledDate: text("scheduled_date").notNull(),
  startMinutes: integer("start_minutes").notNull(),
  duration: integer("duration").notNull(),
  color: text("color").notNull(),
  planningStatus: text("planning_status").notNull().default("To Plan"),
  classStatus: text("class_status"),
  studentName: text("student_name"),
  groupName: text("group_name"),
  description: text("description"),
  observation: text("observation"),
  classPlanId: text("class_plan_id"),
  studentEmails: text("student_emails").notNull().default("[]"),
  teacherNames: text("teacher_names").notNull().default("[]"),
  recurrence: text("recurrence").notNull().default("{}"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_calendar_events_scheduled_date_start").on(table.scheduledDate, table.startMinutes),
  index("idx_calendar_events_type_date").on(table.eventType, table.scheduledDate),
]);
