import React, { useCallback, useEffect, useRef } from "react";
import type { JSONContent } from "@tiptap/react";
import { SimpleEditor, type CollaborationConfig } from "../../components/tiptap-templates/simple/simple-editor";

type EditorWrapperProps = {
  content: JSONContent;
  title: string;
  onTitleChange: (title: string) => void;
  onContentChange: (value: JSONContent) => void;
  disabled?: boolean;
  isSaving?: boolean;
  statusMessage?: string;
  statusTone?: "idle" | "saving" | "queued" | "error";
  collaborationConfig?: CollaborationConfig;
  contentKey?: string;
};

type AnyFn = (...args: any[]) => any;

const useStableEvent = <Fn extends AnyFn | undefined>(handler: Fn) => {
  const handlerRef = useRef<Fn>(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  return useCallback((...args: Fn extends AnyFn ? Parameters<Fn> : never) => {
    const current = handlerRef.current;
    if (typeof current === "function") {
      (current as AnyFn)(...args);
    }
  }, []) as Fn extends AnyFn
    ? (...args: Parameters<Fn>) => ReturnType<Fn>
    : () => void;
};

const EditorWrapper: React.FC<EditorWrapperProps> = ({
  content,
  title,
  onTitleChange,
  onContentChange,
  disabled = false,
  isSaving = false,
  statusMessage,
  statusTone = "idle",
  collaborationConfig,
  contentKey,
}) => {
  const stableContentChange = useStableEvent(onContentChange);
  const stableTitleChange = useStableEvent(onTitleChange);

  return (
    <SimpleEditor
      key={contentKey}
      title={title}
      onTitleChange={stableTitleChange}
      content={content}
      onContentChange={stableContentChange}
      disabled={disabled}
      isSaving={isSaving}
      statusMessage={statusMessage}
      statusTone={statusTone}
      collaborationConfig={collaborationConfig}
    />
  );
};

export default React.memo(EditorWrapper);
