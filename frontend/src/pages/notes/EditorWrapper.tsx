// src/components/EditorWrapper.tsx
import React, { useEffect, useRef, useMemo } from "react";
import type { JSONContent } from "@tiptap/react";
import { SimpleEditor, type CollaborationConfig } from "../../components/tiptap-templates/simple/simple-editor";

interface EditorWrapperProps {
  content: JSONContent;
  onContentChange: (value: JSONContent) => void;
  disabled?: boolean;
  collaborationConfig?: CollaborationConfig;
}

const EditorWrapper: React.FC<EditorWrapperProps> = ({
  content,
  onContentChange,
  disabled = false,
  collaborationConfig,
}) => {
  const initialContentRef = useRef<JSONContent>(content);

  // Only re-render default content when `content` prop meaningful changes
  useEffect(() => {
    if (initialContentRef.current !== content) {
      initialContentRef.current = content;
    }
  }, [content]);

  // We memoize the SimpleEditor to avoid re‐mounting on parent state changes
  const editorElement = useMemo(() => {
    return (
      <SimpleEditor
        content={initialContentRef.current}
        disabled={disabled}
        onContentChange={onContentChange}
        collaborationConfig={collaborationConfig}
      />
    );
  // Only recreate when key props change:
  }, [onContentChange, disabled, collaborationConfig]);

  return <>{editorElement}</>;
};

export default React.memo(EditorWrapper);
