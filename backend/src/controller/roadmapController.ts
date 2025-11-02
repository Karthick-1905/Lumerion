
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { HumanMessage } from "@langchain/core/messages";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import { orchestratorGraph } from "../agents/orchestrator/graph";
import { ContextBootstrapSummary, PrerequisitePlanSummary, RoadmapModule } from "../agents/roadmap/state";
import { Quiz, QuizQuestion } from "../agents/quizzes/state";
import { db } from "../drizzle";
import {
    learningModule,
    learningPath,
    learningPathModule,
    moduleDependency,
    quiz,
    quizQuestion,
    userModuleProgress,
    userQuizAnswer,
    studyGroup,
    users,
} from "../drizzle/schema";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { getSession } from "../utils/authUtils";
import {
    PublicRoadmapListQuery,
    ModuleDependencySnapshot,
    publicRoadmapListQuerySchema,
    setLearningPathVisibilitySchema,
} from "../schema/roadmapSchema";

type QuizWithQuestions = {
    quiz: typeof quiz.$inferSelect;
    questions: Array<typeof quizQuestion.$inferSelect>;
};

const buildQuizFilter = (pathId: number, moduleId: number, quizId?: number) => {
    const baseFilter = and(eq(quiz.pathId, pathId), eq(quiz.moduleId, moduleId));
    if (typeof quizId === "number") {
        return and(baseFilter, eq(quiz.quizId, quizId));
    }
    return baseFilter;
};

const loadQuizzesWithQuestions = async (
    pathId: number,
    moduleId: number,
    quizId?: number,
): Promise<QuizWithQuestions[]> => {
    const rows = await db
        .select({ quiz, question: quizQuestion })
        .from(quiz)
        .leftJoin(quizQuestion, eq(quizQuestion.quizId, quiz.quizId))
        .where(buildQuizFilter(pathId, moduleId, quizId))
        .orderBy(asc(quiz.quizId), asc(quizQuestion.questionId));

    const quizMap = new Map<number, QuizWithQuestions>();

    for (const row of rows) {
        const quizIdValue = row.quiz.quizId;
        if (!quizMap.has(quizIdValue)) {
            quizMap.set(quizIdValue, { quiz: row.quiz, questions: [] });
        }
        const entry = quizMap.get(quizIdValue)!;
        if (row.question) {
            entry.questions.push(row.question);
        }
    }

    return Array.from(quizMap.values());
};

const COOKIE_SESSION_KEY = process.env.COOKIE_SESSION_KEY ?? "session-id";

const saveRoadmapSchema = z.object({
    threadId: z.string().min(1, "threadId is required"),
    topic: z.string().min(1, "topic is required"),
    goal: z.string().optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    tags: z.array(z.string().min(1)).optional(),
});

