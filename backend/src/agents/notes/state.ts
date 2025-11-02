import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import { type BaseMessage } from "@langchain/core/messages";
import { RoadmapModule } from "../roadmap/state"; // Import shared types

export interface NotionNote {
    pageId: string;
    title: string;
    content: string;
    url: string;
    createdAt: string;
    updatedAt: string;
}

export interface NotesGenerationOutput {
    notes: NotionNote[];
    summary: string;
}

export const NotesStateAnnotation = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: messagesStateReducer,
        default: () => [],
    }),
    roadmapModules: Annotation<RoadmapModule[]>({
        reducer: (_left, right) => right,
        default: () => [],
    }),
    notes: Annotation<NotionNote[]>({
        default: () => [],
        reducer: (_left, right) => right,
    }),
    summary: Annotation<string | null>({
        reducer: (_left, right) => right,
        default: () => null,
    }),
});

export type NotesGraphState = typeof NotesStateAnnotation.State;