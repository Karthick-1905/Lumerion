CREATE TYPE "public"."group_member_status" AS ENUM('pending', 'active', 'removed');--> statement-breakpoint
ALTER TYPE "public"."role_enum" ADD VALUE 'owner' BEFORE 'admin';--> statement-breakpoint
CREATE TABLE "checkpoint_blobs" (
	"thread_id" text NOT NULL,
	"checkpoint_ns" text DEFAULT '' NOT NULL,
	"channel" text NOT NULL,
	"version" text NOT NULL,
	"type" text NOT NULL,
	"blob" "bytea",
	CONSTRAINT "checkpoint_blobs_pkey" PRIMARY KEY("thread_id","checkpoint_ns","channel","version")
);
--> statement-breakpoint
CREATE TABLE "checkpoint_migrations" (
	"v" integer PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checkpoints" (
	"thread_id" text NOT NULL,
	"checkpoint_ns" text DEFAULT '' NOT NULL,
	"checkpoint_id" text NOT NULL,
	"parent_checkpoint_id" text,
	"type" text,
	"checkpoint" jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "checkpoints_pkey" PRIMARY KEY("thread_id","checkpoint_ns","checkpoint_id")
);
--> statement-breakpoint
CREATE TABLE "quiz" (
	"quiz_id" serial PRIMARY KEY NOT NULL,
	"module_id" integer,
	"path_id" integer,
	"lesson_index" integer DEFAULT null,
	"title" text NOT NULL,
	"description" text,
	"assessment_type" varchar(50),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quiz_question" (
	"question_id" serial PRIMARY KEY NOT NULL,
	"quiz_id" integer NOT NULL,
	"prompt" text NOT NULL,
	"question_type" varchar(50),
	"choices" jsonb,
	"answer" text,
	"explanation" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "roadmap_session" (
	"session_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"thread_id" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"last_activity_at" timestamp DEFAULT now(),
	CONSTRAINT "roadmap_session_thread_id_unique" UNIQUE("thread_id")
);
--> statement-breakpoint
CREATE TABLE "skill_assessment" (
	"assessment_id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"topic" varchar(100) NOT NULL,
	"difficulty_level" "difficulty_level" DEFAULT 'medium',
	"estimated_duration" integer,
	"is_active" boolean DEFAULT true,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_friend" (
	"friendship_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"friend_user_id" integer NOT NULL,
	"connected_at" timestamp DEFAULT now(),
	CONSTRAINT "user_friend_user_id_friend_user_id_key" UNIQUE("user_id","friend_user_id")
);
--> statement-breakpoint
CREATE TABLE "user_quiz_answer" (
	"answer_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"question_id" integer NOT NULL,
	"answer" text NOT NULL,
	"is_correct" boolean,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_quiz_answer_user_question_unique" UNIQUE("user_id","question_id")
);
--> statement-breakpoint
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
ALTER TABLE "learning_path" ADD COLUMN "thread_id" text;--> statement-breakpoint
ALTER TABLE "learning_path" ADD COLUMN "visibility" "visibility_enum" DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE "friend_request" ADD COLUMN "message" text;--> statement-breakpoint
ALTER TABLE "friend_request" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "friend_request" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "study_group" ADD COLUMN "path_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "study_group" ADD COLUMN "settings" jsonb;--> statement-breakpoint
ALTER TABLE "study_group_membership" ADD COLUMN "status" "group_member_status" DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "study_group_membership" ADD COLUMN "last_active_at" timestamp;--> statement-breakpoint
ALTER TABLE "quiz" ADD CONSTRAINT "quiz_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."learning_module"("module_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz" ADD CONSTRAINT "quiz_path_id_fkey" FOREIGN KEY ("path_id") REFERENCES "public"."learning_path"("path_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_question" ADD CONSTRAINT "quiz_question_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."quiz"("quiz_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_session" ADD CONSTRAINT "roadmap_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_friend" ADD CONSTRAINT "user_friend_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_friend" ADD CONSTRAINT "user_friend_friend_user_id_fkey" FOREIGN KEY ("friend_user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_quiz_answer" ADD CONSTRAINT "user_quiz_answer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_quiz_answer" ADD CONSTRAINT "user_quiz_answer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_question"("question_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skill_assessment" ADD CONSTRAINT "user_skill_assessment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skill_assessment" ADD CONSTRAINT "user_skill_assessment_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."skill_assessment"("assessment_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_group" ADD CONSTRAINT "study_group_path_id_fkey" FOREIGN KEY ("path_id") REFERENCES "public"."learning_path"("path_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_group_membership" ADD CONSTRAINT "study_group_membership_group_id_user_id_key" UNIQUE("group_id","user_id");