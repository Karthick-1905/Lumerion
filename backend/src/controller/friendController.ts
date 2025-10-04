import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { and, desc, eq, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "../drizzle";
import { friendRequest, userFriend, users } from "../drizzle/schema";
import {
	FriendListQuery,
	FriendRequestsQuery,
	FriendSummary,
	PaginationMeta,
	SendFriendRequestBody,
	friendListQuerySchema,
	friendRequestsQuerySchema,
	requestIdParamsSchema,
	friendUserIdParamsSchema,
} from "../schema/friendSchema";
import { sendFriendAcceptanceEmail, sendFriendRequestEmail } from "../mailer/friendMailer";

function sanitizeMessage(message?: string | null): string | null {
	if (typeof message !== "string") {
		return null;
	}

	const trimmed = message.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function buildPaginationMeta(total: number, limit: number, offset: number): PaginationMeta {
	return {
		total,
		limit,
		offset,
	};
}

export const sendFriendRequest = async (req: Request<{}, {}, SendFriendRequestBody>, res: Response) => {
	try {
		const userId = req.user_id;
		if (!userId) {
			return res.status(StatusCodes.UNAUTHORIZED).json({
				success: false,
				message: "Authentication required.",
			});
		}

		const { targetUserId, message } = req.body;

		if (userId === targetUserId) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "You cannot send a friend request to yourself.",
			});
		}

		const targetUser = await db.query.users.findFirst({
			columns: {
				userId: true,
				userEmail: true,
				userName: true,
				avatarUrl: true,
			},
			where: eq(users.userId, targetUserId),
		});

		if (!targetUser) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "Target user not found.",
			});
		}

		const existingFriendship = await db
			.select({ friendshipId: userFriend.friendshipId })
			.from(userFriend)
			.where(
				or(
					and(eq(userFriend.userId, userId), eq(userFriend.friendUserId, targetUserId)),
					and(eq(userFriend.userId, targetUserId), eq(userFriend.friendUserId, userId)),
				),
			)
			.limit(1);

		if (existingFriendship.length > 0) {
			return res.status(StatusCodes.CONFLICT).json({
				success: false,
				message: "You are already friends with this user.",
			});
		}

		const existingRequest = await db.query.friendRequest.findFirst({
			where: or(
				and(
					eq(friendRequest.senderId, userId),
					eq(friendRequest.receiverId, targetUserId),
					eq(friendRequest.status, "pending"),
				),
				and(
					eq(friendRequest.senderId, targetUserId),
					eq(friendRequest.receiverId, userId),
					eq(friendRequest.status, "pending"),
				),
			),
		});

		if (existingRequest) {
			return res.status(StatusCodes.CONFLICT).json({
				success: false,
				message: "A pending friend request already exists between these users.",
			});
		}

		const nowIso = new Date().toISOString();
		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
		const normalizedMessage = sanitizeMessage(message);

		const [created] = await db
			.insert(friendRequest)
			.values({
				senderId: userId,
				receiverId: targetUserId,
				message: normalizedMessage,
				sentAt: nowIso,
				updatedAt: nowIso,
				expiresAt,
				status: "pending",
			})
			.returning({
				requestId: friendRequest.requestId,
				sentAt: friendRequest.sentAt,
				message: friendRequest.message,
				expiresAt: friendRequest.expiresAt,
			});

		const requester = await db.query.users.findFirst({
			columns: {
				userName: true,
				userEmail: true,
			},
			where: eq(users.userId, userId),
		});

		if (requester?.userEmail) {
			void sendFriendRequestEmail({
				toEmail: targetUser.userEmail,
				toName: targetUser.userName ?? "there",
				fromName: requester.userName ?? "A colleague",
				message: normalizedMessage,
			});
		}

		return res.status(StatusCodes.CREATED).json({
			success: true,
			request: {
				requestId: created.requestId,
				status: "pending" as const,
				sentAt: created.sentAt ?? nowIso,
				message: created.message ?? null,
				expiresAt: created.expiresAt ?? expiresAt,
				target: {
					userId: targetUser.userId,
					userName: targetUser.userName ?? null,
					avatarUrl: targetUser.avatarUrl ?? null,
				},
			},
		});
	} catch (error) {
		console.error("Failed to send friend request:", error);
		return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "Unable to send friend request at the moment.",
		});
	}
};

