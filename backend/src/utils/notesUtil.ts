import { and, eq, or } from "drizzle-orm";
import { db } from "../drizzle";
import { noteMedia, noteMediaAlignment, studyNote, studyGroup, studyGroupMembership, users } from "../drizzle/schema";

const normalizeContent = (content: unknown): unknown => {
    if (content === undefined || content === null) {
        return null;
    }

    if (typeof content === "string") {
        try {
            const parsed = JSON.parse(content);
            return parsed ?? null;
        } catch {
            return { type: "text", text: content };
        }
    }

    if (typeof content === "object") {
        return content;
    }

    return null;
};

const normalizeTags = (tags?: unknown): string[] | null => {
    if (tags === undefined || tags === null) {
        return null;
    }

    if (Array.isArray(tags)) {
        const normalized = tags
            .filter((tag): tag is string => typeof tag === "string")
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0);

        return normalized.length > 0 ? normalized : null;
    }

    if (typeof tags === "string") {
        try {
            const parsed = JSON.parse(tags);
            return normalizeTags(parsed);
        } catch {
            const normalized = tags
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag.length > 0);
            return normalized.length > 0 ? normalized : null;
        }
    }

    return null;
};

export async function createNote(
    userId: number,
    title: string,
    content: unknown,
    tags?: unknown,
): Promise<{ noteId: number; collaborationRoom: string }> {
    const [inserted] = await db
        .insert(studyNote)
        .values({
            userId,
            title,
            content: normalizeContent(content),
            tags: normalizeTags(tags),
        })
        .returning({ noteId: studyNote.noteId });

    const collaborationRoom = `note-${inserted.noteId}`;

    await db
        .update(studyNote)
        .set({
            collaborationRoom,
            collaborationEnabled: true,
            collaborationLastSyncedAt: new Date().toISOString(),
        })
        .where(eq(studyNote.noteId, inserted.noteId));

    return { noteId: inserted.noteId, collaborationRoom };
}

export async function getNoteWithMedia(noteId: number) {
    const [note] = await db
        .select()
        .from(studyNote)
        .where(eq(studyNote.noteId, noteId))
        .limit(1);

    if (!note) {
        throw new Error("Note not found");
    }

    const mediaRows = await db
        .select()
        .from(noteMedia)
        .where(eq(noteMedia.noteId, noteId));

    const alignmentRows = await db
        .select()
        .from(noteMediaAlignment)
        .where(eq(noteMediaAlignment.noteId, noteId));

    const mediaWithAlignments = mediaRows.map((item) => ({
        ...item,
        alignments: alignmentRows
            .filter((alignment) => alignment.mediaId === item.mediaId)
            .map((alignment) => ({
                alignmentId: alignment.alignmentId,
                blockPath: alignment.blockPath,
                position: alignment.position ?? 0,
            })),
    }));

    return {
        ...note,
        tags: note.tags ?? [],
        media: mediaWithAlignments,
    };
}

export async function updateNote(
    noteId: number,
    userId: number,
    title: string,
    content: unknown,
    tags?: unknown,
) {
    const [updated] = await db
        .update(studyNote)
        .set({
            title,
            content: normalizeContent(content),
            tags: normalizeTags(tags),
            updatedAt: new Date().toISOString(),
            collaborationLastSyncedAt: new Date().toISOString(),
        })
        .where(and(eq(studyNote.noteId, noteId), eq(studyNote.userId, userId)))
        .returning({ noteId: studyNote.noteId });

    if (!updated) {
        throw new Error("Note not found or access denied");
    }

    return true;
}

export async function checkStudyGroupMembership(userId: number, groupId: number): Promise<boolean> {
    const [membership] = await db
        .select()
        .from(studyGroupMembership)
        .where(and(
            eq(studyGroupMembership.groupId, groupId),
            eq(studyGroupMembership.userId, userId),
            eq(studyGroupMembership.status, 'active')
        ))
        .limit(1);

    return !!membership;
}

