import { jest, describe, it, expect, beforeEach, beforeAll } from "@jest/globals";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { createMockRequest, createMockResponse } from "../utils/express";
import {
  mockDb,
  resetDbMocks,
  enqueueSelectResult,
  enqueueInsertOperation,
  enqueueUpdateOperation,
  setTransactionImplementation,
} from "../utils/drizzleMock";

const authUtilsMockModule = await import("../mocks/authUtils.mock");
const { getSession, resetAuthUtilsMocks } = authUtilsMockModule;

const roadmapGraphInvokeMock = jest.fn();
const roadmapGraphGetStateMock = jest.fn();
const roadmapGraphMock = {
  invoke: roadmapGraphInvokeMock,
  getState: roadmapGraphGetStateMock,
};

const uuidMock = jest.fn(() => "thread-123");
const uuidValidateMock = jest.fn(() => true);

jest.unstable_mockModule("uuid", () => ({ v4: uuidMock, validate: uuidValidateMock }));

jest.unstable_mockModule("../../src/utils/authUtils", () => ({
  ...authUtilsMockModule,
  getSession,
}));

jest.unstable_mockModule("../../src/drizzle", () => ({
  db: mockDb,
}));

jest.unstable_mockModule("../../src/agents/roadmapGenerator/graph", () => ({
  roadmapGraph: roadmapGraphMock,
  roadmapGraphDebug: {},
  runRoadmapWithReflectionLoop: jest.fn(),
}));

const roadmapControllerModule = await import("../../src/controller/roadmapController");
const {
  roadmapGenerator,
  saveRoadmap,
  setLearningPathVisibility,
  listPublicRoadmaps,
  getModuleQuizzes,
  submitQuizAssessment,
} = roadmapControllerModule;

const asMock = (fn: unknown) => fn as jest.MockedFunction<any>;
const resolveMock = (fn: unknown, value: unknown) => asMock(fn).mockResolvedValue(value);
const resolveMockOnce = (fn: unknown, value: unknown) => asMock(fn).mockResolvedValueOnce(value);
const rejectMockOnce = (fn: unknown, error: unknown) => asMock(fn).mockRejectedValueOnce(error);

beforeAll(() => {
  process.env.COOKIE_SESSION_KEY = process.env.COOKIE_SESSION_KEY ?? "session-id";
});

beforeEach(() => {
  jest.clearAllMocks();
  resetDbMocks();
  resetAuthUtilsMocks();
  resolveMock(roadmapGraphInvokeMock, undefined);
  resolveMock(roadmapGraphGetStateMock, { values: {} });
  uuidMock.mockReturnValue("thread-123");
  resolveMock(getSession, null);
  setTransactionImplementation(async (callback) => callback({
    select: mockDb.select,
    insert: mockDb.insert,
    update: mockDb.update,
    delete: mockDb.delete,
    query: mockDb.query,
  }));
});

