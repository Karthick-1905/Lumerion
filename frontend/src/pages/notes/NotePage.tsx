import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useParams } from "react-router-dom";
import type { JSONContent } from "@tiptap/react";

import EditorWrapper from "./EditorWrapper";
import { notesApi } from "../../api/notes";
import type { Note, UpsertNotePayload } from "../../api/types";
import type { UploadHandler } from "../../components/tiptap-templates/simple/simple-editor";
import useDebouncedCallback from "../../hooks/use-debounced-callback";
import fallbackContent from "../../components/tiptap-templates/simple/data/content.json";

const UNTITLED_NOTE = "Untitled note";
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 400;

type QueueMode = "idle" | "queued" | "retry-wait";
type SaveQueueState = { mode: QueueMode; attempt: number; };
type SaveJob = { payload: UpsertNotePayload; attempts: number; };

const parseNoteContent = (value: unknown): JSONContent | null => {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as JSONContent;
    } catch {
      return null;
    }
  }
  if (typeof value === "object") {
    return value as JSONContent;
  }
  return null;
};

const COLLAB_ENABLED = import.meta.env.VITE_ENABLE_NOTE_COLLAB === "true";
const COLLAB_SERVER_URL = import.meta.env.VITE_NOTE_COLLAB_WS_URL ?? "";

