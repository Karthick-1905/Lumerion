import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { SQL, and, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "../drizzle";
import {
	learningPath,
	studyGroup,
	studyGroupMembership,
	users,
} from "../drizzle/schema";
import type {AddMemberBody,CreateStudyGroupBody,ListStudyGroupsQuery,RespondToInvitationBody,StudyGroupDetail,StudyGroupDetailMember,StudyGroupMemberStatus,
	StudyGroupRole,StudyGroupSummary,StudyGroupVisibility,UpdateMemberBody,} from "../schema/studyGroupSchema";
import {
	groupMemberStatusEnum as groupMemberStatusSchema,
	groupRoleEnum as groupRoleSchema,
} from "../schema/studyGroupSchema";
import {
	sendStudyGroupAdminNotification,
	sendStudyGroupInviteEmail,
} from "../mailer/studygroupMailer";

type MembershipRow = typeof studyGroupMembership.$inferSelect;

const ACTIVE_STATUSES: StudyGroupMemberStatus[] = ["active"];

function normalizeDescription(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function ensureAuthenticated(req: Request, res: Response): number | null {
	const userId = req.user_id;
	if (!userId) {
		res.status(StatusCodes.UNAUTHORIZED).json({
			success: false,
			message: "Authentication required.",
		});
		return null;
	}
	return userId;
}

function isPrivileged(role: StudyGroupRole | null | undefined): boolean {
	return role === "owner" || role === "admin";
}

type LearningPathOwnerRecord = {
	pathId: number;
	userId: number;
	userGoal: string | null;
	userQuery: string | null;
};

async function fetchLearningPathOwnedBy(pathId: number,userId: number,): Promise<LearningPathOwnerRecord | null> {
	const record = await db.query.learningPath.findFirst({
		columns: {
			pathId: true,
			userId: true,
			userGoal: true,
			userQuery: true,
		},
		where: eq(learningPath.pathId, pathId),
	});

	return record && record.userId === userId ? record : null;
}

type StudyGroupRecord = {
	groupId: number;
	groupName: string;
	createdBy: number;
	pathId: number;
	description: string | null;
	visibility: "public" | "private" | "restricted" | null;
	settings: unknown;
	createdAt: string | null;
	updatedAt: string | null;
};

async function fetchGroupWithAccessCheck(groupId: number): Promise<StudyGroupRecord | null> {
	const record = await db.query.studyGroup.findFirst({
		columns: {
			groupId: true,
			groupName: true,
			createdBy: true,
			pathId: true,
			description: true,
			visibility: true,
			settings: true,
			createdAt: true,
			updatedAt: true,
		},
		where: eq(studyGroup.groupId, groupId),
	});

	return record ?? null;
}

async function fetchMembership(groupId: number, userId: number) {
	return db.query.studyGroupMembership.findFirst({
		where: and(
			eq(studyGroupMembership.groupId, groupId),
			eq(studyGroupMembership.userId, userId),
		),
	});
}

async function countActiveOwners(groupId: number, tx = db) {
	const [{ total }] = await tx
		.select({ total: sql<number>`count(*)::int` })
		.from(studyGroupMembership)
		.where(
			and(
				eq(studyGroupMembership.groupId, groupId),
				eq(studyGroupMembership.role, "owner"),
				eq(studyGroupMembership.status, "active"),
			),
		);

	return total ?? 0;
}

export const createStudyGroup = async (req: Request, res: Response) => {
	const userId = ensureAuthenticated(req, res);
	if (!userId) {
		return;
	}

	const pathId = Number(req.params.pathId);
	if (!Number.isInteger(pathId) || pathId <= 0) {
		return res.status(StatusCodes.BAD_REQUEST).json({
			success: false,
			message: "Invalid learning path identifier.",
		});
	}

	const body = req.body as CreateStudyGroupBody;
	const pathRecord = await fetchLearningPathOwnedBy(pathId, userId);

	if (!pathRecord) {
		return res.status(StatusCodes.FORBIDDEN).json({
			success: false,
			message: "You can only create groups for learning paths you own.",
		});
	}

	const candidateMemberIds = Array.from(
		new Set((body.initialMembers ?? []).filter((id) => Number.isInteger(id) && id > 0 && id !== userId)),
	);

	const candidateMembers = candidateMemberIds.length
		? await db
			  .select({
				  userId: users.userId,
				  userEmail: users.userEmail,
				  userName: users.userName,
			  })
			  .from(users)
			  .where(inArray(users.userId, candidateMemberIds))
		: [];

	const nowIso = new Date().toISOString();

	const { groupRecord, initialInvites } = await db.transaction(async (tx) => {
		const [createdGroup] = await tx
			.insert(studyGroup)
			.values({
				groupName: body.groupName,
				createdBy: userId,
				pathId,
				description: normalizeDescription(body.description),
				visibility: body.visibility ?? "public",
				settings: body.settings ?? null,
				createdAt: nowIso,
				updatedAt: nowIso,
			})
			.returning({
				groupId: studyGroup.groupId,
				groupName: studyGroup.groupName,
				visibility: studyGroup.visibility,
				description: studyGroup.description,
				settings: studyGroup.settings,
				createdAt: studyGroup.createdAt,
				pathId: studyGroup.pathId,
			});

		await tx.insert(studyGroupMembership).values({
			groupId: createdGroup.groupId,
			userId,
			role: "owner",
			status: "active",
			joinedAt: nowIso,
			lastActiveAt: nowIso,
		});

		const invites = candidateMembers.map((member) => ({
			groupId: createdGroup.groupId,
			userId: member.userId,
			role: "member" as StudyGroupRole,
			status: "pending" as StudyGroupMemberStatus,
			joinedAt: nowIso,
			lastActiveAt: null,
		}));

		if (invites.length > 0) {
			await tx
				.insert(studyGroupMembership)
				.values(invites)
				.onConflictDoNothing({
					target: [studyGroupMembership.groupId, studyGroupMembership.userId],
				});
		}

		return {
			groupRecord: createdGroup,
			initialInvites: candidateMembers,
		};
	});

	const [{ memberCount }] = await db
		.select({ memberCount: sql<number>`count(*)::int` })
		.from(studyGroupMembership)
		.where(eq(studyGroupMembership.groupId, groupRecord.groupId));

	if (initialInvites.length > 0) {
		const inviter = await db.query.users.findFirst({
			columns: { userName: true },
			where: eq(users.userId, userId),
		});

		const inviterName = inviter?.userName ?? "A fellow learner";
		const pathTitle = pathRecord.userGoal ?? pathRecord.userQuery ?? null;

		await Promise.all(
			initialInvites
				.filter((member) => member.userEmail)
				.map((member) =>
					sendStudyGroupInviteEmail({
						toEmail: member.userEmail!,
						toName: member.userName ?? "there",
						inviterName,
						groupName: groupRecord.groupName,
						pathTitle,
					}),
				),
		);
	}

	return res.status(StatusCodes.CREATED).json({
		success: true,
		group: {
			groupId: groupRecord.groupId,
			groupName: groupRecord.groupName,
			pathId,
			description: groupRecord.description ?? null,
			visibility: (groupRecord.visibility ?? "public") as StudyGroupVisibility,
			settings: (groupRecord.settings ?? null) as Record<string, unknown> | null,
			createdAt: groupRecord.createdAt ?? nowIso,
			memberCount: memberCount ?? 1,
		} satisfies StudyGroupSummary & { pathId: number; description: string | null; settings: Record<string, unknown> | null },
	});
};

function buildGroupVisibilityFilter(pathId: number, visibility?: StudyGroupVisibility): SQL<unknown> {
	const baseFilter = eq(studyGroup.pathId, pathId) as SQL<unknown>;
	if (visibility === undefined) {
		return baseFilter;
	}
	const visibilityFilter = eq(studyGroup.visibility, visibility);
	if (!visibilityFilter) {
		return baseFilter;
	}
	const combined = and(baseFilter, visibilityFilter as SQL<unknown>);
	return (combined ?? baseFilter) as SQL<unknown>;
}

async function ensurePathAccess(userId: number, pathId: number) {
	const pathRecord = await db.query.learningPath.findFirst({
		columns: { pathId: true, userId: true },
		where: eq(learningPath.pathId, pathId),
	});

	if (pathRecord?.userId === userId) {
		return true;
	}

	const membershipForPath = await db
		.select({ exists: sql<number>`1` })
		.from(studyGroup)
		.innerJoin(
			studyGroupMembership,
			eq(studyGroupMembership.groupId, studyGroup.groupId),
		)
		.where(
			and(
				eq(studyGroup.pathId, pathId),
				eq(studyGroupMembership.userId, userId),
				inArray(studyGroupMembership.status, ACTIVE_STATUSES),
			),
		)
		.limit(1);

	return membershipForPath.length > 0;
}

export const listStudyGroups = async (req: Request, res: Response) => {
	const userId = ensureAuthenticated(req, res);
	if (!userId) {
		return;
	}

	const pathId = Number(req.params.pathId);
	if (!Number.isInteger(pathId) || pathId <= 0) {
		return res.status(StatusCodes.BAD_REQUEST).json({
			success: false,
			message: "Invalid learning path identifier.",
		});
	}

	const query = req.query as unknown as ListStudyGroupsQuery;
	const hasAccess = await ensurePathAccess(userId, pathId);

	if (!hasAccess) {
		return res.status(StatusCodes.FORBIDDEN).json({
			success: false,
			message: "You don't have access to this learning path's groups.",
		});
	}

	const limit = query.limit ?? 20;
	const offset = query.offset ?? 0;

	const whereClause = buildGroupVisibilityFilter(pathId, query.visibility);

	const groups = await db
		.select({
			groupId: studyGroup.groupId,
			groupName: studyGroup.groupName,
			visibility: studyGroup.visibility,
			createdAt: studyGroup.createdAt,
			memberCount: sql<number>`count(${studyGroupMembership.membershipId})::int`,
		})
		.from(studyGroup)
		.leftJoin(
			studyGroupMembership,
			eq(studyGroupMembership.groupId, studyGroup.groupId),
		)
		.where(whereClause)
		.groupBy(studyGroup.groupId)
		.orderBy(desc(studyGroup.createdAt))
		.limit(limit)
		.offset(offset);

	const [{ total }] = await db
		.select({ total: sql<number>`count(*)::int` })
		.from(studyGroup)
		.where(whereClause);

	const formatted: StudyGroupSummary[] = groups.map((group) => ({
		groupId: group.groupId,
		groupName: group.groupName,
		visibility: (group.visibility ?? "public") as StudyGroupVisibility,
		memberCount: group.memberCount ?? 0,
		createdAt: group.createdAt ?? null,
	}));

	return res.status(StatusCodes.OK).json({
		success: true,
		data: formatted,
		pagination: {
			total: total ?? 0,
			limit,
			offset,
		},
	});
};

async function assertGroupAccess(userId: number, groupId: number) {
	const [groupRecord, membershipRecord] = await Promise.all([
		fetchGroupWithAccessCheck(groupId),
		fetchMembership(groupId, userId),
	]);

	if (!groupRecord) {
		return { groupRecord: null, membership: null, authorized: false };
	}

	if (groupRecord.createdBy === userId) {
		return { groupRecord, membership: membershipRecord, authorized: true };
	}

	if (membershipRecord && ACTIVE_STATUSES.includes(membershipRecord.status as StudyGroupMemberStatus)) {
		return { groupRecord, membership: membershipRecord, authorized: true };
	}

	const pathRecord = await db.query.learningPath.findFirst({
		columns: { userId: true },
		where: eq(learningPath.pathId, groupRecord.pathId),
	});

	if (pathRecord?.userId === userId) {
		return { groupRecord, membership: membershipRecord, authorized: true };
	}

	return { groupRecord, membership: membershipRecord, authorized: false };
}

export const getStudyGroup = async (req: Request, res: Response) => {
	const userId = ensureAuthenticated(req, res);
	if (!userId) {
		return;
	}

	const groupId = Number(req.params.groupId);
	if (!Number.isInteger(groupId) || groupId <= 0) {
		return res.status(StatusCodes.BAD_REQUEST).json({
			success: false,
			message: "Invalid study group identifier.",
		});
	}

	const { groupRecord, authorized } = await assertGroupAccess(userId, groupId);

	if (!groupRecord) {
		return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Study group not found." });
	}

	if (!authorized) {
		return res.status(StatusCodes.FORBIDDEN).json({ success: false, message: "You don't have access to this study group." });
	}

	const members = await db
		.select({
			userId: users.userId,
			userName: users.userName,
			avatarUrl: users.avatarUrl,
			role: studyGroupMembership.role,
			status: studyGroupMembership.status,
			joinedAt: studyGroupMembership.joinedAt,
			lastActiveAt: studyGroupMembership.lastActiveAt,
		})
		.from(studyGroupMembership)
		.innerJoin(users, eq(users.userId, studyGroupMembership.userId))
		.where(eq(studyGroupMembership.groupId, groupId))
		.orderBy(sql`case ${studyGroupMembership.role}
			when 'owner' then 0
			when 'admin' then 1
			when 'moderator' then 2
			else 3 end`, desc(studyGroupMembership.joinedAt));

	const creator = await db.query.users.findFirst({
		columns: {
			userId: true,
			userName: true,
			avatarUrl: true,
		},
		where: eq(users.userId, groupRecord.createdBy),
	});

	const formattedMembers: StudyGroupDetailMember[] = members.map((member) => ({
		userId: member.userId,
		userName: member.userName ?? null,
		avatarUrl: member.avatarUrl ?? null,
		role: member.role as StudyGroupRole,
		status: member.status as StudyGroupMemberStatus,
		joinedAt: member.joinedAt ?? null,
		lastActiveAt: member.lastActiveAt ?? null,
	}));

	const detail: StudyGroupDetail = {
		groupId: groupRecord.groupId,
		groupName: groupRecord.groupName,
		pathId: groupRecord.pathId,
		description: groupRecord.description ?? null,
		visibility: (groupRecord.visibility ?? "public") as StudyGroupVisibility,
		settings: (groupRecord.settings ?? null) as Record<string, unknown> | null | undefined,
		createdAt: groupRecord.createdAt ?? null,
		createdBy: {
			userId: creator?.userId ?? groupRecord.createdBy,
			userName: creator?.userName ?? null,
			avatarUrl: creator?.avatarUrl ?? null,
		},
		members: formattedMembers,
	};

	return res.status(StatusCodes.OK).json({ success: true, group: detail });
};

async function ensureCanManageMembers(
 actor: MembershipRow | null | undefined,
 groupRecord: StudyGroupRecord | null,
 actorId: number,
) {
	if (!groupRecord) {
		return { allowed: false, reason: "Study group not found." };
	}

	if (groupRecord.createdBy === actorId) {
		return { allowed: true };
	}

	if (!actor) {
		return { allowed: false, reason: "Only group members can manage invitations." };
	}

	if (!ACTIVE_STATUSES.includes(actor.status as StudyGroupMemberStatus)) {
		return { allowed: false, reason: "Only active members can manage invitations." };
	}

	if (!isPrivileged(actor.role as StudyGroupRole)) {
		return { allowed: false, reason: "Only owners or admins can manage members." };
	}

	return { allowed: true };
}

export const addStudyGroupMember = async (req: Request, res: Response) => {
	const actorId = ensureAuthenticated(req, res);
	if (!actorId) {
		return;
	}

	const groupId = Number(req.params.groupId);
	if (!Number.isInteger(groupId) || groupId <= 0) {
		return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Invalid study group identifier." });
	}

	const body = req.body as AddMemberBody;

	if (body.userId === actorId) {
		return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "You're already part of this group." });
	}

	const [groupRecord, actorMembership, targetMembership, targetUser] = await Promise.all([
		fetchGroupWithAccessCheck(groupId),
		fetchMembership(groupId, actorId),
		fetchMembership(groupId, body.userId),
		db.query.users.findFirst({
			columns: { userId: true, userEmail: true, userName: true },
			where: eq(users.userId, body.userId),
		}),
	]);

	const access = await ensureCanManageMembers(actorMembership, groupRecord, actorId);

	if (!groupRecord) {
		return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Study group not found." });
	}

	if (!access.allowed) {
		return res.status(StatusCodes.FORBIDDEN).json({ success: false, message: access.reason });
	}

	if (!targetUser) {
		return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "User not found." });
	}

	if (targetMembership) {
		return res.status(StatusCodes.CONFLICT).json({ success: false, message: "User is already part of the group." });
	}

	const roleToAssign = body.role ?? "member";
	if (!groupRoleSchema.safeParse(roleToAssign).success) {
		return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Invalid role provided." });
	}

	if (roleToAssign === "owner" && actorMembership?.role !== "owner" && groupRecord.createdBy !== actorId) {
		return res.status(StatusCodes.FORBIDDEN).json({ success: false, message: "Only owners can promote another owner." });
	}

	const nowIso = new Date().toISOString();
	const targetStatus: StudyGroupMemberStatus = body.invite ? "pending" : "active";

	const [membership] = await db
		.insert(studyGroupMembership)
		.values({
			groupId,
			userId: body.userId,
			role: roleToAssign,
			status: targetStatus,
			joinedAt: nowIso,
			lastActiveAt: body.invite ? null : nowIso,
		})
		.returning({
			membershipId: studyGroupMembership.membershipId,
			role: studyGroupMembership.role,
			status: studyGroupMembership.status,
			joinedAt: studyGroupMembership.joinedAt,
			lastActiveAt: studyGroupMembership.lastActiveAt,
		});

	if (body.invite && targetUser.userEmail) {
		const inviter = actorMembership
			? await db.query.users.findFirst({
				  columns: { userName: true },
				  where: eq(users.userId, actorId),
			  })
			: null;

		void sendStudyGroupInviteEmail({
			toEmail: targetUser.userEmail,
			toName: targetUser.userName ?? "there",
			inviterName: inviter?.userName ?? "A fellow learner",
			groupName: groupRecord.groupName,
			pathTitle: null,
		});
	}

	return res.status(StatusCodes.CREATED).json({
		success: true,
		membership: {
			membershipId: membership.membershipId,
			userId: body.userId,
			role: membership.role,
			status: membership.status,
			joinedAt: membership.joinedAt ?? nowIso,
			lastActiveAt: membership.lastActiveAt ?? null,
		},
	});
};

