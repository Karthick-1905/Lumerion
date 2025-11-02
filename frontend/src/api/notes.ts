import { apiClient } from "./client";
import { API_CONFIG } from "./config";
import type {
  CreateNoteResponse,
  Note,
  UpsertNotePayload,
  UpdateNoteResponse,
  UploadMediaResponse,
} from "./types";

export type UploadMediaOptions = {
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
};

const resolveUploadErrorMessage = (xhr: XMLHttpRequest) => {
  try {
    const data = JSON.parse(xhr.responseText);
    if (data && typeof data === "object" && "error" in data) {
      return String(data.error);
    }
    if (data && typeof data === "object" && "message" in data) {
      return String(data.message);
    }
  } catch (error) {
    // Ignore JSON parse errors; fallback to status text below.
  }
  return xhr.statusText || "Upload failed";
};

const uploadMediaWithProgress = (
  noteId: number | string,
  file: File,
  options?: UploadMediaOptions
): Promise<UploadMediaResponse> => {
  return new Promise((resolve, reject) => {
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NOTES.UPLOAD_MEDIA(noteId)}`;
    const xhr = new XMLHttpRequest();

    xhr.open("POST", url);
    xhr.withCredentials = true;

    const handleAbort = () => {
      xhr.abort();
    };

    if (options?.signal) {
      if (options.signal.aborted) {
        return reject(new DOMException("Upload aborted", "AbortError"));
      }
      options.signal.addEventListener("abort", handleAbort, { once: true });
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        options?.onProgress?.(progress);
      }
    };

    xhr.onerror = () => {
      options?.signal?.removeEventListener("abort", handleAbort);
      reject(new Error("Network error while uploading media"));
    };

    xhr.onabort = () => {
      options?.signal?.removeEventListener("abort", handleAbort);
      reject(new DOMException("Upload aborted", "AbortError"));
    };

    xhr.onload = () => {
      options?.signal?.removeEventListener("abort", handleAbort);

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as UploadMediaResponse;
          resolve(data);
        } catch (error) {
          reject(new Error("Failed to parse upload response"));
        }
      } else {
        reject(new Error(resolveUploadErrorMessage(xhr)));
      }
    };

    const formData = new FormData();
    formData.append("file", file);

    try {
      xhr.send(formData);
    } catch (error) {
      options?.signal?.removeEventListener("abort", handleAbort);
      reject(error instanceof Error ? error : new Error("Unexpected upload error"));
    }
  });
};

export const notesApi = {
  createNote: (payload: UpsertNotePayload) =>
    apiClient.post<CreateNoteResponse>(API_CONFIG.ENDPOINTS.NOTES.CREATE, payload),

  getNote: (noteId: number | string) =>
    apiClient.get<Note>(API_CONFIG.ENDPOINTS.NOTES.DETAIL(noteId)),

  updateNote: (noteId: number | string, payload: UpsertNotePayload) =>
    apiClient.put<UpdateNoteResponse>(API_CONFIG.ENDPOINTS.NOTES.UPDATE(noteId), payload),

  uploadMedia: (
    noteId: number | string,
    file: File,
    options?: UploadMediaOptions
  ) => uploadMediaWithProgress(noteId, file, options),
};
