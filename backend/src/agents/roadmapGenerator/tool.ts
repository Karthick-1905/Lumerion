import { TavilySearch } from "@langchain/tavily";
import type { TavilySearchResponse } from "@langchain/tavily";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

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