import "dotenv/config";
import { afterAll } from "@jest/globals";

afterAll(async () => {
	const { knowledgeGraphClient } = await import("../../src/agents/roadmapGenerator/services/graphClient");
	await knowledgeGraphClient.close();
});
