import { pgTable, serial, varchar, text, jsonb, integer, timestamp, foreignKey, boolean, unique, numeric, primaryKey, pgEnum, customType } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

const bytea = customType<{ data: Buffer }>({
  dataType() {
    return 'bytea';
  },
});

export const actionEnum = pgEnum("action_enum", ['joined', 'left', 'started_whiteboard', 'ended_whiteboard', 'sent_message'])
export const dependencyType = pgEnum("dependency_type", ['prerequisite', 'corequisite', 'supplementary'])
export const difficultyLevel = pgEnum("difficulty_level", ['easy', 'medium', 'hard'])
export const groupMemberStatus = pgEnum("group_member_status", ['pending', 'active', 'removed'])
export const interactionEnum = pgEnum("interaction_enum", ['audio_video', 'whiteboard', 'chat'])
export const noteType = pgEnum("note_type", ['text', 'document', 'link', 'multimedia'])
export const presenceEnum = pgEnum("presence_enum", ['online', 'offline', 'away', 'busy'])
export const roleEnum = pgEnum("role_enum", ['owner', 'admin', 'moderator', 'member'])
export const statusEnum = pgEnum("status_enum", ['pending', 'accepted', 'rejected', 'blocked'])
export const visibilityEnum = pgEnum("visibility_enum", ['public', 'private', 'restricted'])
export const visibilityScope = pgEnum("visibility_scope", ['private', 'group', 'public'])
export const activityType = pgEnum("activity_type", ['skill_assessment_completed', 'learning_path_created', 'study_group_joined', 'study_group_created', 'friend_added', 'badge_earned', 'streak_achieved', 'learning_path_shared', 'study_group_posted'])


export const learningModule = pgTable("learning_module", {
	moduleId: serial("module_id").primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	tags: jsonb(),
	estimatedDuration: integer("estimated_duration"),
	assessmentLink: text("assessment_link"),
	difficultyLevel: difficultyLevel("difficulty_level"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const moduleDependency = pgTable("module_dependency", {
	dependencyId: serial("dependency_id").primaryKey().notNull(),
	moduleId: integer("module_id").notNull(),
	prerequisiteId: integer("prerequisite_id").array().notNull(),
	dependencyType: dependencyType("dependency_type"),
	isOptional: boolean("is_optional").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.moduleId],
			foreignColumns: [learningModule.moduleId],
			name: "module_dependency_module_id_fkey"
		}).onDelete("cascade"),
]);

export const users = pgTable("users", {
	userId: serial("user_id").primaryKey().notNull(),
	userEmail: varchar("user_email", { length: 255 }).notNull(),
	password: varchar({ length: 255 }),
	salt: varchar({ length: 255 }),
	avatarUrl: text("avatar_url"),
	avatarPublicUrl: text("avatar_public_url"),
	isVerified: boolean("is_verified").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	userName: varchar("user_name", { length: 255 }).notNull(),
	oauthProvider: varchar("oauth_provider", { length: 50 }),
	oauthId: varchar("oauth_id", { length: 255 }),
	profilePicture: text("profile_picture"),
}, (table) => [
	unique("users_user_email_key").on(table.userEmail),
]);

export const oauthAccounts = pgTable("oauth_accounts", {
	oauthId: serial("oauth_id").primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	provider: varchar({ length: 255 }).notNull(),
	provideraccountid: varchar({ length: 255 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.userId],
			name: "oauth_accounts_user_id_fkey"
		}).onDelete("cascade"),
	unique("oauth_accounts_provider_provideraccountid_key").on(table.provider, table.provideraccountid),
]);

export const userEmailVerification = pgTable("user_email_verification", {
	verificationId: serial("verification_id").primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	userEmail: varchar("user_email", { length: 255 }).notNull(),
	otpCode: varchar("otp_code", { length: 10 }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.userId],
			name: "user_email_verification_user_id_fkey"
		}).onDelete("cascade"),
]);

export const learningPath = pgTable("learning_path", {
	pathId: serial("path_id").primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	userQuery: text("user_query"),
	userGoal: text("user_goal"),
	progress: jsonb(),
	isCustomized: boolean("is_customized").default(false),
	difficultyLevel: difficultyLevel("difficulty_level"),
	tags: text().array(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	visibility: visibilityEnum().default('private').notNull(),
	threadId: text("thread_id"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.userId],
			name: "learning_path_user_id_fkey"
		}).onDelete("cascade"),
]);