const quizSubmissionSchema = z.object({
    answers: z
        .array(
            z.object({
                questionId: z.number().int().positive(),
                answer: z.string().min(1).trim(),
            }),
        )
        .min(1, "At least one answer is required"),
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
        await orchestratorGraph.invoke(
            { messages: [new HumanMessage(topic)] },
            { configurable: { thread_id: threadId } },
        );

        const snapshot = await orchestratorGraph.getState({
            configurable: { thread_id: threadId },
        });

        const snapshotValues = snapshot?.values ?? {};
        const modules = Array.isArray(snapshotValues?.roadmapModules)
            ? (snapshotValues.roadmapModules as RoadmapModule[])
            : [];

        // Assuming domain and other fields are passed through from roadmap subgraph
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

        return res.json({
            success: true,
            threadId,
            topic,
            domain,
            requiresPrereqs,
            bootstrapSummary,
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
    
    const session = await getSession(sessionId);
    if (!session) {
        return res
            .status(StatusCodes.UNAUTHORIZED)
            .json({ success: false, error: "Invalid session." });
    }

    let modules: RoadmapModule[] = [];
    let quizzes: Quiz[] = [];
    let domain: string | null = null;
    let requiresPrereqs: boolean | null = null;
    let bootstrapSummary: ContextBootstrapSummary | null = null;
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
    const normalizeTitle = (value: string) => value.trim().toLowerCase();

    try {
        const snapshot = await orchestratorGraph.getState({
            configurable: { thread_id: threadId },
        });

        const snapshotValues = snapshot?.values ?? {};
        if (Array.isArray(snapshotValues?.roadmapModules)) {
            modules = snapshotValues.roadmapModules as RoadmapModule[];
        }
        if (Array.isArray(snapshotValues?.quizzes)) {
            quizzes = snapshotValues.quizzes as Quiz[];
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

            let persistedQuizSummaries: Array<{ quizId: number; moduleId: number }> = [];
            if (quizzes.length > 0) {
                const moduleIndexByTitle = new Map<string, { moduleId: number; title: string }>();
                for (const meta of insertedModules) {
                    moduleIndexByTitle.set(normalizeTitle(meta.title), {
                        moduleId: meta.moduleId,
                        title: meta.title,
                    });
                }

                const quizInsertValues: Array<{
                    moduleId: number;
                    pathId: number;
                    lessonIndex: number | null;
                    title: string;
                    description: string | null;
                    assessmentType: string;
                    metadata: Record<string, unknown>;
                    createdAt: string;
                    updatedAt: string;
                }> = [];
                const questionBatches: QuizQuestion[][] = [];

                for (const quizEntry of quizzes) {
                    const normalizedModuleTitle = normalizeTitle(quizEntry.moduleTitle ?? "");
                    const moduleMeta = moduleIndexByTitle.get(normalizedModuleTitle);
                    if (!moduleMeta) {
                        continue;
                    }

                    if (!Array.isArray(quizEntry.questions) || quizEntry.questions.length === 0) {
                        continue;
                    }

                    quizInsertValues.push({
                        moduleId: moduleMeta.moduleId,
                        pathId,
                        lessonIndex:
                            typeof quizEntry.lessonIndex === "number" && Number.isFinite(quizEntry.lessonIndex)
                                ? quizEntry.lessonIndex
                                : null,
                        title: quizEntry.moduleTitle?.trim() || moduleMeta.title,
                        description: null,
                        assessmentType: "quiz",
                        metadata: {
                            passingPercentage: quizEntry.passingPercentage,
                            questions: quizEntry.questions.length,
                        },
                        createdAt: nowIso,
                        updatedAt: nowIso,
                    });
                    questionBatches.push(quizEntry.questions);
                }

                if (quizInsertValues.length > 0) {
                    const insertedQuizzes = await tx
                        .insert(quiz)
                        .values(quizInsertValues)
                        .returning({
                            quizId: quiz.quizId,
                            moduleId: quiz.moduleId,
                        });

                    persistedQuizSummaries = insertedQuizzes;

                    const quizQuestionValues: Array<{
                        quizId: number;
                        prompt: string;
                        questionType: string;
                        choices: unknown;
                        answer: string;
                        explanation: string | null;
                        metadata: Record<string, unknown>;
                        createdAt: string;
                    }> = [];

                    insertedQuizzes.forEach((insertedQuiz, index) => {
                        const questionSet = questionBatches[index] ?? [];
                        questionSet.forEach((question, questionIndex) => {
                            quizQuestionValues.push({
                                quizId: insertedQuiz.quizId,
                                prompt: question.prompt,
                                questionType: question.type,
                                choices: question.choices ?? null,
                                answer: question.answer,
                                explanation: question.explanation ?? null,
                                metadata: {
                                    order: questionIndex,
                                    type: question.type,
                                },
                                createdAt: nowIso,
                            });
                        });
                    });

                    if (quizQuestionValues.length > 0) {
                        await tx.insert(quizQuestion).values(quizQuestionValues);
                    }
                }
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

            return {
                pathId,
                insertedModules,
                progress: progressPayload,
                dependencies: dependenciesSnapshot,
                quizzes: persistedQuizSummaries,
            };
        });

        return res.status(StatusCodes.CREATED).json({
            success: true,
            pathId: result.pathId,
            threadId,
            topic: resolvedTopic,
            progress: result.progress,
            bootstrapSummary,
            prerequisitePlan,
            dependencies: result.dependencies,
            quizzes: result.quizzes,
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

export const getModuleQuizzes = async (req: Request, res: Response) => {
    const userId = Number(req.user_id);
    if (!Number.isInteger(userId)) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            error: "Authentication required.",
        });
    }

    const pathId = Number(req.params.pathId);
    const moduleId = Number(req.params.moduleId);

    if (!Number.isInteger(pathId) || !Number.isInteger(moduleId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            error: "Invalid path or module id.",
        });
    }

    const pathRecord = await db.query.learningPath.findFirst({
        columns: {
            pathId: true,
            userId: true,
            visibility: true,
        },
        where: eq(learningPath.pathId, pathId),
    });

    if (!pathRecord) {
        return res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            error: "Learning path not found.",
        });
    }

    if (pathRecord.userId !== userId) {
        return res.status(StatusCodes.FORBIDDEN).json({
            success: false,
            error: "You do not have access to this learning path.",
        });
    }

    const moduleRecord = await db.query.learningPathModule.findFirst({
        columns: { pathModuleId: true },
        where: and(
            eq(learningPathModule.pathId, pathId),
            eq(learningPathModule.moduleId, moduleId),
        ),
    });

    if (!moduleRecord) {
        return res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            error: "Module not found within learning path.",
        });
    }

    const quizBundles = await loadQuizzesWithQuestions(pathId, moduleId);

    const quizzes = quizBundles.map(({ quiz: quizRecord, questions }) => {
        const metadata = (quizRecord.metadata ?? {}) as Record<string, unknown>;
        const rawPassing = metadata.passingPercentage;
        const passingPercentage =
            typeof rawPassing === "number" && Number.isFinite(rawPassing)
                ? Math.max(0, Math.min(100, rawPassing))
                : 70;

        return {
            quizId: quizRecord.quizId,
            moduleId: quizRecord.moduleId,
            pathId: quizRecord.pathId,
            lessonIndex: quizRecord.lessonIndex,
            title: quizRecord.title,
            passingPercentage,
            questionCount: questions.length,
            questions: questions.map((question) => ({
                questionId: question.questionId,
                prompt: question.prompt,
                questionType: question.questionType,
                choices: Array.isArray(question.choices)
                    ? question.choices.map((choice) =>
                          typeof choice === "string" ? choice : String(choice),
                      )
                    : [],
                explanation: question.explanation ?? null,
            })),
        };
    });

    return res.status(StatusCodes.OK).json({
        success: true,
        quizzes,
    });
};

