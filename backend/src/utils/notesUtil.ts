import { and, eq } from "drizzle-orm";
import { db } from "../drizzle";
import { media, noteMediaAlignment, notes } from "../drizzle/schema";

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
): Promise<number> {
    const [inserted] = await db
        .insert(notes)
        .values({
            userId,
            title,
            content: normalizeContent(content),
            tags: normalizeTags(tags),
        })
        .returning({ noteId: notes.noteId });

    return inserted.noteId;
}

export async function getNoteWithMedia(noteId: number) {
    const [note] = await db
        .select()
        .from(notes)
        .where(eq(notes.noteId, noteId))
        .limit(1);

    if (!note) {
        throw new Error("Note not found");
    }

    const mediaRows = await db
        .select()
        .from(media)
        .where(eq(media.noteId, noteId));

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
        .update(notes)
        .set({
            title,
            content: normalizeContent(content),
            tags: normalizeTags(tags),
            updatedAt: new Date().toISOString(),
        })
        .where(and(eq(notes.noteId, noteId), eq(notes.userId, userId)))
        .returning({ noteId: notes.noteId });

    if (!updated) {
        throw new Error("Note not found or access denied");
    }

    return true;
}