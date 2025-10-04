import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ToolMessage, type BaseMessage } from "@langchain/core/messages";
import type { RunnableConfig } from "@langchain/core/runnables";
import { z } from "zod";
import  dotenv from 'dotenv'
dotenv.config({path: '../../.env'})
import  type {
	PlanningNodeInput,
	PlanningNodeOutput,
	SearchNodeInput,
	SearchNodeOutput,
	RoadmapNodeInput,
	RoadmapNodeOutput,
} from "./state.ts";
import { plannerPromptTemplate, roadmapAgentPromptTemplate } from "./prompt.ts";
import { searchQueriesTool } from "./tool.ts";

const plannerOutputSchema = z.object({
	domain: z.string().min(1, "Planner must specify a domain"),
	requires_prereqs: z.boolean(),
	reasoning: z.string().min(1, "Planner must explain reasoning"),
	search_queries: z.array(z.string().min(1)).min(1),
});

const roadmapLessonSchema = z.object({
	title: z.string().min(1),
	description: z.string().min(1),
	estimated_time_hours: z.number().nonnegative().nullable().optional(),
});

const roadmapModuleSchema = z.object({
	title: z.string().min(1),
	description: z.string().min(1),
	lessons: z.array(roadmapLessonSchema).min(1),
});

const roadmapOutputSchema = z.object({
	modules: z.array(roadmapModuleSchema).min(1),
});

const resolveGoogleApiKey = (): string | undefined => {
	const maybeProcess = (globalThis as {
		process?: { env?: Record<string, string | undefined> };
	}).process;
	return 'AIzaSyBAhv90q-tiwl77Ij6pWOEjLfuRsCwon-o';
};

const MAX_RESULTS_PER_QUERY = 2;
const MAX_SNIPPET_LENGTH = 240;

type PlannerChain = ReturnType<typeof plannerPromptTemplate.pipe> | null;
type RoadmapChain = ReturnType<typeof roadmapAgentPromptTemplate.pipe> | null;

let plannerChainInstance: PlannerChain = null;
let roadmapChainInstance: RoadmapChain = null;

type PlannerAgentRawOutput = {
	domain: string;
	requires_prereqs: boolean;
	reasoning: string;
	search_queries: string[];
};

type RoadmapPlannerRawLesson = {
	title: string;
	description: string;
	estimated_time_hours: number | null | undefined;
};

type RoadmapPlannerRawModule = {
	title: string;
	description: string;
	lessons: RoadmapPlannerRawLesson[];
};

type RoadmapPlannerRawOutput = {
	modules: RoadmapPlannerRawModule[];
};

export const getPlannerChain = () => {
	if (!plannerChainInstance) {
		const apiKey = resolveGoogleApiKey()
		if (!apiKey) {
			throw new Error(
				"Google Generative AI API key missing. Set GOOGLE_API_KEY before invoking the planner chain.",
			);
		}
		const plannerModel = new ChatGoogleGenerativeAI({
			model: "gemini-2.0-flash",
			temperature: 0,
			apiKey,
		});
		plannerChainInstance = plannerPromptTemplate.pipe(
			plannerModel.withStructuredOutput(plannerOutputSchema),
		);
	}
	return plannerChainInstance;
};

export const getRoadmapChain = () => {
	if (!roadmapChainInstance) {
		const apiKey = resolveGoogleApiKey();
		if (!apiKey) {
			throw new Error(
				"Google Generative AI API key missing. Set GOOGLE_API_KEY before invoking the roadmap chain.",
			);
		}
		const roadmapModel = new ChatGoogleGenerativeAI({
			model: "gemini-2.0-flash",
			temperature: 0,
			apiKey,
		});
		roadmapChainInstance = roadmapAgentPromptTemplate.pipe(
			roadmapModel.withStructuredOutput(roadmapOutputSchema),
		);
	}
	return roadmapChainInstance;
};