export const moduleCitation = pgTable("module_citation", {
	moduleCitationId: serial("module_citation_id").primaryKey().notNull(),
	moduleId: integer("module_id").notNull(),
	citationId: integer("citation_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.moduleId],
			foreignColumns: [learningModule.moduleId],
			name: "module_citation_module_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.citationId],
			foreignColumns: [citation.citationId],
			name: "module_citation_citation_id_fkey"
		}).onDelete("cascade"),
	unique("module_citation_module_id_citation_id_key").on(table.moduleId, table.citationId),
]);

export const citation = pgTable("citation", {
	citationId: serial("citation_id").primaryKey().notNull(),
	citationText: text("citation_text").notNull(),
	citationUrl: text("citation_url"),
	sourceType: text("source_type"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("citation_citation_url_key").on(table.citationUrl),
]);

export const learningPathModule = pgTable("learning_path_module", {
	pathModuleId: serial("path_module_id").primaryKey().notNull(),
	pathId: integer("path_id").notNull(),
	moduleId: integer("module_id").notNull(),
	position: integer().notNull(),
	isOptional: boolean("is_optional").default(false),
	isLocked: boolean("is_locked").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.pathId],
			foreignColumns: [learningPath.pathId],
			name: "learning_path_module_path_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.moduleId],
			foreignColumns: [learningModule.moduleId],
			name: "learning_path_module_module_id_fkey"
		}).onDelete("cascade"),
	unique("learning_path_module_path_id_module_id_key").on(table.pathId, table.moduleId),
]);

export const userModuleProgress = pgTable("user_module_progress", {
	moduleProgressId: serial("module_progress_id").primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	moduleId: integer("module_id").notNull(),
	pathId: integer("path_id").notNull(),
	status: text().notNull(),
	completionPercent: numeric("completion_percent", { precision: 5, scale:  2 }).default('0.00'),
	lastAccessed: timestamp("last_accessed", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.userId],
			name: "user_module_progress_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.moduleId],
			foreignColumns: [learningModule.moduleId],
			name: "user_module_progress_module_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.pathId],
			foreignColumns: [learningPath.pathId],
			name: "user_module_progress_path_id_fkey"
		}).onDelete("cascade"),
	unique("user_module_progress_user_id_module_id_path_id_key").on(table.userId, table.moduleId, table.pathId),
]);

export const studyGroup = pgTable("study_group", {
	groupId: serial("group_id").primaryKey().notNull(),
	groupName: varchar("group_name", { length: 255 }).notNull(),
	createdBy: integer("created_by").notNull(),
	description: text(),
	visibility: visibilityEnum().default('public'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	pathId: integer("path_id").notNull(),
	settings: jsonb(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.userId],
			name: "study_group_created_by_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.pathId],
			foreignColumns: [learningPath.pathId],
			name: "study_group_path_id_fkey"
		}).onDelete("cascade"),
]);


export const notes = pgTable("study_note", {
	noteId: serial("note_id").primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	title: text("title").notNull(),
	content: jsonb("content").$type<unknown>(),
	visibilityScope: text("visibility_scope").default("private"), 
	relatedModuleId: integer("related_module_id"),
	isShared: boolean("is_shared").default(false),
	sharedWithGroupId: integer("shared_with_group_id"),
	noteType: text("note_type").default("text"),
	tags: jsonb("tags").$type<string[] | null>(),
	attachments: jsonb("attachments").$type<Record<string, unknown>[] | null>(),
	likeCount: integer("like_count").default(0),
	viewCount: integer("view_count").default(0),
	lastEditedBy: integer("last_edited_by"),
	forkedFromNoteId: integer("forked_from_note_id"),
	createdAt: timestamp("created_at", { mode: "string" }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: "string" }).defaultNow()
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.userId],
			name: "study_note_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.relatedModuleId],
			foreignColumns: [learningModule.moduleId],
			name: "study_note_related_module_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.sharedWithGroupId],
			foreignColumns: [studyGroup.groupId],
			name: "study_note_shared_with_group_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.lastEditedBy],
			foreignColumns: [users.userId],
			name: "study_note_last_edited_by_fkey"
		}),
	foreignKey({
			columns: [table.forkedFromNoteId],
			foreignColumns: [table.noteId],
			name: "study_note_forked_from_note_id_fkey"
		}),
]);

