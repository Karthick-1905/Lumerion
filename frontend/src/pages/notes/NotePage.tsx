import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import type { JSONContent } from "@tiptap/react";

import { SimpleEditor } from "../../components/tiptap-templates/simple/simple-editor";
import { notesApi } from "../../api/notes";
import type { Note, UpsertNotePayload } from "../../api/types";
import useDebouncedCallback from "../../hooks/use-debounced-callback";
import fallbackContent from "../../components/tiptap-templates/simple/data/content.json";

const UNTITLED_NOTE = "Untitled note";

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
  const hasRequestedNoteRef = useRef(false);

  const createNoteMutation = useMutation({
    mutationFn: (payload: UpsertNotePayload) => notesApi.createNote(payload),
    onSuccess: ({ noteId }) => {
      setSearchParams({ noteId: String(noteId) }, { replace: true });
      setLastSavedAt(new Date());
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
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ noteId, payload }: { noteId: string; payload: UpsertNotePayload }) =>
      notesApi.updateNote(noteId, payload),
    onSuccess: (_, variables) => {
      setLastSavedAt(new Date());
      queryClient.setQueryData(["note", variables.noteId], (previous?: Note) =>
        previous
          ? {
              ...previous,
              title: variables.payload.title,
              content: variables.payload.content,
              tags: variables.payload.tags ?? previous.tags,
            }
          : previous
      );
    },
  });

  const isLoading = createNoteMutation.isPending || noteQuery.isLoading;
  const hasError = noteQuery.error || createNoteMutation.error;

  const debouncedSave = useDebouncedCallback(
    (payload: UpsertNotePayload) => {
      if (!noteId) return;
      updateNoteMutation.mutate({ noteId, payload });
    },
    600
  );

  useEffect(() => () => debouncedSave.flush(), [debouncedSave]);
  useEffect(() => {
    debouncedSave.cancel();
  }, [debouncedSave, noteId]);

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
    if (updateNoteMutation.isPending) return "Saving…";
    if (lastSavedAt) {
      return `Saved at ${lastSavedAt.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
    return "All changes saved";
  }, [isLoading, updateNoteMutation.isPending, lastSavedAt]);

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
      isSaving={isLoading || updateNoteMutation.isPending}
      statusMessage={statusMessage}
      disabled={isLoading}
    />
  );
};

export default NotePage;