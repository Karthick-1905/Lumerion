"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  EditorContent,
  EditorContext,
  useEditor,
  type JSONContent,
} from "@tiptap/react"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { Image as TiptapImage } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Selection } from "@tiptap/extensions"

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button"
import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar"

// --- Tiptap Node ---
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button"
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover"
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap-ui/link-popover"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon"
import { LinkIcon } from "@/components/tiptap-icons/link-icon"

// --- Hooks ---
import { useIsMobile } from "@/hooks/use-mobile"
import { useWindowSize } from "@/hooks/use-window-size"
import { useCursorVisibility } from "@/hooks/use-cursor-visibility"

// --- Components ---
import { ThemeToggle } from "@/components/tiptap-templates/simple/theme-toggle"

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils"

type UploadHandler = (
  file: File,
  onProgress?: (event: { progress: number }) => void,
  signal?: AbortSignal
) => Promise<string>

// --- Styles ---
import "@/components/tiptap-templates/simple/simple-editor.scss"

import defaultContent from "@/components/tiptap-templates/simple/data/content.json"

const ImageExtension = TiptapImage.extend({
  addAttributes() {
    const parent = this.parent?.()
    return {
      ...(parent ?? {}),
      uploadId: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("data-upload-id"),
        renderHTML: (attributes: Record<string, unknown>) => {
          if (!attributes.uploadId) return {}
          return { "data-upload-id": attributes.uploadId }
        },
      },
      isTemporary: {
        default: false,
        renderHTML: (attributes: Record<string, unknown>) =>
          attributes.isTemporary
            ? { "data-temporary": String(attributes.isTemporary) }
            : {},
      },
      uploadProgress: {
        default: 0,
        renderHTML: (attributes: Record<string, unknown>) =>
          typeof attributes.uploadProgress === "number"
            ? { "data-upload-progress": attributes.uploadProgress }
            : {},
      },
    }
  },
})

type SimpleEditorProps = {
  title?: string
  onTitleChange?: (title: string) => void
  content?: JSONContent | null
  onContentChange?: (content: JSONContent) => void
  isSaving?: boolean
  statusMessage?: string
  disabled?: boolean
  statusTone?: "idle" | "saving" | "queued" | "error"
  onUploadMedia?: UploadHandler
}

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
}: {
  onHighlighterClick: () => void
  onLinkClick: () => void
  isMobile: boolean
}) => {
  return (
    <>
      <Spacer />

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu levels={[1, 2, 3, 4]} portal={isMobile} />
        <ListDropdownMenu
          types={["bulletList", "orderedList", "taskList"]}
          portal={isMobile}
        />
        <BlockquoteButton />
        <CodeBlockButton />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ImageUploadButton text="Add" />
      </ToolbarGroup>

      <Spacer />

      {isMobile && <ToolbarSeparator />}

      <ToolbarGroup>
        <ThemeToggle />
      </ToolbarGroup>
    </>
  )
}

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link"
  onBack: () => void
}) => (
  <>
    <ToolbarGroup>
      <Button data-style="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
)