export const media = pgTable("note_media", {
  mediaId: serial("media_id").primaryKey().notNull(),
  noteId: integer("note_id").notNull(),
  objectKey: text("object_key").notNull(),
  bucketName: text("bucket_name").notNull(),
  url: text("url").notNull(),
	type: text("type").notNull(),
	originalName: text("original_name").notNull(),
	mimeType: text("mime_type").notNull(),
	size: integer("size").notNull(),
	metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow()
}, (table) => [
  foreignKey({
    columns: [table.noteId],
    foreignColumns: [notes.noteId],
    name: "note_media_note_id_fkey"
  }).onDelete("cascade")
]);

export const noteMediaAlignment = pgTable("note_media_alignment", {
  alignmentId: serial("alignment_id").primaryKey().notNull(),
  noteId: integer("note_id").notNull(),
  mediaId: integer("media_id").notNull(),
  blockPath: text("block_path").notNull(),    // e.g., JSON-pointer path like "/blocks/3/children/0"
  position: integer("position").notNull().default(0),  // ordering index
  createdAt: timestamp("created_at", { mode: "string" }).defaultNow()
}, (table) => [
  foreignKey({
    columns: [table.noteId],
    foreignColumns: [notes.noteId],
    name: "nma_note_id_fkey"
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.mediaId],
    foreignColumns: [media.mediaId],
    name: "nma_media_id_fkey"
  }).onDelete("cascade")
]);

export const passwordResetTokens = pgTable("password_reset_tokens", {
	tokenId: serial("token_id").primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	token: varchar({ length: 255 }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	isUsed: boolean("is_used").default(false),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.userId],
			name: "password_reset_tokens_user_id_fkey"
		}).onDelete("cascade"),
]);

export const friendRequest = pgTable("friend_request", {
	requestId: serial("request_id").primaryKey().notNull(),
	senderId: integer("sender_id").notNull(),
	receiverId: integer("receiver_id").notNull(),
	status: statusEnum().default('pending'),
	sentAt: timestamp("sent_at", { mode: 'string' }).defaultNow(),
	acceptedAt: timestamp("accepted_at", { mode: 'string' }),
	message: text(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	expiresAt: timestamp("expires_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [users.userId],
			name: "friend_request_sender_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.receiverId],
			foreignColumns: [users.userId],
			name: "friend_request_receiver_id_fkey"
		}).onDelete("cascade"),
]);

export const userFriend = pgTable("user_friend", {
	friendshipId: serial("friendship_id").primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	friendUserId: integer("friend_user_id").notNull(),
	connectedAt: timestamp("connected_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.userId],
			name: "user_friend_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.friendUserId],
			foreignColumns: [users.userId],
			name: "user_friend_friend_user_id_fkey"
		}).onDelete("cascade"),
	unique("user_friend_user_id_friend_user_id_key").on(table.userId, table.friendUserId),
]);

export const checkpointMigrations = pgTable("checkpoint_migrations", {
	v: integer().primaryKey().notNull(),
});

export const studyGroupMembership = pgTable("study_group_membership", {
	membershipId: serial("membership_id").primaryKey().notNull(),
	groupId: integer("group_id").notNull(),
	userId: integer("user_id").notNull(),
	role: roleEnum().default('member'),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow(),
	leftAt: timestamp("left_at", { mode: 'string' }),
	status: groupMemberStatus().default('pending'),
	lastActiveAt: timestamp("last_active_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [studyGroup.groupId],
			name: "study_group_membership_group_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.userId],
			name: "study_group_membership_user_id_fkey"
		}).onDelete("cascade"),
	unique("study_group_membership_group_id_user_id_key").on(table.groupId, table.userId),
]);

export const roadmapSession = pgTable("roadmap_session", {
	sessionId: serial("session_id").primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	threadId: text("thread_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	lastActivityAt: timestamp("last_activity_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.userId],
			name: "roadmap_session_user_id_fkey"
		}).onDelete("cascade"),
	unique("roadmap_session_thread_id_unique").on(table.threadId),
]);

export const userQuizAnswer = pgTable("user_quiz_answer", {
	answerId: serial("answer_id").primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	questionId: integer("question_id").notNull(),
	answer: text().notNull(),
	isCorrect: boolean("is_correct"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.userId],
			name: "user_quiz_answer_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [quizQuestion.questionId],
			name: "user_quiz_answer_question_id_fkey"
		}).onDelete("cascade"),
	unique("user_quiz_answer_user_question_unique").on(table.userId, table.questionId),
]);

