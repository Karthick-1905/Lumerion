import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { and, eq, ilike, inArray, not, sql, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";

import { db } from "../drizzle";
import { learningModule, learningPath, learningPathModule, moduleDependency, userModuleProgress, users, quiz, quizQuestion, userQuizAnswer, friendRequest, studyGroupMembership, studyGroup, skillAssessment, userSkillAssessment, activity, userFriend } from "../drizzle/schema";

import type {
    LessonJson,
    LearningPathListItem,
    LearningPathPayload,
    ProgressModuleInput,
    ModulePayload,
    ModuleProgressPayload,
    ModuleProgressStatus,
    ProgressModuleSnapshot,
    ModuleDependencySnapshot,
    RoadmapProgressSnapshot,
} from "../schema/roadmapSchema";
import { updateLearningPathSchema, updateModuleProgressSchema } from "../schema/roadmapSchema";
import type { UserSearchQuery } from "../schema/friendSchema";
import { userSearchQuerySchema } from "../schema/friendSchema";

type BaseNotification = {
    type: "friend_request" | "study_group_invitation";
    createdAt: string | null;
};

type FriendRequestNotification = BaseNotification & {
    type: "friend_request";
    requestId: number;
    message: string | null;
    sender: {
        userId: number;
        userName: string | null;
        avatarUrl: string | null;
    };
};

type StudyGroupInvitationNotification = BaseNotification & {
    type: "study_group_invitation";
    membershipId: number;
    role: string | null;
    group: {
        groupId: number;
        groupName: string | null;
        pathId: number;
        pathTitle: string | null;
    };
    inviter: {
        userId: number;
        userName: string | null;
    } | null;
};

type UserNotification = FriendRequestNotification | StudyGroupInvitationNotification;

function resolveTimestamp(value: string | null | undefined): number {
    if (!value) {
        return 0;
    }

    const parsed = Date.parse(value);
    if (Number.isNaN(parsed)) {
        return 0;
    }

    return parsed;
}

const moduleProgressParamsSchema = z.object({
    pathId: z.coerce.number().int().positive(),
    moduleId: z.coerce.number().int().positive(),
});

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

function normalizeModuleStatus(value: unknown): ModuleProgressStatus {
    if (value === "completed" || value === "in_progress" || value === "not_started") {
        return value;
    }
    return "not_started";
}

function buildProgressState(
    previous: unknown,
    modules: ProgressModuleInput[],
    dependencies: ModuleDependencySnapshot[],
    timestamp: string,
    threadId?: string | null,
): RoadmapProgressSnapshot {
    const prevRecord = isRecord(previous) ? (previous as Record<string, unknown>) : {};

    const snapshot: RoadmapProgressSnapshot = {
        threadId:
            typeof prevRecord.threadId === "string" && prevRecord.threadId.trim().length > 0
                ? (prevRecord.threadId as string)
                : threadId ?? "",
        topic: typeof prevRecord.topic === "string" ? (prevRecord.topic as string) : null,
        domain: typeof prevRecord.domain === "string" ? (prevRecord.domain as string) : null,
        requiresPrereqs:
            typeof prevRecord.requiresPrereqs === "boolean"
                ? (prevRecord.requiresPrereqs as boolean)
                : null,
        bootstrapSummary: prevRecord.bootstrapSummary ?? null,
        graphContext: prevRecord.graphContext ?? null,
        prerequisitePlan: prevRecord.prerequisitePlan ?? null,
        modules: modules.map((module) => ({
            moduleId: module.moduleId,
            title: module.title,
            position: module.position,
            lessons: module.lessons.map((lesson) => {
                if (isRecord(lesson)) {
                    return {
                        ...lesson,
                        completed: typeof lesson.completed === "boolean" ? lesson.completed : false,
                    } as LessonJson;
                }
                return { completed: false } as LessonJson;
            }),
        })),
        dependencies,
        updatedAt: timestamp,
    };

    if (threadId && threadId.trim().length > 0) {
        snapshot.threadId = threadId;
    }

    return snapshot;
}

function coerceRoadmapState(
    value: unknown,
    fallbackThreadId: string | null,
    dependencies: ModuleDependencySnapshot[],
): RoadmapProgressSnapshot | null {
    if (!isRecord(value)) {
        if (!fallbackThreadId && dependencies.length === 0) {
            return null;
        }

        return fallbackThreadId
            ? {
                  threadId: fallbackThreadId,
                  topic: null,
                  domain: null,
                  requiresPrereqs: null,
                  bootstrapSummary: null,
                  graphContext: null,
                  prerequisitePlan: null,
                  modules: [],
                  dependencies,
              }
            : null;
    }

    const record = value as Record<string, unknown>;

    const snapshot: RoadmapProgressSnapshot = {
        threadId:
            typeof record.threadId === "string" && record.threadId.trim().length > 0
                ? (record.threadId as string)
                : fallbackThreadId ?? "",
        topic: typeof record.topic === "string" ? (record.topic as string) : null,
        domain: typeof record.domain === "string" ? (record.domain as string) : null,
        requiresPrereqs:
            typeof record.requiresPrereqs === "boolean"
                ? (record.requiresPrereqs as boolean)
                : null,
        bootstrapSummary: record.bootstrapSummary ?? null,
        graphContext: record.graphContext ?? null,
        prerequisitePlan: record.prerequisitePlan ?? null,
        modules: Array.isArray(record.modules)
            ? (record.modules as ProgressModuleSnapshot[])
            : [],
        dependencies: Array.isArray(record.dependencies)
            ? (record.dependencies as ModuleDependencySnapshot[])
            : dependencies,
        updatedAt: typeof record.updatedAt === "string" ? (record.updatedAt as string) : undefined,
    };

    if (!snapshot.dependencies.length && dependencies.length) {
        snapshot.dependencies = dependencies;
    }

    return snapshot;
}


export const getUserNotifications = async (req: Request, res: Response) => {
    const { user_id: userId } = req;

    if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: "Authentication required.",
        });
    }

    const senderAlias = alias(users, "friend_request_sender");
    const inviterAlias = alias(users, "study_group_inviter");

    const [friendRows, inviteRows] = await Promise.all([
        db
            .select({
                requestId: friendRequest.requestId,
                senderId: friendRequest.senderId,
                senderName: senderAlias.userName,
                senderAvatar: senderAlias.avatarUrl,
                message: friendRequest.message,
                sentAt: friendRequest.sentAt,
            })
            .from(friendRequest)
            .innerJoin(senderAlias, eq(friendRequest.senderId, senderAlias.userId))
            .where(and(eq(friendRequest.receiverId, userId), eq(friendRequest.status, "pending"))),
        db
            .select({
                membershipId: studyGroupMembership.membershipId,
                groupId: studyGroupMembership.groupId,
                role: studyGroupMembership.role,
                invitedAt: studyGroupMembership.joinedAt,
                groupName: studyGroup.groupName,
                pathId: studyGroup.pathId,
                pathTitle: learningPath.userGoal,
                pathTopic: learningPath.userQuery,
                inviterId: studyGroup.createdBy,
                inviterName: inviterAlias.userName,
            })
            .from(studyGroupMembership)
            .innerJoin(studyGroup, eq(studyGroupMembership.groupId, studyGroup.groupId))
            .leftJoin(learningPath, eq(learningPath.pathId, studyGroup.pathId))
            .leftJoin(inviterAlias, eq(inviterAlias.userId, studyGroup.createdBy))
            .where(and(eq(studyGroupMembership.userId, userId), eq(studyGroupMembership.status, "pending"))),
    ]);

    const friendNotifications: FriendRequestNotification[] = friendRows.map((row) => ({
        type: "friend_request",
        requestId: row.requestId,
        message: row.message ?? null,
        createdAt: row.sentAt ?? null,
        sender: {
            userId: row.senderId,
            userName: row.senderName ?? null,
            avatarUrl: row.senderAvatar ?? null,
        },
    }));

    const groupNotifications: StudyGroupInvitationNotification[] = inviteRows.map((row) => ({
        type: "study_group_invitation",
        membershipId: row.membershipId,
        role: row.role ?? null,
        createdAt: row.invitedAt ?? null,
        group: {
            groupId: row.groupId,
            groupName: row.groupName ?? null,
            pathId: row.pathId,
            pathTitle: row.pathTitle ?? row.pathTopic ?? null,
        },
        inviter: row.inviterId
            ? {
                  userId: row.inviterId,
                  userName: row.inviterName ?? null,
              }
            : null,
    }));

    const notifications: UserNotification[] = [...friendNotifications, ...groupNotifications].sort(
        (a, b) => resolveTimestamp(b.createdAt) - resolveTimestamp(a.createdAt),
    );

    return res.status(StatusCodes.OK).json({
        success: true,
        notifications,
        counts: {
            total: notifications.length,
            friendRequests: friendNotifications.length,
            studyGroupInvitations: groupNotifications.length,
        },
    });
};

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

        // Calculate learning streak
        const learningActivityRows = await db
            .select({
                lastAccessed: userModuleProgress.lastAccessed,
            })
            .from(userModuleProgress)
            .where(eq(userModuleProgress.userId, userId))
            .orderBy(sql`${userModuleProgress.lastAccessed} DESC`);

        let currentStreak = 0;
        let longestStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (learningActivityRows.length > 0) {
            // Get unique dates of learning activity
            const uniqueDates = [...new Set(
                learningActivityRows
                    .map(row => row.lastAccessed)
                    .filter(date => date !== null)
                    .map(date => {
                        const d = new Date(date!);
                        d.setHours(0, 0, 0, 0);
                        return d.getTime();
                    })
            )].sort((a, b) => b - a); // Sort descending

            // Calculate current streak
            let streakCount = 0;
            let expectedDate = today.getTime();

            for (const date of uniqueDates) {
                if (date === expectedDate) {
                    streakCount++;
                    expectedDate -= 24 * 60 * 60 * 1000; // Previous day
                } else if (date < expectedDate) {
                    // Gap in streak
                    break;
                }
                // If date > expectedDate, skip (future dates shouldn't happen)
            }

            // If today has activity, count it
            if (uniqueDates.includes(today.getTime())) {
                currentStreak = streakCount;
            } else {
                // Check if yesterday has activity for current streak
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                if (uniqueDates.includes(yesterday.getTime())) {
                    currentStreak = streakCount;
                }
            }

            // Calculate longest streak
            let tempStreak = 1;
            longestStreak = 1;

            for (let i = 1; i < uniqueDates.length; i++) {
                const prevDate = new Date(uniqueDates[i - 1]);
                const currDate = new Date(uniqueDates[i]);
                const diffTime = prevDate.getTime() - currDate.getTime();
                const diffDays = diffTime / (1000 * 60 * 60 * 24);

                if (diffDays === 1) {
                    tempStreak++;
                    longestStreak = Math.max(longestStreak, tempStreak);
                } else {
                    tempStreak = 1;
                }
            }
        }

        // Calculate achievements
        const achievements = [];

        // Learning milestones
        if (completedModules >= 1) achievements.push({ id: 'first_module', name: 'First Steps', description: 'Completed your first module', icon: '🎯', unlocked: true });
        if (completedModules >= 5) achievements.push({ id: 'five_modules', name: 'Getting Started', description: 'Completed 5 modules', icon: '📚', unlocked: true });
        if (completedModules >= 10) achievements.push({ id: 'ten_modules', name: 'Knowledge Seeker', description: 'Completed 10 modules', icon: '🧠', unlocked: true });
        if (completedModules >= 25) achievements.push({ id: 'twenty_five_modules', name: 'Learning Enthusiast', description: 'Completed 25 modules', icon: '🎓', unlocked: true });
        if (completedModules >= 50) achievements.push({ id: 'fifty_modules', name: 'Master Learner', description: 'Completed 50 modules', icon: '🏆', unlocked: true });

        // Streak achievements
        if (longestStreak >= 3) achievements.push({ id: 'three_day_streak', name: 'Consistent Learner', description: 'Maintained a 3-day learning streak', icon: '🔥', unlocked: true });
        if (longestStreak >= 7) achievements.push({ id: 'week_warrior', name: 'Week Warrior', description: 'Maintained a 7-day learning streak', icon: '⚡', unlocked: true });
        if (longestStreak >= 14) achievements.push({ id: 'fortnight_champion', name: 'Fortnight Champion', description: 'Maintained a 14-day learning streak', icon: '👑', unlocked: true });
        if (longestStreak >= 30) achievements.push({ id: 'monthly_master', name: 'Monthly Master', description: 'Maintained a 30-day learning streak', icon: '🌟', unlocked: true });

        // Path achievements
        if (totalLearningPaths >= 1) achievements.push({ id: 'first_path', name: 'Pathfinder', description: 'Started your first learning path', icon: '🗺️', unlocked: true });
        if (totalLearningPaths >= 5) achievements.push({ id: 'five_paths', name: 'Explorer', description: 'Started 5 learning paths', icon: '🧭', unlocked: true });
        if (totalLearningPaths >= 10) achievements.push({ id: 'ten_paths', name: 'Trailblazer', description: 'Started 10 learning paths', icon: '🚀', unlocked: true });

        // Study group achievements
        const [{ studyGroupsJoined }] = await db
            .select({
                studyGroupsJoined: sql<number>`count(*)::int`,
            })
            .from(studyGroupMembership)
            .where(and(eq(studyGroupMembership.userId, userId), eq(studyGroupMembership.status, "active")));

        if (studyGroupsJoined >= 1) achievements.push({ id: 'first_group', name: 'Team Player', description: 'Joined your first study group', icon: '👥', unlocked: true });
        if (studyGroupsJoined >= 3) achievements.push({ id: 'three_groups', name: 'Social Learner', description: 'Joined 3 study groups', icon: '🤝', unlocked: true });
        if (studyGroupsJoined >= 5) achievements.push({ id: 'five_groups', name: 'Community Builder', description: 'Joined 5 study groups', icon: '🌍', unlocked: true });

        // Calculate progress data over time (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const progressDataRows = await db
            .select({
                date: sql<string>`DATE(${userModuleProgress.lastAccessed})`,
                completedModules: sql<number>`count(*)::int`,
            })
            .from(userModuleProgress)
            .where(
                and(
                    eq(userModuleProgress.userId, userId),
                    eq(userModuleProgress.status, "completed"),
                    sql`${userModuleProgress.lastAccessed} >= ${thirtyDaysAgo.toISOString()}`
                )
            )
            .groupBy(sql`DATE(${userModuleProgress.lastAccessed})`)
            .orderBy(sql`DATE(${userModuleProgress.lastAccessed})`);

        const progressData = progressDataRows.map(row => ({
            date: row.date,
            completedModules: row.completedModules ?? 0,
        }));

        return res.status(StatusCodes.OK).json({
            success: true,
            profile: userRecord,
            metrics: {
                totalLearningPaths: totalLearningPaths ?? 0,
                totalModules: totalModules ?? 0,
                completedModules: completedModules ?? 0,
                currentStreak,
                longestStreak,
                achievements,
                progressData,
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

export const searchUsersByName = async (req: Request, res: Response) => {
    const actorId = req.user_id;
    if (!actorId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "Authentication required." });
    }

    const queryParse = userSearchQuerySchema.safeParse(req.query);
    if (!queryParse.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            errors: queryParse.error.flatten().fieldErrors,
        });
    }

    const { term, limit = 20, offset = 0 } = queryParse.data as UserSearchQuery;
    const sanitizedTerm = `%${term.replace(/[%_]/g, "\\$&")}%`;

    const [{ total }] = await db
        .select({ total: sql<number>`count(*)::int` })
        .from(users)
        .where(
            and(
                ilike(users.userName, sanitizedTerm),
                not(eq(users.userId, actorId)),
            ),
        );

    const rows = await db
        .select({
            userId: users.userId,
            userName: users.userName,
        })
        .from(users)
        .where(
            and(
                ilike(users.userName, sanitizedTerm),
                not(eq(users.userId, actorId)),
            ),
        )
        .orderBy(users.userName)
        .limit(limit)
        .offset(offset);

    return res.status(StatusCodes.OK).json({
        success: true,
        results: rows.map((row) => ({ userId: row.userId, userName: row.userName ?? null })),
        pagination: {
            total: total ?? 0,
            limit,
            offset,
        },
    });
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
            visibility: learningPath.visibility,
            progress: learningPath.progress,
            threadId: learningPath.threadId,
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

    const moduleIds = moduleRows.map((row) => row.moduleId);

    const dependencyRows = moduleIds.length > 0
        ? await db
            .select({
                moduleId: moduleDependency.moduleId,
                prerequisiteIds: moduleDependency.prerequisiteId,
                dependencyType: moduleDependency.dependencyType,
                isOptional: moduleDependency.isOptional,
            })
            .from(moduleDependency)
            .where(inArray(moduleDependency.moduleId, moduleIds))
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
    const dependenciesByModule = new Map<number, ModuleDependencySnapshot>();
    const dependencySnapshotsByPath = new Map<number, ModuleDependencySnapshot[]>();

    for (const progress of progressRows) {
        const moduleProgress: ModuleProgressPayload = {
            status: normalizeModuleStatus(progress.status),
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

    for (const dependency of dependencyRows) {
        const snapshot: ModuleDependencySnapshot = {
            moduleId: dependency.moduleId,
            prerequisiteModuleIds: Array.isArray(dependency.prerequisiteIds)
                ? dependency.prerequisiteIds
                : [],
            dependencyType: (dependency.dependencyType as ModuleDependencySnapshot["dependencyType"]) ?? null,
            isOptional: dependency.isOptional ?? false,
        };

        dependenciesByModule.set(dependency.moduleId, snapshot);
    }

    for (const row of moduleRows) {
        if (!modulesByPath.has(row.pathId)) {
            modulesByPath.set(row.pathId, []);
        }

        const pathProgress = progressByPath.get(row.pathId);
        const moduleProgress = pathProgress?.get(row.moduleId) ?? null;
        const dependencyRecord = dependenciesByModule.get(row.moduleId);

        const prerequisites = dependencyRecord ? [...dependencyRecord.prerequisiteModuleIds] : [];
        const dependencyType = dependencyRecord?.dependencyType ?? null;
        const isOptionalDependency = dependencyRecord?.isOptional ?? false;

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
            prerequisites,
            dependencyType,
            isOptionalDependency,
        });

        if (dependencyRecord) {
            if (!dependencySnapshotsByPath.has(row.pathId)) {
                dependencySnapshotsByPath.set(row.pathId, []);
            }
            dependencySnapshotsByPath.get(row.pathId)!.push({ ...dependencyRecord });
        }
    }

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

            const dependenciesForPath = dependencySnapshotsByPath.get(path.pathId) ?? [];
            const roadmapState = coerceRoadmapState(path.progress, path.threadId ?? null, dependenciesForPath);
            const threadId = typeof path.threadId === "string" && path.threadId.trim().length > 0
                ? path.threadId
                : roadmapState?.threadId ?? null;

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
                progress: roadmapState,
                threadId,
                moduleCount: modules.length,
                modules: includeDetails ? modules : [],
                visibility: (path.visibility ?? "private") as "public" | "private" | "restricted",
            } as LearningPathPayload;
        })
        .sort((a, b) => {
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bTime - aTime;
        });
}