export const respondToStudyGroupInvitation = async (req: Request, res: Response) => {
	const userId = ensureAuthenticated(req, res);
	if (!userId) {
		return;
	}

	const groupId = Number(req.params.groupId);
	if (!Number.isInteger(groupId) || groupId <= 0) {
		return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Invalid study group identifier." });
	}

	const body = req.body as RespondToInvitationBody;

	const [groupRecord, membership] = await Promise.all([
		fetchGroupWithAccessCheck(groupId),
		fetchMembership(groupId, userId),
	]);

	if (!groupRecord) {
		return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Study group not found." });
	}

	if (!membership || membership.userId !== userId) {
		return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Invitation not found." });
	}

	if (membership.status !== "pending") {
		return res.status(StatusCodes.CONFLICT).json({ success: false, message: "Invitation has already been handled." });
	}

	if (body.decision === "accept") {
		const nowIso = new Date().toISOString();
		const [updated] = await db
			.update(studyGroupMembership)
			.set({
				status: "active",
				joinedAt: membership.joinedAt ?? nowIso,
				lastActiveAt: nowIso,
			})
			.where(
				and(
					eq(studyGroupMembership.groupId, groupId),
					eq(studyGroupMembership.userId, userId),
				),
			)
			.returning({
				role: studyGroupMembership.role,
				status: studyGroupMembership.status,
				joinedAt: studyGroupMembership.joinedAt,
				lastActiveAt: studyGroupMembership.lastActiveAt,
			});

		const [owner, memberProfile] = await Promise.all([
			db.query.users.findFirst({
				columns: { userEmail: true, userName: true },
				where: eq(users.userId, groupRecord.createdBy),
			}),
			db.query.users.findFirst({
				columns: { userName: true },
				where: eq(users.userId, userId),
			}),
		]);

		if (owner?.userEmail && memberProfile?.userName) {
			void sendStudyGroupAdminNotification({
				toEmail: owner.userEmail,
				toName: owner.userName ?? "there",
				groupName: groupRecord.groupName,
				memberName: memberProfile.userName,
			});
		}

		return res.status(StatusCodes.OK).json({
			success: true,
			membership: {
				groupId,
				userId,
				role: updated.role,
				status: updated.status,
				joinedAt: updated.joinedAt ?? nowIso,
				lastActiveAt: updated.lastActiveAt ?? nowIso,
			},
			message: "Invitation accepted.",
		});
	}

	await db
		.delete(studyGroupMembership)
		.where(
			and(
				eq(studyGroupMembership.groupId, groupId),
				eq(studyGroupMembership.userId, userId),
			),
		);

	return res.status(StatusCodes.OK).json({ success: true, message: "Invitation declined." });
};

