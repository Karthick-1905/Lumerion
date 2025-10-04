import { z } from "zod";

export type LessonJson = Record<string, unknown>;

export type LearningPathListItem = {
    pathId: number;
    query: string | null;
    goal: string | null;
    difficulty: string | null;
    tags: string[];
    moduleCount: number;
    createdAt: string | null;
    updatedAt: string | null;
    lastUpdatedAt: string | null;
};

export type ModuleProgressPayload = {
    status: string;
    completionPercent: number;
    lastAccessed: string | null;
};

export type ModulePayload = {
    pathModuleId: number;
    moduleId: number;
    title: string | null;
    description: string | null;
    position: number | null;
    estimatedDuration: number | null;
    difficulty: string | null;
    isOptional: boolean;
    isLocked: boolean;
    lessons: LessonJson[];
    progress: ModuleProgressPayload | null;
    createdAt: string | null;
    updatedAt: string | null;
};

export type LearningPathPayload = {
    pathId: number;
    query: string | null;
    goal: string | null;
    difficulty: string | null;
    tags: string[];
    createdAt: string | null;
    updatedAt: string | null;
    progress: unknown;
    moduleCount: number;
    modules: ModulePayload[];
};

export const updateLessonSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    estimatedTimeHours: z.number().nonnegative().optional(),
    completed: z.boolean().optional(),
}).catchall(z.unknown());

export const updateModuleSchema = z.object({
    pathModuleId: z.number().int().positive(),
    title: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    lessons: z.array(updateLessonSchema).optional(),
    position: z.number().int().nonnegative().optional(),
    isOptional: z.boolean().optional(),
    isLocked: z.boolean().optional(),
    estimatedDuration: z.number().int().nonnegative().optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).nullable().optional(),
});

export const updateLearningPathSchema = z.object({
    userGoal: z.string().min(1).optional(),
    isCustomized: z.boolean().optional(),
    difficultyLevel: z.enum(["easy", "medium", "hard"]).nullable().optional(),
    tags: z.array(z.string().min(1)).optional(),
    modules: z.array(updateModuleSchema).optional(),
});

export type ProgressModuleInput = {
    moduleId: number;
    title: string | null;
    position: number | null;
    lessons: LessonJson[];
};