export const updateModuleProgress = async (req: Request, res: Response) => {
    const { user_id: userId } = req;
    if (!userId) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: "Authentication required.",
        });
    }

    const paramsResult = moduleProgressParamsSchema.safeParse(req.params ?? {});
    if (!paramsResult.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            errors: paramsResult.error.flatten().fieldErrors,
        });
    }

    const { pathId, moduleId } = paramsResult.data;

    const bodyResult = updateModuleProgressSchema.safeParse(req.body ?? {});
    if (!bodyResult.success) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            errors: bodyResult.error.flatten().fieldErrors,
        });
    }

    const payload = bodyResult.data;

    const pathRows = await db
        .select({
            pathId: learningPath.pathId,
            threadId: learningPath.threadId,
            progress: learningPath.progress,
        })
        .from(learningPath)
        .where(and(eq(learningPath.pathId, pathId), eq(learningPath.userId, userId)))
        .limit(1);

    const pathRecord = pathRows[0];
    if (!pathRecord) {
        return res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            message: "Learning path not found.",
        });
    }

    const moduleRows = await db
        .select({
            pathModuleId: learningPathModule.pathModuleId,
        })
        .from(learningPathModule)
        .where(
            and(
                eq(learningPathModule.pathId, pathId),
                eq(learningPathModule.moduleId, moduleId),
            ),
        )
        .limit(1);

    if (moduleRows.length === 0) {
        return res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            message: "Module is not part of this learning path.",
        });
    }

    const nowIso = new Date().toISOString();

    try {
        const result = await db.transaction(async (tx) => {
            const existingProgress = await tx.query.userModuleProgress.findFirst({
                where: and(
                    eq(userModuleProgress.userId, userId),
                    eq(userModuleProgress.pathId, pathId),
                    eq(userModuleProgress.moduleId, moduleId),
                ),
            });

            const existingStatus = existingProgress
                ? normalizeModuleStatus(existingProgress.status)
                : "not_started";
            const existingCompletion = existingProgress?.completionPercent
                ? Number(existingProgress.completionPercent)
                : 0;

            let completion = typeof payload.completionPercent === "number"
                ? payload.completionPercent
                : existingCompletion;

            if (Number.isNaN(completion)) {
                completion = 0;
            }

            let status: ModuleProgressStatus = payload.status
                ? payload.status
                : existingStatus;

            if (payload.markCompleted) {
                status = "completed";
                completion = 100;
            } else {
                if (completion >= 100) {
                    completion = 100;
                    status = "completed";
                } else if (status === "completed" && completion < 100) {
                    completion = 100;
                } else if (completion > 0 && status === "not_started") {
                    status = "in_progress";
                } else if (completion <= 0 && status === "in_progress") {
                    status = "not_started";
                }
            }

            if (completion < 0) {
                completion = 0;
            }
            if (completion > 100) {
                completion = 100;
            }

            const normalizedCompletion = Number(completion.toFixed(2));
            const progressPayload = {
                status,
                completionPercent: normalizedCompletion,
                lastAccessed: nowIso,
            } satisfies ModuleProgressPayload;

            if (existingProgress) {
                await tx
                    .update(userModuleProgress)
                    .set({
                        status,
                        completionPercent: normalizedCompletion.toFixed(2),
                        lastAccessed: nowIso,
                    })
                    .where(eq(userModuleProgress.moduleProgressId, existingProgress.moduleProgressId));
            } else {
                await tx.insert(userModuleProgress).values({
                    userId,
                    pathId,
                    moduleId,
                    status,
                    completionPercent: normalizedCompletion.toFixed(2),
                    lastAccessed: nowIso,
                });
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

            const normalizedModules: ProgressModuleInput[] = progressModules.map((module) => ({
                moduleId: module.moduleId,
                title: module.title ?? null,
                position: module.position ?? null,
                lessons: normalizeLessons(module.lessons),
            }));

            const moduleIdsForDependencies = progressModules.map((module) => module.moduleId);
            const dependencyRows = moduleIdsForDependencies.length > 0
                ? await tx
                    .select({
                        moduleId: moduleDependency.moduleId,
                        prerequisiteIds: moduleDependency.prerequisiteId,
                        dependencyType: moduleDependency.dependencyType,
                        isOptional: moduleDependency.isOptional,
                    })
                    .from(moduleDependency)
                    .where(inArray(moduleDependency.moduleId, moduleIdsForDependencies))
                : [];

            const dependencySnapshots: ModuleDependencySnapshot[] = dependencyRows.map((dependency) => ({
                moduleId: dependency.moduleId,
                prerequisiteModuleIds: Array.isArray(dependency.prerequisiteIds)
                    ? dependency.prerequisiteIds
                    : [],
                dependencyType: (dependency.dependencyType as ModuleDependencySnapshot["dependencyType"]) ?? null,
                isOptional: dependency.isOptional ?? false,
            }));

            const existingState = coerceRoadmapState(
                pathRecord.progress,
                pathRecord.threadId ?? null,
                dependencySnapshots,
            );

            let updatedState: RoadmapProgressSnapshot | null = null;

            if (existingState) {
                const modulesWithUpdates = existingState.modules.map((module) => {
                    if (module.moduleId !== moduleId) {
                        return module;
                    }

                    const updatedLessons = module.lessons.map((lesson) => {
                        if (isRecord(lesson)) {
                            const normalizedLesson: LessonJson = { ...lesson };
                            if (status === "completed") {
                                normalizedLesson.completed = true;
                            } else if (status === "not_started") {
                                normalizedLesson.completed = false;
                            }
                            return normalizedLesson;
                        }

                        if (status === "completed") {
                            return { completed: true } as LessonJson;
                        }

                        if (status === "not_started") {
                            return { completed: false } as LessonJson;
                        }

                        return lesson;
                    });

                    return {
                        ...module,
                        lessons: updatedLessons,
                    };
                });

                const moduleIdsInState = new Set(modulesWithUpdates.map((module) => module.moduleId));

                if (!moduleIdsInState.has(moduleId) && normalizedModules.length > 0) {
                    updatedState = buildProgressState(
                        pathRecord.progress,
                        normalizedModules,
                        dependencySnapshots,
                        nowIso,
                        pathRecord.threadId ?? null,
                    );
                } else {
                    updatedState = {
                        ...existingState,
                        modules: modulesWithUpdates,
                        dependencies: existingState.dependencies.length
                            ? existingState.dependencies
                            : dependencySnapshots,
                        updatedAt: nowIso,
                    };
                }
            } else {
                updatedState = buildProgressState(
                    pathRecord.progress,
                    normalizedModules,
                    dependencySnapshots,
                    nowIso,
                    pathRecord.threadId ?? null,
                );
            }

            const pathUpdates: Partial<typeof learningPath.$inferInsert> = {
                updatedAt: nowIso,
            };

            if (updatedState) {
                pathUpdates.progress = updatedState;
            }

            await tx
                .update(learningPath)
                .set(pathUpdates)
                .where(eq(learningPath.pathId, pathId));

            const [{ totalModules }] = await tx
                .select({
                    totalModules: sql<number>`count(*)::int`,
                })
                .from(learningPathModule)
                .where(eq(learningPathModule.pathId, pathId));

            const [{ completedModules }] = await tx
                .select({
                    completedModules: sql<number>`count(*)::int`,
                })
                .from(userModuleProgress)
                .where(
                    and(
                        eq(userModuleProgress.userId, userId),
                        eq(userModuleProgress.pathId, pathId),
                        eq(userModuleProgress.status, "completed"),
                    ),
                );

            const totalCount = totalModules ?? 0;
            const completedCount = completedModules ?? 0;
            const pathCompletionPercent = totalCount > 0
                ? Number(((completedCount / totalCount) * 100).toFixed(2))
                : 0;

            return {
                progressPayload,
                totals: {
                    totalModules: totalCount,
                    completedModules: completedCount,
                    completionPercent: pathCompletionPercent,
                    updatedAt: nowIso,
                },
                state: updatedState,
            };
        });

        return res.status(StatusCodes.OK).json({
            success: true,
            moduleProgress: {
                pathId,
                moduleId,
                status: result.progressPayload.status,
                completionPercent: result.progressPayload.completionPercent,
                lastAccessed: result.progressPayload.lastAccessed,
            },
            pathProgress: result.totals,
            roadmapState: result.state,
        });
    } catch (error) {
        console.error("Failed to update module progress:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Unable to update module progress.",
        });
    }
};

