CREATE TYPE "public"."action_enum" AS ENUM('joined', 'left', 'started_whiteboard', 'ended_whiteboard', 'sent_message');--> statement-breakpoint
CREATE TYPE "public"."activity_type" AS ENUM('skill_assessment_completed', 'learning_path_created', 'study_group_joined', 'study_group_created', 'friend_added', 'badge_earned', 'streak_achieved', 'learning_path_shared', 'study_group_posted');--> statement-breakpoint
CREATE TYPE "public"."dependency_type" AS ENUM('prerequisite', 'corequisite', 'supplementary');--> statement-breakpoint
CREATE TYPE "public"."difficulty_level" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."group_member_status" AS ENUM('pending', 'active', 'removed');--> statement-breakpoint
CREATE TYPE "public"."interaction_enum" AS ENUM('audio_video', 'whiteboard', 'chat');--> statement-breakpoint
CREATE TYPE "public"."note_type" AS ENUM('text', 'document', 'link', 'multimedia');--> statement-breakpoint
CREATE TYPE "public"."presence_enum" AS ENUM('online', 'offline', 'away', 'busy');--> statement-breakpoint
CREATE TYPE "public"."role_enum" AS ENUM('owner', 'admin', 'moderator', 'member');--> statement-breakpoint
CREATE TYPE "public"."status_enum" AS ENUM('pending', 'accepted', 'rejected', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."visibility_enum" AS ENUM('public', 'private', 'restricted');--> statement-breakpoint
CREATE TYPE "public"."visibility_scope" AS ENUM('private', 'group', 'public');--> statement-breakpoint
CREATE TABLE "activity" (
	"activity_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"activity_type" "activity_type" NOT NULL,
	"target_id" integer,
	"target_type" varchar(50),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
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
CREATE TABLE "checkpoint_writes" (
	"thread_id" text NOT NULL,
	"checkpoint_ns" text DEFAULT '' NOT NULL,
	"checkpoint_id" text NOT NULL,
	"task_id" text NOT NULL,
	"idx" integer NOT NULL,
	"channel" text NOT NULL,
	"type" text,
	"blob" "bytea" NOT NULL,
	CONSTRAINT "checkpoint_writes_pkey" PRIMARY KEY("thread_id","checkpoint_ns","checkpoint_id","task_id","idx")
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
CREATE TABLE "citation" (
	"citation_id" serial PRIMARY KEY NOT NULL,
	"citation_text" text NOT NULL,
	"citation_url" text,
	"source_type" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "citation_citation_url_key" UNIQUE("citation_url")
);
--> statement-breakpoint
CREATE TABLE "friend_request" (
	"request_id" serial PRIMARY KEY NOT NULL,
	"sender_id" integer NOT NULL,
	"receiver_id" integer NOT NULL,
	"status" "status_enum" DEFAULT 'pending',
	"sent_at" timestamp DEFAULT now(),
	"accepted_at" timestamp,
	"message" text,
	"updated_at" timestamp DEFAULT now(),
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "learning_module" (
	"module_id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"tags" jsonb,
	"estimated_duration" integer,
	"assessment_link" text,
	"difficulty_level" "difficulty_level",
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "learning_path" (
	"path_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"user_query" text,
	"user_goal" text,
	"progress" jsonb,
	"is_customized" boolean DEFAULT false,
	"difficulty_level" "difficulty_level",
	"tags" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"visibility" "visibility_enum" DEFAULT 'private' NOT NULL,
	"thread_id" text
);
--> statement-breakpoint
CREATE TABLE "learning_path_module" (
	"path_module_id" serial PRIMARY KEY NOT NULL,
	"path_id" integer NOT NULL,
	"module_id" integer NOT NULL,
	"position" integer NOT NULL,
	"is_optional" boolean DEFAULT false,
	"is_locked" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "learning_path_module_path_id_module_id_key" UNIQUE("path_id","module_id")
);
--> statement-breakpoint
CREATE TABLE "note_media" (
	"media_id" serial PRIMARY KEY NOT NULL,
	"note_id" integer NOT NULL,
	"object_key" text NOT NULL,
	"bucket_name" text NOT NULL,
	"url" text NOT NULL,
	"type" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "module_citation" (
	"module_citation_id" serial PRIMARY KEY NOT NULL,
	"module_id" integer NOT NULL,
	"citation_id" integer NOT NULL,
	CONSTRAINT "module_citation_module_id_citation_id_key" UNIQUE("module_id","citation_id")
);
--> statement-breakpoint
CREATE TABLE "module_dependency" (
	"dependency_id" serial PRIMARY KEY NOT NULL,
	"module_id" integer NOT NULL,
	"prerequisite_id" integer[] NOT NULL,
	"dependency_type" "dependency_type",
	"is_optional" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "note_media_alignment" (
	"alignment_id" serial PRIMARY KEY NOT NULL,
	"note_id" integer NOT NULL,
	"media_id" integer NOT NULL,
	"block_path" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "study_note" (
	"note_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"content" jsonb,
	"visibility_scope" text DEFAULT 'private',
	"related_module_id" integer,
	"is_shared" boolean DEFAULT false,
	"shared_with_group_id" integer,
	"note_type" text DEFAULT 'text',
	"collaboration_enabled" boolean DEFAULT true,
	"collaboration_room" text,
	"collaboration_last_synced_at" timestamp,
	"tags" jsonb,
	"attachments" jsonb,
	"like_count" integer DEFAULT 0,
	"view_count" integer DEFAULT 0,
	"last_edited_by" integer,
	"forked_from_note_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "oauth_accounts" (
	"oauth_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"provider" varchar(255) NOT NULL,
	"provideraccountid" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "oauth_accounts_provider_provideraccountid_key" UNIQUE("provider","provideraccountid")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"token_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"is_used" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "quiz" (
	"quiz_id" serial PRIMARY KEY NOT NULL,
	"module_id" integer NOT NULL,
	"path_id" integer NOT NULL,
	"lesson_index" integer,
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
	"title" varchar(255) NOT NULL,
	"description" text,
	"topic" varchar(255),
	"difficulty_level" "difficulty_level",
	"estimated_duration" integer,
	"is_active" boolean DEFAULT true,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "study_group" (
	"group_id" serial PRIMARY KEY NOT NULL,
	"group_name" varchar(255) NOT NULL,
	"created_by" integer NOT NULL,
	"description" text,
	"visibility" "visibility_enum" DEFAULT 'public',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"path_id" integer NOT NULL,
	"settings" jsonb
);
--> statement-breakpoint
CREATE TABLE "study_group_membership" (
	"membership_id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" "role_enum" DEFAULT 'member',
	"joined_at" timestamp DEFAULT now(),
	"left_at" timestamp,
	"status" "group_member_status" DEFAULT 'pending',
	"last_active_at" timestamp,
	CONSTRAINT "study_group_membership_group_id_user_id_key" UNIQUE("group_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "user_email_verification" (
	"verification_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"user_email" varchar(255) NOT NULL,
	"otp_code" varchar(10) NOT NULL,
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
CREATE TABLE "user_module_progress" (
	"module_progress_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"module_id" integer NOT NULL,
	"path_id" integer NOT NULL,
	"status" text NOT NULL,
	"completion_percent" numeric(5, 2) DEFAULT '0.00',
	"last_accessed" timestamp DEFAULT now(),
	CONSTRAINT "user_module_progress_user_id_module_id_path_id_key" UNIQUE("user_id","module_id","path_id")
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
	"result_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"assessment_id" integer NOT NULL,
	"score" numeric(5, 2),
	"max_score" numeric(5, 2),
	"percentage" numeric(5, 2),
	"skill_level" varchar(50),
	"completed_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" serial PRIMARY KEY NOT NULL,
	"user_email" varchar(255) NOT NULL,
	"password" varchar(255),
	"salt" varchar(255),
	"avatar_url" text,
	"avatar_public_url" text,
	"is_verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"user_name" varchar(255) NOT NULL,
	"oauth_provider" varchar(50),
	"oauth_id" varchar(255),
	"profile_picture" text,
	CONSTRAINT "users_user_email_key" UNIQUE("user_email")
);
--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_request" ADD CONSTRAINT "friend_request_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_request" ADD CONSTRAINT "friend_request_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path" ADD CONSTRAINT "learning_path_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_module" ADD CONSTRAINT "learning_path_module_path_id_fkey" FOREIGN KEY ("path_id") REFERENCES "public"."learning_path"("path_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_module" ADD CONSTRAINT "learning_path_module_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."learning_module"("module_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_media" ADD CONSTRAINT "note_media_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "public"."study_note"("note_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_citation" ADD CONSTRAINT "module_citation_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."learning_module"("module_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_citation" ADD CONSTRAINT "module_citation_citation_id_fkey" FOREIGN KEY ("citation_id") REFERENCES "public"."citation"("citation_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_dependency" ADD CONSTRAINT "module_dependency_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."learning_module"("module_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_media_alignment" ADD CONSTRAINT "nma_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "public"."study_note"("note_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_media_alignment" ADD CONSTRAINT "nma_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "public"."note_media"("media_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_note" ADD CONSTRAINT "study_note_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_note" ADD CONSTRAINT "study_note_related_module_id_fkey" FOREIGN KEY ("related_module_id") REFERENCES "public"."learning_module"("module_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_note" ADD CONSTRAINT "study_note_shared_with_group_id_fkey" FOREIGN KEY ("shared_with_group_id") REFERENCES "public"."study_group"("group_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_note" ADD CONSTRAINT "study_note_last_edited_by_fkey" FOREIGN KEY ("last_edited_by") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_note" ADD CONSTRAINT "study_note_forked_from_note_id_fkey" FOREIGN KEY ("forked_from_note_id") REFERENCES "public"."study_note"("note_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz" ADD CONSTRAINT "quiz_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."learning_module"("module_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz" ADD CONSTRAINT "quiz_path_id_fkey" FOREIGN KEY ("path_id") REFERENCES "public"."learning_path"("path_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_question" ADD CONSTRAINT "quiz_question_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."quiz"("quiz_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roadmap_session" ADD CONSTRAINT "roadmap_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_group" ADD CONSTRAINT "study_group_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_group" ADD CONSTRAINT "study_group_path_id_fkey" FOREIGN KEY ("path_id") REFERENCES "public"."learning_path"("path_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_group_membership" ADD CONSTRAINT "study_group_membership_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."study_group"("group_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_group_membership" ADD CONSTRAINT "study_group_membership_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_email_verification" ADD CONSTRAINT "user_email_verification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_friend" ADD CONSTRAINT "user_friend_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_friend" ADD CONSTRAINT "user_friend_friend_user_id_fkey" FOREIGN KEY ("friend_user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_module_progress" ADD CONSTRAINT "user_module_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_module_progress" ADD CONSTRAINT "user_module_progress_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."learning_module"("module_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_module_progress" ADD CONSTRAINT "user_module_progress_path_id_fkey" FOREIGN KEY ("path_id") REFERENCES "public"."learning_path"("path_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_quiz_answer" ADD CONSTRAINT "user_quiz_answer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_quiz_answer" ADD CONSTRAINT "user_quiz_answer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_question"("question_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skill_assessment" ADD CONSTRAINT "user_skill_assessment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skill_assessment" ADD CONSTRAINT "user_skill_assessment_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "public"."skill_assessment"("assessment_id") ON DELETE cascade ON UPDATE no action;