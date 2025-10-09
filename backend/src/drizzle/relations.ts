import { relations } from "drizzle-orm/relations";
import { learningModule, moduleDependency, users, oauthAccounts, userEmailVerification, learningPath, moduleCitation, citation, learningPathModule, userModuleProgress, studyGroup, studyGroupMembership, metaSpace, metaInteractionGroup, studyNote, noteComment, metaSpaceUserPresence, metaInteractionGroupMembers, metaInteractionLog, passwordResetTokens, friendRequest, userFriend } from "./schema";                                                                                                                                                                                                                                                

export const moduleDependencyRelations = relations(moduleDependency, ({one}) => ({
	learningModule: one(learningModule, {
		fields: [moduleDependency.moduleId],
		references: [learningModule.moduleId]
	}),
}));

export const learningModuleRelations = relations(learningModule, ({many}) => ({
	moduleDependencies: many(moduleDependency),
	moduleCitations: many(moduleCitation),
	learningPathModules: many(learningPathModule),
	userModuleProgresses: many(userModuleProgress),
	studyNotes: many(studyNote),
}));

export const oauthAccountsRelations = relations(oauthAccounts, ({one}) => ({
	user: one(users, {
		fields: [oauthAccounts.userId],
		references: [users.userId]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	oauthAccounts: many(oauthAccounts),
	userEmailVerifications: many(userEmailVerification),
	learningPaths: many(learningPath),
	userModuleProgresses: many(userModuleProgress),
	studyGroups: many(studyGroup),
	studyGroupMemberships: many(studyGroupMembership),
	studyNotes_userId: many(studyNote, {
		relationName: "studyNote_userId_users_userId"
	}),
	studyNotes_lastEditedBy: many(studyNote, {
		relationName: "studyNote_lastEditedBy_users_userId"
	}),
	noteComments: many(noteComment),
	metaSpaces: many(metaSpace),
	metaSpaceUserPresences: many(metaSpaceUserPresence),
	metaInteractionGroupMembers: many(metaInteractionGroupMembers),
	metaInteractionLogs: many(metaInteractionLog),
	passwordResetTokens: many(passwordResetTokens),
	friendRequests_senderId: many(friendRequest, {
		relationName: "friendRequest_senderId_users_userId"
	}),
	friendRequests_receiverId: many(friendRequest, {
		relationName: "friendRequest_receiverId_users_userId"
	}),
	userFriends_userId: many(userFriend, {
		relationName: "userFriend_userId_users_userId"
	}),
	userFriends_friendUserId: many(userFriend, {
		relationName: "userFriend_friendUserId_users_userId"
	}),
}));

export const userEmailVerificationRelations = relations(userEmailVerification, ({one}) => ({
	user: one(users, {
		fields: [userEmailVerification.userId],
		references: [users.userId]
	}),
}));

export const learningPathRelations = relations(learningPath, ({one, many}) => ({
	user: one(users, {
		fields: [learningPath.userId],
		references: [users.userId]
	}),
	learningPathModules: many(learningPathModule),
	userModuleProgresses: many(userModuleProgress),
}));

export const moduleCitationRelations = relations(moduleCitation, ({one}) => ({
	learningModule: one(learningModule, {
		fields: [moduleCitation.moduleId],
		references: [learningModule.moduleId]
	}),
	citation: one(citation, {
		fields: [moduleCitation.citationId],
		references: [citation.citationId]
	}),
}));

export const citationRelations = relations(citation, ({many}) => ({
	moduleCitations: many(moduleCitation),
}));

export const learningPathModuleRelations = relations(learningPathModule, ({one}) => ({
	learningPath: one(learningPath, {
		fields: [learningPathModule.pathId],
		references: [learningPath.pathId]
	}),
	learningModule: one(learningModule, {
		fields: [learningPathModule.moduleId],
		references: [learningModule.moduleId]
	}),
}));

export const userModuleProgressRelations = relations(userModuleProgress, ({one}) => ({
	user: one(users, {
		fields: [userModuleProgress.userId],
		references: [users.userId]
	}),
	learningModule: one(learningModule, {
		fields: [userModuleProgress.moduleId],
		references: [learningModule.moduleId]
	}),
	learningPath: one(learningPath, {
		fields: [userModuleProgress.pathId],
		references: [learningPath.pathId]
	}),
}));

export const studyGroupRelations = relations(studyGroup, ({one, many}) => ({
	user: one(users, {
		fields: [studyGroup.createdBy],
		references: [users.userId]
	}),
	learningPath: one(learningPath, {
		fields: [studyGroup.pathId],
		references: [learningPath.pathId]
	}),
	studyGroupMemberships: many(studyGroupMembership),
	studyNotes: many(studyNote),
}));

export const studyGroupMembershipRelations = relations(studyGroupMembership, ({one}) => ({
	studyGroup: one(studyGroup, {
		fields: [studyGroupMembership.groupId],
		references: [studyGroup.groupId]
	}),
	user: one(users, {
		fields: [studyGroupMembership.userId],
		references: [users.userId]
	}),
}));

export const metaInteractionGroupRelations = relations(metaInteractionGroup, ({one, many}) => ({
	metaSpace: one(metaSpace, {
		fields: [metaInteractionGroup.spaceId],
		references: [metaSpace.spaceId]
	}),
	metaInteractionGroupMembers: many(metaInteractionGroupMembers),
	metaInteractionLogs: many(metaInteractionLog),
}));

export const metaSpaceRelations = relations(metaSpace, ({one, many}) => ({
	metaInteractionGroups: many(metaInteractionGroup),
	user: one(users, {
		fields: [metaSpace.createdBy],
		references: [users.userId]
	}),
	metaSpaceUserPresences: many(metaSpaceUserPresence),
}));

export const studyNoteRelations = relations(studyNote, ({one, many}) => ({
	user_userId: one(users, {
		fields: [studyNote.userId],
		references: [users.userId],
		relationName: "studyNote_userId_users_userId"
	}),
	learningModule: one(learningModule, {
		fields: [studyNote.relatedModuleId],
		references: [learningModule.moduleId]
	}),
	studyGroup: one(studyGroup, {
		fields: [studyNote.sharedWithGroupId],
		references: [studyGroup.groupId]
	}),
	user_lastEditedBy: one(users, {
		fields: [studyNote.lastEditedBy],
		references: [users.userId],
		relationName: "studyNote_lastEditedBy_users_userId"
	}),
	studyNote: one(studyNote, {
		fields: [studyNote.forkedFromNoteId],
		references: [studyNote.noteId],
		relationName: "studyNote_forkedFromNoteId_studyNote_noteId"
	}),
	studyNotes: many(studyNote, {
		relationName: "studyNote_forkedFromNoteId_studyNote_noteId"
	}),
	noteComments: many(noteComment),
}));

export const noteCommentRelations = relations(noteComment, ({one}) => ({
	studyNote: one(studyNote, {
		fields: [noteComment.noteId],
		references: [studyNote.noteId]
	}),
	user: one(users, {
		fields: [noteComment.userId],
		references: [users.userId]
	}),
}));

export const metaSpaceUserPresenceRelations = relations(metaSpaceUserPresence, ({one}) => ({
	metaSpace: one(metaSpace, {
		fields: [metaSpaceUserPresence.spaceId],
		references: [metaSpace.spaceId]
	}),
	user: one(users, {
		fields: [metaSpaceUserPresence.userId],
		references: [users.userId]
	}),
}));

export const metaInteractionGroupMembersRelations = relations(metaInteractionGroupMembers, ({one}) => ({
	metaInteractionGroup: one(metaInteractionGroup, {
		fields: [metaInteractionGroupMembers.groupId],
		references: [metaInteractionGroup.groupId]
	}),
	user: one(users, {
		fields: [metaInteractionGroupMembers.userId],
		references: [users.userId]
	}),
}));

export const metaInteractionLogRelations = relations(metaInteractionLog, ({one}) => ({
	metaInteractionGroup: one(metaInteractionGroup, {
		fields: [metaInteractionLog.groupId],
		references: [metaInteractionGroup.groupId]
	}),
	user: one(users, {
		fields: [metaInteractionLog.userId],
		references: [users.userId]
	}),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({one}) => ({
	user: one(users, {
		fields: [passwordResetTokens.userId],
		references: [users.userId]
	}),
}));

export const friendRequestRelations = relations(friendRequest, ({one}) => ({
	user_senderId: one(users, {
		fields: [friendRequest.senderId],
		references: [users.userId],
		relationName: "friendRequest_senderId_users_userId"
	}),
	user_receiverId: one(users, {
		fields: [friendRequest.receiverId],
		references: [users.userId],
		relationName: "friendRequest_receiverId_users_userId"
	}),
}));

export const userFriendRelations = relations(userFriend, ({one}) => ({
	user_userId: one(users, {
		fields: [userFriend.userId],
		references: [users.userId],
		relationName: "userFriend_userId_users_userId"
	}),
	user_friendUserId: one(users, {
		fields: [userFriend.friendUserId],
		references: [users.userId],
		relationName: "userFriend_friendUserId_users_userId"
	}),
}));