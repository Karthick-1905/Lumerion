import "dotenv/config";
import { afterAll } from "@jest/globals";

afterAll(async () => {
	const { knowledgeGraphClient } = await import("../../src/agents/notes/services/graphClient");
	await knowledgeGraphClient.close();
});
