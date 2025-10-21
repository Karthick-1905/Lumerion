import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import type { RunnableConfig } from "@langchain/core/runnables";

const chainInvokeMock = jest.fn() as jest.MockedFunction<(input: unknown, config?: unknown) => Promise<unknown>>;
const pipeMock = jest.fn(() => ({ invoke: chainInvokeMock })) as jest.MockedFunction<
  (model: unknown) => { invoke: typeof chainInvokeMock }
>;

const withStructuredOutputMock = jest.fn(() => ({
  invoke: chainInvokeMock,
})) as jest.MockedFunction<
  (schema: unknown) => { invoke: typeof chainInvokeMock }
>;

const createGeminiModelMock = jest.fn(() => ({
  withStructuredOutput: withStructuredOutputMock,
})) as jest.MockedFunction<
  (options: Record<string, unknown>) => { withStructuredOutput: typeof withStructuredOutputMock }
>;

const userProfileInvokeMock = jest.fn() as jest.MockedFunction<(input: unknown) => Promise<unknown>>;

jest.unstable_mockModule("../../src/agents/roadmapGenerator/prompt", () => ({
  contextBootstrapPromptTemplate: { pipe: pipeMock },
}));

jest.unstable_mockModule("../../src/agents/roadmapGenerator/utils/modelProvider", () => ({
  createGeminiModel: createGeminiModelMock,
}));

jest.unstable_mockModule("../../src/agents/roadmapGenerator/tool", () => ({
  userProfileTool: { invoke: userProfileInvokeMock },
}));

const { contextBootstrapNode } = await import("../../src/agents/roadmapGenerator/nodes/contextBootstrap");
const { messageContentToString } = await import("../../src/agents/roadmapGenerator/utils/messages");
const { normaliseStringList } = await import("../../src/agents/roadmapGenerator/utils/text");

const resetMocks = () => {
  chainInvokeMock.mockReset();
  pipeMock.mockReset();
  pipeMock.mockReturnValue({ invoke: chainInvokeMock });
  withStructuredOutputMock.mockReset();
  withStructuredOutputMock.mockReturnValue({ invoke: chainInvokeMock });
  createGeminiModelMock.mockReset();
  createGeminiModelMock.mockReturnValue({ withStructuredOutput: withStructuredOutputMock });
  userProfileInvokeMock.mockReset();
};

beforeEach(() => {
  resetMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("contextBootstrapNode", () => {
  it("throws when messages array is empty", async () => {
    await expect(contextBootstrapNode({ messages: [] })).rejects.toThrow(
      "Context bootstrap node requires at least one user message.",
    );
  });

  it("throws when user query is empty", async () => {
    const state = { messages: [{ content: "   " } as any] };
    await expect(contextBootstrapNode(state)).rejects.toThrow("User query for context bootstrap node is empty.");
  });

  it("loads learner profile and maps bootstrap summary", async () => {
    const rawOutput = {
      topic_statement: "machine learning",
      learner_persona: "Working professional",
      experience_summary: "Basic statistics",
      learning_objectives: ["Build models"],
      knowledge_gaps: ["Deep learning"],
      learning_constraints: ["Limited time"],
      learning_preferences: ["Hands-on"],
      success_criteria: ["Deploy project"],
      other_notes: "Needs mentorship",
    };

    chainInvokeMock.mockResolvedValueOnce(rawOutput);
    userProfileInvokeMock.mockResolvedValueOnce({
      success: true,
      profile: {
        userId: 7,
        userName: "Alex",
        userEmail: "alex@example.com",
        avatarUrl: null,
        isVerified: true,
        createdAt: "2024-01-01",
        updatedAt: "2024-01-02",
      },
      metrics: { totalLearningPaths: 3, completedModules: 2 },
      recentLearningPaths: [
        {
          pathId: 1,
          title: "Data Science",
          query: "Learn DS",
          moduleCount: 5,
          createdAt: "2023-12-01",
          updatedAt: "2023-12-10",
        },
      ],
    });

    const state: any = {
      messages: [{ content: "Help me learn ML" } as any],
      domain: "",
      requiresPrereqs: undefined,
    };
    const config: RunnableConfig = { configurable: { userId: 7 } };

    const result = await contextBootstrapNode(state, config);

    expect(createGeminiModelMock).toHaveBeenCalledWith({ temperature: 0 });
    expect(pipeMock).toHaveBeenCalled();
    expect(chainInvokeMock).toHaveBeenCalledTimes(1);
    const [promptInput, promptConfig] = chainInvokeMock.mock.calls[0];
    expect(promptConfig).toBe(config);
    expect(promptInput).toMatchObject({ user_query: "Help me learn ML" });
    expect(typeof (promptInput as any).learner_profile_json).toBe("string");
    expect(JSON.parse((promptInput as any).learner_profile_json)).toMatchObject({
      userId: 7,
      metrics: { totalLearningPaths: 3, completedModules: 2 },
    });
    expect(userProfileInvokeMock).toHaveBeenCalledWith({ userId: 7, includePaths: true, limit: 5 });
    expect(result.topic).toBe("machine learning");
    expect(result.domain).toBe("machine learning");
    expect(result.requiresPrereqs).toBe(false);
    expect(result.bootstrapSummary.learningObjectives).toEqual(["Build models"]);
    expect(result.learnerProfile?.metrics).toEqual({ totalLearningPaths: 3, completedModules: 2 });
    expect(result.learnerProfile?.recentLearningPaths[0]).toEqual(
      expect.objectContaining({ pathId: 1, moduleCount: 5 }),
    );
  });

  it("handles learner profile errors gracefully", async () => {
    chainInvokeMock.mockResolvedValueOnce({
      topic_statement: "data engineering",
      learner_persona: "Professional",
      experience_summary: "SQL",
      learning_objectives: ["Pipelines"],
      knowledge_gaps: [],
      learning_constraints: [],
      learning_preferences: [],
      success_criteria: [],
      other_notes: null,
    });

    userProfileInvokeMock.mockRejectedValueOnce(new Error("profile failure"));
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);

  const config: RunnableConfig = { configurable: { userId: 9 } };
  const result = await contextBootstrapNode({ messages: [{ content: "Learn DE" } as any] }, config);

    expect(warnSpy).toHaveBeenCalled();
  expect(userProfileInvokeMock).toHaveBeenCalledWith({ userId: 9, includePaths: true, limit: 5 });
    expect(result.learnerProfile).toBeNull();
    expect(result.topic).toBe("data engineering");
  });
});

describe("agent utilities", () => {
  it("converts composite message content to string", () => {
    const message = {
      content: [
        "Hello",
        { text: "World" },
        { text: 123 },
      ],
    } as any;

    expect(messageContentToString(message)).toBe("Hello\nWorld");
  });

  it("normalises string lists", () => {
    expect(normaliseStringList(["  example", "Example", "another"]).join(", ")).toBe("Example, Another");
    expect(normaliseStringList(null)).toEqual([]);
  });
});
