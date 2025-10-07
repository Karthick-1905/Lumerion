import { TavilySearch } from "@langchain/tavily";
import type { TavilySearchResponse } from "@langchain/tavily";
import { tool } from "@langchain/core/tools";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "../../drizzle/index.ts";
import {
	learningPath,
	learningPathModule,
	userModuleProgress,
	users,
} from "../../drizzle/schema.ts";

import type {
	SearchQueriesToolInput,
	SearchQueriesToolOutput,
} from "./state";
const resolveTavilyApiKey = (): string | undefined => {
	const maybeProcess = (globalThis as {
		process?: { env?: Record<string, string | undefined> };
	}).process;
	return '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'
};

let tavilySearch: TavilySearch | null = null;

const getTavilySearch = (): TavilySearch => {
	if (!tavilySearch) {
		const apiKey = resolveTavilyApiKey();
		if (!apiKey) {
			throw new Error(
				"Tavily API key not found. Set the TAVILY_API_KEY environment variable before invoking the search tool.",
			);
		}
		tavilySearch = new TavilySearch({
			maxResults: 5,
			searchDepth: "advanced",
			tavilyApiKey: apiKey,
		});
	}
	return tavilySearch;
};

const searchQueriesToolSchema = z.object({
	searchQueries: z
		.array(z.string().min(1, "Search query cannot be empty"))
		.min(1, "Provide at least one search query"),
});

const userProfileToolSchema = z.object({
	userId: z.number().int().positive(),
	includePaths: z.boolean().optional().default(true),
	limit: z.number().int().positive().max(25).optional().default(5),
});

export const searchQueriesTool = tool(
	async (input: any): Promise<SearchQueriesToolOutput> => {
		const { searchQueries } = input as SearchQueriesToolInput;

		const results: SearchQueriesToolOutput = [];

		for (const [index, query] of searchQueries.entries()) {
			try {
				const searchClient = getTavilySearch();
				const response: TavilySearchResponse | { error: string } =
					await searchClient.invoke({
					query,
					searchDepth: "advanced",
					});

				if ("error" in response) {
					const errorMessage =
						typeof response.error === "string"
							? response.error
							: "Unknown Tavily search error";
					results.push({
						query,
						queryIndex: index + 1,
						results: [],
						totalResults: 0,
						error: errorMessage,
					});
					continue;
				}

				const structuredResults = response.results.map(
					(result: TavilySearchResponse["results"][number]) => ({
					title: result.title ?? "",
					url: result.url ?? "",
					content: (result.content ?? "").slice(0, 500),
					score: result.score,
					}),
				);

				results.push({
					query,
					queryIndex: index + 1,
					results: structuredResults,
					totalResults: structuredResults.length,
				});
			} catch (error) {
				const message =
					error instanceof Error ? error.message : "Unknown Tavily search error";
				results.push({
					query,
					queryIndex: index + 1,
					results: [],
					totalResults: 0,
					error: message,
				});
			}
		}

		return results;
	},
	{
		name: "search_queries_tool",
		description:
			"Execute multiple Tavily web searches and return structured summaries for each query.",
		schema: searchQueriesToolSchema,
	},
);

export type SearchQueriesTool = typeof searchQueriesTool;

export const userProfileTool = tool(
	async (rawInput: unknown) => {
		const { userId, includePaths, limit } = userProfileToolSchema.parse(rawInput);

		const profile = await db.query.users.findFirst({
			columns: {
				userId: true,
				userName: true,
				userEmail: true,
				avatarPublicUrl: true,
				isVerified: true,
				createdAt: true,
				updatedAt: true,
			},
			where: eq(users.userId, userId),
		});

		if (!profile) {
			return {
				success: false,
				reason: "User not found",
			};
		}

		const [{ totalLearningPaths }] = await db
			.select({ totalLearningPaths: sql<number>`count(*)::int` })
			.from(learningPath)
			.where(eq(learningPath.userId, userId));

		const [{ completedModules }] = await db
			.select({ completedModules: sql<number>`count(*)::int` })
			.from(userModuleProgress)
			.where(
				and(
					eq(userModuleProgress.userId, userId),
					eq(userModuleProgress.status, "completed"),
				),
			);

		let recentLearningPaths: Array<{
			pathId: number;
			title: string | null;
			query: string | null;
			moduleCount: number;
			createdAt: string | null;
			updatedAt: string | null;
		}> = [];

		if (includePaths) {
			recentLearningPaths = await db
				.select({
					pathId: learningPath.pathId,
					title: learningPath.userGoal,
					query: learningPath.userQuery,
					moduleCount: sql<number>`count(${learningPathModule.moduleId})::int`,
					createdAt: learningPath.createdAt,
					updatedAt: learningPath.updatedAt,
				})
				.from(learningPath)
				.leftJoin(
					learningPathModule,
					eq(learningPathModule.pathId, learningPath.pathId),
				)
				.where(eq(learningPath.userId, userId))
				.groupBy(learningPath.pathId)
				.orderBy(desc(learningPath.updatedAt))
				.limit(limit);
		}

		return {
			success: true,
			profile: {
				userId: profile.userId,
				userName: profile.userName,
				userEmail: profile.userEmail,
				avatarUrl: profile.avatarPublicUrl ?? null,
				isVerified: profile.isVerified ?? false,
				createdAt: profile.createdAt ?? null,
				updatedAt: profile.updatedAt ?? null,
			},
			metrics: {
				totalLearningPaths: totalLearningPaths ?? 0,
				completedModules: completedModules ?? 0,
			},
			recentLearningPaths,
		};
	},
	{
		name: "user_profile_tool",
		description:
			"Fetch a learner's profile, learning-path metrics, and recent paths for personalisation.",
		schema: userProfileToolSchema,
	},
);

export type UserProfileTool = typeof userProfileTool;