describe("roadmapGenerator", () => {
  it("requires non-empty topic", async () => {
    const req = createMockRequest({ body: { topic: "   " } });
    const res = createMockResponse();

    await roadmapGenerator(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    expect(roadmapGraphInvokeMock).not.toHaveBeenCalled();
  });

  it("returns roadmap snapshot", async () => {
    const modules = [
      {
        title: "Intro",
        description: "Basics",
        lessons: [],
      },
    ];

    resolveMockOnce(roadmapGraphGetStateMock, {
      values: {
        modules,
        domain: "AI",
        requiresPrereqs: true,
        bootstrapSummary: { summary: "boot" },
        graphContext: { focus: "graph" },
        prerequisitePlan: { steps: [] },
      },
    });

    const req = createMockRequest({ body: { topic: "Learn AI" } });
    const res = createMockResponse();

    await roadmapGenerator(req as Request, res as Response);

    expect(roadmapGraphInvokeMock).toHaveBeenCalledWith(
      { messages: expect.any(Array) },
      { configurable: { thread_id: "thread-123" } },
    );
    expect(res.status).not.toHaveBeenCalled();
    const payload = (res as unknown as { payload: any }).payload;
    expect(payload.success).toBe(true);
    expect(payload.threadId).toBe("thread-123");
    expect(payload.modules).toEqual(modules);
    expect(payload.domain).toBe("AI");
    expect(payload.requiresPrereqs).toBe(true);
    expect(payload.bootstrapSummary).toEqual({ summary: "boot" });
    expect(payload.graphContext).toEqual({ focus: "graph" });
    expect(payload.prerequisitePlan).toEqual({ steps: [] });
  });

  it("handles graph errors", async () => {
    rejectMockOnce(roadmapGraphInvokeMock, new Error("llm failure"));

    const req = createMockRequest({ body: { topic: "Learn AI" } });
    const res = createMockResponse();

    await roadmapGenerator(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Failed to generate roadmap." }),
    );
  });
});

describe("saveRoadmap", () => {
  it("validates input body", async () => {
    const req = createMockRequest({ body: {}, cookies: { session_cookie_key: "abc" } });
    const res = createMockResponse();

    await saveRoadmap(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
  });

  it("requires session cookie", async () => {
    const req = createMockRequest({
      body: { threadId: "t", topic: "Topic" },
      cookies: {},
    });
    const res = createMockResponse();

    await saveRoadmap(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
  });

  it("rejects invalid session", async () => {
    const req = createMockRequest({
      body: { threadId: "t", topic: "Topic" },
      cookies: { "session-id": "abc" },
    });
    const res = createMockResponse();

    resolveMockOnce(getSession, null);

    await saveRoadmap(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
  });

  it("returns 404 when snapshot missing", async () => {
    const req = createMockRequest({
      body: { threadId: "t", topic: "Topic" },
      cookies: { "session-id": "abc" },
    });
    const res = createMockResponse();

    resolveMockOnce(getSession, { userId: 10 });
    rejectMockOnce(roadmapGraphGetStateMock, new Error("missing"));

    await saveRoadmap(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
  });

  it("rejects when snapshot has no modules", async () => {
    const req = createMockRequest({
      body: { threadId: "t", topic: "Topic" },
      cookies: { "session-id": "abc" },
    });
    const res = createMockResponse();

    resolveMockOnce(getSession, { userId: 10 });
    resolveMockOnce(roadmapGraphGetStateMock, { values: { modules: [] } });

    await saveRoadmap(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
  });

  it("persists roadmap modules and dependencies", async () => {
    const req = createMockRequest({
      body: {
        threadId: "t",
        topic: "Topic",
        goal: "Goal",
        difficulty: "medium",
        tags: ["ai"],
      },
      cookies: { "session-id": "abc" },
    });
    const res = createMockResponse();

    resolveMockOnce(getSession, { userId: 10 });
    const snapshotModules = [
      {
        title: "On Ramp",
        description: "Start",
        lessons: [
          {
            title: "Basics",
            description: "desc",
            estimatedTimeHours: 1,
            recommendedResources: ["Res1"],
            masteryCheck: "Check",
          },
        ],
      },
      {
        title: "Deep Dive",
        description: "Go deeper",
        lessons: [
          {
            title: "Lesson",
            description: "desc",
            estimatedTimeHours: 2,
            recommendedResources: ["Res2"],
            masteryCheck: "Check",
          },
        ],
      },
    ];

    resolveMockOnce(roadmapGraphGetStateMock, {
      values: {
        modules: snapshotModules,
        topic: "Resolved Topic",
        domain: "AI",
        requiresPrereqs: true,
        bootstrapSummary: { summary: "boot" },
        graphContext: { focus: "graph" },
        prerequisitePlan: { steps: [] },
      },
    });

  enqueueInsertOperation({ returning: [{ pathId: 200 }] });
  enqueueInsertOperation({ returning: [{ moduleId: 300 }] });
  enqueueInsertOperation({ resolved: [] });
  enqueueInsertOperation({ returning: [{ moduleId: 301 }] });
  enqueueInsertOperation({ resolved: [] });
  enqueueInsertOperation({ resolved: [] });
    enqueueUpdateOperation({ resolved: [] });

    await saveRoadmap(req as Request, res as Response);

    expect(mockDb.transaction).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED);
    const payload = (res as unknown as { payload: any }).payload;
    expect(payload.success).toBe(true);
    expect(payload.pathId).toBe(200);
    expect(payload.topic).toBe("Resolved Topic");
    expect(payload.savedModules).toHaveLength(2);
    expect(payload.dependencies).toHaveLength(1);
    expect(payload.progress.modules[0]).toMatchObject({
      moduleId: 300,
      lessons: [expect.objectContaining({ completed: false })],
    });
  });
});

describe("setLearningPathVisibility", () => {
  it("requires authentication", async () => {
    const req = createMockRequest({ user_id: undefined, params: { pathId: "1" }, body: { visibility: "public" } });
    const res = createMockResponse();

    await setLearningPathVisibility(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
  });

  it("validates payload", async () => {
    const req = createMockRequest({ user_id: 10, params: { pathId: "abc" }, body: {} });
    const res = createMockResponse();

    await setLearningPathVisibility(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
  });

  it("returns 404 for missing path", async () => {
    const req = createMockRequest({ user_id: 10, params: { pathId: "1" }, body: { visibility: "public" } });
    const res = createMockResponse();

    mockDb.query.learningPath.findFirst.mockResolvedValueOnce(null);

    await setLearningPathVisibility(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
  });

  it("forbidden for different owner", async () => {
    const req = createMockRequest({ user_id: 10, params: { pathId: "1" }, body: { visibility: "public" } });
    const res = createMockResponse();

    mockDb.query.learningPath.findFirst.mockResolvedValueOnce({ pathId: 1, userId: 99, visibility: "private" });

    await setLearningPathVisibility(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.FORBIDDEN);
  });

  it("updates visibility", async () => {
    const req = createMockRequest({ user_id: 10, params: { pathId: "1" }, body: { visibility: "public" } });
    const res = createMockResponse();

    mockDb.query.learningPath.findFirst.mockResolvedValueOnce({ pathId: 1, userId: 10, visibility: "private" });

    await setLearningPathVisibility(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(res.payload).toMatchObject({ success: true, visibility: "public" });
  });
});

describe("getModuleQuizzes", () => {
  it("returns quizzes for a module", async () => {
    const req = createMockRequest({ user_id: 10, params: { pathId: "4", moduleId: "7" } });
    const res = createMockResponse();

    mockDb.query.learningPath.findFirst.mockResolvedValueOnce({ pathId: 4, userId: 10, visibility: "private" });
    mockDb.query.learningPathModule.findFirst.mockResolvedValueOnce({ pathModuleId: 99 });

    const quizRow = {
      quiz: {
        quizId: 5,
        moduleId: 7,
        pathId: 4,
        lessonIndex: 1,
        title: "Module Quiz",
        description: null,
        assessmentType: "quiz",
        metadata: { passingPercentage: 65 },
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
      question: {
        questionId: 11,
        quizId: 5,
        prompt: "What is AI?",
        questionType: "single",
        choices: ["ML", "DL"],
        answer: "ML",
        explanation: "Because",
        metadata: {},
        createdAt: "2024-01-01T00:00:00.000Z",
      },
    };

    enqueueSelectResult([quizRow, { quiz: quizRow.quiz, question: null }]);

    await getModuleQuizzes(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    const payload = (res as unknown as { payload: any }).payload;
    expect(payload.success).toBe(true);
    expect(payload.quizzes).toHaveLength(1);
    expect(payload.quizzes[0]).toMatchObject({
      quizId: 5,
      pathId: 4,
      moduleId: 7,
      passingPercentage: 65,
      questionCount: 1,
    });
    expect(payload.quizzes[0].questions[0]).toMatchObject({
      questionId: 11,
      choices: ["ML", "DL"],
      prompt: "What is AI?",
    });
  });
});

describe("submitQuizAssessment", () => {
  it("scores answers and records results", async () => {
    const req = createMockRequest({
      user_id: 10,
      params: { pathId: "4", moduleId: "7", quizId: "5" },
      body: { answers: [{ questionId: 11, answer: "ML" }] },
    });
    const res = createMockResponse();

    mockDb.query.learningPath.findFirst.mockResolvedValueOnce({ pathId: 4, userId: 10 });

    const quizRow = {
      quiz: {
        quizId: 5,
        moduleId: 7,
        pathId: 4,
        lessonIndex: 1,
        title: "Module Quiz",
        description: null,
        assessmentType: "quiz",
        metadata: { passingPercentage: 60 },
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
      question: {
        questionId: 11,
        quizId: 5,
        prompt: "What is AI?",
        questionType: "single",
        choices: ["ML", "DL"],
        answer: "ML",
        explanation: "Because",
        metadata: {},
        createdAt: "2024-01-01T00:00:00.000Z",
      },
    };

    enqueueSelectResult([quizRow]);
    enqueueInsertOperation({ resolved: [] });
    enqueueInsertOperation({ resolved: [] });

    await submitQuizAssessment(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    const payload = (res as unknown as { payload: any }).payload;
    expect(payload.success).toBe(true);
    expect(payload.passed).toBe(true);
    expect(payload.correctCount).toBe(1);
    expect(payload.totalQuestions).toBe(1);
    expect(payload.results[0]).toMatchObject({
      questionId: 11,
      isCorrect: true,
      correctAnswer: "ML",
    });
    expect(mockDb.transaction).toHaveBeenCalled();
  });
});

describe("listPublicRoadmaps", () => {
  it("validates query", async () => {
    const req = createMockRequest({ query: { limit: "-1" } });
    const res = createMockResponse();

    await listPublicRoadmaps(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
  });

  it("returns paginated data", async () => {
    const req = createMockRequest({ query: { limit: "2", offset: "1", search: "AI", difficulty: "easy" } });
    const res = createMockResponse();

    enqueueSelectResult([
      {
        pathId: 5,
        title: "Goal",
        topic: "Query",
        difficultyLevel: "easy",
        tags: ["ai"],
        createdAt: "2024-01-01",
        updatedAt: "2024-01-02",
        ownerId: 10,
        ownerName: "Alice",
        moduleCount: 4,
        studyGroupCount: 2,
      },
    ]);
    enqueueSelectResult([{ total: 1 }]);

    await listPublicRoadmaps(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    const payload = (res as unknown as { payload: any }).payload;
    expect(payload.data).toHaveLength(1);
    expect(payload.pagination).toEqual({ total: 1, limit: 2, offset: 1 });
    expect(payload.data[0]).toMatchObject({
      pathId: 5,
      visibility: "public",
      owner: { userId: 10, userName: "Alice" },
    });
  });
});
