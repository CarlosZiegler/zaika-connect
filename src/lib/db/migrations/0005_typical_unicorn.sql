CREATE TABLE "cvs" (
	"id" text PRIMARY KEY NOT NULL,
	"candidate_id" text NOT NULL,
	"file_id" text,
	"file_key" text,
	"cv_text" text,
	"cv_embedding" vector(1536),
	"ai_score" integer,
	"ai_analysis" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cvs" ADD CONSTRAINT "cvs_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cvs" ADD CONSTRAINT "cvs_file_id_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cvs_embedding_idx" ON "cvs" USING hnsw ("cv_embedding" vector_cosine_ops);