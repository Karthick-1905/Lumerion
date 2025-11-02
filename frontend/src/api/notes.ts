import { apiClient } from "./client";
import { API_CONFIG } from "./config";
import type {
  CreateNoteResponse,
  Note,
  UpsertNotePayload,
  UpdateNoteResponse,
  UploadMediaResponse,
} from "./types";

export const notesApi = {
  createNote: (payload: UpsertNotePayload) =>
    apiClient.post<CreateNoteResponse>(API_CONFIG.ENDPOINTS.NOTES.CREATE, payload),

  getNote: (noteId: number | string) =>
    apiClient.get<Note>(API_CONFIG.ENDPOINTS.NOTES.DETAIL(noteId)),

  updateNote: (noteId: number | string, payload: UpsertNotePayload) =>
    apiClient.put<UpdateNoteResponse>(API_CONFIG.ENDPOINTS.NOTES.UPDATE(noteId), payload),

  uploadMedia: (noteId: number | string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    return apiClient.post<UploadMediaResponse>(
      API_CONFIG.ENDPOINTS.NOTES.UPLOAD_MEDIA(noteId),
      formData
    );
  },
};