const NotePage = () => {
  const { noteId: noteIdParam } = useParams<{ noteId: string }>();
  const [searchParams] = useSearchParams();
  const collaborationAllowed = searchParams.get("collaboration") === "true";
  const queryClient = useQueryClient();

  const fallbackJSON = useMemo(() => fallbackContent as JSONContent, []);
  const fallbackSerialized = useMemo(() => JSON.stringify(fallbackContent), []);

  const [title, setTitle] = useState<string>(UNTITLED_NOTE);
  const titleRef = useRef<string>(UNTITLED_NOTE);
  const [initialEditorContent, setInitialEditorContent] = useState<JSONContent>(fallbackJSON);
  const editorContentRef = useRef<JSONContent>(fallbackJSON);
  const editorContentSerializedRef = useRef<string>(fallbackSerialized);
  const [contentRevision, setContentRevision] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [queueState, setQueueState] = useState<SaveQueueState>({ mode: "idle", attempt: 0 });

  const hasRequestedNoteRef = useRef(false);
  const saveJobRef = useRef<SaveJob | null>(null);
  const isProcessingRef = useRef(false);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const createNoteMutation = useMutation({
    mutationFn: (payload: UpsertNotePayload) => notesApi.createNote(payload),
    onSuccess: () => {
      setLastSavedAt(new Date());
      setQueueState({ mode: "idle", attempt: 0 });
      setSaveError(null);
    },
  });

  const noteId = noteIdParam ?? undefined;

  const noteQuery = useQuery({
    queryKey: ["note", noteId],
    enabled: Boolean(noteId),
    queryFn: async () => {
      if (!noteId) throw new Error("Missing note id");
      return notesApi.getNote(noteId);
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ noteId, payload }: { noteId: string; payload: UpsertNotePayload }) =>
      notesApi.updateNote(noteId, payload),
    retry: 0,
    onMutate: async ({ noteId, payload }) => {
      setSaveError(null);
      await queryClient.cancelQueries({ queryKey: ["note", noteId] });
      const previous = queryClient.getQueryData<Note>(["note", noteId]);
      if (previous) {
        const optimistic: Note = {
          ...previous,
          title: payload.title,
          content: JSON.stringify(payload.content),
          tags: payload.tags !== undefined ? payload.tags : previous.tags,
        };
        queryClient.setQueryData(["note", noteId], optimistic);
      }
      return { previous };
    },
    onError: (_error, vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["note", vars.noteId], context.previous);
      }
    },
    onSuccess: (_data, vars) => {
      setLastSavedAt(new Date());
      queryClient.setQueryData(["note", vars.noteId], (current?: Note) =>
        current
          ? {
              ...current,
              title: vars.payload.title,
              content: JSON.stringify(vars.payload.content),
              tags:
                vars.payload.tags !== undefined
                  ? vars.payload.tags
                  : current.tags,
            }
          : current
      );
    },
  });

  const processQueue = useCallback(async () => {
    if (!noteId || isProcessingRef.current) return;
    const job = saveJobRef.current;
    if (!job) return;

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    isProcessingRef.current = true;
    saveJobRef.current = null;

    setQueueState({ mode: "queued", attempt: job.attempts });

    try {
      await updateNoteMutation.mutateAsync({ noteId, payload: job.payload });
      const hasNext = Boolean(saveJobRef.current);
      setQueueState({ mode: hasNext ? "queued" : "idle", attempt: 0 });
      setSaveError(null);
    } catch (err) {
      const nextAttempts = job.attempts + 1;
      if (nextAttempts <= MAX_RETRY_ATTEMPTS) {
        const delay = Math.min(RETRY_BASE_DELAY_MS * 2 ** (nextAttempts - 1), 4000);
        saveJobRef.current = { payload: job.payload, attempts: nextAttempts };
        setQueueState({ mode: "retry-wait", attempt: nextAttempts });
        retryTimeoutRef.current = setTimeout(() => {
          retryTimeoutRef.current = null;
          void processQueue();
        }, delay);
      } else {
        setQueueState({ mode: "idle", attempt: nextAttempts });
        setSaveError("Autosave failed. We'll keep your changes until you retry.");
      }
    } finally {
      isProcessingRef.current = false;
      if (saveJobRef.current) {
        void processQueue();
      }
    }
  }, [noteId, updateNoteMutation]);

  const enqueueSave = useCallback((payload: UpsertNotePayload) => {
    if (!noteId) return;
    setSaveError(null);
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    saveJobRef.current = { payload, attempts: 0 };
    setQueueState({ mode: "queued", attempt: 0 });
    if (!isProcessingRef.current) {
      void processQueue();
    }
  }, [noteId, processQueue]);

  const debouncedSave = useDebouncedCallback((payload: UpsertNotePayload) => {
    enqueueSave(payload);
  }, 1000);

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    saveJobRef.current = null;
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    setQueueState({ mode: "idle", attempt: 0 });
    setSaveError(null);
  }, [noteId]);

  useEffect(() => {
    if (!noteId && !hasRequestedNoteRef.current && !createNoteMutation.isPending) {
      hasRequestedNoteRef.current = true;
      createNoteMutation.mutate({
        title: UNTITLED_NOTE,
        content: fallbackContent as JSONContent,
        tags: [],
      });
    }
  }, [noteId]);

  useEffect(() => {
    if (noteId) {
      return;
    }
    titleRef.current = UNTITLED_NOTE;
    setTitle(UNTITLED_NOTE);
    editorContentRef.current = fallbackJSON;
    editorContentSerializedRef.current = fallbackSerialized;
    setInitialEditorContent(fallbackJSON);
    setContentRevision((prev) => prev + 1);
  }, [noteId, fallbackJSON, fallbackSerialized]);

  useEffect(() => {
    const data = noteQuery.data;
    if (!data) return;

    if (data.title && data.title !== titleRef.current) {
      titleRef.current = data.title;
      setTitle(data.title);
    }

    if (
      Array.isArray(data.tags) &&
      JSON.stringify(data.tags) !== JSON.stringify(tags)
    ) {
      setTags(data.tags);
    }

    const parsed = parseNoteContent(data.content) ?? fallbackJSON;
    const serialized = JSON.stringify(parsed);
    if (serialized !== editorContentSerializedRef.current) {
      editorContentRef.current = parsed;
      editorContentSerializedRef.current = serialized;
      setInitialEditorContent(parsed);
      setContentRevision((prev) => prev + 1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteQuery.data]);

  const handlePersist = useCallback((nextTitle: string, nextContent: JSONContent | null) => {
    if (!noteId) return;
    const payload: UpsertNotePayload = {
      title: nextTitle || UNTITLED_NOTE,
      content: nextContent ?? fallbackJSON,
      tags,
    };
    setLastSavedAt(null);
    debouncedSave(payload);
  }, [noteId, tags, debouncedSave, fallbackJSON]);

  const handleTitleChange = useCallback((value: string) => {
    if (noteQuery.isLoading) return;
    if (value === titleRef.current) {
      return;
    }
    titleRef.current = value;
    setTitle(value);
    handlePersist(value, editorContentRef.current);
  }, [noteQuery.isLoading, handlePersist]);

  const handleContentChange = useCallback((value: JSONContent) => {
    if (noteQuery.isLoading) return;
    if (value === editorContentRef.current) {
      return;
    }
    const serialized = JSON.stringify(value);
    if (serialized === editorContentSerializedRef.current) {
      return;
    }
    editorContentRef.current = value;
    editorContentSerializedRef.current = serialized;
    handlePersist(titleRef.current, value);
  }, [noteQuery.isLoading, handlePersist]);

  const collaborationUserId = useMemo(() => {
    return crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  }, []);

  const noteData = noteQuery.data;
  const hasNoteData = Boolean(noteData);
  const noteCollabRoom = noteData?.collaborationRoom;
  const noteCollabEnabled = noteData?.collaborationEnabled;

  const mediaUploadHandler = useCallback<UploadHandler>(
    async (file, onProgress, signal) => {
      if (!noteId) {
        throw new Error("Please save this note before uploading media.");
      }

      const response = await notesApi.uploadMedia(noteId, file, {
        signal,
        onProgress: (progress) => {
          onProgress?.({ progress });
        },
      });

      return response;
    },
    [noteId]
  );

  const collaborationConfig = useMemo(() => {
    if (!COLLAB_SERVER_URL || !noteId || !hasNoteData) return undefined;
    const allow = COLLAB_ENABLED && collaborationAllowed && (noteCollabEnabled ?? true);
    if (!allow) return undefined;
    const docName = noteCollabRoom ?? `note-${noteId}`;
    return {
      enabled: true,
      serverUrl: COLLAB_SERVER_URL,
      documentName: docName,
      params: { noteId: String(noteId) },
      user: { id: collaborationUserId },
    };
  }, [noteId, hasNoteData, collaborationAllowed, noteCollabEnabled, noteCollabRoom, collaborationUserId]);

  const editorInstanceKey = useMemo(() => `${noteId ?? "new"}-${contentRevision}`, [noteId, contentRevision]);
  const editorIsSaving = useMemo(() => {
    return updateNoteMutation.isPending || queueState.mode === "queued" || queueState.mode === "retry-wait";
  }, [updateNoteMutation.isPending, queueState.mode]);

  const statusMessage = useMemo(() => {
    if (noteQuery.isLoading) return "Preparing note…";
    if (saveError) return saveError;
    if (updateNoteMutation.isPending) return "Saving…";
    if (queueState.mode === "retry-wait") {
      return `Retrying save (attempt ${Math.min(queueState.attempt, MAX_RETRY_ATTEMPTS)} of ${MAX_RETRY_ATTEMPTS})…`;
    }
    if (queueState.mode === "queued") {
      return queueState.attempt > 0 ? "Processing queued changes…" : "Queued to save…";
    }
    if (lastSavedAt) {
      return `Saved at ${lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit"})}`;
    }
    return "All changes saved";
  }, [noteQuery.isLoading, saveError, updateNoteMutation.isPending, queueState, lastSavedAt]);

  const statusTone = useMemo<"idle"|"saving"|"queued"|"error">(() => {
    if (noteQuery.isLoading) return "saving";
    if (saveError) return "error";
    if (updateNoteMutation.isPending) return "saving";
    if (queueState.mode === "retry-wait" || queueState.mode === "queued") return "queued";
    return "idle";
  }, [noteQuery.isLoading, saveError, updateNoteMutation.isPending, queueState]);

  if (noteQuery.isLoading) {
    return (
      <div className="simple-editor-wrapper">
        <div className="simple-editor-header">
          <p className="simple-editor-status">Loading note…</p>
        </div>
      </div>
    );
  }

  if (noteQuery.error) {
    return (
      <div className="simple-editor-wrapper">
        <div className="simple-editor-header">
          <p className="simple-editor-status">Unable to load note.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="simple-editor-wrapper">
      <EditorWrapper
        content={initialEditorContent}
        contentKey={editorInstanceKey}
        title={title}
        onTitleChange={handleTitleChange}
        onContentChange={handleContentChange}
        disabled={noteQuery.isLoading}
        isSaving={editorIsSaving}
        statusMessage={statusMessage}
        statusTone={statusTone}
        collaborationConfig={collaborationConfig}
        onUploadMedia={mediaUploadHandler}
      />
      <div className="simple-editor-footer">
        <p className={`status ${statusTone}`}>{statusMessage}</p>
      </div>
    </div>
  );
};

export default NotePage;