export const listFriendRequests = async (req: Request, res: Response) => {
	try {
		const {user_id : userId} = req;
		if (!userId) {
			return res.status(StatusCodes.UNAUTHORIZED).json({
				success: false,
				message: "Authentication required.",
			});
		}

		const parsedQuery = friendRequestsQuerySchema.safeParse(req.query);
		const query: FriendRequestsQuery = parsedQuery.success
			? parsedQuery.data
			: {};

		const direction = query.direction ?? "inbound";
		const status = query.status ?? "pending";
		const limit = query.limit ?? 20;
		const offset = query.offset ?? 0;

		const involvementCondition = direction === "inbound"
			? eq(friendRequest.receiverId, userId)
			: direction === "outbound"
				? eq(friendRequest.senderId, userId)
				: or(eq(friendRequest.senderId, userId), eq(friendRequest.receiverId, userId));

		const whereClause = status
			? and(involvementCondition, eq(friendRequest.status, status))
			: involvementCondition;

		const [{ total }] = await db
			.select({ total: sql<number>`count(*)::int` })
			.from(friendRequest)
			.where(whereClause);

		const senderUser = alias(users, "sender_user");
		const receiverUser = alias(users, "receiver_user");

		const rows = await db
			.select({
				requestId: friendRequest.requestId,
				senderId: friendRequest.senderId,
				receiverId: friendRequest.receiverId,
				status: friendRequest.status,
				message: friendRequest.message,
				sentAt: friendRequest.sentAt,
				updatedAt: friendRequest.updatedAt,
				senderUserId: senderUser.userId,
				senderName: senderUser.userName,
				senderAvatar: senderUser.avatarUrl,
				receiverUserId: receiverUser.userId,
				receiverName: receiverUser.userName,
				receiverAvatar: receiverUser.avatarUrl,
			})
			.from(friendRequest)
			.innerJoin(senderUser, eq(friendRequest.senderId, senderUser.userId))
			.innerJoin(receiverUser, eq(friendRequest.receiverId, receiverUser.userId))
			.where(whereClause)
			.orderBy(desc(friendRequest.sentAt))
			.limit(limit)
			.offset(offset);

		const data = rows.map((row) => {
			const perspective = row.receiverId === userId ? "inbound" : "outbound" as const;
			const user = perspective === "inbound"
				? {
					userId: row.senderUserId,
					userName: row.senderName ?? null,
					avatarUrl: row.senderAvatar ?? null,
				}
				: {
					userId: row.receiverUserId,
					userName: row.receiverName ?? null,
					avatarUrl: row.receiverAvatar ?? null,
				};

			return {
				requestId: row.requestId,
				status: row.status,
				sentAt: row.sentAt ?? null,
				updatedAt: row.updatedAt ?? null,
				message: row.message ?? null,
				direction: perspective,
				user,
			};
		});

		return res.status(StatusCodes.OK).json({
			success: true,
			data,
			pagination: buildPaginationMeta(total ?? 0, limit, offset),
		});
	} catch (error) {
		console.error("Failed to list friend requests:", error);
		return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "Unable to retrieve friend requests at the moment.",
		});
	}
};

