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

const sendStudyGroupInviteEmailMock = jest.fn();
const sendStudyGroupAdminNotificationMock = jest.fn();

jest.unstable_mockModule("../../src/drizzle", () => ({
  db: mockDb,
}));

jest.unstable_mockModule("../../src/mailer/studygroupMailer", () => ({
  sendStudyGroupInviteEmail: sendStudyGroupInviteEmailMock,
  sendStudyGroupAdminNotification: sendStudyGroupAdminNotificationMock,
}));

const studyGroupControllerModule = await import("../../src/controller/studygroupController");
const {
  createStudyGroup,
  listStudyGroups,
  getStudyGroup,
  addStudyGroupMember,
  respondToStudyGroupInvitation,
  listStudyGroupMembers,
} = studyGroupControllerModule;

beforeEach(() => {
  jest.clearAllMocks();
  resetDbMocks();
  sendStudyGroupInviteEmailMock.mockReset();
  sendStudyGroupAdminNotificationMock.mockReset();
  setTransactionImplementation(async (callback) => callback({
    select: mockDb.select,
    insert: mockDb.insert,
    update: mockDb.update,
    delete: mockDb.delete,
    query: mockDb.query,
  }));
});

describe("createStudyGroup", () => {
  it("creates a group, invites members, and returns summary", async () => {
    const req = createMockRequest({
      user_id: 5,
      params: { pathId: "12" },
      body: {
        groupName: "ML Circle",
        description: "Deep dive into ML",
        visibility: "private",
        settings: { cadence: "weekly" },
        initialMembers: [30],
      },
    });
    const res = createMockResponse();

    mockDb.query.learningPath.findFirst.mockResolvedValueOnce({
      pathId: 12,
      userId: 5,
      userGoal: "Master ML",
      userQuery: "Learn ML",
    });

    enqueueSelectResult([
      {
        userId: 30,
        userEmail: "member@example.com",
        userName: "Member",
      },
    ]);

    enqueueInsertOperation({
      returning: [
        {
          groupId: 200,
          groupName: "ML Circle",
          visibility: "private",
          description: "Deep dive into ML",
          settings: { cadence: "weekly" },
          createdAt: "2025-06-01T00:00:00.000Z",
          pathId: 12,
        },
      ],
    });
    enqueueInsertOperation({ resolved: [] }); // owner membership
    enqueueInsertOperation({ resolved: [] }); // invite memberships

    enqueueSelectResult([{ memberCount: 2 }]);

    mockDb.query.users.findFirst.mockResolvedValueOnce({ userName: "Owner" });

    await createStudyGroup(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED);
    const payload = (res as unknown as { payload: any }).payload;
    expect(payload.group).toMatchObject({
      groupId: 200,
      groupName: "ML Circle",
      visibility: "private",
      memberCount: 2,
    });
    expect(sendStudyGroupInviteEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        toEmail: "member@example.com",
        inviterName: "Owner",
        groupName: "ML Circle",
      }),
    );
  });
});