export const getModuleQuizzes = async (req: Request, res: Response) => {
    const { user_id: userId } = req;
    if (!userId) return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "Authentication required." });

    const params = moduleProgressParamsSchema.safeParse(req.params ?? {});
    if (!params.success) return res.status(StatusCodes.BAD_REQUEST).json({ success: false, errors: params.error.flatten().fieldErrors });

    const { pathId, moduleId } = params.data;

    const rows = await db
        .select({
            quizId: quiz.quizId,
            title: quiz.title,
            description: quiz.description,
            lessonIndex: quiz.lessonIndex,
            questionId: quizQuestion.questionId,
            prompt: quizQuestion.prompt,
            questionType: quizQuestion.questionType,
            choices: quizQuestion.choices,
        })
        .from(quiz)
        .leftJoin(quizQuestion, eq(quizQuestion.quizId, quiz.quizId))
        .where(and(eq(quiz.pathId, pathId), eq(quiz.moduleId, moduleId)))
        .orderBy(quiz.quizId, quizQuestion.questionId);

    const quizzesMap = new Map<number, any>();
    for (const r of rows) {
        if (!quizzesMap.has(r.quizId)) quizzesMap.set(r.quizId, { quizId: r.quizId, title: r.title, description: r.description, lessonIndex: r.lessonIndex, questions: [] });
        if (r.questionId) {
            quizzesMap.get(r.quizId).questions.push({ questionId: r.questionId, prompt: r.prompt, type: r.questionType ?? null, choices: r.choices ?? null });
        }
    }

    return res.status(StatusCodes.OK).json({ success: true, quizzes: Array.from(quizzesMap.values()) });
};