export const acceptFriendRequest = async (req: Request, res: Response) => {
	try {
		const userId = req.user_id;
		if (!userId) {
			return res.status(StatusCodes.UNAUTHORIZED).json({
				success: false,
				message: "Authentication required.",
			});
		}

		const paramsParse = requestIdParamsSchema.safeParse(req.params);
		if (!paramsParse.success) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "Invalid friend request identifier.",
			});
		}

		const { requestId } = paramsParse.data;

		const requestRecord = await db.query.friendRequest.findFirst({
			where: eq(friendRequest.requestId, requestId),
		});

		if (!requestRecord) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "Friend request not found.",
			});
		}

		if (requestRecord.receiverId !== userId) {
			return res.status(StatusCodes.FORBIDDEN).json({
				success: false,
				message: "You can only accept requests sent to you.",
			});
		}

		if (requestRecord.status !== "pending") {
			return res.status(StatusCodes.CONFLICT).json({
				success: false,
				message: "Only pending requests can be accepted.",
			});
		}

		const nowIso = new Date().toISOString();

		const result = await db.transaction(async (tx) => {
			await tx
				.update(friendRequest)
				.set({
					status: "accepted",
					acceptedAt: nowIso,
					updatedAt: nowIso,
				})
				.where(eq(friendRequest.requestId, requestId));

			await tx
				.insert(userFriend)
				.values([
					{
						userId,
						friendUserId: requestRecord.senderId,
						connectedAt: nowIso,
					},
					{
						userId: requestRecord.senderId,
						friendUserId: userId,
						connectedAt: nowIso,
					},
				])
				.onConflictDoNothing({
					target: [userFriend.userId, userFriend.friendUserId],
				});

			return tx
				.select({
					friendshipId: userFriend.friendshipId,
					connectedAt: userFriend.connectedAt,
				})
				.from(userFriend)
				.where(and(eq(userFriend.userId, userId), eq(userFriend.friendUserId, requestRecord.senderId)))
				.limit(1);
		});

		const friendshipRow = result[0];

		if (!friendshipRow) {
			throw new Error("Friendship record missing after acceptance");
		}

		const friendUser = await db.query.users.findFirst({
			columns: {
				userId: true,
				userName: true,
				avatarUrl: true,
				userEmail: true,
			},
			where: eq(users.userId, requestRecord.senderId),
		});

		const acceptingUser = await db.query.users.findFirst({
			columns: {
				userName: true,
				userEmail: true,
			},
			where: eq(users.userId, userId),
		});

		if (friendUser?.userEmail && acceptingUser?.userName) {
			void sendFriendAcceptanceEmail({
				toEmail: friendUser.userEmail,
				toName: friendUser.userName ?? "there",
				friendName: acceptingUser.userName ?? "A friend",
			});
		}

		return res.status(StatusCodes.OK).json({
			success: true,
			friendship: {
				friendshipId: friendshipRow.friendshipId,
				connectedAt: friendshipRow.connectedAt ?? nowIso,
				friend: {
					userId: friendUser?.userId ?? requestRecord.senderId,
					userName: friendUser?.userName ?? null,
					avatarUrl: friendUser?.avatarUrl ?? null,
				},
			} satisfies FriendSummary,
		});
	} catch (error) {
		console.error("Failed to accept friend request:", error);
		return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "Unable to accept friend request at the moment.",
		});
	}
};

export const declineFriendRequest = async (req: Request, res: Response) => {
	try {
		const userId = req.user_id;
		if (!userId) {
			return res.status(StatusCodes.UNAUTHORIZED).json({
				success: false,
				message: "Authentication required.",
			});
		}

		const paramsParse = requestIdParamsSchema.safeParse(req.params);
		if (!paramsParse.success) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "Invalid friend request identifier.",
			});
		}

		const { requestId } = paramsParse.data;

		const requestRecord = await db.query.friendRequest.findFirst({
			where: eq(friendRequest.requestId, requestId),
		});

		if (!requestRecord) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "Friend request not found.",
			});
		}

		const canAct = requestRecord.receiverId === userId || requestRecord.senderId === userId;
		if (!canAct) {
			return res.status(StatusCodes.FORBIDDEN).json({
				success: false,
				message: "You are not authorized to update this friend request.",
			});
		}

		if (requestRecord.status !== "pending") {
			return res.status(StatusCodes.CONFLICT).json({
				success: false,
				message: "Only pending requests can be updated.",
			});
		}

		const nowIso = new Date().toISOString();

		const [updated] = await db
			.update(friendRequest)
			.set({
				status: "rejected",
				updatedAt: nowIso,
			})
			.where(eq(friendRequest.requestId, requestId))
			.returning({
				requestId: friendRequest.requestId,
				status: friendRequest.status,
				updatedAt: friendRequest.updatedAt,
			});

		return res.status(StatusCodes.OK).json({
			success: true,
			request: {
				requestId: updated.requestId,
				status: updated.status,
				updatedAt: updated.updatedAt ?? nowIso,
			},
		});
	} catch (error) {
		console.error("Failed to decline friend request:", error);
		return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "Unable to update friend request at the moment.",
		});
	}
};

