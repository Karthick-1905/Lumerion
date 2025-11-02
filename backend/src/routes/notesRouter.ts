import { Router } from "express";
import multer from "multer";
import {
  createNoteHandler,
  getNoteHandler,
  updateNoteHandler,
  uploadMediaHandler,
} from "../controller/notesController";

const router = Router();
const upload = multer();

router.post("/", createNoteHandler);
router.get("/:noteId", getNoteHandler);
router.put("/:noteId", updateNoteHandler);
router.post("/:noteId/media", upload.single("file"), uploadMediaHandler);

export default router;