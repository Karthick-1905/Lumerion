
import { z } from "zod";
import type { RunnableConfig } from "@langchain/core/runnables";

import type {
	ContextBootstrapNodeInput,
	ContextBootstrapNodeOutput,
	ContextBootstrapSummary,
	LearnerProfileSnapshot,
} from "../state.ts";
import { contextBootstrapPromptTemplate } from "../prompt.ts";
import { createGeminiModel } from "../utils/modelProvider.ts";
import { messageContentToString } from "../utils/messages.ts";
import { userProfileTool } from "../tool.ts";
import { normaliseStringList } from "../utils/text.ts";

const contextBootstrapSchema = z.object({
	topic_statement: z.string().min(1, "Topic statement cannot be empty"),
	learner_persona: z.string().min(1, "Learner persona cannot be empty"),
	experience_summary: z.string().min(1, "Experience summary cannot be empty"),
	learning_objectives: z
		.array(z.string().min(1))
		.min(1, "Provide at least one learning objective"),
	knowledge_gaps: z.array(z.string().min(1)).optional().default([]),
	learning_constraints: z.array(z.string().min(1)).optional().default([]),
	learning_preferences: z.array(z.string().min(1)).optional().default([]),
	success_criteria: z.array(z.string().min(1)).optional().default([]),
	other_notes: z.string().optional().nullable(),
});

type ContextBootstrapRawOutput = z.infer<typeof contextBootstrapSchema>;

type UserProfileToolSuccess = {
	success: true;
	profile: {
		userId: number;
		userName: string | null;
		userEmail: string | null;
		avatarUrl: string | null;
		isVerified: boolean;
		createdAt: string | null;
		updatedAt: string | null;
	};
	metrics: {
		totalLearningPaths: number | null;
		completedModules: number | null;
	};
	recentLearningPaths: Array<{
		pathId: number;
		title: string | null;
		query: string | null;
		moduleCount: number | null;
		createdAt: string | null;
		updatedAt: string | null;
	}>;
};

type UserProfileToolFailure = { success: false };

type UserProfileToolResponse = UserProfileToolSuccess | UserProfileToolFailure;

const buildLearnerProfileSnapshot = (
	response: UserProfileToolResponse,
): LearnerProfileSnapshot | null => {
	if (!response || !response.success) {
		return null;
	}

	return {
		userId: response.profile.userId,
		userName: response.profile.userName,
		userEmail: response.profile.userEmail,
		avatarUrl: response.profile.avatarUrl,
		isVerified: response.profile.isVerified,
		createdAt: response.profile.createdAt,
		updatedAt: response.profile.updatedAt,
		metrics: {
			totalLearningPaths: response.metrics.totalLearningPaths ?? 0,
			completedModules: response.metrics.completedModules ?? 0,
		},
		recentLearningPaths: response.recentLearningPaths.map((path) => ({
			pathId: path.pathId,
			title: path.title,
			query: path.query,
			moduleCount: path.moduleCount ?? 0,
			createdAt: path.createdAt ?? null,
			updatedAt: path.updatedAt ?? null,
		})),
	};
};

const mapBootstrapSummary = (
	output: ContextBootstrapRawOutput,
): ContextBootstrapSummary => ({
	topicStatement: output.topic_statement,
	learnerPersona: output.learner_persona,
	experienceSummary: output.experience_summary,
	learningObjectives: normaliseStringList(output.learning_objectives),
	knowledgeGaps: normaliseStringList(output.knowledge_gaps),
	learningConstraints: normaliseStringList(output.learning_constraints),
	learningPreferences: normaliseStringList(output.learning_preferences),
	successCriteria: normaliseStringList(output.success_criteria),
	otherNotes: output.other_notes ? output.other_notes.trim() : undefined,
});

export const contextBootstrapNode = async (
	state: ContextBootstrapNodeInput,
	config?: RunnableConfig,
): Promise<ContextBootstrapNodeOutput> => {
	const lastMessage = state.messages.at(-1);
	if (!lastMessage) {
		throw new Error("Context bootstrap node requires at least one user message.");
	}

	const userQuery = messageContentToString(lastMessage).trim();
	if (!userQuery) {
		throw new Error("User query for context bootstrap node is empty.");
	}

	let learnerProfile: LearnerProfileSnapshot | null = null;

	const maybeUserId = config?.configurable?.userId;
	if (typeof maybeUserId === "number" && Number.isFinite(maybeUserId) && maybeUserId > 0) {
		try {
			const profileResponse = (await userProfileTool.invoke({
				userId: maybeUserId,
				includePaths: true,
				limit: 5,
			})) as UserProfileToolResponse;
			learnerProfile = buildLearnerProfileSnapshot(profileResponse);
		} catch (error) {
			console.warn("Failed to load learner profile for context bootstrap:", error);
		}
	}

	const learnerProfileJson = JSON.stringify(learnerProfile ?? null);

	const model = createGeminiModel({ temperature: 0 });
	const chain = contextBootstrapPromptTemplate.pipe(
		model.withStructuredOutput(contextBootstrapSchema),
	);

	const bootstrapRaw = (await chain.invoke({
		user_query: userQuery,
		learner_profile_json: learnerProfileJson,
	}, config)) as ContextBootstrapRawOutput;


    // TODO : Review This ContextBootStrap Node

	const bootstrapSummary = mapBootstrapSummary(bootstrapRaw);
	const stateDomain = (state as { domain?: unknown }).domain;
	const stateRequiresPrereqs = (state as { requiresPrereqs?: unknown }).requiresPrereqs;
	const fallbackDomain = bootstrapSummary.topicStatement || userQuery;

	return {
		topic: fallbackDomain,
		bootstrapSummary,
		learnerProfile,
		domain:
			typeof stateDomain === "string" && stateDomain.trim().length > 0
				? stateDomain
				: fallbackDomain,
		requiresPrereqs:
			typeof stateRequiresPrereqs === "boolean" ? stateRequiresPrereqs : false,
	};
};