export async function getStudyGroupNotes(groupId: number, userId?: number) {
    // Get all notes shared with this study group
    const groupNotes = await db
        .select({
            noteId: studyNote.noteId,
            title: studyNote.title,
            content: studyNote.content,
            visibilityScope: studyNote.visibilityScope,
            noteType: studyNote.noteType,
            collaborationEnabled: studyNote.collaborationEnabled,
            collaborationRoom: studyNote.collaborationRoom,
            tags: studyNote.tags,
            likeCount: studyNote.likeCount,
            viewCount: studyNote.viewCount,
            createdAt: studyNote.createdAt,
            updatedAt: studyNote.updatedAt,
            userId: studyNote.userId,
            userName: users.userName,
        })
        .from(studyNote)
        .innerJoin(users, eq(studyNote.userId, users.userId))
        .where(and(
            eq(studyNote.sharedWithGroupId, groupId),
            or(
                eq(studyNote.visibilityScope, 'group'),
                eq(studyNote.visibilityScope, 'public')
            )
        ));

    // If user is provided, also include their private notes for this group
    if (userId) {
        const userPrivateNotes = await db
            .select({
                noteId: studyNote.noteId,
                title: studyNote.title,
                content: studyNote.content,
                visibilityScope: studyNote.visibilityScope,
                noteType: studyNote.noteType,
                collaborationEnabled: studyNote.collaborationEnabled,
                collaborationRoom: studyNote.collaborationRoom,
                tags: studyNote.tags,
                likeCount: studyNote.likeCount,
                viewCount: studyNote.viewCount,
                createdAt: studyNote.createdAt,
                updatedAt: studyNote.updatedAt,
                userId: studyNote.userId,
                userName: users.userName,
            })
            .from(studyNote)
            .innerJoin(users, eq(studyNote.userId, users.userId))
            .where(and(
                eq(studyNote.userId, userId),
                eq(studyNote.sharedWithGroupId, groupId),
                eq(studyNote.visibilityScope, 'private')
            ));

        groupNotes.push(...userPrivateNotes);
    }

    return groupNotes;
}

export async function createStudyGroupNote(
    userId: number,
    groupId: number,
    title: string,
    content: unknown,
    tags?: unknown,
    visibilityScope: 'private' | 'group' | 'public' = 'private'
): Promise<{ noteId: number; collaborationRoom: string }> {
    // Verify user is member of the study group
    const isMember = await checkStudyGroupMembership(userId, groupId);
    if (!isMember) {
        throw new Error("User is not a member of this study group");
    }

    const [inserted] = await db
        .insert(studyNote)
        .values({
            userId,
            title,
            content: normalizeContent(content),
            tags: normalizeTags(tags),
            sharedWithGroupId: groupId,
            visibilityScope,
            isShared: visibilityScope !== 'private',
        })
        .returning({ noteId: studyNote.noteId });

    const collaborationRoom = `group-${groupId}-note-${inserted.noteId}`;

    await db
        .update(studyNote)
        .set({
            collaborationRoom,
            collaborationEnabled: true,
            collaborationLastSyncedAt: new Date().toISOString(),
        })
        .where(eq(studyNote.noteId, inserted.noteId));

    return { noteId: inserted.noteId, collaborationRoom };
}

export async function updateNoteSharing(
    noteId: number,
    userId: number,
    visibilityScope: 'private' | 'group' | 'public',
    groupId?: number
) {
    const updateData: any = {
        visibilityScope,
        isShared: visibilityScope !== 'private',
        updatedAt: new Date().toISOString(),
        collaborationLastSyncedAt: new Date().toISOString(),
    };

    if (groupId !== undefined) {
        updateData.sharedWithGroupId = groupId;
    }

    const [updated] = await db
        .update(studyNote)
        .set(updateData)
        .where(and(eq(studyNote.noteId, noteId), eq(studyNote.userId, userId)))
        .returning({ noteId: studyNote.noteId });

    if (!updated) {
        throw new Error("Note not found or access denied");
    }

    return true;
}