export const submitModuleQuizAnswers = async (req: Request, res: Response) => {
    const { user_id: userId } = req;
    if (!userId) return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: "Authentication required." });

    const params = moduleProgressParamsSchema.safeParse(req.params ?? {});
    if (!params.success) return res.status(StatusCodes.BAD_REQUEST).json({ success: false, errors: params.error.flatten().fieldErrors });
    const { pathId, moduleId } = params.data;

    const body = z.object({ answers: z.array(z.object({ questionId: z.number().int().positive(), answer: z.string() })) }).safeParse(req.body ?? {});
    if (!body.success) return res.status(StatusCodes.BAD_REQUEST).json({ success: false, errors: body.error.flatten().fieldErrors });

    const nowIso = new Date().toISOString();

    try {
        const result = await db.transaction(async (tx) => {
            // load questions
            const qrows = await tx.select({ questionId: quizQuestion.questionId, answer: quizQuestion.answer }).from(quizQuestion).where(inArray(quizQuestion.questionId, body.data.answers.map(a=>a.questionId)));

            const answerMap = new Map<number,string>();
            for (const q of qrows) answerMap.set(q.questionId, (q.answer ?? "").toString());

            let correct = 0;
            for (const ans of body.data.answers) {
                const correctAns = answerMap.get(ans.questionId) ?? "";
                const isCorrect = correctAns.trim().toLowerCase() === ans.answer.trim().toLowerCase();

                // upsert user answer
                const existing = await tx.query.userQuizAnswer.findFirst({ where: and(eq(userQuizAnswer.userId, userId), eq(userQuizAnswer.questionId, ans.questionId)) });
                if (existing) {
                    await tx.update(userQuizAnswer).set({ answer: ans.answer, isCorrect, createdAt: nowIso }).where(eq(userQuizAnswer.answerId, existing.answerId));
                } else {
                    await tx.insert(userQuizAnswer).values({ userId, questionId: ans.questionId, answer: ans.answer, isCorrect, createdAt: nowIso });
                }

                if (isCorrect) correct++;
            }

            const totalQuestions = body.data.answers.length;
            const completionPercent = totalQuestions > 0 ? Number(((correct / totalQuestions) * 100).toFixed(2)) : 0;

            // upsert module progress for user
            const existingProgress = await tx.query.userModuleProgress.findFirst({ where: and(eq(userModuleProgress.userId, userId), eq(userModuleProgress.pathId, pathId), eq(userModuleProgress.moduleId, moduleId)) });
            const status = completionPercent >= 100 ? "completed" : (completionPercent > 0 ? "in_progress" : "not_started");

            if (existingProgress) {
                await tx.update(userModuleProgress).set({ status, completionPercent: completionPercent.toFixed(2), lastAccessed: nowIso }).where(eq(userModuleProgress.moduleProgressId, existingProgress.moduleProgressId));
            } else {
                await tx.insert(userModuleProgress).values({ userId, pathId, moduleId, status, completionPercent: completionPercent.toFixed(2), lastAccessed: nowIso });
            }

            // compute path totals
            const [{ totalModules }] = await tx.select({ totalModules: sql<number>`count(*)::int` }).from(learningPathModule).where(eq(learningPathModule.pathId, pathId));
            const [{ completedModules }] = await tx.select({ completedModules: sql<number>`count(*)::int` }).from(userModuleProgress).where(and(eq(userModuleProgress.userId, userId), eq(userModuleProgress.pathId, pathId), eq(userModuleProgress.status, "completed")));

            return { completionPercent, totalModules: totalModules ?? 0, completedModules: completedModules ?? 0 };
        });

        return res.status(StatusCodes.OK).json({ success: true, result });
    } catch (error) {
        console.error("Failed to submit quiz answers:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ success: false, message: "Unable to submit answers." });
    }
};

