import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "../drizzle";
import { learningModule, learningPath, learningPathModule, userModuleProgress, users } from "../drizzle/schema";

import type {
    LessonJson,
    LearningPathListItem,
    LearningPathPayload,
    ProgressModuleInput,
    ModulePayload,
    ModuleProgressPayload,
} from "../schema/roadmapSchema";
import { updateLearningPathSchema } from "../schema/roadmapSchema";

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeLessons(value: unknown): LessonJson[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.map((entry) => {
        if (isRecord(entry)) {
            const normalized: LessonJson = { ...entry };
            const estimated = normalized.estimatedTimeHours;
            if (typeof estimated === "string") {
                const numeric = Number(estimated);
                if (!Number.isNaN(numeric)) {
                    normalized.estimatedTimeHours = numeric;
                }
            }
            return {
                ...normalized,
                completed: typeof normalized.completed === "boolean" ? normalized.completed : false,
            } as LessonJson;
        }

        return {
            completed: false,
        } as LessonJson;
    });
}

function buildProgressState(
    previous: unknown,
    modules: ProgressModuleInput[],
    timestamp: string,
): Record<string, unknown> {
    const base = isRecord(previous) ? { ...previous } : {};

    base.modules = modules.map((module) => ({
        moduleId: module.moduleId,
        title: module.title,
        position: module.position,
        lessons: module.lessons.map((lesson) => {
            if (isRecord(lesson)) {
                return {
                    ...lesson,
                    completed: typeof lesson.completed === "boolean" ? lesson.completed : false,
                };
            }
            return { completed: false };
        }),
    }));

    base.updatedAt = timestamp;

    return base;
}


export const getUserProfile = async (req: Request, res: Response) => {
    try {
        const { user_id: userId } = req
        if (!userId) 
            return res.status(StatusCodes.UNAUTHORIZED)
            .json({success: false,message: "Authentication required."})
        
        const userRecord = await db.query.users.findFirst({
            columns: {  userId: true,   userEmail: true,userName: true , avatarPublicUrl: true,
                isVerified: true, updatedAt: true,
            },
            where: eq(users.userId, userId),
        });
        if (!userRecord)  
            return res.status(StatusCodes.NOT_FOUND)
            .json({success: false,message: "User not found."});

        const [{ totalLearningPaths }] = await db
            .select({ totalLearningPaths: sql<number>`count(*)::int` })
            .from(learningPath)
            .where(eq(learningPath.userId, userId));

        const [{ totalModules }] = await db
            .select({
                totalModules: sql<number>`count(distinct ${learningPathModule.moduleId})::int`,
            })
            .from(learningPathModule)
            .innerJoin(learningPath, eq(learningPathModule.pathId, learningPath.pathId))
            .where(eq(learningPath.userId, userId));

        const [{ completedModules }] = await db
            .select({
                completedModules: sql<number>`count(*)::int`,
            })
            .from(userModuleProgress)
            .where(
                and(
                    eq(userModuleProgress.userId, userId),
                    eq(userModuleProgress.status, "completed"),
                ),
            );

        return res.status(StatusCodes.OK).json({
            success: true,
            profile: userRecord,
            metrics: {
                totalLearningPaths: totalLearningPaths ?? 0,
                totalModules: totalModules ?? 0,
                completedModules: completedModules ?? 0,
            },
        });
    } catch (error) {
        console.error("Failed to fetch user profile:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Unable to fetch user profile at the moment.",
        });
    }
};


type FetchLearningPathsOptions = {
    pathIds?: number[];
    includeDetails?: boolean;
};

