ALTER TABLE "applications" DROP CONSTRAINT "applications_cv_file_id_file_id_fk";
--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "candidate_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "cv_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_cv_id_cvs_id_fk" FOREIGN KEY ("cv_id") REFERENCES "public"."cvs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "full_name";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "email";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "phone";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "cv_file_id";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "cv_file_key";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "ai_score";--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "ai_analysis";