export const getLearningPaths = async (req: Request, res: Response) => {
    const { user_id: userId } = req;
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
            lastUpdatedAt: path.roadmapState?.updatedAt ?? path.updatedAt,
            visibility: path.visibility,
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
    const { user_id: userId } = req;
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

            const moduleIdsForProgress = progressModules.map((module) => module.moduleId);
            const dependencyRows = moduleIdsForProgress.length > 0
                ? await tx
                    .select({
                        moduleId: moduleDependency.moduleId,
                        prerequisiteIds: moduleDependency.prerequisiteId,
                        dependencyType: moduleDependency.dependencyType,
                        isOptional: moduleDependency.isOptional,
                    })
                    .from(moduleDependency)
                    .where(inArray(moduleDependency.moduleId, moduleIdsForProgress))
                : [];

            const dependencySnapshots: ModuleDependencySnapshot[] = dependencyRows.map((dependency) => ({
                moduleId: dependency.moduleId,
                prerequisiteModuleIds: Array.isArray(dependency.prerequisiteIds)
                    ? dependency.prerequisiteIds
                    : [],
                dependencyType: (dependency.dependencyType as ModuleDependencySnapshot["dependencyType"]) ?? null,
                isOptional: dependency.isOptional ?? false,
            }));

            const updatedProgress = buildProgressState(
                existingPath.progress,
                normalizedProgressModules,
                dependencySnapshots,
                nowIso,
                existingPath.threadId ?? null,
            );

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

export const getSkillAssessments = async (req: Request, res: Response) => {
    try {
        const { user_id: userId } = req;
        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "Authentication required.",
            });
        }

        // Get all active skill assessments
        const assessments = await db
            .select({
                assessmentId: skillAssessment.assessmentId,
                title: skillAssessment.title,
                description: skillAssessment.description,
                topic: skillAssessment.topic,
                difficultyLevel: skillAssessment.difficultyLevel,
                estimatedDuration: skillAssessment.estimatedDuration,
                createdAt: skillAssessment.createdAt,
            })
            .from(skillAssessment)
            .where(eq(skillAssessment.isActive, true))
            .orderBy(skillAssessment.topic, skillAssessment.createdAt);

        // Get user's completed assessments
        const completedAssessments = await db
            .select({
                assessmentId: userSkillAssessment.assessmentId,
                score: userSkillAssessment.score,
                percentage: userSkillAssessment.percentage,
                skillLevel: userSkillAssessment.skillLevel,
                completedAt: userSkillAssessment.completedAt,
            })
            .from(userSkillAssessment)
            .where(eq(userSkillAssessment.userId, userId));

        // Create a map of completed assessments
        const completedMap = new Map(
            completedAssessments.map(assessment => [
                assessment.assessmentId,
                {
                    score: assessment.score,
                    percentage: assessment.percentage,
                    skillLevel: assessment.skillLevel,
                    completedAt: assessment.completedAt,
                }
            ])
        );

        // Combine assessments with completion status
        const assessmentsWithStatus = assessments.map(assessment => ({
            ...assessment,
            isCompleted: completedMap.has(assessment.assessmentId),
            result: completedMap.get(assessment.assessmentId) || null,
        }));

        return res.status(StatusCodes.OK).json({
            success: true,
            assessments: assessmentsWithStatus,
        });
    } catch (error) {
        console.error("Failed to fetch skill assessments:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Unable to fetch skill assessments at the moment.",
        });
    }
};