export const updateStudyGroupMember = async (req: Request, res: Response) => {
	const actorId = ensureAuthenticated(req, res);
	if (!actorId) {
		return;
	}

	const groupId = Number(req.params.groupId);
	const targetUserId = Number(req.params.userId);

	if (!Number.isInteger(groupId) || groupId <= 0 || !Number.isInteger(targetUserId) || targetUserId <= 0) {
		return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Invalid identifiers supplied." });
	}

	const body = req.body as UpdateMemberBody;

	const [groupRecord, actorMembership, targetMembership] = await Promise.all([
		fetchGroupWithAccessCheck(groupId),
		fetchMembership(groupId, actorId),
		fetchMembership(groupId, targetUserId),
	]);

	if (!groupRecord) {
		return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Study group not found." });
	}

	if (!targetMembership) {
		return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Target membership not found." });
	}

	if (targetMembership.userId === groupRecord.createdBy && actorId !== groupRecord.createdBy) {
		return res.status(StatusCodes.FORBIDDEN).json({ success: false, message: "Only the group owner can modify their own membership." });
	}

	if (targetUserId === actorId && body.role && body.role !== targetMembership.role) {
		return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Use group settings to change your own role." });
	}

	if (!actorMembership && groupRecord.createdBy !== actorId) {
		return res.status(StatusCodes.FORBIDDEN).json({ success: false, message: "You are not authorized to update this membership." });
	}

	if (actorMembership && !isPrivileged(actorMembership.role as StudyGroupRole) && groupRecord.createdBy !== actorId) {
		return res.status(StatusCodes.FORBIDDEN).json({ success: false, message: "Only owners or admins can update memberships." });
	}

	if (body.role === "owner" && groupRecord.createdBy !== actorId) {
		return res.status(StatusCodes.FORBIDDEN).json({ success: false, message: "Only the group owner can assign ownership." });
	}

	if (body.role && !groupRoleSchema.safeParse(body.role).success) {
		return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Invalid role provided." });
	}

	if (body.status && !groupMemberStatusSchema.safeParse(body.status).success) {
		return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Invalid status provided." });
	}

	if (targetMembership.role === "owner" && body.status === "removed") {
		const ownerCount = await countActiveOwners(groupId);
		if (ownerCount <= 1) {
			return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Cannot remove the last active owner." });
		}
	}

	if (body.role && targetMembership.role === "owner" && body.role !== "owner") {
		const ownerCount = await countActiveOwners(groupId);
		if (ownerCount <= 1) {
			return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Cannot demote the last active owner." });
		}
	}

	const updates: Partial<typeof studyGroupMembership.$inferInsert> = {};

	if (body.role) {
		updates.role = body.role;
	}

	if (body.status) {
		updates.status = body.status;
		if (body.status === "active") {
			updates.lastActiveAt = new Date().toISOString();
		}
		if (body.status === "removed") {
			updates.leftAt = new Date().toISOString();
		}
	}

	const [updated] = await db
		.update(studyGroupMembership)
		.set(updates)
		.where(
			and(
				eq(studyGroupMembership.groupId, groupId),
				eq(studyGroupMembership.userId, targetUserId),
			),
		)
		.returning({
			role: studyGroupMembership.role,
			status: studyGroupMembership.status,
			joinedAt: studyGroupMembership.joinedAt,
			lastActiveAt: studyGroupMembership.lastActiveAt,
			leftAt: studyGroupMembership.leftAt,
		});

	if (body.status === "active" && targetMembership.status !== "active") {
		const owner = await db.query.users.findFirst({
			columns: { userEmail: true, userName: true },
			where: eq(users.userId, groupRecord.createdBy),
		});

		const targetUser = await db.query.users.findFirst({
			columns: { userName: true },
			where: eq(users.userId, targetUserId),
		});

		if (owner?.userEmail && targetUser?.userName) {
			void sendStudyGroupAdminNotification({
				toEmail: owner.userEmail,
				toName: owner.userName ?? "there",
				groupName: groupRecord.groupName,
				memberName: targetUser.userName,
			});
		}
	}

	return res.status(StatusCodes.OK).json({
		success: true,
		membership: {
			userId: targetUserId,
			role: updated.role,
			status: updated.status,
			joinedAt: updated.joinedAt ?? null,
			lastActiveAt: updated.lastActiveAt ?? null,
			leftAt: updated.leftAt ?? null,
		},
	});
};

