import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { createMockRequest, createMockResponse } from "../utils/express";
import {
  mockDb,
  resetDbMocks,
  enqueueSelectResult,
  enqueueInsertOperation,
  enqueueUpdateOperation,
  enqueueDeleteOperation,
  setTransactionImplementation,
} from "../utils/drizzleMock";

const sendFriendRequestEmailMock = jest.fn();
const sendFriendAcceptanceEmailMock = jest.fn();

jest.unstable_mockModule("../../src/drizzle", () => ({
  db: mockDb,
}));

jest.unstable_mockModule("../../src/mailer/friendMailer", () => ({
  sendFriendRequestEmail: sendFriendRequestEmailMock,
  sendFriendAcceptanceEmail: sendFriendAcceptanceEmailMock,
}));

const friendControllerModule = await import("../../src/controller/friendController");
const {
  sendFriendRequest,
  listFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  listFriends,
  removeFriend,
} = friendControllerModule;

beforeEach(() => {
  jest.clearAllMocks();
  resetDbMocks();
  sendFriendRequestEmailMock.mockReset();
  sendFriendAcceptanceEmailMock.mockReset();
  setTransactionImplementation(async (callback) => callback({
    select: mockDb.select,
    insert: mockDb.insert,
    update: mockDb.update,
    delete: mockDb.delete,
    query: mockDb.query,
  }));
});

describe("sendFriendRequest", () => {
  it("creates a friend request and notifies the receiver", async () => {
    const req = createMockRequest({
      user_id: 11,
      body: { targetUserId: 22, message: "  Let's connect!  " },
    });
    const res = createMockResponse();

    mockDb.query.users.findFirst
      .mockResolvedValueOnce({
        userId: 22,
        userEmail: "target@example.com",
        userName: "Target",
        avatarUrl: "avatar.png",
      })
      .mockResolvedValueOnce({
        userId: 11,
        userEmail: "sender@example.com",
        userName: "Sender",
      });

    enqueueSelectResult([]); // existing friendship check
    mockDb.query.friendRequest.findFirst.mockResolvedValueOnce(null);

    enqueueInsertOperation({
      returning: [
        {
          requestId: 901,
          sentAt: "2025-01-01T00:00:00.000Z",
          message: "Let's connect!",
          expiresAt: "2025-01-08T00:00:00.000Z",
        },
      ],
    });

    await sendFriendRequest(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED);
    const payload = (res as unknown as { payload: any }).payload;
    expect(payload.success).toBe(true);
    expect(payload.request).toMatchObject({
      requestId: 901,
      status: "pending",
      target: {
        userId: 22,
        userName: "Target",
        avatarUrl: "avatar.png",
      },
    });
    expect(sendFriendRequestEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        toEmail: "target@example.com",
        fromName: "Sender",
        message: "Let's connect!",
      }),
    );
  });

  it("rejects self-directed requests", async () => {
    const req = createMockRequest({
      user_id: 33,
      body: { targetUserId: 33, message: "hi" },
    });
    const res = createMockResponse();

    await sendFriendRequest(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    expect(mockDb.insert).not.toHaveBeenCalled();
  });
});

