CREATE TABLE `calendar_events` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`event_type` text NOT NULL,
	`scheduled_date` text NOT NULL,
	`start_minutes` integer NOT NULL,
	`duration` integer NOT NULL,
	`color` text NOT NULL,
	`planning_status` text DEFAULT 'To Plan' NOT NULL,
	`class_status` text,
	`student_name` text,
	`group_name` text,
	`description` text,
	`student_emails` text DEFAULT '[]' NOT NULL,
	`teacher_names` text DEFAULT '[]' NOT NULL,
	`recurrence` text DEFAULT '{}' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
