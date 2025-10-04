
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { HumanMessage } from "@langchain/core/messages";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import { roadmapGraph } from "../agents/roadmapGenerator/graph.ts";
import { RoadmapModule } from "../agents/roadmapGenerator/state.ts";
import { db } from "../drizzle";
import {
    learningModule,
    learningPath,
    learningPathModule,
} from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { getSession } from "../utils/authUtils";

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
        const result = await roadmapGraph.invoke(
            { messages: [new HumanMessage(topic)] },
            { configurable: { thread_id: threadId } },
        );

        return res.json({
            success: true,
            threadId,
            topic,
            domain: result?.domain ?? null,
            requiresPrereqs: result?.requiresPrereqs ?? null,
            modules: result?.modules ?? [],
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

    try {
        const snapshot = await roadmapGraph.getState({
            configurable: { thread_id: threadId },
        });

        const snapshotValues = snapshot?.values ?? {};
        if (Array.isArray(snapshotValues?.modules)) {
            modules = snapshotValues.modules as RoadmapModule[];
        }
        domain =
            typeof snapshotValues?.domain === "string" ? snapshotValues.domain : null;
        requiresPrereqs =
            typeof snapshotValues?.requiresPrereqs === "boolean"
                ? snapshotValues.requiresPrereqs
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

            const progressPayload = {
                threadId,
                domain,
                requiresPrereqs,
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

            return { pathId, insertedModules, progress: progressPayload };
        });

        return res.status(StatusCodes.CREATED).json({
            success: true,
            pathId: result.pathId,
            threadId,
            progress: result.progress,
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