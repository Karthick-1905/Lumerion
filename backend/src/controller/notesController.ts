// src/controllers/noteController.ts
import { Request, Response } from "express";
import * as noteService from "../utils/notesUtil"
import * as mediaService from "../config/minio";

type UploadedFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

type MulterRequest = Request & { file?: UploadedFile };

export async function uploadMediaHandler(req: Request, res: Response) {
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

    const userId = Number(req.user_id);
    if (!Number.isInteger(userId)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const result = await mediaService.uploadMedia({
      noteId,
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      userId,
    });

    res.json({
      mediaId: result.mediaId,
      url: result.url,
      type: result.type,
      metadata: result.metadata,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal error" });
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

    const noteId = await noteService.createNote(userId, title.trim(), content, tags);
    res.status(201).json({ noteId });
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
