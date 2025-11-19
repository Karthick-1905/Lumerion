import { Router } from "express";
import fs from "fs";
import { tmpdir } from "os";
import path from "path";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import {
  createNoteHandler,
  getNoteHandler,
  updateNoteHandler,
  uploadMediaHandler,
  getStudyGroupNotesHandler,
  createStudyGroupNoteHandler,
  updateNoteSharingHandler,
} from "../controller/notesController";

const router = Router();

const TEMP_UPLOAD_DIR = process.env.NOTE_MEDIA_TEMP_DIR
  ? path.resolve(process.env.NOTE_MEDIA_TEMP_DIR)
  : path.join(tmpdir(), "Lumerion", "upload-cache");

fs.mkdirSync(TEMP_UPLOAD_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, TEMP_UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      const extension = path.extname(safeName);
      const baseName = path.basename(safeName, extension);
      cb(null, `${baseName}-${uuidv4()}${extension}`);
    },
  }),
  limits: {
    fileSize: Number(process.env.NOTE_MEDIA_MAX_SIZE ?? 15 * 1024 * 1024),
  },
});

router.post("/", createNoteHandler);
router.get("/:noteId", getNoteHandler);
router.put("/:noteId", updateNoteHandler);
router.put("/:noteId/sharing", updateNoteSharingHandler);
router.post("/:noteId/media", upload.single("file"), uploadMediaHandler);

// Study group notes routes
router.get("/groups/:groupId/notes", getStudyGroupNotesHandler);
router.post("/groups/:groupId/notes", createStudyGroupNoteHandler);

export default router;