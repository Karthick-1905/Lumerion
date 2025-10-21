import { jest, describe, it, expect } from "@jest/globals";
import request from "supertest";

jest.unstable_mockModule("../../src/agents/roadmapGenerator/graph", () => ({
  roadmapGraph: {
    invoke: jest.fn(),
    getState: jest.fn(),
  },
  roadmapGraphDebug: {},
  runRoadmapWithReflectionLoop: jest.fn(),
}));

const appModule = await import("../../src/app");
const app = appModule.default;

describe("GET /api/health-check", () => {
  it("returns the service status", async () => {
    const response = await request(app).get("/api/health-check");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true });
    expect(typeof response.body.message).toBe("string");
  });
});