export const submitQuizAssessment = async (req: Request, res: Response) => {
    const userId = Number(req.user_id);
    if (!Number.isInteger(userId)) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            error: "Authentication required.",
        });
    }

    const pathId = Number(req.params.pathId);
    const moduleId = Number(req.params.moduleId);
    const quizId = Number(req.params.quizId);

    if (!Number.isInteger(pathId) || !Number.isInteger(moduleId) || !Number.isInteger(quizId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            error: "Invalid path, module, or quiz id.",
        });
    }

    const submission = quizSubmissionSchema.safeParse(req.body);
    if (!submission.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            errors: submission.error.flatten().fieldErrors,
        });
    }

    const pathRecord = await db.query.learningPath.findFirst({
        columns: {
            pathId: true,
            userId: true,
        },
        where: eq(learningPath.pathId, pathId),
    });

    if (!pathRecord) {
        return res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            error: "Learning path not found.",
        });
    }

    if (pathRecord.userId !== userId) {
        return res.status(StatusCodes.FORBIDDEN).json({
            success: false,
            error: "You do not have access to this learning path.",
        });
    }

    const [quizResult] = await loadQuizzesWithQuestions(pathId, moduleId, quizId);

    if (!quizResult) {
        return res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            error: "Quiz not found for module.",
        });
    }

    const { quiz: quizRecord, questions: questionList } = quizResult;
    if (questionList.length === 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            error: "Quiz has no questions configured.",
        });
    }

    const answerMap = new Map<number, string>();
    for (const answer of submission.data.answers) {
        answerMap.set(answer.questionId, answer.answer.trim());
    }

    const evaluateAnswer = (question: typeof questionList[number], provided: string | null) => {
        if (!provided || provided.length === 0) return false;
        const correctAnswer = (question.answer ?? "").trim();
        if (correctAnswer.length === 0) return false;

        const normalizedProvided = provided.toLowerCase();
        const normalizedCorrect = correctAnswer.toLowerCase();
        return normalizedProvided === normalizedCorrect;
    };

    const questionResults = questionList.map((question) => {
        const provided = answerMap.get(question.questionId) ?? null;
        const isCorrect = evaluateAnswer(question, provided);
        return {
            question,
            provided,
            isCorrect,
        };
    });

    const correctCount = questionResults.filter((result) => result.isCorrect).length;
    const totalQuestions = questionList.length;
    const rawScore = totalQuestions === 0 ? 0 : (correctCount / totalQuestions) * 100;
    const score = Math.round(rawScore * 100) / 100;

    const metadata = (quizRecord.metadata ?? {}) as Record<string, unknown>;
    const rawPassing = metadata.passingPercentage;
    const passingPercentage =
        typeof rawPassing === "number" && Number.isFinite(rawPassing)
            ? Math.max(0, Math.min(100, rawPassing))
            : 70;
    const passed = score >= passingPercentage;

    const nowIso = new Date().toISOString();

    await db.transaction(async (tx) => {
        const answerRows = questionResults.map((result) => ({
            userId,
            questionId: result.question.questionId,
            answer: result.provided ?? "",
            isCorrect: result.isCorrect,
            createdAt: nowIso,
        }));

        if (answerRows.length > 0) {
            await tx
                .insert(userQuizAnswer)
                .values(answerRows)
                .onConflictDoUpdate({
                    target: [userQuizAnswer.userId, userQuizAnswer.questionId],
                    set: {
                        answer: sql`excluded.answer`,
                        isCorrect: sql`excluded.is_correct`,
                        createdAt: sql`excluded.created_at`,
                    },
                });
        }

        const moduleStatus = passed ? "completed" : "in_progress";
        await tx
            .insert(userModuleProgress)
            .values({
                userId,
                moduleId,
                pathId,
                status: moduleStatus,
                completionPercent: score.toFixed(2),
                lastAccessed: nowIso,
            })
            .onConflictDoUpdate({
                target: [
                    userModuleProgress.userId,
                    userModuleProgress.moduleId,
                    userModuleProgress.pathId,
                ],
                set: {
                    status: moduleStatus,
                    completionPercent: score.toFixed(2),
                    lastAccessed: nowIso,
                },
            });
    });

    return res.status(StatusCodes.OK).json({
        success: true,
        pathId,
        moduleId,
        quizId,
        totalQuestions,
        correctCount,
        score,
        passingPercentage,
        passed,
        results: questionResults.map((result) => ({
            questionId: result.question.questionId,
            prompt: result.question.prompt,
            questionType: result.question.questionType,
            answerGiven: result.provided,
            isCorrect: result.isCorrect,
            correctAnswer: result.question.answer,
        })),
    });
};

