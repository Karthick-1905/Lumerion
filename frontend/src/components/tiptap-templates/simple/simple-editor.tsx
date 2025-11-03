"use client"

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  EditorContent,
  EditorContext,
  useEditor,
  type JSONContent,
} from "@tiptap/react"
import type { Extensions } from "@tiptap/core"
import Collaboration from "@tiptap/extension-collaboration"
import CollaborationCursor from "@tiptap/extension-collaboration-cursor"
import * as Y from "yjs"
import { WebsocketProvider } from "y-websocket"

// --- Tiptap Core Extensions ---
import { StarterKit, type StarterKitOptions } from "@tiptap/starter-kit"
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

type CollaborationUser = {
  id?: string
  name?: string
  color?: string
}

export type CollaborationConfig = {
  enabled: boolean
  serverUrl: string
  documentName: string
  token?: string
  field?: string
  params?: Record<string, string>
  user?: CollaborationUser
}

const CURSOR_COLOR_PALETTE = [
  "#0ea5e9",
  "#ec4899",
  "#10b981",
  "#f97316",
  "#8b5cf6",
  "#facc15",
] as const

const DEFAULT_COLLAB_USER_NAME = "Anonymous"
const DEFAULT_COLLAB_FIELD = "content"

const debugLog = (...args: unknown[]) => {
  if (typeof window !== "undefined" && window?.console) {
    console.debug("[SimpleEditor]", ...args)
  }
}

const hashString = (value: string) => {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash)
}

const resolveUserColor = (user?: CollaborationUser) => {
  if (user?.color) return user.color
  const seedSource = user?.id ?? user?.name ?? Math.random().toString(36).slice(2)
  const paletteIndex = hashString(seedSource) % CURSOR_COLOR_PALETTE.length
  return CURSOR_COLOR_PALETTE[paletteIndex]
}

const serializeParams = (params?: Record<string, string>) => {
  if (!params) return ""
  return Object.keys(params)
    .sort()
    .map((key) => `${key}:${params[key] ?? ""}`)
    .join("|")
}

const buildCollaborationSignature = (config?: CollaborationConfig) => {
  if (!config) return "::none"
  return [
    config.enabled ? "1" : "0",
    config.serverUrl ?? "",
    config.documentName ?? "",
    config.token ?? "",
    config.field ?? "",
    serializeParams(config.params),
    config.user?.id ?? "",
    config.user?.name ?? "",
    config.user?.color ?? "",
  ].join("::")
}

