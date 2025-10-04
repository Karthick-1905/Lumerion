import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import { type BaseMessage } from "@langchain/core/messages";

export type AnyRecord = Record<string, any>;

export interface PlannerAgentOutput {
	domain: string;
	requiresPrereqs: boolean;
	reasoning: string;
	searchQueries: string[];
}

export interface SearchResultSnippet {
	title: string;
	url: string;
	content: string;
	score?: number;
}

export interface SearchQueryResult {
	query: string;
	queryIndex: number;
	results: SearchResultSnippet[];
	totalResults: number;
	error?: string;
}

export interface RoadmapLesson {
	title: string;
	description: string;
	estimatedTimeHours: number | null;
}

export interface RoadmapModule {
	title: string;
	description: string;
	lessons: RoadmapLesson[];
}

export interface RoadmapPlannerOutput {
	modules: RoadmapModule[];
}

export interface SearchQueriesToolInput {
	searchQueries: string[];
}

export type SearchQueriesToolOutput = SearchQueryResult[];

export const RoadmapInputAnnotation = Annotation.Root({
	messages: Annotation<BaseMessage[]>({
		reducer: messagesStateReducer,
		default: () => [],
	}),
});

export const RoadmapStateAnnotation = Annotation.Root({
	messages: Annotation<BaseMessage[]>({
		reducer: messagesStateReducer,
		default: () => [],
	}),
	domain: Annotation<string | null>({
		reducer: (_left, right) => right,
		default: () => null,
	}),
	requiresPrereqs: Annotation<boolean | null>({
		reducer: (_left, right) => right,
		default: () => null,
	}),
	reasoning: Annotation<string | null>({
		reducer: (_left, right) => right,
		default: () => null,
	}),
	searchQueries: Annotation<string[]>({
		default: () => [],
		reducer: (_left, right) => right,
	}),
	searchResults: Annotation<SearchQueryResult[]>({
		default: () => [],
		reducer: (_left, right) => right,
	}),
	modules: Annotation<RoadmapModule[]>({
		default: () => [],
		reducer: (_left, right) => right,
	}),
});

export type RoadmapInputState = typeof RoadmapInputAnnotation.State;

export type RoadmapGraphState = typeof RoadmapStateAnnotation.State;

export type PlanningNodeInput = Pick<RoadmapGraphState, "messages">;

export type PlanningNodeOutput = Pick<
	RoadmapGraphState,
	"domain" | "requiresPrereqs" | "reasoning" | "searchQueries"
>;

export type SearchNodeInput = Pick<RoadmapGraphState, "messages" | "searchQueries">;

export type SearchNodeOutput = Pick<
	RoadmapGraphState,
	"messages" | "searchResults"
>;

export type RoadmapNodeInput = Pick<
	RoadmapGraphState,
	"domain" | "requiresPrereqs" | "reasoning" | "searchResults"
>;

export type RoadmapNodeOutput = Pick<RoadmapGraphState, "modules">;
