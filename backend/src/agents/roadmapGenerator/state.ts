import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import { type BaseMessage } from "@langchain/core/messages";

export type AnyRecord = Record<string, any>;

export interface RoadmapLesson {
	title: string;
	description: string;
	estimatedTimeHours: number | null;
	recommendedResources: string[];
	masteryCheck?: string | null;
}

export interface RoadmapModule {
	title: string;
	description: string;
	lessons: RoadmapLesson[];
}

export interface LearnerProfileMetrics {
	totalLearningPaths: number;
	completedModules: number;
}

export interface LearnerPathSnapshot {
	pathId: number;
	title: string | null;
	query: string | null;
	moduleCount: number;
	createdAt: string | null;
	updatedAt: string | null;
}

export interface LearnerProfileSnapshot {
	userId: number;
	userName: string | null;
	userEmail: string | null;
	avatarUrl: string | null;
	isVerified: boolean;
	createdAt: string | null;
	updatedAt: string | null;
	metrics: LearnerProfileMetrics;
	recentLearningPaths: LearnerPathSnapshot[];
}

export interface ContextBootstrapSummary {
	topicStatement: string;
	learnerPersona: string;
	experienceSummary: string;
	learningObjectives: string[];
	knowledgeGaps: string[];
	learningConstraints: string[];
	learningPreferences: string[];
	successCriteria: string[];
	otherNotes?: string;
}

export interface GraphConceptSummary {
	conceptId: string;
	name: string;
	conceptType?: string | null;
	description?: string | null;
	difficulty?: string | null;
	importance?: number | null;
	readiness?: number | null;
	recommendedDurationHours?: number | null;
	links?: string[];
}

export interface GraphResourceSummary {
	resourceId: string;
	title: string;
	url: string;
	resourceType?: string | null;
	difficulty?: string | null;
	description?: string | null;
	recommendedOrder?: number | null;
}

export interface GraphContextSnapshot {
	focusConcept: GraphConceptSummary | null;
	directPrerequisites: GraphConceptSummary[];
	supportingConcepts: GraphConceptSummary[];
	relatedResources: GraphResourceSummary[];
	graphNotes?: string;
}

export interface PrerequisitePlanStep {
	conceptId?: string;
	conceptName: string;
	sequence: number;
	categorisation: string;
	justification: string;
	recommendedResources: string[];
	masteryCheck: string;
}

export interface PrerequisitePlanSummary {
	steps: PrerequisitePlanStep[];
	missingFoundations: string[];
	integrationGuidance: string[];
	refresherAdvice: string[];
	summary: string;
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
	topic: Annotation<string | null>({
		reducer: (_left, right) => right,
		default: () => null,
	}),
	learnerProfile: Annotation<LearnerProfileSnapshot | null>({
		reducer: (_left, right) => right,
		default: () => null,
	}),
	bootstrapSummary: Annotation<ContextBootstrapSummary | null>({
		reducer: (_left, right) => right,
		default: () => null,
	}),
	domain: Annotation<string | null>({
		reducer: (_left, right) => right,
		default: () => null,
	}),
	requiresPrereqs: Annotation<boolean | null>({
		reducer: (_left, right) => right,
		default: () => null,
	}),
	graphContext: Annotation<GraphContextSnapshot | null>({
		reducer: (_left, right) => right,
		default: () => null,
	}),
	prerequisitePlan: Annotation<PrerequisitePlanSummary | null>({
		reducer: (_left, right) => right,
		default: () => null,
	}),
	modules: Annotation<RoadmapModule[]>({
		default: () => [],
		reducer: (_left, right) => right,
	}),
	reflection: Annotation<{
		changes: string[];
		retries: number;
	}>({
		default: () => ({ changes: [], retries: 0 }),
		reducer: (left, right) => ({
			changes: Array.isArray(right?.changes) ? right.changes : left.changes,
			retries: typeof right?.retries === 'number' ? right.retries : left.retries,
		}),
	}),
	quizzes: Annotation<{
		quizzes: Array<{
			moduleTitle: string;
			lessonIndex?: number | null;
			questions: Array<{ prompt: string; type?: string; choices?: string[]; answer?: string }>;
		}>;
	}>({
		default: () => ({ quizzes: [] }),
		reducer: (_left, right) => right ?? { quizzes: [] },
	}),
});

export type RoadmapInputState = typeof RoadmapInputAnnotation.State;

export type RoadmapGraphState = typeof RoadmapStateAnnotation.State;

export type ContextBootstrapNodeInput = Pick<RoadmapGraphState, "messages">;

export type ContextBootstrapNodeOutput = Pick<
	RoadmapGraphState,
	"topic" | "bootstrapSummary" | "learnerProfile" | "domain" | "requiresPrereqs"
>;

export type PrerequisiteResolverNodeInput = Pick<
	RoadmapGraphState,
	"topic" | "bootstrapSummary" | "learnerProfile"
>;

export type PrerequisiteResolverNodeOutput = Pick<
	RoadmapGraphState,
	"graphContext" | "prerequisitePlan"
>;

export type CurriculumComposerNodeInput = Pick<
	RoadmapGraphState,
	"topic" | "bootstrapSummary" | "graphContext" | "prerequisitePlan"
>;

export type CurriculumComposerNodeOutput = Pick<RoadmapGraphState, "modules">;
