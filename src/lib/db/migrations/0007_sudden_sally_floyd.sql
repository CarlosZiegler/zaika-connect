ALTER TABLE "cvs" ADD COLUMN "processing_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "cvs" ADD COLUMN "processing_error" text;--> statement-breakpoint
ALTER TABLE "cvs" ADD COLUMN "processed_at" timestamp;