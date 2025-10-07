import { z } from "zod";

export const friendRequestDirectionEnum = z.enum(["inbound", "outbound", "all"]);

export const friendRequestStatusEnum = z.enum([
	"pending",
	"accepted",
	"rejected",
	"blocked",
]);

const paginationQuerySchema = z.object({
	limit: z.coerce.number().int().positive().max(100).optional(),
	offset: z.coerce.number().int().nonnegative().optional(),
});

export const sendFriendRequestBodySchema = z.object({
	targetUserId: z.number().int().positive(),
	message: z
		.string()
		.trim()
		.max(500, "Message must be 500 characters or less")
		.optional()
		.nullable(),
});

export const sendFriendRequestSchema = z.object({
	body: sendFriendRequestBodySchema,
});

export const friendRequestsQuerySchema = paginationQuerySchema.merge(
	z.object({
		direction: friendRequestDirectionEnum.optional(),
		status: friendRequestStatusEnum.optional(),
	}),
);

export const listFriendRequestsSchema = z.object({
	query: friendRequestsQuerySchema,
});

export const friendListQuerySchema = paginationQuerySchema;

export const requestIdParamsSchema = z.object({
	requestId: z.coerce.number().int().positive(),
});

export const requestIdParamSchema = z.object({
	params: requestIdParamsSchema,
});

export const friendUserIdParamsSchema = z.object({
	friendUserId: z.coerce.number().int().positive(),
});

export const friendUserIdParamSchema = z.object({
	params: friendUserIdParamsSchema,
});

export const listFriendsSchema = z.object({
	query: friendListQuerySchema,
});

export const userSearchQuerySchema = paginationQuerySchema.merge(
	z.object({
		term: z
			.string()
			.trim()
			.min(1, "Search term must be at least 1 character")
			.max(100, "Search term must be at most 100 characters"),
	})
);

export type SendFriendRequestBody = z.infer<typeof sendFriendRequestBodySchema>;
export type FriendRequestsQuery = z.infer<typeof friendRequestsQuerySchema>;
export type FriendListQuery = z.infer<typeof friendListQuerySchema>;
export type UserSearchQuery = z.infer<typeof userSearchQuerySchema>;
export type FriendRequestDirection = z.infer<typeof friendRequestDirectionEnum>;
export type FriendRequestStatus = z.infer<typeof friendRequestStatusEnum>;
export type RequestIdParams = z.infer<typeof requestIdParamsSchema>;
export type FriendUserIdParams = z.infer<typeof friendUserIdParamsSchema>;

export type FriendSummary = {
	friendshipId: number;
	connectedAt: string | null;
	friend: {
		userId: number;
		userName: string | null;
		avatarUrl: string | null;
	};
};

export type FriendRequestListItem = {
	requestId: number;
	status: FriendRequestStatus;
	sentAt: string | null;
	updatedAt: string | null;
	message: string | null;
	direction: Exclude<FriendRequestDirection, "all">;
	user: {
		userId: number;
		userName: string | null;
		avatarUrl: string | null;
	};
};

export type PaginationMeta = {
	total: number;
	limit: number;
	offset: number;
};