export const getLearningPathProgress = async (req: Request, res: Response) => {
    const userId = Number(req.user_id);
    if (!Number.isInteger(userId)) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            error: "Authentication required.",
        });
    }

    const pathId = Number(req.params.pathId);
    if (!Number.isInteger(pathId)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            error: "Invalid learning path id.",
        });
    }

    const pathRecord = await db.query.learningPath.findFirst({
        columns: {
            pathId: true,
            userId: true,
        },
        where: eq(learningPath.pathId, pathId),
    });

    if (!pathRecord) {
        return res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            error: "Learning path not found.",
        });
    }

    if (pathRecord.userId !== userId) {
        return res.status(StatusCodes.FORBIDDEN).json({
            success: false,
            error: "You do not have access to this learning path.",
        });
    }

    const progressRows = await db
        .select({
            moduleId: userModuleProgress.moduleId,
            status: userModuleProgress.status,
            completionPercent: userModuleProgress.completionPercent,
            lastAccessed: userModuleProgress.lastAccessed,
        })
        .from(userModuleProgress)
        .where(
            and(
                eq(userModuleProgress.pathId, pathId),
                eq(userModuleProgress.userId, userId),
            ),
        )
        .orderBy(userModuleProgress.moduleId);

    return res.status(StatusCodes.OK).json({
        success: true,
        pathId,
        moduleProgress: progressRows,
    });
};