export const removeStudyGroupMember = async (req: Request, res: Response) => {
	const actorId = ensureAuthenticated(req, res);
	if (!actorId) {
		return;
	}

	const groupId = Number(req.params.groupId);
	const targetUserId = Number(req.params.userId);

	if (!Number.isInteger(groupId) || groupId <= 0 || !Number.isInteger(targetUserId) || targetUserId <= 0) {
		return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Invalid identifiers supplied." });
	}

	const [groupRecord, actorMembership, targetMembership] = await Promise.all([
		fetchGroupWithAccessCheck(groupId),
		fetchMembership(groupId, actorId),
		fetchMembership(groupId, targetUserId),
	]);

	if (!groupRecord) {
		return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Study group not found." });
	}

	if (!targetMembership) {
		return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Membership not found." });
	}

	const isSelf = actorId === targetUserId;
	const actorIsOwner = groupRecord.createdBy === actorId || actorMembership?.role === "owner";
	const actorIsAdmin = actorMembership?.role === "admin";

	if (!isSelf && !actorIsOwner && !actorIsAdmin) {
		return res.status(StatusCodes.FORBIDDEN).json({ success: false, message: "You are not allowed to remove this member." });
	}

	if (targetMembership.role === "owner") {
		const ownerCount = await countActiveOwners(groupId);
		if (ownerCount <= 1) {
			return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Cannot remove the last active owner." });
		}
	}

	await db.transaction(async (tx) => {
		await tx
			.delete(studyGroupMembership)
			.where(
				and(
					eq(studyGroupMembership.groupId, groupId),
					eq(studyGroupMembership.userId, targetUserId),
				),
			);
	});

	return res.status(StatusCodes.NO_CONTENT).send();
};