async function fetchLearningPathsPayload(
    userId: number,
    { pathIds, includeDetails = false }: FetchLearningPathsOptions = {},
): Promise<LearningPathPayload[]> {
    const whereClause = pathIds && pathIds.length > 0
        ? and(eq(learningPath.userId, userId), inArray(learningPath.pathId, pathIds))
        : eq(learningPath.userId, userId);

    const paths = await db
        .select({
            pathId: learningPath.pathId,
            userQuery: learningPath.userQuery,
            userGoal: learningPath.userGoal,
            difficultyLevel: learningPath.difficultyLevel,
            tags: learningPath.tags,
            createdAt: learningPath.createdAt,
            updatedAt: learningPath.updatedAt,
            progress: learningPath.progress,
        })
        .from(learningPath)
        .where(whereClause);

    if (paths.length === 0) {
        return [];
    }

    const collectedPathIds = paths.map((path) => path.pathId);

    const moduleRows = collectedPathIds.length > 0
        ? await db
            .select({
                pathModuleId: learningPathModule.pathModuleId,
                pathId: learningPathModule.pathId,
                moduleId: learningModule.moduleId,
                title: learningModule.title,
                description: learningModule.description,
                position: learningPathModule.position,
                estimatedDuration: learningModule.estimatedDuration,
                difficulty: learningModule.difficultyLevel,
                isOptional: learningPathModule.isOptional,
                isLocked: learningPathModule.isLocked,
                lessons: learningModule.tags,
                moduleCreatedAt: learningModule.createdAt,
                moduleUpdatedAt: learningModule.updatedAt,
                pathModuleUpdatedAt: learningPathModule.updatedAt,
            })
            .from(learningPathModule)
            .innerJoin(learningModule, eq(learningPathModule.moduleId, learningModule.moduleId))
            .where(inArray(learningPathModule.pathId, collectedPathIds))
        : [];

    const progressRows = collectedPathIds.length > 0
        ? await db
            .select({
                pathId: userModuleProgress.pathId,
                moduleId: userModuleProgress.moduleId,
                status: userModuleProgress.status,
                completionPercent: userModuleProgress.completionPercent,
                lastAccessed: userModuleProgress.lastAccessed,
            })
            .from(userModuleProgress)
            .where(
                and(
                    eq(userModuleProgress.userId, userId),
                    inArray(userModuleProgress.pathId, collectedPathIds),
                ),
            )
        : [];

    const modulesByPath = new Map<number, ModulePayload[]>();
    const progressByPath = new Map<number, Map<number, ModuleProgressPayload>>();

    for (const progress of progressRows) {
        const moduleProgress: ModuleProgressPayload = {
            status: progress.status,
            completionPercent: progress.completionPercent
                ? Number(progress.completionPercent)
                : 0,
            lastAccessed: progress.lastAccessed ?? null,
        };

        if (!progressByPath.has(progress.pathId)) {
            progressByPath.set(progress.pathId, new Map());
        }

        progressByPath.get(progress.pathId)!.set(progress.moduleId, moduleProgress);
    }

    moduleRows.forEach((row) => {
        if (!modulesByPath.has(row.pathId)) {
            modulesByPath.set(row.pathId, []);
        }

        const pathProgress = progressByPath.get(row.pathId);
        const moduleProgress = pathProgress?.get(row.moduleId) ?? null;

        modulesByPath.get(row.pathId)!.push({
            pathModuleId: row.pathModuleId,
            moduleId: row.moduleId,
            title: row.title ?? null,
            description: row.description ?? null,
            position: row.position ?? null,
            estimatedDuration: row.estimatedDuration ?? null,
            difficulty: row.difficulty ?? null,
            isOptional: row.isOptional ?? false,
            isLocked: row.isLocked ?? false,
            lessons: normalizeLessons(row.lessons),
            progress: moduleProgress,
            createdAt: row.moduleCreatedAt ?? null,
            updatedAt: row.moduleUpdatedAt ?? row.pathModuleUpdatedAt ?? null,
        });
    });

    return paths
        .map((path) => {
            const modules = (modulesByPath.get(path.pathId) ?? []).sort((a, b) => {
                const positionA = a.position ?? Number.MAX_SAFE_INTEGER;
                const positionB = b.position ?? Number.MAX_SAFE_INTEGER;
                if (positionA !== positionB) {
                    return positionA - positionB;
                }
                return a.pathModuleId - b.pathModuleId;
            });

            return {
                pathId: path.pathId,
                query: path.userQuery ?? null,
                goal: path.userGoal ?? null,
                difficulty: path.difficultyLevel ?? null,
                tags: Array.isArray(path.tags)
                    ? path.tags.filter((tag): tag is string => typeof tag === "string")
                    : [],
                createdAt: path.createdAt ?? null,
                updatedAt: path.updatedAt ?? null,
                progress: path.progress ?? null,
                moduleCount: modules.length,
                modules: includeDetails ? modules : [],
            };
        })
        .sort((a, b) => {
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bTime - aTime;
        });
}