export function SimpleEditor({
  title = "",
  onTitleChange,
  content,
  onContentChange,
  isSaving = false,
  statusMessage,
  disabled = false,
  statusTone = "idle",
  onUploadMedia,
}: SimpleEditorProps) {
  const isMobile = useIsMobile()
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
    "main"
  )
  const toolbarRef = useRef<HTMLDivElement>(null)
  const initialContent = useMemo(() => content ?? (defaultContent as JSONContent), [content])
  const onContentChangeRef = useRef<typeof onContentChange>(undefined)
  const uploadMedia = onUploadMedia ?? (async (file, onProgress, signal) => {
    return handleImageUpload(file, onProgress, signal)
  })
  const tempUploadsRef = useRef<Map<string, string>>(new Map())
  const processPastedImagesRef = useRef<(files: File[]) => Promise<void>>(
    async () => {}
  )
  const statusClassName = useMemo(
    () =>
      [
        "simple-editor-status",
        (statusTone === "saving" || statusTone === "queued") &&
          "simple-editor-status--saving",
        statusTone === "queued" && "simple-editor-status--queued",
        statusTone === "error" && "simple-editor-status--error",
      ]
        .filter(Boolean)
        .join(" "),
    [statusTone]
  )

  useEffect(() => {
    onContentChangeRef.current = onContentChange
  }, [onContentChange])

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: "simple-editor",
      },
      handlePaste: (_view, event) => {
        const clipboard = event.clipboardData
        if (!clipboard) return false

        const filesFromItems = Array.from(clipboard.items ?? [])
          .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
          .map((item) => item.getAsFile())
          .filter((file): file is File => Boolean(file))

        const filesFromList = Array.from(clipboard.files ?? []).filter((file) =>
          file.type.startsWith("image/")
        )

        const files = filesFromItems.length ? filesFromItems : filesFromList

        if (!files.length) {
          return false
        }

        event.preventDefault()
        void processPastedImagesRef.current(files)
        return true
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      ImageExtension,
      Typography,
      Superscript,
      Subscript,
      Selection,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: uploadMedia,
        onError: (error: Error) => console.error("Upload failed:", error),
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const nextContent = editor.getJSON()
      onContentChangeRef.current?.(nextContent)
    },
  })

  const updateImageAttributes = useCallback(
    (uploadId: string, attrs: Record<string, unknown>) => {
      if (!editor) return

      const { state } = editor
      let tr = state.tr
      let changed = false

      state.doc.descendants((node, pos) => {
        if (node.type.name === "image" && node.attrs.uploadId === uploadId) {
          tr = tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            ...attrs,
          })
          changed = true
          return false
        }
        return true
      })

      if (changed) {
        editor.view.dispatch(tr)
      }
    },
    [editor]
  )

  const removeImageById = useCallback(
    (uploadId: string) => {
      if (!editor) return

      const { state } = editor
      let tr = state.tr
      let removed = false

      state.doc.descendants((node, pos) => {
        if (removed) {
          return false
        }

        if (node.type.name === "image" && node.attrs.uploadId === uploadId) {
          tr = tr.delete(pos, pos + node.nodeSize)
          removed = true
          return false
        }

        return true
      })

      if (removed) {
        editor.view.dispatch(tr)
      }
    },
    [editor]
  )

  const processPastedImages = useCallback(
    async (files: File[]) => {
      if (!editor || !files.length) return

      for (const file of files) {
        const uploadId = crypto.randomUUID()
        const tempUrl = URL.createObjectURL(file)
        tempUploadsRef.current.set(uploadId, tempUrl)

        const filename = file.name.replace(/\.[^/.]+$/, "") || "image"

        editor
          .chain()
          .focus()
          .insertContent({
            type: "image",
            attrs: {
              src: tempUrl,
              alt: filename,
              title: filename,
              uploadId,
              isTemporary: true,
              uploadProgress: 1,
            },
          })
          .run()

        const abortController = new AbortController()

        try {
          const url = await uploadMedia(
            file,
            (event: { progress: number }) => {
              updateImageAttributes(uploadId, {
                uploadProgress: event.progress,
              })
            },
            abortController.signal
          )

          updateImageAttributes(uploadId, {
            src: url,
            isTemporary: false,
            uploadProgress: 100,
          })
        } catch (error) {
          removeImageById(uploadId)
          if (error instanceof Error && error.name !== "AbortError") {
            console.error("Image paste upload failed", error)
          }
        } finally {
          const objectUrl = tempUploadsRef.current.get(uploadId)
          if (objectUrl) {
            URL.revokeObjectURL(objectUrl)
            tempUploadsRef.current.delete(uploadId)
          }
        }
      }
    },
    [editor, uploadMedia, updateImageAttributes, removeImageById]
  )

  useEffect(() => {
    processPastedImagesRef.current = processPastedImages
  }, [processPastedImages])

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main")
    }
  }, [isMobile, mobileView])

  useEffect(() => {
    if (!editor || !content) {
      return
    }

    const current = editor.getJSON()
    const currentStr = JSON.stringify(current)
    const incomingStr = JSON.stringify(content)

    if (currentStr !== incomingStr) {
      editor.commands.setContent(content, {
        emitUpdate: false,
      })
    }
  }, [content, editor])

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled)
    }
  }, [disabled, editor])

  return (
    <div className="simple-editor-wrapper">
      <div className="simple-editor-header">
        <input
          className="simple-editor-title"
          value={title}
          onChange={(event) => onTitleChange?.(event.target.value)}
          placeholder="Untitled note"
          disabled={disabled}
        />
        <span
          className={statusClassName}
          aria-live="polite"
          data-status={statusTone}
        >
          {statusMessage ?? (isSaving ? "Saving…" : "Saved")}
        </span>
      </div>
      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          style={{
            ...(isMobile
              ? {
                  bottom: `calc(100% - ${height - rect.y}px)`,
                }
              : {}),
          }}
        >
          {mobileView === "main" ? (
            <MainToolbarContent
              onHighlighterClick={() => setMobileView("highlighter")}
              onLinkClick={() => setMobileView("link")}
              isMobile={isMobile}
            />
          ) : (
            <MobileToolbarContent
              type={mobileView === "highlighter" ? "highlighter" : "link"}
              onBack={() => setMobileView("main")}
            />
          )}
        </Toolbar>

        <EditorContent
          editor={editor}
          role="presentation"
          className="simple-editor-content"
        />
      </EditorContext.Provider>
    </div>
  )
}
