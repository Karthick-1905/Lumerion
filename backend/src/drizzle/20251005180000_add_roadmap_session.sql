CREATE TABLE IF NOT EXISTS "roadmap_session" (
    "session_id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL,
    "thread_id" text NOT NULL,
    "created_at" timestamp DEFAULT now(),
    "last_activity_at" timestamp DEFAULT now(),
    CONSTRAINT "roadmap_session_thread_id_unique" UNIQUE ("thread_id"),
    CONSTRAINT "roadmap_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE
);
