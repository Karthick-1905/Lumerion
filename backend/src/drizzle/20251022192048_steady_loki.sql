CREATE TABLE "user_skill_assessment" (
	"user_assessment_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"assessment_id" integer NOT NULL,
	"score" numeric(5, 2),
	"max_score" numeric(5, 2),
	"percentage" numeric(5, 2),
	"skill_level" varchar(20),
	"completed_at" timestamp DEFAULT now(),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "user_skill_assessment_user_id_assessment_id_key" UNIQUE("user_id","assessment_id")
);
--> statement-breakpoint
ALTER TABLE "user_skill_assessment" ADD CONSTRAINT "user_skill_assessment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skill_assessment" ADD CONSTRAINT "user_skill_assessment_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."skill_assessment"("assessment_id") ON DELETE cascade ON UPDATE no action;