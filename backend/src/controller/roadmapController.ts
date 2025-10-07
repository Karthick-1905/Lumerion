
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { HumanMessage } from "@langchain/core/messages";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import { roadmapGraph } from "../agents/roadmapGenerator/graph";
import {
    ContextBootstrapSummary,
    GraphContextSnapshot,
    PrerequisitePlanSummary,
    RoadmapModule,
} from "../agents/roadmapGenerator/state";
import { db } from "../drizzle";
import {
    learningModule,
    learningPath,
    learningPathModule,
    moduleDependency,
    studyGroup,
    users,
} from "../drizzle/schema";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { getSession } from "../utils/authUtils";
import {
    PublicRoadmapListQuery,
    ModuleDependencySnapshot,
    publicRoadmapListQuerySchema,
    setLearningPathVisibilitySchema,
} from "../schema/roadmapSchema";

const COOKIE_SESSION_KEY = process.env.COOKIE_SESSION_KEY ?? "session-id";

const saveRoadmapSchema = z.object({
    threadId: z.string().min(1, "threadId is required"),
    topic: z.string().min(1, "topic is required"),
    goal: z.string().optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    tags: z.array(z.string().min(1)).optional(),
});

export const roadmapGenerator = async (req: Request, res: Response) => {
    const topic = String(req.body?.topic ?? "").trim();

    if (!topic) {
        return res
            .status(StatusCodes.BAD_REQUEST)
            .json({ error: "Provide a non-empty topic string." });
    }

    const threadId = uuidv4();

    try {
        await roadmapGraph.invoke(
            { messages: [new HumanMessage(topic)] },
            { configurable: { thread_id: threadId } },
        );

        const snapshot = await roadmapGraph.getState({
            configurable: { thread_id: threadId },
        });

        const snapshotValues = snapshot?.values ?? {};
        const modules = Array.isArray(snapshotValues?.modules)
            ? (snapshotValues.modules as RoadmapModule[])
            : [];

        const domain =
            typeof snapshotValues?.domain === "string" ? snapshotValues.domain : null;
        const requiresPrereqs =
            typeof snapshotValues?.requiresPrereqs === "boolean"
                ? snapshotValues.requiresPrereqs
                : null;
        const bootstrapSummary =
            snapshotValues?.bootstrapSummary && typeof snapshotValues.bootstrapSummary === "object"
                ? JSON.parse(JSON.stringify(snapshotValues.bootstrapSummary))
                : null;
        const prerequisitePlan =
            snapshotValues?.prerequisitePlan && typeof snapshotValues.prerequisitePlan === "object"
                ? JSON.parse(JSON.stringify(snapshotValues.prerequisitePlan))
                : null;
        const graphContext =
            snapshotValues?.graphContext && typeof snapshotValues.graphContext === "object"
                ? JSON.parse(JSON.stringify(snapshotValues.graphContext))
                : null;

        return res.json({
            success: true,
            threadId,
            topic,
            domain,
            requiresPrereqs,
            bootstrapSummary,
            graphContext,
            prerequisitePlan,
            modules,
        });
    } catch (error) {
        console.error("roadmap route error:", error);
        return res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: "Failed to generate roadmap." });
    }
};