const useStableCollaborationConfig = (config?: CollaborationConfig) => {
  const signature = useMemo(() => buildCollaborationSignature(config), [config])
  const storedConfigRef = useRef(config)
  const storedSignatureRef = useRef<string | null>(null)

  useEffect(() => {
    if (signature === storedSignatureRef.current) {
      return
    }
    debugLog("collaboration config updated", {
      previousSignature: storedSignatureRef.current,
      nextSignature: signature,
    })
    storedSignatureRef.current = signature
    storedConfigRef.current = config
  }, [config, signature])

  return storedConfigRef.current
}

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
  collaborationConfig?: CollaborationConfig
}

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
  showUndoRedo = true,
}: {
  onHighlighterClick: () => void
  onLinkClick: () => void
  isMobile: boolean
  showUndoRedo?: boolean
}) => {
  return (
    <>
      <Spacer />

      {showUndoRedo && (
        <>
          <ToolbarGroup>
            <UndoRedoButton action="undo" />
            <UndoRedoButton action="redo" />
          </ToolbarGroup>

          <ToolbarSeparator />
        </>
      )}

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

const SimpleEditorComponent = ({
  title = "",
  onTitleChange,
  content,
  onContentChange,
  isSaving = false,
  statusMessage,
  disabled = false,
  statusTone = "idle",
  onUploadMedia,
  collaborationConfig,
}: SimpleEditorProps) => {
  const isMobile = useIsMobile()
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
    "main"
  )
  const toolbarRef = useRef<HTMLDivElement>(null)
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

  const stableCollaborationConfig = useStableCollaborationConfig(collaborationConfig)

  const isCollaborationEnabled = Boolean(
    stableCollaborationConfig?.enabled &&
      stableCollaborationConfig.serverUrl &&
      stableCollaborationConfig.documentName
  )

  const collabParamsKey = useMemo(
    () => JSON.stringify(stableCollaborationConfig?.params ?? {}),
    [stableCollaborationConfig?.params]
  )

  const collaborationRuntime = useMemo(() => {
    if (!isCollaborationEnabled || typeof window === "undefined" || !stableCollaborationConfig) return null
    const doc = new Y.Doc()
    const params = {
      ...(stableCollaborationConfig.token ? { token: stableCollaborationConfig.token } : {}),
      ...(stableCollaborationConfig.params ?? {}),
    }
    const provider = new WebsocketProvider(
      stableCollaborationConfig.serverUrl,
      stableCollaborationConfig.documentName,
      doc,
      {
        connect: true,
        params: Object.keys(params).length ? params : undefined,
      }
    )
    return { doc, provider }
  }, [stableCollaborationConfig?.serverUrl, stableCollaborationConfig?.documentName, collabParamsKey])

  const initialContentRef = useRef<JSONContent | null>(null)
  // Ensure we only apply `content` prop once if not collab
  useEffect(() => {
    if (!isCollaborationEnabled) {
      initialContentRef.current = content ?? (defaultContent as JSONContent)
    }
  }, [content, isCollaborationEnabled])

  const stableExtensions = useMemo(() => {
    // compute the extensions array once and store it
    const list: Extensions = []
    const starterKitOptions: Partial<StarterKitOptions> & { history?: boolean } = {
      horizontalRule: false,
      link: { openOnClick: false, enableClickSelection: true },
    }
    if (isCollaborationEnabled) {
      starterKitOptions.history = false
    }
    list.push(StarterKit.configure(starterKitOptions))
    list.push(HorizontalRule)
    list.push(TextAlign.configure({ types: ["heading","paragraph"] }))
    list.push(TaskList)
    list.push(TaskItem.configure({ nested: true }))
    list.push(Highlight.configure({ multicolor: true }))
    list.push(ImageExtension)
    list.push(Typography)
    list.push(Superscript)
    list.push(Subscript)
    list.push(Selection)
    list.push(
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: onUploadMedia ?? (async (file, onProgress, signal) => {
          return handleImageUpload(file, onProgress, signal)
        }),
        onError: (error: Error) => console.error("Upload failed:", error),
      })
    )
    if (collaborationRuntime) {
      list.push(Collaboration.configure({
        document: collaborationRuntime.doc,
        field: stableCollaborationConfig?.field ?? DEFAULT_COLLAB_FIELD,
      }))
      list.push(CollaborationCursor.configure({
        provider: collaborationRuntime.provider,
        user: {
          id: stableCollaborationConfig?.user?.id,
          name: stableCollaborationConfig?.user?.name ?? DEFAULT_COLLAB_USER_NAME,
          color: resolveUserColor(stableCollaborationConfig?.user),
        }
      }))
    }
    return list
  }, [isCollaborationEnabled, collaborationRuntime, stableCollaborationConfig?.field, stableCollaborationConfig?.user, onUploadMedia])

  const [collaborationStatus, setCollaborationStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >(isCollaborationEnabled ? "connecting" : "disconnected")

  useEffect(() => {
    if (!collaborationRuntime) {
      setCollaborationStatus(isCollaborationEnabled ? "connecting" : "disconnected")
      return
    }

    const { provider } = collaborationRuntime
    debugLog("registered collaboration provider status listener")
    const handleStatus = ({ status }: { status: "connecting" | "connected" | "disconnected" }) => {
      debugLog("collaboration status", status)
      setCollaborationStatus(status)
    }

    provider.on("status", handleStatus)

    return () => {
      debugLog("unregistering collaboration provider status listener")
      provider.off("status", handleStatus)
    }
  }, [collaborationRuntime, isCollaborationEnabled])

  useEffect(() => {
    if (!collaborationRuntime) {
      return
    }

    const { provider, doc } = collaborationRuntime

    const userState = {
      id: stableCollaborationConfig?.user?.id,
      name: stableCollaborationConfig?.user?.name ?? DEFAULT_COLLAB_USER_NAME,
      color: resolveUserColor(stableCollaborationConfig?.user),
    }

    debugLog("setting local collaboration state", userState)
    provider.awareness.setLocalStateField("user", userState)

    return () => {
      debugLog("destroying collaboration runtime")
      provider.destroy()
      doc.destroy()
    }
  }, [collaborationRuntime, stableCollaborationConfig?.user])

  const displayStatusMessage = useMemo(() => {
    if (!isCollaborationEnabled) {
      return statusMessage
    }

    const collaborationLabel =
      collaborationStatus === "connected"
        ? "Collaboration synced"
        : collaborationStatus === "connecting"
          ? "Collaboration connecting…"
          : "Collaboration offline"

    if (!statusMessage) {
      return collaborationLabel
    }

    return `${statusMessage} • ${collaborationLabel}`
  }, [collaborationStatus, isCollaborationEnabled, statusMessage])

  const collabInitialContentAppliedRef = useRef(false)
  const hasEmittedContentUpdateRef = useRef(false)

  useEffect(() => {
    collabInitialContentAppliedRef.current = false
    hasEmittedContentUpdateRef.current = false
    debugLog("reset collaboration initial content flags")
  }, [collaborationRuntime])

  useEffect(() => {
    onContentChangeRef.current = onContentChange
    debugLog("onContentChange handler updated", Boolean(onContentChange))
  }, [onContentChange])

  const editor = useEditor({
    extensions: stableExtensions,
    content: !isCollaborationEnabled ? initialContentRef.current ?? undefined : undefined,
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
        const files = Array.from(clipboard.items ?? [])
          .filter(item => item.kind === "file" && item.type.startsWith("image/"))
          .map(item => item.getAsFile())
          .filter((file): file is File => Boolean(file))
        if (!files.length) {
          return false
        }
        event.preventDefault()
        void processPastedImagesRef.current(files)
        return true
      }
    },
    onUpdate: ({ editor }) => {
      if (!hasEmittedContentUpdateRef.current) {
        hasEmittedContentUpdateRef.current = true
        return
      }
      const next = editor.getJSON()
      onContentChangeRef.current?.(next)
    }
  }, [])  // <-- empty dependency array ensures one-time init

  useEffect(() => {
    if (editor) {
      debugLog("editor instance ready", {
        hasCollaboration: Boolean(collaborationRuntime),
        isCollaborationEnabled,
      })
    }
  }, [editor, collaborationRuntime, isCollaborationEnabled])

  useEffect(() => {
    if (
      !isCollaborationEnabled ||
      !editor ||
      !collaborationRuntime ||
      collabInitialContentAppliedRef.current
    ) {
      return
    }

    const fieldName = stableCollaborationConfig?.field ?? DEFAULT_COLLAB_FIELD
    const metaMap = collaborationRuntime.doc.getMap("meta") as Y.Map<unknown>
    const yXmlFragment = collaborationRuntime.doc.getXmlFragment(fieldName)
    const alreadyLoaded = metaMap.get("initialContentLoaded") === true

    if (alreadyLoaded || yXmlFragment.length > 0) {
      collabInitialContentAppliedRef.current = true
      return
    }

    const initial = content ?? (defaultContent as JSONContent)
    if (!initial) {
      return
    }

  debugLog("applying initial collaboration content", {
      hasInitial: Boolean(initial),
      emitUpdate: false,
    })
    editor.commands.setContent(initial, { emitUpdate: false })
    metaMap.set("initialContentLoaded", true)
    collabInitialContentAppliedRef.current = true
  }, [
    stableCollaborationConfig?.field,
    collaborationRuntime,
    content,
    editor,
    isCollaborationEnabled,
  ])

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
    if (isCollaborationEnabled || !editor || !content) {
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
  }, [content, editor, isCollaborationEnabled])

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
          data-collaboration-status={isCollaborationEnabled ? collaborationStatus : undefined}
        >
          {displayStatusMessage ?? (isSaving ? "Saving…" : "Saved")}
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
              showUndoRedo={!isCollaborationEnabled}
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

export const SimpleEditor = memo(SimpleEditorComponent)
