import { z } from "zod";

export const groupVisibilityEnum = z.enum(["public", "private", "restricted"]);
export const groupRoleEnum = z.enum(["owner", "admin", "moderator", "member"]);
export const groupMemberStatusEnum = z.enum(["pending", "active", "removed"]);

const paginationQuerySchema = z.object({
	limit: z.coerce.number().int().positive().max(100).optional(),
	offset: z.coerce.number().int().nonnegative().optional(),
});

export const pathIdParamsSchema = z.object({
	pathId: z.coerce.number().int().positive(),
});

export const groupIdParamsSchema = z.object({
	groupId: z.coerce.number().int().positive(),
});

export const userIdParamsSchema = z.object({
	userId: z.coerce.number().int().positive(),
});

const groupSettingsSchema = z
	.record(z.string(), z.unknown())
	.optional();

export const createStudyGroupBodySchema = z.object({
	groupName: z.string().min(3).max(255),
	description: z.string().max(1024).optional().nullable(),
	visibility: groupVisibilityEnum.optional(),
	settings: groupSettingsSchema,
	initialMembers: z.array(z.number().int().positive()).max(50).optional(),
});

export const createStudyGroupSchema = z.object({
	params: pathIdParamsSchema,
	body: createStudyGroupBodySchema,
});

export const listStudyGroupsQuerySchema = paginationQuerySchema.merge(
	z.object({
		visibility: groupVisibilityEnum.optional(),
	}),
);

export const listStudyGroupsSchema = z.object({
	params: pathIdParamsSchema,
	query: listStudyGroupsQuerySchema,
});

export const getStudyGroupSchema = z.object({
	params: groupIdParamsSchema,
});

export const addMemberBodySchema = z.object({
	userId: z.number().int().positive(),
	role: groupRoleEnum.optional(),
	invite: z.boolean().default(true),
});

export const addMemberSchema = z.object({
	params: groupIdParamsSchema,
	body: addMemberBodySchema,
});

export const respondToInvitationBodySchema = z.object({
	decision: z.enum(["accept", "decline"]),
});

export const respondToInvitationSchema = z.object({
	params: groupIdParamsSchema,
	body: respondToInvitationBodySchema,
});

export const updateMemberBodySchema = z
	.object({
		role: groupRoleEnum.optional(),
		status: groupMemberStatusEnum.optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field must be provided",
	});

export const updateMemberSchema = z.object({
	params: groupIdParamsSchema.merge(userIdParamsSchema),
	body: updateMemberBodySchema,
});

export const removeMemberSchema = z.object({
	params: groupIdParamsSchema.merge(userIdParamsSchema),
});

export const listMembersSchema = z.object({
	params: groupIdParamsSchema,
});

export type StudyGroupVisibility = z.infer<typeof groupVisibilityEnum>;
export type StudyGroupRole = z.infer<typeof groupRoleEnum>;
export type StudyGroupMemberStatus = z.infer<typeof groupMemberStatusEnum>;
export type PathIdParams = z.infer<typeof pathIdParamsSchema>;
export type GroupIdParams = z.infer<typeof groupIdParamsSchema>;
export type UserIdParams = z.infer<typeof userIdParamsSchema>;
export type CreateStudyGroupBody = z.infer<typeof createStudyGroupBodySchema>;
export type ListStudyGroupsQuery = z.infer<typeof listStudyGroupsQuerySchema>;
export type AddMemberBody = z.infer<typeof addMemberBodySchema>;
export type UpdateMemberBody = z.infer<typeof updateMemberBodySchema>;
export type RespondToInvitationBody = z.infer<typeof respondToInvitationBodySchema>;

export type StudyGroupSummary = {
	groupId: number;
	groupName: string;
	visibility: StudyGroupVisibility;
	memberCount: number;
	createdAt: string | null;
};

export type StudyGroupDetailMember = {
	userId: number;
	userName: string | null;
	avatarUrl: string | null;
	role: StudyGroupRole;
	status: StudyGroupMemberStatus;
	joinedAt: string | null;
	lastActiveAt: string | null;
};

export type StudyGroupDetail = {
	groupId: number;
	groupName: string;
	pathId: number;
	description: string | null;
	visibility: StudyGroupVisibility;
	settings: Record<string, unknown> | null | undefined;
	createdAt: string | null;
	createdBy: {
		userId: number;
		userName: string | null;
		avatarUrl: string | null;
	};
	members: StudyGroupDetailMember[];
};

export type PaginationMeta = {
	total: number;
	limit: number;
	offset: number;
};
