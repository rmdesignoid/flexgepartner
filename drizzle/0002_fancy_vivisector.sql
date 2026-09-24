ALTER TABLE `calendar_events` ADD `class_plan_id` text;--> statement-breakpoint
CREATE INDEX `idx_calendar_events_type_date` ON `calendar_events` (`event_type`,`scheduled_date`);