const messageContentToString = (message: BaseMessage): string => {
	const { content } = message;

	if (typeof content === "string") {
		return content;
	}

	if (Array.isArray(content)) {
		return content
			.map((item) => {
				if (typeof item === "string") {
					return item;
				}
				if (item && typeof item === "object" && "text" in item) {
					return typeof item.text === "string" ? item.text : "";
				}
				return "";
			})
			.filter(Boolean)
			.join("\n");
	}

	if (content && typeof content === "object" && "text" in content) {
		return typeof (content as { text?: unknown }).text === "string"
			? ((content as { text?: string }).text ?? "")
			: "";
	}

	return JSON.stringify(content);
};

export const planningNode = async (
	state: PlanningNodeInput,
	config?: RunnableConfig,
): Promise<PlanningNodeOutput> => {
	const lastMessage = state.messages.at(-1);
	if (!lastMessage) {
		throw new Error("Planning node requires at least one user message.");
	}

	const userQuery = messageContentToString(lastMessage).trim();
	if (!userQuery) {
		throw new Error("User query for planning node is empty.");
	}

	const planningChain = getPlannerChain();
	const planningResponse = (await planningChain.invoke(
		{ user_query: userQuery },
		config,
	)) as PlannerAgentRawOutput;

	return {
		domain: planningResponse.domain,
		requiresPrereqs: planningResponse.requires_prereqs,
		reasoning: planningResponse.reasoning,
		searchQueries: planningResponse.search_queries,
	};
};

export const searchNode = async (
	state: SearchNodeInput,
	config?: RunnableConfig,
): Promise<SearchNodeOutput> => {
	const queries = state.searchQueries ?? [];

	if (!queries.length) {
		throw new Error("Search node expected search queries but received none.");
	}

	const searchResults = await searchQueriesTool.invoke(
		{ searchQueries: queries },
		config,
	);

	const totalResults = searchResults.reduce(
		(acc, entry) => acc + (entry.totalResults ?? 0),
		0,
	);

	const toolMessage = new ToolMessage({
		content: `Search completed. Found ${totalResults} total results across ${searchResults.length} queries.`,
		tool_call_id: "search_queries_tool",
		status: "success",
	});

	return {
		messages: [toolMessage],
		searchResults,
	};
};

export const roadmapNode = async (
	state: RoadmapNodeInput,
	config?: RunnableConfig,
): Promise<RoadmapNodeOutput> => {
	const { domain, requiresPrereqs, reasoning, searchResults } = state;

	if (!domain) {
		throw new Error("Roadmap node missing domain classification.");
	}

	if (requiresPrereqs === undefined || requiresPrereqs === null) {
		throw new Error("Roadmap node missing prerequisite decision.");
	}

	if (!reasoning) {
		throw new Error("Roadmap node missing planning reasoning.");
	}

	if (!searchResults?.length) {
		throw new Error("Roadmap node requires search results to proceed.");
	}

	const searchResultsSummary = searchResults
		.map((queryResult) => {
			const topResults = queryResult.results
				.slice(0, MAX_RESULTS_PER_QUERY)
				.map((result) => {
					const snippet = (result.content ?? "")
						.replace(/\s+/g, " ")
						.slice(0, MAX_SNIPPET_LENGTH)
						.trim();
					return `- ${result.title} (${result.url}) :: ${snippet}`;
				})
				.join("\n");

			return `Query: ${queryResult.query}\n${topResults}`;
		})
		.join("\n\n");

	const roadmapChain = getRoadmapChain();
	const roadmapResponse = (await roadmapChain.invoke(
		{
			domain,
			requires_prereqs: requiresPrereqs,
			reasoning,
			search_results: searchResultsSummary,
		},
		config,
	)) as RoadmapPlannerRawOutput;

	const modules = roadmapResponse.modules.map((module) => ({
		title: module.title,
		description: module.description,
		lessons: module.lessons.map((lesson) => ({
			title: lesson.title,
			description: lesson.description,
			estimatedTimeHours:
				lesson.estimated_time_hours === undefined ||
				lesson.estimated_time_hours === null
					? null
					: lesson.estimated_time_hours,
		})),
	}));

	return { modules };
};

export const roadmapNodes = {
	planningNode,
	searchNode,
	roadmapNode,
};

export const roadmapChains = {
	getPlannerChain,
	getRoadmapChain,
};
