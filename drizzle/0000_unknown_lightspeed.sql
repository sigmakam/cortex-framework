CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"module" text NOT NULL,
	"payload" jsonb NOT NULL,
	"correlation_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
