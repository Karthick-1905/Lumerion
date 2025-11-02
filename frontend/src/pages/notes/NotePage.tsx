import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import type { JSONContent } from "@tiptap/react";

import { SimpleEditor } from "../../components/tiptap-templates/simple/simple-editor";
import { notesApi } from "../../api/notes";
import type { Note, UpsertNotePayload } from "../../api/types";
import useDebouncedCallback from "../../hooks/use-debounced-callback";
import fallbackContent from "../../components/tiptap-templates/simple/data/content.json";

const UNTITLED_NOTE = "Untitled note";
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 400;

type QueueMode = "idle" | "queued" | "retry-wait";

type SaveQueueState = {
  mode: QueueMode;
  attempt: number;
};

type SaveJob = {
  payload: UpsertNotePayload;
  attempts: number;
};

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

const NotePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const noteIdParam = searchParams.get("noteId");
  const queryClient = useQueryClient();
  const [title, setTitle] = useState<string>(UNTITLED_NOTE);
  const [editorContent, setEditorContent] = useState<JSONContent | null>(
    fallbackContent as JSONContent
  );
  const [tags, setTags] = useState<string[]>([]);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [queueState, setQueueState] = useState<SaveQueueState>({
    mode: "idle",
    attempt: 0,
  });
  const hasRequestedNoteRef = useRef(false);
  const saveJobRef = useRef<SaveJob | null>(null);
  const isProcessingRef = useRef(false);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const createNoteMutation = useMutation({
    mutationFn: (payload: UpsertNotePayload) => notesApi.createNote(payload),
    onSuccess: ({ noteId }) => {
      setSearchParams({ noteId: String(noteId) }, { replace: true });
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
    mutationFn: ({
      noteId,
      payload,
    }: {
      noteId: string;
      payload: UpsertNotePayload;
    }) => notesApi.updateNote(noteId, payload),
    retry: 0,
    onMutate: async ({ noteId, payload }) => {
      setSaveError(null);
      await queryClient.cancelQueries({ queryKey: ["note", noteId] });
      const previousNote = queryClient.getQueryData<Note>(["note", noteId]);

      if (previousNote) {
        const optimisticNote: Note = {
          ...previousNote,
          title: payload.title,
          content: payload.content,
          tags:
            payload.tags !== undefined ? payload.tags : previousNote.tags,
        };
        queryClient.setQueryData(["note", noteId], optimisticNote);
      }

      return { previousNote };
    },
    onError: (_error, variables, context) => {
      if (context?.previousNote) {
        queryClient.setQueryData(["note", variables.noteId], context.previousNote);
      }
    },
    onSuccess: (_data, variables) => {
      setLastSavedAt(new Date());
      queryClient.setQueryData(["note", variables.noteId], (current?: Note) =>
        current
          ? {
              ...current,
              title: variables.payload.title,
              content: variables.payload.content,
              tags:
                variables.payload.tags !== undefined
                  ? variables.payload.tags
                  : current.tags,
            }
          : current
      );
    },
  });

  const processQueue = useCallback(async () => {
    if (!noteId || isProcessingRef.current) {
      return;
    }

    const job = saveJobRef.current;
    if (!job) {
      return;
    }

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    isProcessingRef.current = true;
    saveJobRef.current = null;

    setQueueState({ mode: "queued", attempt: job.attempts });

    let shouldContinueImmediately = true;

    try {
      await updateNoteMutation.mutateAsync({ noteId, payload: job.payload });
      const hasNextJob = Boolean(saveJobRef.current);
      setQueueState({
        mode: hasNextJob ? "queued" : "idle",
        attempt: 0,
      });
      setSaveError(null);
    } catch (error) {
      const nextAttempts = job.attempts + 1;
      if (nextAttempts <= MAX_RETRY_ATTEMPTS) {
        const delay = Math.min(
          RETRY_BASE_DELAY_MS * 2 ** (nextAttempts - 1),
          4000
        );
        saveJobRef.current = {
          payload: job.payload,
          attempts: nextAttempts,
        };
        setQueueState({ mode: "retry-wait", attempt: nextAttempts });
        shouldContinueImmediately = false;
        retryTimeoutRef.current = setTimeout(() => {
          retryTimeoutRef.current = null;
          void processQueue();
        }, delay);
      } else {
        setQueueState({ mode: "idle", attempt: nextAttempts });
        setSaveError(
          "Autosave failed. We'll keep your changes here until you retry."
        );
      }
    } finally {
      isProcessingRef.current = false;
      if (shouldContinueImmediately && saveJobRef.current) {
        void processQueue();
      }
    }
  }, [noteId, updateNoteMutation]);

  const enqueueSave = useCallback(
    (payload: UpsertNotePayload) => {
      if (!noteId) return;

      setSaveError(null);

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      saveJobRef.current = {
        payload,
        attempts: 0,
      };

      setQueueState({ mode: "queued", attempt: 0 });

      if (!isProcessingRef.current) {
        void processQueue();
      }
    },
    [noteId, processQueue]
  );

  const isLoading = createNoteMutation.isPending || noteQuery.isLoading;
  const hasError = noteQuery.error || createNoteMutation.error;
  const isSavingMutation = updateNoteMutation.isPending;

  const debouncedSave = useDebouncedCallback(
    (payload: UpsertNotePayload) => {
      enqueueSave(payload);
    },
    1000
  );

  useEffect(() => () => debouncedSave.flush(), [debouncedSave]);
  useEffect(() => {
    debouncedSave.cancel();
  }, [debouncedSave, noteId]);

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
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!noteId && !hasRequestedNoteRef.current && !createNoteMutation.isPending) {
      hasRequestedNoteRef.current = true;
      createNoteMutation.mutate({
        title: UNTITLED_NOTE,
        content: fallbackContent,
        tags: [],
      });
    }
  }, [noteId, createNoteMutation]);

  useEffect(() => {
    if (!noteQuery.data) {
      return;
    }

    const note = noteQuery.data;
    setTitle(note.title ?? UNTITLED_NOTE);

    const normalizedTags = Array.isArray(note.tags)
      ? note.tags.filter((tag): tag is string => typeof tag === "string")
      : [];
    setTags(normalizedTags);

    const parsedContent =
      parseNoteContent(note.content) ?? (fallbackContent as JSONContent);
    setEditorContent(parsedContent);
  }, [noteQuery.data]);

  const handlePersist = (nextTitle: string, nextContent: JSONContent | null) => {
    if (!noteId) return;
    const payload: UpsertNotePayload = {
      title: nextTitle || UNTITLED_NOTE,
      content: nextContent ?? (fallbackContent as JSONContent),
      tags,
    };
    setLastSavedAt(null);
    debouncedSave(payload);
  };

  const handleTitleChange = (value: string) => {
    if (isLoading) return;
    setTitle(value);
    handlePersist(value, editorContent);
  };

  const handleContentChange = (value: JSONContent) => {
    if (isLoading) return;
    setEditorContent(value);
    handlePersist(title, value);
  };

  const statusMessage = useMemo(() => {
    if (isLoading) return "Preparing note…";
    if (saveError) return saveError;
    if (isSavingMutation) return "Saving…";
    if (queueState.mode === "retry-wait") {
      return `Retrying save (attempt ${Math.min(
        queueState.attempt,
        MAX_RETRY_ATTEMPTS
      )} of ${MAX_RETRY_ATTEMPTS})…`;
    }
    if (queueState.mode === "queued") {
      return queueState.attempt > 0 ? "Processing queued changes…" : "Queued to save…";
    }
    if (lastSavedAt) {
      return `Saved at ${lastSavedAt.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
    return "All changes saved";
  }, [isLoading, isSavingMutation, lastSavedAt, queueState, saveError]);

  const statusTone = useMemo<"idle" | "saving" | "queued" | "error">(() => {
    if (isLoading) return "saving";
    if (saveError) return "error";
    if (isSavingMutation) return "saving";
    if (queueState.mode === "retry-wait" || queueState.mode === "queued") {
      return "queued";
    }
    return "idle";
  }, [isLoading, saveError, isSavingMutation, queueState]);

  if (hasError) {
    return (
      <div className="simple-editor-wrapper">
        <div className="simple-editor-header">
          <p className="simple-editor-status">Unable to load note.</p>
        </div>
      </div>
    );
  }

  return (
    <SimpleEditor
      title={title}
      onTitleChange={handleTitleChange}
      content={editorContent}
      onContentChange={handleContentChange}
      isSaving={isLoading || isSavingMutation || queueState.mode !== "idle"}
      statusMessage={statusMessage}
      statusTone={statusTone}
      disabled={isLoading}
    />
  );
};

export default NotePage;