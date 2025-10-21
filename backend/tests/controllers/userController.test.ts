import { jest, describe, it, expect, beforeEach, beforeAll } from "@jest/globals";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { createMockRequest, createMockResponse } from "../utils/express";
import {
  mockDb,
  resetDbMocks,
  enqueueSelectResult,
} from "../utils/drizzleMock";

jest.unstable_mockModule("../../src/drizzle", () => ({
  db: mockDb,
}));

const userControllerModule = await import("../../src/controller/userController");
const { getUserNotifications, searchUsersByName } = userControllerModule;

beforeAll(() => {
  process.env.COOKIE_SESSION_KEY = process.env.COOKIE_SESSION_KEY ?? "session_cookie_key";
});

beforeEach(() => {
  jest.clearAllMocks();
  resetDbMocks();
});

describe("getUserNotifications", () => {
  it("requires authentication", async () => {
    const req = createMockRequest({ user_id: undefined });
    const res = createMockResponse();

    await getUserNotifications(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Authentication required." }),
    );
  });

  it("returns sorted notifications and counts", async () => {
    const req = createMockRequest({ user_id: 10 });
    const res = createMockResponse();

    enqueueSelectResult([
      {
        requestId: 1,
        senderId: 2,
        senderName: "Charlie",
        senderAvatar: "avatar.png",
        message: "Let's connect",
        sentAt: "2024-01-02T10:00:00.000Z",
      },
    ]);

    enqueueSelectResult([
      {
        membershipId: 5,
        groupId: 8,
        role: "member",
        invitedAt: "2024-01-01T09:00:00.000Z",
        groupName: "Study Buddies",
        pathId: 55,
        pathTitle: null,
        pathTopic: "Graph Theory",
        inviterId: null,
        inviterName: null,
      },
    ]);

    await getUserNotifications(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    const payload = (res as unknown as { payload: any }).payload;
    expect(payload.success).toBe(true);
    expect(payload.notifications).toHaveLength(2);
    expect(payload.notifications[0]).toMatchObject({
      type: "friend_request",
      requestId: 1,
      sender: { userId: 2, userName: "Charlie", avatarUrl: "avatar.png" },
    });
    expect(payload.notifications[1]).toMatchObject({
      type: "study_group_invitation",
      membershipId: 5,
      group: {
        groupId: 8,
        pathTitle: "Graph Theory",
      },
      inviter: null,
    });
    expect(payload.counts).toEqual({ total: 2, friendRequests: 1, studyGroupInvitations: 1 });
  });

  it("handles empty result sets", async () => {
    const req = createMockRequest({ user_id: 10 });
    const res = createMockResponse();

    enqueueSelectResult([]);
    enqueueSelectResult([]);

    await getUserNotifications(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    const payload = (res as unknown as { payload: any }).payload;
    expect(payload.notifications).toHaveLength(0);
    expect(payload.counts).toEqual({ total: 0, friendRequests: 0, studyGroupInvitations: 0 });
  });
});

describe("searchUsersByName", () => {
  it("requires authentication", async () => {
    const req = createMockRequest({ user_id: undefined });
    const res = createMockResponse();

    await searchUsersByName(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
  });

  it("validates query params", async () => {
    const req = createMockRequest({ user_id: 42, query: {} });
    const res = createMockResponse();

    await searchUsersByName(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false }),
    );
  });

  it("returns paginated results", async () => {
    const req = createMockRequest({
      user_id: 42,
      query: { term: "a", limit: "5", offset: "10" },
    });
    const res = createMockResponse();

    enqueueSelectResult([{ total: 2 }]);
    enqueueSelectResult([
      { userId: 99, userName: "Alice" },
      { userId: 100, userName: null },
    ]);

    await searchUsersByName(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    const payload = (res as unknown as { payload: any }).payload;
    expect(payload.success).toBe(true);
    expect(payload.results).toEqual([
      { userId: 99, userName: "Alice" },
      { userId: 100, userName: null },
    ]);
    expect(payload.pagination).toEqual({ total: 2, limit: 5, offset: 10 });
  });
});
