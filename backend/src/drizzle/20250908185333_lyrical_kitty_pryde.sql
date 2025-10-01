-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TYPE "public"."action_enum" AS ENUM('joined', 'left', 'started_whiteboard', 'ended_whiteboard', 'sent_message');--> statement-breakpoint
CREATE TYPE "public"."dependency_type" AS ENUM('prerequisite', 'corequisite', 'supplementary');--> statement-breakpoint
CREATE TYPE "public"."difficulty_level" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."interaction_enum" AS ENUM('audio_video', 'whiteboard', 'chat');--> statement-breakpoint
CREATE TYPE "public"."note_type" AS ENUM('text', 'document', 'link', 'multimedia');--> statement-breakpoint
CREATE TYPE "public"."presence_enum" AS ENUM('online', 'offline', 'away', 'busy');--> statement-breakpoint
CREATE TYPE "public"."role_enum" AS ENUM('admin', 'moderator', 'member');--> statement-breakpoint
CREATE TYPE "public"."status_enum" AS ENUM('pending', 'accepted', 'rejected', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."visibility_enum" AS ENUM('public', 'private', 'restricted');--> statement-breakpoint
CREATE TYPE "public"."visibility_scope" AS ENUM('private', 'group', 'public');--> statement-breakpoint
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
CREATE TABLE "module_dependency" (
	"dependency_id" serial PRIMARY KEY NOT NULL,
	"module_id" integer NOT NULL,
	"prerequisite_id" integer[] NOT NULL,
	"dependency_type" "dependency_type",
	"is_optional" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
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
CREATE TABLE "oauth_accounts" (
	"oauth_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"provider" varchar(255) NOT NULL,
	"provideraccountid" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "oauth_accounts_provider_provideraccountid_key" UNIQUE("provider","provideraccountid")
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
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "module_citation" (
	"module_citation_id" serial PRIMARY KEY NOT NULL,
	"module_id" integer NOT NULL,
	"citation_id" integer NOT NULL,
	CONSTRAINT "module_citation_module_id_citation_id_key" UNIQUE("module_id","citation_id")
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
CREATE TABLE "friend_request" (
	"request_id" serial PRIMARY KEY NOT NULL,
	"sender_id" integer NOT NULL,
	"receiver_id" integer NOT NULL,
	"status" "status_enum" DEFAULT 'pending',
	"sent_at" timestamp DEFAULT now(),
	"accepted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "study_group" (
	"group_id" serial PRIMARY KEY NOT NULL,
	"group_name" varchar(255) NOT NULL,
	"created_by" integer NOT NULL,
	"description" text,
	"visibility" "visibility_enum" DEFAULT 'public',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "study_group_membership" (
	"membership_id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" "role_enum" DEFAULT 'member',
	"joined_at" timestamp DEFAULT now(),
	"left_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "meta_interaction_group" (
	"group_id" serial PRIMARY KEY NOT NULL,
	"space_id" integer NOT NULL,
	"interaction_type" "interaction_enum" NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"ended_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "study_note" (
	"note_id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"visibility_scope" "visibility_scope" DEFAULT 'private',
	"related_module_id" integer,
	"is_shared" boolean DEFAULT false,
	"shared_with_group_id" integer,
	"note_type" "note_type" DEFAULT 'text',
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
CREATE TABLE "note_comment" (
	"comment_id" serial PRIMARY KEY NOT NULL,
	"note_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"comment_text" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "meta_space" (
	"space_id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"created_by" integer NOT NULL,
	"layout_config" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "meta_space_user_presence" (
	"presence_id" serial PRIMARY KEY NOT NULL,
	"space_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"x_coord" integer DEFAULT 0,
	"y_coord" integer DEFAULT 0,
	"orientation" varchar(50),
	"status" "presence_enum" DEFAULT 'online',
	"last_updated" timestamp DEFAULT now(),
	CONSTRAINT "meta_space_user_presence_space_id_user_id_key" UNIQUE("space_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "meta_interaction_group_members" (
	"group_member_id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"joined_at" timestamp DEFAULT now(),
	"left_at" timestamp,
	CONSTRAINT "meta_interaction_group_members_group_id_user_id_key" UNIQUE("group_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "meta_interaction_log" (
	"interaction_id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"action_type" "action_enum" NOT NULL,
	"metadata" jsonb,
	"timestamp" timestamp DEFAULT now()
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
ALTER TABLE "module_dependency" ADD CONSTRAINT "module_dependency_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."learning_module"("module_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_email_verification" ADD CONSTRAINT "user_email_verification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path" ADD CONSTRAINT "learning_path_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_citation" ADD CONSTRAINT "module_citation_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."learning_module"("module_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "module_citation" ADD CONSTRAINT "module_citation_citation_id_fkey" FOREIGN KEY ("citation_id") REFERENCES "public"."citation"("citation_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_module" ADD CONSTRAINT "learning_path_module_path_id_fkey" FOREIGN KEY ("path_id") REFERENCES "public"."learning_path"("path_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_module" ADD CONSTRAINT "learning_path_module_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."learning_module"("module_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_module_progress" ADD CONSTRAINT "user_module_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_module_progress" ADD CONSTRAINT "user_module_progress_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."learning_module"("module_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_module_progress" ADD CONSTRAINT "user_module_progress_path_id_fkey" FOREIGN KEY ("path_id") REFERENCES "public"."learning_path"("path_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_request" ADD CONSTRAINT "friend_request_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_request" ADD CONSTRAINT "friend_request_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_group" ADD CONSTRAINT "study_group_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_group_membership" ADD CONSTRAINT "study_group_membership_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."study_group"("group_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_group_membership" ADD CONSTRAINT "study_group_membership_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_interaction_group" ADD CONSTRAINT "meta_interaction_group_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."meta_space"("space_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_note" ADD CONSTRAINT "study_note_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_note" ADD CONSTRAINT "study_note_related_module_id_fkey" FOREIGN KEY ("related_module_id") REFERENCES "public"."learning_module"("module_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_note" ADD CONSTRAINT "study_note_shared_with_group_id_fkey" FOREIGN KEY ("shared_with_group_id") REFERENCES "public"."study_group"("group_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_note" ADD CONSTRAINT "study_note_last_edited_by_fkey" FOREIGN KEY ("last_edited_by") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_note" ADD CONSTRAINT "study_note_forked_from_note_id_fkey" FOREIGN KEY ("forked_from_note_id") REFERENCES "public"."study_note"("note_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_comment" ADD CONSTRAINT "note_comment_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "public"."study_note"("note_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_comment" ADD CONSTRAINT "note_comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_space" ADD CONSTRAINT "meta_space_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_space_user_presence" ADD CONSTRAINT "meta_space_user_presence_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "public"."meta_space"("space_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_space_user_presence" ADD CONSTRAINT "meta_space_user_presence_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_interaction_group_members" ADD CONSTRAINT "meta_interaction_group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."meta_interaction_group"("group_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_interaction_group_members" ADD CONSTRAINT "meta_interaction_group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_interaction_log" ADD CONSTRAINT "meta_interaction_log_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."meta_interaction_group"("group_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meta_interaction_log" ADD CONSTRAINT "meta_interaction_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;
*/