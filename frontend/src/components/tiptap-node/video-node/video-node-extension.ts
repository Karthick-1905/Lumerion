import { mergeAttributes, Node } from "@tiptap/core"

export interface VideoNodeOptions {
  HTMLAttributes: Record<string, unknown>
}

export const VideoNode = Node.create<VideoNodeOptions>({
  name: "video",

  group: "block",

  atom: true,

  draggable: true,

  selectable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      title: {
        default: null,
      },
      poster: {
        default: null,
      },
      mediaId: {
        default: null,
      },
      mimeType: {
        default: "video/mp4",
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-type="video"]',
      },
      {
        tag: "video",
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const { src, title, poster, mediaId, mimeType, ...rest } = HTMLAttributes

    const figureAttrs = mergeAttributes(
      {
        "data-type": "video",
        ...(mediaId ? { "data-media-id": mediaId } : {}),
      },
      rest
    )

    const videoAttrs = mergeAttributes(
      {
        src,
        title,
        controls: "controls",
        preload: "metadata",
        playsinline: "playsinline",
        ...(poster ? { poster } : {}),
      }
    )

    const sourceAttrs = mergeAttributes(
      {
        src,
      },
      mimeType ? { type: mimeType } : {}
    )

    return [
      "figure",
      figureAttrs,
      [
        "video",
        videoAttrs,
        ["source", sourceAttrs],
      ],
    ]
  },
})

export default VideoNode