export const getSkillAssessment = async (req: Request, res: Response) => {
    try {
        const { user_id: userId } = req;
        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const assessmentId = Number(req.params.assessmentId);
        if (!Number.isInteger(assessmentId) || assessmentId <= 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Invalid assessment identifier.",
            });
        }

        // Get assessment details
        const assessment = await db.query.skillAssessment.findFirst({
            where: eq(skillAssessment.assessmentId, assessmentId),
        });

        if (!assessment || !assessment.isActive) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Skill assessment not found.",
            });
        }

        // Get assessment questions (assuming there's a quiz linked to this assessment)
        const assessmentQuiz = await db.query.quiz.findFirst({
            where: and(
                eq(quiz.assessmentType, "skill_assessment"),
                eq(quiz.title, assessment.title) // Simple matching, could be improved
            ),
        });

        let questions = [];
        if (assessmentQuiz) {
            const quizQuestions = await db
                .select({
                    questionId: quizQuestion.questionId,
                    prompt: quizQuestion.prompt,
                    questionType: quizQuestion.questionType,
                    choices: quizQuestion.choices,
                })
                .from(quizQuestion)
                .where(eq(quizQuestion.quizId, assessmentQuiz.quizId))
                .orderBy(quizQuestion.questionId);

            questions = quizQuestions.map(q => ({
                questionId: q.questionId,
                prompt: q.prompt,
                type: q.questionType,
                choices: q.choices,
            }));
        }

        // Check if user has already completed this assessment
        const existingResult = await db.query.userSkillAssessment.findFirst({
            where: and(
                eq(userSkillAssessment.userId, userId),
                eq(userSkillAssessment.assessmentId, assessmentId)
            ),
        });

        return res.status(StatusCodes.OK).json({
            success: true,
            assessment: {
                assessmentId: assessment.assessmentId,
                title: assessment.title,
                description: assessment.description,
                topic: assessment.topic,
                difficultyLevel: assessment.difficultyLevel,
                estimatedDuration: assessment.estimatedDuration,
                questions: questions,
                isCompleted: !!existingResult,
                result: existingResult ? {
                    score: existingResult.score,
                    percentage: existingResult.percentage,
                    skillLevel: existingResult.skillLevel,
                    completedAt: existingResult.completedAt,
                } : null,
            },
        });
    } catch (error) {
        console.error("Failed to fetch skill assessment:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Unable to fetch skill assessment details.",
        });
    }
};

