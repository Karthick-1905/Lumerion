/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_ENABLE_NOTE_COLLAB?: string
	readonly VITE_NOTE_COLLAB_WS_URL?: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