describe("listStudyGroups", () => {
  it("lists groups for a path when user has access", async () => {
    const req = createMockRequest({
      user_id: 7,
      params: { pathId: "9" },
      query: { limit: "2", offset: "1", visibility: "public" },
    });
    const res = createMockResponse();

    mockDb.query.learningPath.findFirst.mockResolvedValueOnce({ pathId: 9, userId: 7 });

    enqueueSelectResult([
      {
        groupId: 1,
        groupName: "Group A",
        visibility: "public",
        createdAt: "2025-01-01T00:00:00.000Z",
        memberCount: 4,
      },
    ]);
    enqueueSelectResult([{ total: 1 }]);

    await listStudyGroups(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    const payload = (res as unknown as { payload: any }).payload;
    expect(payload.data).toEqual([
      {
        groupId: 1,
        groupName: "Group A",
        visibility: "public",
        memberCount: 4,
        createdAt: "2025-01-01T00:00:00.000Z",
      },
    ]);
  expect(payload.pagination).toEqual({ total: 1, limit: "2", offset: "1" });
  });
});

describe("getStudyGroup", () => {
  it("returns detailed group information when authorized", async () => {
    const req = createMockRequest({ user_id: 10, params: { groupId: "3" } });
    const res = createMockResponse();

    mockDb.query.studyGroup.findFirst.mockResolvedValueOnce({
      groupId: 3,
      groupName: "Algorithms",
      createdBy: 10,
      pathId: 12,
      description: "Algorithms study",
      visibility: "public",
      settings: { timezone: "UTC" },
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-02T00:00:00.000Z",
    });

    mockDb.query.studyGroupMembership.findFirst.mockResolvedValueOnce({
      userId: 10,
      role: "owner",
      status: "active",
    });

    enqueueSelectResult([
      {
        userId: 10,
        userName: "Owner",
        avatarUrl: "owner.png",
        role: "owner",
        status: "active",
        joinedAt: "2025-01-01T00:00:00.000Z",
        lastActiveAt: "2025-01-03T00:00:00.000Z",
      },
      {
        userId: 11,
        userName: "Member",
        avatarUrl: "member.png",
        role: "member",
        status: "active",
        joinedAt: "2025-01-02T00:00:00.000Z",
        lastActiveAt: null,
      },
    ]);

    mockDb.query.users.findFirst.mockResolvedValueOnce({
      userId: 10,
      userName: "Owner",
      avatarUrl: "owner.png",
    });

    await getStudyGroup(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    const payload = (res as unknown as { payload: any }).payload;
    expect(payload.group.members).toHaveLength(2);
    expect(payload.group.createdBy).toMatchObject({ userId: 10, userName: "Owner" });
  });
});

describe("addStudyGroupMember", () => {
  it("adds a new active member", async () => {
    const req = createMockRequest({
      user_id: 20,
      params: { groupId: "5" },
      body: { userId: 21 },
    });
    const res = createMockResponse();

    mockDb.query.studyGroup.findFirst.mockResolvedValueOnce({
      groupId: 5,
      groupName: "Data Structures",
      createdBy: 20,
      pathId: 15,
      description: null,
      visibility: "public",
      settings: null,
      createdAt: "2025-02-01T00:00:00.000Z",
      updatedAt: "2025-02-01T00:00:00.000Z",
    });

    mockDb.query.studyGroupMembership.findFirst
      .mockResolvedValueOnce({ userId: 20, role: "owner", status: "active" })
      .mockResolvedValueOnce(null);

    mockDb.query.users.findFirst.mockResolvedValueOnce({
      userId: 21,
      userEmail: "new@example.com",
      userName: "New Member",
    });

    enqueueInsertOperation({
      returning: [
        {
          membershipId: 77,
          role: "member",
          status: "active",
          joinedAt: "2025-02-02T00:00:00.000Z",
          lastActiveAt: "2025-02-02T00:00:00.000Z",
        },
      ],
    });

    await addStudyGroupMember(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED);
    const payload = (res as unknown as { payload: any }).payload;
    expect(payload.membership).toMatchObject({
      membershipId: 77,
      userId: 21,
      status: "active",
    });
  });
});

describe("respondToStudyGroupInvitation", () => {
  it("accepts an invitation and notifies the owner", async () => {
    const req = createMockRequest({
      user_id: 31,
      params: { groupId: "8" },
      body: { decision: "accept" },
    });
    const res = createMockResponse();

    mockDb.query.studyGroup.findFirst.mockResolvedValueOnce({
      groupId: 8,
      groupName: "Cloud Club",
      createdBy: 40,
      pathId: 19,
      description: null,
      visibility: "restricted",
      settings: null,
      createdAt: "2025-03-01T00:00:00.000Z",
      updatedAt: "2025-03-01T00:00:00.000Z",
    });

    mockDb.query.studyGroupMembership.findFirst.mockResolvedValueOnce({
      userId: 31,
      role: "member",
      status: "pending",
      joinedAt: null,
      lastActiveAt: null,
    });

    enqueueUpdateOperation({
      returning: [
        {
          role: "member",
          status: "active",
          joinedAt: "2025-03-02T00:00:00.000Z",
          lastActiveAt: "2025-03-02T00:00:00.000Z",
        },
      ],
    });

    mockDb.query.users.findFirst
      .mockResolvedValueOnce({ userEmail: "owner@example.com", userName: "Owner" })
      .mockResolvedValueOnce({ userName: "Invitee" });

    await respondToStudyGroupInvitation(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    const payload = (res as unknown as { payload: any }).payload;
    expect(payload.membership).toMatchObject({
      userId: 31,
      status: "active",
    });
    expect(sendStudyGroupAdminNotificationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        toEmail: "owner@example.com",
        memberName: "Invitee",
        groupName: "Cloud Club",
      }),
    );
  });
});

describe("listStudyGroupMembers", () => {
  it("returns members when caller is authorized", async () => {
    const req = createMockRequest({ user_id: 41, params: { groupId: "6" } });
    const res = createMockResponse();

    mockDb.query.studyGroup.findFirst.mockResolvedValueOnce({
      groupId: 6,
      groupName: "Backend Guild",
      createdBy: 41,
      pathId: 22,
      description: null,
      visibility: "public",
      settings: null,
      createdAt: "2025-04-01T00:00:00.000Z",
      updatedAt: "2025-04-01T00:00:00.000Z",
    });

    mockDb.query.studyGroupMembership.findFirst.mockResolvedValueOnce({
      userId: 41,
      role: "owner",
      status: "active",
    });

    enqueueSelectResult([
      {
        userId: 41,
        userName: "Owner",
        avatarUrl: "owner.png",
        role: "owner",
        status: "active",
        joinedAt: "2025-04-01T00:00:00.000Z",
        lastActiveAt: "2025-04-02T00:00:00.000Z",
      },
      {
        userId: 42,
        userName: "Peer",
        avatarUrl: null,
        role: "member",
        status: "active",
        joinedAt: "2025-04-02T00:00:00.000Z",
        lastActiveAt: null,
      },
    ]);

    await listStudyGroupMembers(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    const payload = (res as unknown as { payload: any }).payload;
    expect(payload.members).toHaveLength(2);
    expect(payload.members[0]).toMatchObject({ userId: 41, role: "owner" });
  });
});
