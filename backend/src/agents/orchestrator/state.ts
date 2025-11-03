import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import { type BaseMessage } from "@langchain/core/messages";
import {
    ContextBootstrapSummary,
    LearnerProfileSnapshot,
    PrerequisitePlanSummary,
    RoadmapModule,
} from "../roadmap/state";
import { NotionNote } from "../notes/state";
import { Quiz } from "../quizzes/state";

export interface OrchestratorOutput {
    roadmap: RoadmapModule[];
    notes: NotionNote[];
    quizzes: Quiz[];
}

export const OrchestratorStateAnnotation = Annotation.Root({
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
    domain: Annotation<string | null>({
        reducer: (_left, right) => right,
        default: () => null,
    }),
    requiresPrereqs: Annotation<boolean | null>({
        reducer: (_left, right) => right,
        default: () => null,
    }),
    bootstrapSummary: Annotation<ContextBootstrapSummary | null>({
        reducer: (_left, right) => right,
        default: () => null,
    }),
    prerequisitePlan: Annotation<PrerequisitePlanSummary | null>({
        reducer: (_left, right) => right,
        default: () => null,
    }),
    // Outputs from subgraphs
    roadmapModules: Annotation<RoadmapModule[]>({
        reducer: (_left, right) => right,
        default: () => [],
    }),
    notes: Annotation<NotionNote[]>({
        reducer: (_left, right) => right,
        default: () => [],
    }),
    quizzes: Annotation<Quiz[]>({
        reducer: (_left, right) => right,
        default: () => [],
    }),
    finalOutput: Annotation<OrchestratorOutput | null>({
        reducer: (_left, right) => right,
        default: () => null,
    }),
});

export type OrchestratorGraphState = typeof OrchestratorStateAnnotation.State;