export const saveRoadmap = async (req: Request, res: Response) => {
    const parseResult = saveRoadmapSchema.safeParse(req.body);

    if (!parseResult.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            errors: parseResult.error.flatten().fieldErrors,
        });
    }

    const { threadId, topic, goal, difficulty, tags } = parseResult.data;

    const sessionId = req.cookies?.[COOKIE_SESSION_KEY];
    if (!sessionId) {
        return res
            .status(StatusCodes.UNAUTHORIZED)
            .json({ success: false, error: "Authentication required." });
    }

    const session = await getSession(sessionId);
    if (!session) {
        return res
            .status(StatusCodes.UNAUTHORIZED)
            .json({ success: false, error: "Invalid session." });
    }

    let modules: RoadmapModule[] = [];
    let domain: string | null = null;
    let requiresPrereqs: boolean | null = null;
    let bootstrapSummary: ContextBootstrapSummary | null = null;
    let graphContext: GraphContextSnapshot | null = null;
    let prerequisitePlan: PrerequisitePlanSummary | null = null;
    let resolvedTopic = topic;

    const toSearchableText = (module: RoadmapModule): string => {
        const parts: string[] = [module.title ?? "", module.description ?? ""];
        for (const lesson of module.lessons) {
            parts.push(lesson.title ?? "");
            if (typeof lesson.description === "string") {
                parts.push(lesson.description);
            }
            for (const resource of lesson.recommendedResources ?? []) {
                if (typeof resource === "string" && resource.trim().length > 0) {
                    parts.push(resource);
                }
            }
            if (typeof lesson.masteryCheck === "string" && lesson.masteryCheck.trim().length > 0) {
                parts.push(lesson.masteryCheck);
            }
        }
        return parts
            .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
            .join(" ")
            .toLowerCase();
    };

    const prereqTitlePattern = /(on[-\s]?ramp|prerequisite|foundation|essentials|readiness|primer)/i;

    try {
        const snapshot = await roadmapGraph.getState({
            configurable: { thread_id: threadId },
        });

        const snapshotValues = snapshot?.values ?? {};
        if (Array.isArray(snapshotValues?.modules)) {
            modules = snapshotValues.modules as RoadmapModule[];
        }
        if (typeof snapshotValues?.topic === "string" && snapshotValues.topic.trim().length > 0) {
            resolvedTopic = snapshotValues.topic.trim();
        }
        domain =
            typeof snapshotValues?.domain === "string" ? snapshotValues.domain : null;
        requiresPrereqs =
            typeof snapshotValues?.requiresPrereqs === "boolean"
                ? snapshotValues.requiresPrereqs
                : null;
        bootstrapSummary =
            snapshotValues?.bootstrapSummary && typeof snapshotValues.bootstrapSummary === "object"
                ? JSON.parse(JSON.stringify(snapshotValues.bootstrapSummary))
                : null;
        graphContext =
            snapshotValues?.graphContext && typeof snapshotValues.graphContext === "object"
                ? JSON.parse(JSON.stringify(snapshotValues.graphContext))
                : null;
        prerequisitePlan =
            snapshotValues?.prerequisitePlan && typeof snapshotValues.prerequisitePlan === "object"
                ? JSON.parse(JSON.stringify(snapshotValues.prerequisitePlan))
                : null;
    } catch (error) {
        console.error("Failed to read roadmap state:", error);
        return res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            error: "Roadmap state not found or thread has expired.",
        });
    }

    if (!Array.isArray(modules) || modules.length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            error: "No modules available to save for this thread.",
        });
    }

    const nowIso = new Date().toISOString();

    try {
        const result = await db.transaction(async (tx) => {
            const [pathRow] = await tx
                .insert(learningPath)
                .values({
                    userId: session.userId,
                    userQuery: topic,
                    userGoal: goal ?? null,
                    threadId,
                    isCustomized: false,
                    difficultyLevel: difficulty ?? null,
                    tags: tags ?? null,
                    progress: null,
                    createdAt: nowIso,
                    updatedAt: nowIso,
                })
                .returning({ pathId: learningPath.pathId });

            if (!pathRow) {
                throw new Error("Failed to create learning path record");
            }

            const pathId = pathRow.pathId;
            const insertedModules: Array<{
                moduleId: number;
                position: number;
                title: string;
            }> = [];
            const moduleAggregates = new Map<number, string>();

            for (const [index, module] of modules.entries()) {
                const totalHours = module.lessons.reduce((sum, lesson) => {
                    return (
                        sum +
                        (typeof lesson.estimatedTimeHours === "number"
                            ? lesson.estimatedTimeHours
                            : 0)
                    );
                }, 0);

                const estimatedDuration =
                    totalHours > 0 ? Math.round(totalHours) : null;

                const [moduleRow] = await tx
                    .insert(learningModule)
                    .values({
                        title: module.title,
                        description: module.description,
                        tags: module.lessons,
                        estimatedDuration,
                        createdAt: nowIso,
                        updatedAt: nowIso,
                    })
                    .returning({ moduleId: learningModule.moduleId });

                if (!moduleRow) {
                    throw new Error("Failed to create learning module record");
                }

                insertedModules.push({
                    moduleId: moduleRow.moduleId,
                    position: index + 1,
                    title: module.title,
                });

                moduleAggregates.set(moduleRow.moduleId, toSearchableText(module));

                await tx.insert(learningPathModule).values({
                    pathId,
                    moduleId: moduleRow.moduleId,
                    position: index + 1,
                    isOptional: false,
                    isLocked: false,
                    createdAt: nowIso,
                    updatedAt: nowIso,
                });
            }

            const orderedModules = [...insertedModules].sort((a, b) => a.position - b.position);
            const moduleMetaById = new Map(orderedModules.map((meta) => [meta.moduleId, meta]));
            const onRampModule = orderedModules.find((meta) => prereqTitlePattern.test(meta.title)) ?? orderedModules[0] ?? null;

            const conceptMap = new Map<string, Set<number>>();
            if (prerequisitePlan && Array.isArray(prerequisitePlan.steps)) {
                for (const step of prerequisitePlan.steps) {
                    const term = step.conceptName?.toLowerCase().trim();
                    if (!term) continue;
                    for (const meta of orderedModules) {
                        const aggregate = moduleAggregates.get(meta.moduleId) ?? "";
                        if (aggregate.includes(term)) {
                            if (!conceptMap.has(term)) {
                                conceptMap.set(term, new Set());
                            }
                            conceptMap.get(term)!.add(meta.moduleId);
                        }
                    }
                }
            }

            const dependenciesSnapshot: ModuleDependencySnapshot[] = [];

            for (const meta of orderedModules) {
                if (meta.position <= 1) continue;

                const prerequisites = new Set<number>();
                const targetAggregate = moduleAggregates.get(meta.moduleId) ?? "";

                const immediatePrevious = orderedModules.find((candidate) => candidate.position === meta.position - 1);
                if (immediatePrevious) {
                    prerequisites.add(immediatePrevious.moduleId);
                }

                if (onRampModule && onRampModule.moduleId !== meta.moduleId) {
                    prerequisites.add(onRampModule.moduleId);
                }

                for (const [term, moduleIds] of conceptMap.entries()) {
                    if (!targetAggregate.includes(term)) {
                        continue;
                    }
                    for (const moduleId of moduleIds) {
                        if (moduleId === meta.moduleId) continue;
                        const candidate = moduleMetaById.get(moduleId);
                        if (candidate && candidate.position < meta.position) {
                            prerequisites.add(candidate.moduleId);
                        }
                    }
                }

                const prerequisiteIds = Array.from(prerequisites).filter((id) => id !== meta.moduleId);
                prerequisiteIds.sort((a, b) => a - b);

                if (prerequisiteIds.length === 0) {
                    continue;
                }

                await tx.insert(moduleDependency).values({
                    moduleId: meta.moduleId,
                    prerequisiteId: prerequisiteIds,
                    dependencyType: "prerequisite",
                    isOptional: false,
                    createdAt: nowIso,
                });

                dependenciesSnapshot.push({
                    moduleId: meta.moduleId,
                    prerequisiteModuleIds: prerequisiteIds,
                    dependencyType: "prerequisite",
                    isOptional: false,
                });
            }

            const progressPayload = {
                threadId,
                topic: resolvedTopic,
                domain,
                requiresPrereqs,
                bootstrapSummary,
                graphContext,
                prerequisitePlan,
                updatedAt: nowIso,
                dependencies: dependenciesSnapshot,
                modules: insertedModules.map((moduleMeta) => {
                    const originalModule = modules[moduleMeta.position - 1];
                    return {
                        moduleId: moduleMeta.moduleId,
                        title: originalModule.title,
                        position: moduleMeta.position,
                        lessons: originalModule.lessons.map((lesson) => ({
                            title: lesson.title,
                            description: lesson.description,
                            estimatedTimeHours: lesson.estimatedTimeHours,
                            recommendedResources: Array.isArray(lesson.recommendedResources)
                                ? lesson.recommendedResources
                                : [],
                            masteryCheck:
                                typeof lesson.masteryCheck === "string" && lesson.masteryCheck.trim().length > 0
                                    ? lesson.masteryCheck.trim()
                                    : null,
                            completed: false,
                        })),
                    };
                }),
            };

            await tx
                .update(learningPath)
                .set({
                    progress: progressPayload,
                    updatedAt: nowIso,
                })
                .where(eq(learningPath.pathId, pathId));

            return { pathId, insertedModules, progress: progressPayload, dependencies: dependenciesSnapshot };
        });

        return res.status(StatusCodes.CREATED).json({
            success: true,
            pathId: result.pathId,
            threadId,
            topic: resolvedTopic,
            progress: result.progress,
            bootstrapSummary,
            graphContext,
            prerequisitePlan,
            dependencies: result.dependencies,
            savedModules: result.insertedModules,
        });
    } catch (error) {
        console.error("Failed to save roadmap:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: "Failed to persist roadmap. Please try again.",
        });
    }
};

