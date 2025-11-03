// src/controllers/noteController.ts
import type { Request, Response } from "express";
import { promises as fs } from "fs";
import path from "path";
import * as noteService from "../utils/notesUtil"
import * as mediaService from "../config/minio";
import { client as redisClient } from "../utils/redisClient";
import type { File as MulterFile } from "multer";

type UploadedFile = MulterFile & { path: string };
type MulterRequest = Request & { file?: UploadedFile };

const MEDIA_CACHE_PREFIX = "note:media";
const MEDIA_CACHE_TTL_SECONDS = Number(process.env.MEDIA_CACHE_TTL ?? 60 * 60);

export async function uploadMediaHandler(req: Request, res: Response) {
  let absoluteFilePath: string | undefined;
  try {
    const { noteId: noteIdParam } = req.params;
    const noteId = Number(noteIdParam);
    if (!Number.isInteger(noteId)) {
      return res.status(400).json({ error: "Invalid note id" });
    }

  const { file } = req as MulterRequest;
    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (!file.path) {
      return res.status(500).json({ error: "Uploaded file missing path" });
    }

    const userId = Number(req.user_id);
    if (!Number.isInteger(userId)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    absoluteFilePath = path.resolve(file.path);
    let fileBuffer: Buffer;

    try {
      fileBuffer = await fs.readFile(absoluteFilePath);
    } catch (readError) {
      console.error("Failed to read uploaded file", readError);
      return res.status(500).json({ error: "Unable to process uploaded file" });
    }

    const result = await mediaService.uploadMedia({
      noteId,
      buffer: fileBuffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      userId,
    });

    const cacheKey = `${MEDIA_CACHE_PREFIX}:${noteId}:${result.mediaId}`;

    const cachePayload = {
      ...result,
      noteId,
      cachedAt: new Date().toISOString(),
      // Stored as base64 to safely transport binary data if needed downstream.
      base64: fileBuffer.toString("base64"),
    } as const;

    redisClient
      .set(cacheKey, JSON.stringify(cachePayload), "EX", MEDIA_CACHE_TTL_SECONDS)
      .catch((cacheError) => {
        console.warn("Unable to cache media payload", cacheError);
      });

    return res.json({
      mediaId: result.mediaId,
      url: result.url,
      type: result.type,
      metadata: result.metadata,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal error" });
  } finally {
    if (absoluteFilePath) {
      fs.unlink(absoluteFilePath).catch((unlinkError) => {
        console.warn("Failed to clean up temp upload", unlinkError);
      });
    }
  }
}

export async function createNoteHandler(req: Request, res: Response) {
  try {
    const userId = Number(req.user_id);
    if (!Number.isInteger(userId)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { title, content, tags } = req.body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({ error: "Title is required" });
    }

    const { noteId, collaborationRoom } = await noteService.createNote(
      userId,
      title.trim(),
      content,
      tags
    );
    res.status(201).json({ noteId, collaborationRoom });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal error" });
  }
}

export async function getNoteHandler(req: Request, res: Response) {
  try {
    const { noteId: noteIdParam } = req.params;
    const noteId = Number(noteIdParam);
    if (!Number.isInteger(noteId)) {
      return res.status(400).json({ error: "Invalid note id" });
    }

    const noteWithMedia = await noteService.getNoteWithMedia(noteId);
    res.json(noteWithMedia);
  } catch (err) {
    console.error(err);
    if (err instanceof Error && err.message === "Note not found") {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: "Internal error" });
  }
}

export async function updateNoteHandler(req: Request, res: Response) {
  try {
    const userId = Number(req.user_id);
    if (!Number.isInteger(userId)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { noteId: noteIdParam } = req.params;
    const noteId = Number(noteIdParam);
    if (!Number.isInteger(noteId)) {
      return res.status(400).json({ error: "Invalid note id" });
    }

    const { title, content, tags } = req.body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({ error: "Title is required" });
    }

    await noteService.updateNote(noteId, userId, title.trim(), content, tags);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    if (err instanceof Error && err.message === "Note not found or access denied") {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: "Internal error" });
  }
}

export async function getStudyGroupNotesHandler(req: Request, res: Response) {
  try {
    const userId = Number(req.user_id);
    if (!Number.isInteger(userId)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { groupId: groupIdParam } = req.params;
    const groupId = Number(groupIdParam);
    if (!Number.isInteger(groupId)) {
      return res.status(400).json({ error: "Invalid group id" });
    }

    // Check if user is member of the study group
    const isMember = await noteService.checkStudyGroupMembership(userId, groupId);
    if (!isMember) {
      return res.status(403).json({ error: "Access denied: not a member of this study group" });
    }

    const notes = await noteService.getStudyGroupNotes(groupId, userId);
    res.json({ success: true, data: { notes } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal error" });
  }
}

export async function createStudyGroupNoteHandler(req: Request, res: Response) {
  try {
    const userId = Number(req.user_id);
    if (!Number.isInteger(userId)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { groupId: groupIdParam } = req.params;
    const groupId = Number(groupIdParam);
    if (!Number.isInteger(groupId)) {
      return res.status(400).json({ error: "Invalid group id" });
    }

    const { title, content, tags, visibilityScope } = req.body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({ error: "Title is required" });
    }

    const validScopes = ['private', 'group', 'public'];
    if (visibilityScope && !validScopes.includes(visibilityScope)) {
      return res.status(400).json({ error: "Invalid visibility scope" });
    }

    const { noteId, collaborationRoom } = await noteService.createStudyGroupNote(
      userId,
      groupId,
      title.trim(),
      content,
      tags,
      visibilityScope || 'private'
    );

    res.status(201).json({ noteId, collaborationRoom });
  } catch (err) {
    console.error(err);
    if (err instanceof Error && err.message === "User is not a member of this study group") {
      return res.status(403).json({ error: err.message });
    }
    res.status(500).json({ error: "Internal error" });
  }
}

export async function updateNoteSharingHandler(req: Request, res: Response) {
  try {
    const userId = Number(req.user_id);
    if (!Number.isInteger(userId)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { noteId: noteIdParam } = req.params;
    const noteId = Number(noteIdParam);
    if (!Number.isInteger(noteId)) {
      return res.status(400).json({ error: "Invalid note id" });
    }

    const { visibilityScope, groupId } = req.body;

    const validScopes = ['private', 'group', 'public'];
    if (!visibilityScope || !validScopes.includes(visibilityScope)) {
      return res.status(400).json({ error: "Invalid visibility scope" });
    }

    await noteService.updateNoteSharing(noteId, userId, visibilityScope, groupId);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    if (err instanceof Error && err.message === "Note not found or access denied") {
      return res.status(404).json({ error: err.message });
    }
    res.status(500).json({ error: "Internal error" });
  }
}