export const listStudyGroupMembers = async (req: Request, res: Response) => {
	const userId = ensureAuthenticated(req, res);
	if (!userId) {
		return;
	}

	const groupId = Number(req.params.groupId);
	if (!Number.isInteger(groupId) || groupId <= 0) {
		return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: "Invalid study group identifier." });
	}

	const { groupRecord, authorized } = await assertGroupAccess(userId, groupId);

	if (!groupRecord) {
		return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: "Study group not found." });
	}

	if (!authorized) {
		return res.status(StatusCodes.FORBIDDEN).json({ success: false, message: "You don't have access to this study group." });
	}

	const members = await db
		.select({
			userId: users.userId,
			userName: users.userName,
			avatarUrl: users.avatarUrl,
			role: studyGroupMembership.role,
			status: studyGroupMembership.status,
			joinedAt: studyGroupMembership.joinedAt,
			lastActiveAt: studyGroupMembership.lastActiveAt,
		})
		.from(studyGroupMembership)
		.innerJoin(users, eq(users.userId, studyGroupMembership.userId))
		.where(eq(studyGroupMembership.groupId, groupId))
		.orderBy(
			sql`case ${studyGroupMembership.role} when 'owner' then 0 when 'admin' then 1 when 'moderator' then 2 else 3 end`,
			desc(studyGroupMembership.joinedAt),
		);

	const formatted: StudyGroupDetailMember[] = members.map((member) => ({
		userId: member.userId,
		userName: member.userName ?? null,
		avatarUrl: member.avatarUrl ?? null,
		role: member.role as StudyGroupRole,
		status: member.status as StudyGroupMemberStatus,
		joinedAt: member.joinedAt ?? null,
		lastActiveAt: member.lastActiveAt ?? null,
	}));

	return res.status(StatusCodes.OK).json({ success: true, members: formatted });
};