export const submitSkillAssessment = async (req: Request, res: Response) => {
    try {
        const { user_id: userId } = req;
        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "Authentication required.",
            });
        }

        const assessmentId = Number(req.params.assessmentId);
        if (!Number.isInteger(assessmentId) || assessmentId <= 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: "Invalid assessment identifier.",
            });
        }

        const body = z.object({
            answers: z.array(z.object({
                questionId: z.number().int().positive(),
                answer: z.string(),
            })),
        }).safeParse(req.body);

        if (!body.success) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                errors: body.error.flatten().fieldErrors,
            });
        }

        // Check if assessment exists and is active
        const assessment = await db.query.skillAssessment.findFirst({
            where: and(
                eq(skillAssessment.assessmentId, assessmentId),
                eq(skillAssessment.isActive, true)
            ),
        });

        if (!assessment) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: "Skill assessment not found.",
            });
        }

        // Check if user has already completed this assessment
        const existingResult = await db.query.userSkillAssessment.findFirst({
            where: and(
                eq(userSkillAssessment.userId, userId),
                eq(userSkillAssessment.assessmentId, assessmentId)
            ),
        });

        if (existingResult) {
            return res.status(StatusCodes.CONFLICT).json({
                success: false,
                message: "You have already completed this assessment.",
            });
        }

        // Get correct answers
        const questionIds = body.data.answers.map(a => a.questionId);
        const correctAnswers = await db
            .select({
                questionId: quizQuestion.questionId,
                answer: quizQuestion.answer,
            })
            .from(quizQuestion)
            .where(inArray(quizQuestion.questionId, questionIds));

        const answerMap = new Map(correctAnswers.map(q => [q.questionId, q.answer?.toString() || ""]));

        // Calculate score
        let correct = 0;
        const totalQuestions = body.data.answers.length;

        for (const userAnswer of body.data.answers) {
            const correctAnswer = answerMap.get(userAnswer.questionId) || "";
            const isCorrect = correctAnswer.trim().toLowerCase() === userAnswer.answer.trim().toLowerCase();
            if (isCorrect) correct++;
        }

        const score = correct;
        const maxScore = totalQuestions;
        const percentage = totalQuestions > 0 ? Number(((correct / totalQuestions) * 100).toFixed(2)) : 0;

        // Determine skill level
        let skillLevel = "beginner";
        if (percentage >= 90) skillLevel = "expert";
        else if (percentage >= 75) skillLevel = "advanced";
        else if (percentage >= 60) skillLevel = "intermediate";

        // Save result
        await db.insert(userSkillAssessment).values({
            userId,
            assessmentId,
            score: score.toString(),
            maxScore: maxScore.toString(),
            percentage: percentage.toString(),
            skillLevel,
            completedAt: new Date().toISOString(),
        });

        // Create activity
        await createActivity(
            userId,
            'skill_assessment_completed',
            assessmentId,
            'skill_assessment',
            {
                score,
                maxScore,
                percentage,
                skillLevel,
                topic: assessment.topic,
                title: assessment.title,
            }
        );

        return res.status(StatusCodes.OK).json({
            success: true,
            result: {
                score,
                maxScore,
                percentage,
                skillLevel,
                completedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error("Failed to submit skill assessment:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Unable to submit assessment.",
        });
    }
};