export const quiz = pgTable("quiz", {
	quizId: serial("quiz_id").primaryKey().notNull(),
	moduleId: integer("module_id").notNull(),
	pathId: integer("path_id").notNull(),
	lessonIndex: integer("lesson_index"),
	title: text().notNull(),
	description: text(),
	assessmentType: varchar("assessment_type", { length: 50 }),
	metadata: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.moduleId],
			foreignColumns: [learningModule.moduleId],
			name: "quiz_module_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.pathId],
			foreignColumns: [learningPath.pathId],
			name: "quiz_path_id_fkey"
		}).onDelete("cascade"),
]);

export const quizQuestion = pgTable("quiz_question", {
	questionId: serial("question_id").primaryKey().notNull(),
	quizId: integer("quiz_id").notNull(),
	prompt: text().notNull(),
	questionType: varchar("question_type", { length: 50 }),
	choices: jsonb(),
	answer: text(),
	explanation: text(),
	metadata: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.quizId],
			foreignColumns: [quiz.quizId],
			name: "quiz_question_quiz_id_fkey"
		}).onDelete("cascade"),
]);

export const skillAssessment = pgTable("skill_assessment", {
	assessmentId: serial("assessment_id").primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	topic: varchar({ length: 255 }),
	difficultyLevel: difficultyLevel("difficulty_level"),
	estimatedDuration: integer("estimated_duration"),
	isActive: boolean("is_active").default(true),
	metadata: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const userSkillAssessment = pgTable("user_skill_assessment", {
	resultId: serial("result_id").primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	assessmentId: integer("assessment_id").notNull(),
	score: numeric({ precision: 5, scale: 2 }),
	maxScore: numeric("max_score", { precision: 5, scale: 2 }),
	percentage: numeric({ precision: 5, scale: 2 }),
	skillLevel: varchar("skill_level", { length: 50 }),
	completedAt: timestamp("completed_at", { mode: 'string' }),
	metadata: jsonb().default({}).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.userId],
			name: "user_skill_assessment_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.assessmentId],
			foreignColumns: [skillAssessment.assessmentId],
			name: "user_skill_assessment_assessment_id_fkey"
		}).onDelete("cascade"),
]);

export const activity = pgTable("activity", {
	activityId: serial("activity_id").primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	activityType: activityType("activity_type").notNull(),
	targetId: integer("target_id"),
	targetType: varchar("target_type", { length: 50 }),
	metadata: jsonb().default({}).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.userId],
			name: "activity_user_id_fkey"
		}).onDelete("cascade"),
]);

export const checkpointBlobs = pgTable("checkpoint_blobs", {
	threadId: text("thread_id").notNull(),
	checkpointNs: text("checkpoint_ns").default('').notNull(),
	channel: text().notNull(),
	version: text().notNull(),
	type: text().notNull(),
	blob: bytea(),
}, (table) => [
	primaryKey({ columns: [table.threadId, table.checkpointNs, table.channel, table.version], name: "checkpoint_blobs_pkey"}),
]);

export const checkpoints = pgTable("checkpoints", {
	threadId: text("thread_id").notNull(),
	checkpointNs: text("checkpoint_ns").default('').notNull(),
	checkpointId: text("checkpoint_id").notNull(),
	parentCheckpointId: text("parent_checkpoint_id"),
	type: text(),
	checkpoint: jsonb().notNull(),
	metadata: jsonb().default({}).notNull(),
}, (table) => [
	primaryKey({ columns: [table.threadId, table.checkpointNs, table.checkpointId], name: "checkpoints_pkey"}),
]);

export const checkpointWrites = pgTable("checkpoint_writes", {
	threadId: text("thread_id").notNull(),
	checkpointNs: text("checkpoint_ns").default('').notNull(),
	checkpointId: text("checkpoint_id").notNull(),
	taskId: text("task_id").notNull(),
	idx: integer().notNull(),
	channel: text().notNull(),
	type: text(),
	blob: bytea().notNull(),
}, (table) => [
	primaryKey({ columns: [table.threadId, table.checkpointNs, table.checkpointId, table.taskId, table.idx], name: "checkpoint_writes_pkey"}),
]);
