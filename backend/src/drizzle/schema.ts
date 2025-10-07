import { pgTable, serial, varchar, text, jsonb, integer, timestamp, foreignKey, boolean, unique, numeric, primaryKey, pgEnum, customType } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const actionEnum = pgEnum("action_enum", ['joined', 'left', 'started_whiteboard', 'ended_whiteboard', 'sent_message'])
export const dependencyType = pgEnum("dependency_type", ['prerequisite', 'corequisite', 'supplementary'])
export const difficultyLevel = pgEnum("difficulty_level", ['easy', 'medium', 'hard'])
export const interactionEnum = pgEnum("interaction_enum", ['audio_video', 'whiteboard', 'chat'])
export const noteType = pgEnum("note_type", ['text', 'document', 'link', 'multimedia'])
export const presenceEnum = pgEnum("presence_enum", ['online', 'offline', 'away', 'busy'])
export const roleEnum = pgEnum("role_enum", ['owner', 'admin', 'moderator', 'member'])
export const groupMemberStatusEnum = pgEnum("group_member_status", ['pending', 'active', 'removed'])
export const statusEnum = pgEnum("status_enum", ['pending', 'accepted', 'rejected', 'blocked'])
export const visibilityEnum = pgEnum("visibility_enum", ['public', 'private', 'restricted'])
export const visibilityScope = pgEnum("visibility_scope", ['private', 'group', 'public'])


const bytea = customType<{ data: Buffer | null; driverData: Buffer | null }>({
	dataType() {
		return "bytea";
	},
});


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
	visibility: visibilityEnum("visibility").default('private').notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
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
	pathId: integer("path_id").notNull(),
	description: text(),
	visibility: visibilityEnum().default('public'),
	settings: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
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

export const studyGroupMembership = pgTable("study_group_membership", {
	membershipId: serial("membership_id").primaryKey().notNull(),
	groupId: integer("group_id").notNull(),
	userId: integer("user_id").notNull(),
	role: roleEnum().default('member'),
	status: groupMemberStatusEnum("status").default('pending'),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow(),
	lastActiveAt: timestamp("last_active_at", { mode: 'string' }),
	leftAt: timestamp("left_at", { mode: 'string' }),
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

export const metaInteractionGroup = pgTable("meta_interaction_group", {
	groupId: serial("group_id").primaryKey().notNull(),
	spaceId: integer("space_id").notNull(),
	interactionType: interactionEnum("interaction_type").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	endedAt: timestamp("ended_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.spaceId],
			foreignColumns: [metaSpace.spaceId],
			name: "meta_interaction_group_space_id_fkey"
		}).onDelete("cascade"),
]);

export const studyNote = pgTable("study_note", {
	noteId: serial("note_id").primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	title: text().notNull(),
	content: text(),
	visibilityScope: visibilityScope("visibility_scope").default('private'),
	relatedModuleId: integer("related_module_id"),
	isShared: boolean("is_shared").default(false),
	sharedWithGroupId: integer("shared_with_group_id"),
	noteType: noteType("note_type").default('text'),
	tags: jsonb(),
	attachments: jsonb(),
	likeCount: integer("like_count").default(0),
	viewCount: integer("view_count").default(0),
	lastEditedBy: integer("last_edited_by"),
	forkedFromNoteId: integer("forked_from_note_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
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

export const noteComment = pgTable("note_comment", {
	commentId: serial("comment_id").primaryKey().notNull(),
	noteId: integer("note_id").notNull(),
	userId: integer("user_id").notNull(),
	commentText: text("comment_text").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.noteId],
			foreignColumns: [studyNote.noteId],
			name: "note_comment_note_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.userId],
			name: "note_comment_user_id_fkey"
		}).onDelete("cascade"),
]);

export const metaSpace = pgTable("meta_space", {
	spaceId: serial("space_id").primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	createdBy: integer("created_by").notNull(),
	layoutConfig: jsonb("layout_config"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.userId],
			name: "meta_space_created_by_fkey"
		}).onDelete("cascade"),
]);

export const metaSpaceUserPresence = pgTable("meta_space_user_presence", {
	presenceId: serial("presence_id").primaryKey().notNull(),
	spaceId: integer("space_id").notNull(),
	userId: integer("user_id").notNull(),
	xCoord: integer("x_coord").default(0),
	yCoord: integer("y_coord").default(0),
	orientation: varchar({ length: 50 }),
	status: presenceEnum().default('online'),
	lastUpdated: timestamp("last_updated", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.spaceId],
			foreignColumns: [metaSpace.spaceId],
			name: "meta_space_user_presence_space_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.userId],
			name: "meta_space_user_presence_user_id_fkey"
		}).onDelete("cascade"),
	unique("meta_space_user_presence_space_id_user_id_key").on(table.spaceId, table.userId),
]);

export const metaInteractionGroupMembers = pgTable("meta_interaction_group_members", {
	groupMemberId: serial("group_member_id").primaryKey().notNull(),
	groupId: integer("group_id").notNull(),
	userId: integer("user_id").notNull(),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow(),
	leftAt: timestamp("left_at", { mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [metaInteractionGroup.groupId],
			name: "meta_interaction_group_members_group_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.userId],
			name: "meta_interaction_group_members_user_id_fkey"
		}).onDelete("cascade"),
	unique("meta_interaction_group_members_group_id_user_id_key").on(table.groupId, table.userId),
]);

export const metaInteractionLog = pgTable("meta_interaction_log", {
	interactionId: serial("interaction_id").primaryKey().notNull(),
	groupId: integer("group_id").notNull(),
	userId: integer("user_id").notNull(),
	actionType: actionEnum("action_type").notNull(),
	metadata: jsonb(),
	timestamp: timestamp({ mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.groupId],
			foreignColumns: [metaInteractionGroup.groupId],
			name: "meta_interaction_log_group_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.userId],
			name: "meta_interaction_log_user_id_fkey"
		}).onDelete("cascade"),
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

export const checkpointMigrations = pgTable("checkpoint_migrations", {
	v: integer().primaryKey().notNull(),
});

export const checkpointBlobs = pgTable("checkpoint_blobs", {
	threadId: text("thread_id").notNull(),
	checkpointNs: text("checkpoint_ns").default('').notNull(),
	channel: text().notNull(),
	version: text().notNull(),
	type: text().notNull(),
	blob: bytea("blob"),
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
	blob: bytea("blob").notNull(),
}, (table) => [
	primaryKey({ columns: [table.threadId, table.checkpointNs, table.checkpointId, table.taskId, table.idx], name: "checkpoint_writes_pkey"}),
]);