export const getActivityFeed = async (req: Request, res: Response) => {
    try {
        const { user_id: userId } = req;
        if (!userId) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: "Authentication required.",
            });
        }

        // Get user's friends
        const friends = await db
            .select({ friendUserId: userFriend.friendUserId })
            .from(userFriend)
            .where(eq(userFriend.userId, userId));

        const friendIds = friends.map(f => f.friendUserId);

        // Get user's study groups
        const userStudyGroups = await db
            .select({ groupId: studyGroupMembership.groupId })
            .from(studyGroupMembership)
            .where(and(
                eq(studyGroupMembership.userId, userId),
                eq(studyGroupMembership.status, "active")
            ));

        const groupIds = userStudyGroups.map(g => g.groupId);

        // Get all relevant user IDs (friends + study group members + self)
        const relevantUserIds = new Set([userId, ...friendIds]);

        if (groupIds.length > 0) {
            const groupMembers = await db
                .select({ userId: studyGroupMembership.userId })
                .from(studyGroupMembership)
                .where(and(
                    inArray(studyGroupMembership.groupId, groupIds),
                    eq(studyGroupMembership.status, "active")
                ));

            groupMembers.forEach(member => relevantUserIds.add(member.userId));
        }

        const activities = await db
            .select({
                activityId: activity.activityId,
                activityType: activity.activityType,
                targetId: activity.targetId,
                targetType: activity.targetType,
                metadata: activity.metadata,
                createdAt: activity.createdAt,
                userId: activity.userId,
                userName: users.userName,
                userAvatar: users.avatarPublicUrl,
            })
            .from(activity)
            .innerJoin(users, eq(activity.userId, users.userId))
            .where(inArray(activity.userId, Array.from(relevantUserIds)))
            .orderBy(sql`${activity.createdAt} DESC`)
            .limit(50);

        // Sort by created date (already sorted by query)
        const recentActivities = activities.slice(0, 50);

        // Format activities for frontend
        const formattedActivities = recentActivities.map(activity => ({
            id: activity.activityId,
            type: activity.activityType,
            user: {
                id: activity.userId,
                name: activity.userName || 'Unknown User',
                avatar: activity.userAvatar,
            },
            target: {
                id: activity.targetId,
                type: activity.targetType,
            },
            metadata: activity.metadata,
            createdAt: activity.createdAt,
        }));

        return res.status(StatusCodes.OK).json({
            success: true,
            activities: formattedActivities,
        });
    } catch (error) {
        console.error("Failed to fetch activity feed:", error);
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Unable to fetch activity feed.",
        });
    }
};

// Helper function to create activity
export const createActivity = async (
    userId: number,
    activityType: string,
    targetId?: number,
    targetType?: string,
    metadata: Record<string, any> = {}
) => {
    try {
        await db.insert(activity).values({
            userId,
            activityType: activityType as any, // Cast to bypass type checking
            targetId,
            targetType,
            metadata,
            createdAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Failed to create activity:", error);
        // Don't throw error to avoid breaking main functionality
    }
};
