import { z } from "zod";

export type LessonJson = Record<string, unknown>;

export type ModuleDependencySnapshot = {
    moduleId: number;
    prerequisiteModuleIds: number[];
    dependencyType: "prerequisite" | "corequisite" | "supplementary" | null;
    isOptional: boolean;
};

export type ProgressModuleSnapshot = {
    moduleId: number;
    title: string | null;
    position: number | null;
    lessons: LessonJson[];
};

export type RoadmapProgressSnapshot = {
    threadId: string;
    topic: string | null;
    domain: string | null;
    requiresPrereqs: boolean | null;
    bootstrapSummary: unknown;
    graphContext: unknown;
    prerequisitePlan: unknown;
    modules: ProgressModuleSnapshot[];
    dependencies: ModuleDependencySnapshot[];
    updatedAt?: string;
};

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
    visibility: "public" | "private" | "restricted";
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
    prerequisites: number[];
    dependencyType: "prerequisite" | "corequisite" | "supplementary" | null;
    isOptionalDependency: boolean;
};

export type LearningPathPayload = {
    pathId: number;
    query: string | null;
    goal: string | null;
    difficulty: string | null;
    tags: string[];
    createdAt: string | null;
    updatedAt: string | null;
    progress: RoadmapProgressSnapshot | null;
    roadmapState: RoadmapProgressSnapshot | null;
    threadId: string | null;
    moduleCount: number;
    modules: ModulePayload[];
    visibility: "public" | "private" | "restricted";
};

export const pathIdParamsSchema = z.object({
    pathId: z.coerce.number().int().positive(),
});

export const learningPathVisibilityEnum = z.enum(["public", "private"]);

const paginationQuerySchema = z.object({
    limit: z.coerce.number().int().positive().max(100).optional(),
    offset: z.coerce.number().int().nonnegative().optional(),
});

export const setLearningPathVisibilitySchema = z.object({
    params: pathIdParamsSchema,
    body: z.object({
        visibility: learningPathVisibilityEnum,
    }),
});

export const publicRoadmapListQuerySchema = paginationQuerySchema.merge(
    z.object({
        search: z.string().min(1).optional(),
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    }),
);

export type PublicRoadmapListQuery = z.infer<typeof publicRoadmapListQuerySchema>;

export type PublicRoadmapSummary = {
    pathId: number;
    title: string | null;
    topic: string | null;
    visibility: "public";
    difficulty: string | null;
    tags: string[];
    moduleCount: number;
    studyGroupCount: number;
    createdAt: string | null;
    updatedAt: string | null;
    owner: {
        userId: number;
        userName: string | null;
    };
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