export const listFriends = async (req: Request, res: Response) => {
	try {
		const userId = req.user_id;
		if (!userId) {
			return res.status(StatusCodes.UNAUTHORIZED).json({
				success: false,
				message: "Authentication required.",
			});
		}

		const parsedQuery = friendListQuerySchema.safeParse(req.query);
		const query: FriendListQuery = parsedQuery.success
			? parsedQuery.data
			: {};

		const limit = query.limit ?? 20;
		const offset = query.offset ?? 0;

		const [{ total }] = await db
			.select({ total: sql<number>`count(*)::int` })
			.from(userFriend)
			.where(eq(userFriend.userId, userId));

		const friendUser = alias(users, "friend_user");

		const rows = await db
			.select({
				friendshipId: userFriend.friendshipId,
				connectedAt: userFriend.connectedAt,
				friendUserId: friendUser.userId,
				friendName: friendUser.userName,
				friendAvatar: friendUser.avatarUrl,
			})
			.from(userFriend)
			.innerJoin(friendUser, eq(userFriend.friendUserId, friendUser.userId))
			.where(eq(userFriend.userId, userId))
			.orderBy(desc(userFriend.connectedAt))
			.limit(limit)
			.offset(offset);

		const data: FriendSummary[] = rows.map((row) => ({
			friendshipId: row.friendshipId,
			connectedAt: row.connectedAt ?? null,
			friend: {
				userId: row.friendUserId,
				userName: row.friendName ?? null,
				avatarUrl: row.friendAvatar ?? null,
			},
		}));

		return res.status(StatusCodes.OK).json({
			success: true,
			data,
			pagination: buildPaginationMeta(total ?? 0, limit, offset),
		});
	} catch (error) {
		console.error("Failed to list friends:", error);
		return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "Unable to retrieve friends at the moment.",
		});
	}
};

export const removeFriend = async (req: Request, res: Response) => {
	try {
		const userId = req.user_id;
		if (!userId) {
			return res.status(StatusCodes.UNAUTHORIZED).json({
				success: false,
				message: "Authentication required.",
			});
		}

		const paramsParse = friendUserIdParamsSchema.safeParse(req.params);
		if (!paramsParse.success) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: "Invalid friend identifier.",
			});
		}

		const { friendUserId } = paramsParse.data;

		const existingFriendship = await db.query.userFriend.findFirst({
			where: and(eq(userFriend.userId, userId), eq(userFriend.friendUserId, friendUserId)),
		});

		if (!existingFriendship) {
			return res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: "No friendship found with the specified user.",
			});
		}

		await db.transaction(async (tx) => {
			await tx
				.delete(userFriend)
				.where(and(eq(userFriend.userId, userId), eq(userFriend.friendUserId, friendUserId)));
			await tx
				.delete(userFriend)
				.where(and(eq(userFriend.userId, friendUserId), eq(userFriend.friendUserId, userId)));
		});

		return res.status(StatusCodes.NO_CONTENT).send();
	} catch (error) {
		console.error("Failed to remove friend:", error);
		return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: "Unable to remove friend at the moment.",
		});
	}
};