export const getLearningPaths = async (req: Request, res: Response) => {
    const { user_id: userId } = req
    if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: "Authentication required.",
        });
    }

    try {
        const payload = await fetchLearningPathsPayload(userId, { includeDetails: false });
        const summarized = payload.map<LearningPathListItem>((path) => ({
            pathId: path.pathId,
            query: path.query,
            goal: path.goal,
            difficulty: path.difficulty,
            tags: path.tags,
            moduleCount: path.moduleCount,
            createdAt: path.createdAt,
            updatedAt: path.updatedAt,
            lastUpdatedAt: path.progress && isRecord(path.progress) && typeof path.progress.updatedAt === "string"
                ? (path.progress.updatedAt as string)
                : path.updatedAt,
        }));
        return res.status(StatusCodes.OK).json({
            success: true,
            learningPaths: summarized,
        });
    } catch (error) {
        console.error("Failed to load learning paths:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Unable to fetch learning paths at the moment.",
        });
    }
};

export const updateLearningPath = async (req: Request, res: Response) => {
    const { user_id: userId } = req
    if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: "Authentication required.",
        });
    }

    const pathId = Number(req.params.pathId);
    if (!Number.isInteger(pathId) || pathId <= 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Invalid learning path identifier.",
        });
    }

    const parsedBody = updateLearningPathSchema.safeParse(req.body ?? {});
    if (!parsedBody.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            errors: parsedBody.error.flatten().fieldErrors,
        });
    }

    const payload = parsedBody.data;
    const hasModuleUpdates = Array.isArray(payload.modules) && payload.modules.length > 0;
    const hasPathUpdates =
        payload.userGoal !== undefined ||
        payload.isCustomized !== undefined ||
        payload.difficultyLevel !== undefined ||
        payload.tags !== undefined;

    if (!hasModuleUpdates && !hasPathUpdates) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "No changes were provided to update the learning path.",
        });
    }

    const existingPath = await db.query.learningPath.findFirst({
        where: and(eq(learningPath.pathId, pathId), eq(learningPath.userId, userId)),
    });

    if (!existingPath) {
        return res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            message: "Learning path not found.",
        });
    }

    const nowIso = new Date().toISOString();

    try {
        await db.transaction(async (tx) => {
            const pathUpdates: Partial<typeof learningPath.$inferInsert> = {};

            if (payload.userGoal !== undefined) {
                pathUpdates.userGoal = payload.userGoal;
            }

            if (payload.isCustomized !== undefined) {
                pathUpdates.isCustomized = payload.isCustomized;
            }

            if (payload.difficultyLevel !== undefined) {
                pathUpdates.difficultyLevel = payload.difficultyLevel ?? null;
            }

            if (payload.tags !== undefined) {
                pathUpdates.tags = payload.tags;
            }

            const moduleMap = new Map<number, number>();

            if (hasModuleUpdates) {
                const existingModules = await tx
                    .select({
                        pathModuleId: learningPathModule.pathModuleId,
                        moduleId: learningPathModule.moduleId,
                    })
                    .from(learningPathModule)
                    .where(eq(learningPathModule.pathId, pathId));

                existingModules.forEach((module) => {
                    moduleMap.set(module.pathModuleId, module.moduleId);
                });

                for (const modulePayload of payload.modules ?? []) {
                    const moduleId = moduleMap.get(modulePayload.pathModuleId);
                    if (!moduleId) {
                        throw new Error(`Module with pathModuleId ${modulePayload.pathModuleId} does not belong to this learning path.`);
                    }

                    const moduleUpdates: Partial<typeof learningModule.$inferInsert> = {};
                    const pathModuleUpdates: Partial<typeof learningPathModule.$inferInsert> = {};

                    if (modulePayload.title !== undefined) {
                        moduleUpdates.title = modulePayload.title;
                    }

                    if (modulePayload.description !== undefined) {
                        moduleUpdates.description = modulePayload.description ?? null;
                    }

                    if (modulePayload.difficulty !== undefined) {
                        moduleUpdates.difficultyLevel = modulePayload.difficulty ?? null;
                    }

                    let normalizedLessons: LessonJson[] | undefined;
                    if (modulePayload.lessons !== undefined) {
                        normalizedLessons = modulePayload.lessons.map((lesson) => {
                            const normalized: LessonJson = { ...lesson };
                            if (typeof normalized.estimatedTimeHours === "string") {
                                const numeric = Number(normalized.estimatedTimeHours);
                                if (!Number.isNaN(numeric)) {
                                    normalized.estimatedTimeHours = numeric;
                                }
                            }
                            normalized.completed = typeof normalized.completed === "boolean" ? normalized.completed : false;
                            return normalized;
                        });

                        moduleUpdates.tags = normalizedLessons;
                    }

                    if (modulePayload.estimatedDuration !== undefined) {
                        moduleUpdates.estimatedDuration = modulePayload.estimatedDuration;
                    } else if (normalizedLessons) {
                        const duration = normalizedLessons.reduce((total, lesson) => {
                            const estimated = lesson.estimatedTimeHours;
                            return total + (typeof estimated === "number" ? estimated : 0);
                        }, 0);

                        moduleUpdates.estimatedDuration = duration > 0 ? Math.round(duration) : null;
                    }

                    if (Object.keys(moduleUpdates).length > 0) {
                        moduleUpdates.updatedAt = nowIso;
                        await tx
                            .update(learningModule)
                            .set(moduleUpdates)
                            .where(eq(learningModule.moduleId, moduleId));
                    }

                    if (modulePayload.position !== undefined) {
                        pathModuleUpdates.position = modulePayload.position;
                    }

                    if (modulePayload.isOptional !== undefined) {
                        pathModuleUpdates.isOptional = modulePayload.isOptional;
                    }

                    if (modulePayload.isLocked !== undefined) {
                        pathModuleUpdates.isLocked = modulePayload.isLocked;
                    }

                    if (Object.keys(pathModuleUpdates).length > 0) {
                        pathModuleUpdates.updatedAt = nowIso;
                        await tx
                            .update(learningPathModule)
                            .set(pathModuleUpdates)
                            .where(eq(learningPathModule.pathModuleId, modulePayload.pathModuleId));
                    }
                }
            }

            const progressModules = await tx
                .select({
                    moduleId: learningModule.moduleId,
                    title: learningModule.title,
                    position: learningPathModule.position,
                    lessons: learningModule.tags,
                })
                .from(learningPathModule)
                .innerJoin(learningModule, eq(learningPathModule.moduleId, learningModule.moduleId))
                .where(eq(learningPathModule.pathId, pathId));

            const normalizedProgressModules: ProgressModuleInput[] = progressModules.map((module) => ({
                moduleId: module.moduleId,
                title: module.title ?? null,
                position: module.position ?? null,
                lessons: normalizeLessons(module.lessons),
            }));

            const updatedProgress = buildProgressState(existingPath.progress, normalizedProgressModules, nowIso);

            pathUpdates.updatedAt = nowIso;
            pathUpdates.progress = updatedProgress;

            await tx
                .update(learningPath)
                .set(pathUpdates)
                .where(eq(learningPath.pathId, pathId));
        });

        const [updatedPath] = await fetchLearningPathsPayload(userId, {
            pathIds: [pathId],
            includeDetails: true,
        });

        return res.status(StatusCodes.OK).json({
            success: true,
            learningPath: updatedPath ?? null,
        });
    } catch (error) {
        console.error("Failed to update learning path:", error);
        if (error instanceof Error && error.message.includes("does not belong")) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Unable to update learning path.",
        });
    }
};


export const getLearningPath = async (req: Request, res: Response) => {
    const { user_id: userId } = req;
    if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: "Authentication required.",
        });
    }
    try {
        const pathId = Number(req.params.pathId);
        if (!Number.isInteger(pathId) || pathId <= 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Invalid learning path identifier.",
            });
        }

        const [path] = await fetchLearningPathsPayload(userId, {
            pathIds: [pathId],
            includeDetails: true,
        });

        if (!path) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Learning path not found.",
            });
        }

        return res.status(StatusCodes.OK).json({
            success: true,
            learningPath: path,
        });
    } catch (error) {
        console.error("Failed to fetch learning path detail:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Unable to fetch learning path details at the moment.",
        });
    }
};
