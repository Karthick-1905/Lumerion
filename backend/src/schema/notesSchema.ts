import {z} from 'zod'

export const createNoteSchema = z.object({
    title: z.string().trim().min(1, "title is required"),
    content: z.string().optional(),
    noteType: z
        .enum(["text", "document", "link", "multimedia"])
        .optional()
        .default("text"),
    relatedModuleId: z
        .preprocess((value) => (value === undefined || value === null || value === "" ? null : Number(value)), z.number().int().nullable())
        .optional()
        .default(null),
    tags: z
        .preprocess((value) => {
            if (Array.isArray(value)) return value;
            if (typeof value === "string" && value.trim().length > 0) {
                try {
                    return JSON.parse(value);
                } catch {
                    return value.split(",").map((tag) => tag.trim());
                }
            }
            return [];
        }, z.array(z.string()).optional())
        .optional()
        .default([]),
});

export const  parseNoteId = z.object({
    noteId: z.coerce.number().int().positive(),
});