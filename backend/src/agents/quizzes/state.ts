import { Annotation, messagesStateReducer } from "@langchain/langgraph";
import { type BaseMessage } from "@langchain/core/messages";
import { RoadmapModule } from "../roadmap/state"; // Import shared types
import { NotionNote } from "../notes/state"; // Import from notes

export interface QuizQuestion {
    prompt: string;
    type: "multiple_choice" | "true_false" | "short_answer";
    choices?: string[];
    answer: string;
    explanation?: string;
}

export interface Quiz {
    moduleTitle: string;
    lessonIndex: number;
    passingPercentage: number;
    questions: QuizQuestion[];
}

export interface QuizzesGenerationOutput {
    quizzes: Quiz[];
}

export const QuizzesStateAnnotation = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: messagesStateReducer,
        default: () => [],
    }),
    roadmapModules: Annotation<RoadmapModule[]>({
        reducer: (_left, right) => right,
        default: () => [],
    }),
    notes: Annotation<NotionNote[]>({
        reducer: (_left, right) => right,
        default: () => [],
    }),
    quizzes: Annotation<Quiz[]>({
        default: () => [],
        reducer: (_left, right) => right,
    }),
});

export type QuizzesGraphState = typeof QuizzesStateAnnotation.State;