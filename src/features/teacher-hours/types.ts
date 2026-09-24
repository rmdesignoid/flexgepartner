export type TeacherHoursAttendance = "Present" | "Absent" | "No data";

/** These mirror the class statuses already represented by the current product. */
export type TeacherHoursSessionStatus = "Taught" | "Scheduled" | "Rescheduled" | "Reschedule pending" | "Student no-show" | "Canceled";

export type TeacherHoursClassType = "original" | "substitution";

export type TeacherHoursFlag = "Teacher absent" | "Under minimum time" | "Missing check-in" | "Time discrepancy" | "Substitution requiring review" | "Missing data";

export type TeacherReference = {
  id: string;
  name: string;
};

export type TeacherHoursSession = {
  id: string;
  /** Stable calendar event ID when the session is linked to the Full English Planner. */
  plannerEventId?: string | number;
  scheduledDate: string;
  classOrGroup: { id: string; name: string };
  scheduled: {
    teacher: TeacherReference;
    startMinutes: number;
    endMinutes: number;
    durationMinutes: number;
  };
  actual: {
    teacher: TeacherReference | null;
    // Kept optional until the execution source formally provides check-in/out times.
    startMinutes?: number | null;
    endMinutes?: number | null;
    timeInClassMinutes: number | null;
    attendance: TeacherHoursAttendance;
    sessionStatus: TeacherHoursSessionStatus;
  };
  classType: TeacherHoursClassType;
  flags: TeacherHoursFlag[];
  observations: string | null;
};

export type TeacherHoursThresholds = {
  okMinimumMinutes: number;
  attentionMinimumMinutes: number;
};

export const teacherHoursThresholds: TeacherHoursThresholds = {
  // Temporary presentation thresholds. Replace with the future policy contract.
  okMinimumMinutes: 50,
  attentionMinimumMinutes: 30,
};

export type TimeBand = "ok" | "attention" | "critical" | "no-data";

export function timeBandFor(minutes: number | null, attendance: TeacherHoursAttendance, thresholds = teacherHoursThresholds): TimeBand {
  if (minutes === null || attendance !== "Present") return "no-data";
  if (minutes >= thresholds.okMinimumMinutes) return "ok";
  if (minutes >= thresholds.attentionMinimumMinutes) return "attention";
  return "critical";
}