describe("listFriendRequests", () => {
  it("returns paginated friend requests with perspective", async () => {
    const req = createMockRequest({
      user_id: 50,
      query: { direction: "inbound", status: "pending", limit: "10", offset: "0" },
    });
    const res = createMockResponse();

    enqueueSelectResult([{ total: 1 }]);
    enqueueSelectResult([
      {
        requestId: 700,
        senderId: 40,
        receiverId: 50,
        status: "pending",
        message: "hello",
        sentAt: "2025-02-01T12:00:00.000Z",
        updatedAt: "2025-02-01T12:00:00.000Z",
        senderUserId: 40,
        senderName: "Alex",
        senderAvatar: "alex.png",
        receiverUserId: 50,
        receiverName: "Blair",
        receiverAvatar: "blair.png",
      },
    ]);

    await listFriendRequests(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    const payload = (res as unknown as { payload: any }).payload;
    expect(payload.data).toHaveLength(1);
    expect(payload.data[0]).toMatchObject({
      requestId: 700,
      direction: "inbound",
      user: { userId: 40, userName: "Alex", avatarUrl: "alex.png" },
    });
    expect(payload.pagination).toEqual({ total: 1, limit: 10, offset: 0 });
  });
});

describe("acceptFriendRequest", () => {
  it("promotes a pending request into a friendship", async () => {
    const req = createMockRequest({ user_id: 60, params: { requestId: "1000" } });
    const res = createMockResponse();

    mockDb.query.friendRequest.findFirst.mockResolvedValueOnce({
      requestId: 1000,
      senderId: 42,
      receiverId: 60,
      status: "pending",
    });

    enqueueUpdateOperation({ resolved: [] });
    enqueueInsertOperation({ resolved: [] });
    enqueueSelectResult([
      {
        friendshipId: 8888,
        connectedAt: "2025-03-01T08:00:00.000Z",
      },
    ]);

    mockDb.query.users.findFirst
      .mockResolvedValueOnce({
        userId: 42,
        userEmail: "friend@example.com",
        userName: "Friend",
        avatarUrl: "friend.png",
      })
      .mockResolvedValueOnce({
        userId: 60,
        userEmail: "receiver@example.com",
        userName: "Receiver",
      });

    await acceptFriendRequest(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    const payload = (res as unknown as { payload: any }).payload;
    expect(payload.friendship).toMatchObject({
      friendshipId: 8888,
      friend: {
        userId: 42,
        userName: "Friend",
        avatarUrl: "friend.png",
      },
    });
    expect(sendFriendAcceptanceEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        toEmail: "friend@example.com",
        friendName: "Receiver",
      }),
    );
  });
});

describe("declineFriendRequest", () => {
  it("marks a pending request as rejected", async () => {
    const req = createMockRequest({ user_id: 70, params: { requestId: "200" } });
    const res = createMockResponse();

    mockDb.query.friendRequest.findFirst.mockResolvedValueOnce({
      requestId: 200,
      senderId: 70,
      receiverId: 71,
      status: "pending",
    });

    enqueueUpdateOperation({
      returning: [
        {
          requestId: 200,
          status: "rejected",
          updatedAt: "2025-04-01T10:00:00.000Z",
        },
      ],
    });

    await declineFriendRequest(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    const payload = (res as unknown as { payload: any }).payload;
    expect(payload.request).toMatchObject({ requestId: 200, status: "rejected" });
  });
});

describe("listFriends", () => {
  it("returns paginated friend summaries", async () => {
    const req = createMockRequest({ user_id: 90, query: { limit: "5", offset: "2" } });
    const res = createMockResponse();

    enqueueSelectResult([{ total: 3 }]);
    enqueueSelectResult([
      {
        friendshipId: 5000,
        connectedAt: "2025-05-01T00:00:00.000Z",
        friendUserId: 91,
        friendName: "Jamie",
        friendAvatar: "jamie.png",
      },
    ]);

    await listFriends(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    const payload = (res as unknown as { payload: any }).payload;
    expect(payload.data).toEqual([
      {
        friendshipId: 5000,
        connectedAt: "2025-05-01T00:00:00.000Z",
        friend: {
          userId: 91,
          userName: "Jamie",
          avatarUrl: "jamie.png",
        },
      },
    ]);
    expect(payload.pagination).toEqual({ total: 3, limit: 5, offset: 2 });
  });
});

describe("removeFriend", () => {
  it("removes both sides of a friendship", async () => {
    const req = createMockRequest({ user_id: 100, params: { friendUserId: "200" } });
    const res = createMockResponse();

    mockDb.query.userFriend.findFirst.mockResolvedValueOnce({
      friendshipId: 1,
      userId: 100,
      friendUserId: 200,
    });

    enqueueDeleteOperation({ resolved: [] });
    enqueueDeleteOperation({ resolved: [] });

    await removeFriend(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.NO_CONTENT);
  });
});