export const setLearningPathVisibility = async (req: Request, res: Response) => {
    const userId = req.user_id;
    if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: "Authentication required.",
        });
    }

    const parseResult = setLearningPathVisibilitySchema.safeParse({
        params: req.params,
        body: req.body,
    });

    if (!parseResult.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            errors: parseResult.error.flatten().fieldErrors,
        });
    }

    const {
        params: { pathId },
        body: { visibility },
    } = parseResult.data;

    const existingPath = await db.query.learningPath.findFirst({
        columns: {
            pathId: true,
            userId: true,
            visibility: true,
        },
        where: eq(learningPath.pathId, pathId),
    });

    if (!existingPath) {
        return res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            message: "Learning path not found.",
        });
    }

    if (existingPath.userId !== userId) {
        return res.status(StatusCodes.FORBIDDEN).json({
            success: false,
            message: "You do not have permission to update this learning path.",
        });
    }

    const nowIso = new Date().toISOString();

    await db
        .update(learningPath)
        .set({
            visibility,
            updatedAt: nowIso,
        })
        .where(eq(learningPath.pathId, pathId));

    return res.status(StatusCodes.OK).json({
        success: true,
        pathId,
        visibility,
        updatedAt: nowIso,
    });
};

export const listPublicRoadmaps = async (req: Request, res: Response) => {
    const parseResult = publicRoadmapListQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            errors: parseResult.error.flatten().fieldErrors,
        });
    }

    const { limit = 20, offset = 0, search, difficulty } =
        parseResult.data as PublicRoadmapListQuery;

    const whereConditions = [eq(learningPath.visibility, "public")];

    if (difficulty) {
        whereConditions.push(eq(learningPath.difficultyLevel, difficulty));
    }

    if (search && search.trim().length > 0) {
        const sanitized = `%${search.replace(/[%_]/g, "\\$&")}%`;
        const searchClause = or(
            ilike(learningPath.userGoal, sanitized),
            ilike(learningPath.userQuery, sanitized),
            ilike(users.userName, sanitized),
        )!;
        whereConditions.push(searchClause);
    }

    const whereClause = and(...whereConditions);

    const rows = await db
        .select({
            pathId: learningPath.pathId,
            title: learningPath.userGoal,
            topic: learningPath.userQuery,
            difficultyLevel: learningPath.difficultyLevel,
            tags: learningPath.tags,
            createdAt: learningPath.createdAt,
            updatedAt: learningPath.updatedAt,
            ownerId: users.userId,
            ownerName: users.userName,
            moduleCount: sql<number>`count(distinct ${learningPathModule.moduleId})::int`,
            studyGroupCount: sql<number>`count(distinct ${studyGroup.groupId})::int`,
        })
        .from(learningPath)
        .innerJoin(users, eq(users.userId, learningPath.userId))
        .leftJoin(
            learningPathModule,
            eq(learningPathModule.pathId, learningPath.pathId),
        )
        .leftJoin(studyGroup, eq(studyGroup.pathId, learningPath.pathId))
        .where(whereClause)
        .groupBy(
            learningPath.pathId,
            learningPath.userGoal,
            learningPath.userQuery,
            learningPath.difficultyLevel,
            learningPath.tags,
            learningPath.createdAt,
            learningPath.updatedAt,
            users.userId,
            users.userName,
        )
        .orderBy(desc(learningPath.updatedAt ?? learningPath.createdAt))
        .limit(limit)
        .offset(offset);

    const [{ total }] = await db
        .select({ total: sql<number>`count(*)::int` })
        .from(learningPath)
        .where(whereClause);

    const data = rows.map((row) => ({
        pathId: row.pathId,
        title: row.title ?? null,
        topic: row.topic ?? null,
        visibility: "public" as const,
        difficulty: row.difficultyLevel ?? null,
        tags: Array.isArray(row.tags)
            ? row.tags.filter((tag): tag is string => typeof tag === "string")
            : [],
        moduleCount: row.moduleCount ?? 0,
        studyGroupCount: row.studyGroupCount ?? 0,
        createdAt: row.createdAt ?? null,
        updatedAt: row.updatedAt ?? null,
        owner: {
            userId: row.ownerId,
            userName: row.ownerName ?? null,
        },
    }));

    return res.status(StatusCodes.OK).json({
        success: true,
        data,
        pagination: {
            total: total ?? 0,
            limit,
            offset,
        },
    });
};