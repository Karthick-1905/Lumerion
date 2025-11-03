import type { Server as HTTPServer, IncomingMessage } from "http"
import { WebSocketServer } from "ws"
import type { WebSocket } from "ws"
import { setupWSConnection } from "@y/websocket-server/utils"

const DEFAULT_COLLABORATION_PATH = "/collaboration"

const normalizePath = (value: string) => {
	if (!value) return DEFAULT_COLLABORATION_PATH
	return value.startsWith("/") ? value : `/${value}`
}

const extractDocumentName = (request: IncomingMessage, basePath: string): string | null => {
	const host = request.headers.host ?? "localhost"
	const requestUrl = new URL(request.url ?? basePath, `http://${host}`)
	const baseSegments = basePath.split("/").filter(Boolean)
	const pathSegments = requestUrl.pathname.split("/").filter(Boolean)

	while (baseSegments.length && pathSegments.length) {
		const expected = baseSegments.shift()
		const current = pathSegments.shift()
		if (expected !== current) {
			return null
		}
	}

	const documentName = pathSegments.shift()
	return documentName ?? null
}

export const setupNoteCollaborationServer = (server: HTTPServer) => {
	const collaborationPath = normalizePath(process.env.COLLAB_WS_PATH ?? DEFAULT_COLLABORATION_PATH)
	const webSocketServer = new WebSocketServer({ server, path: collaborationPath })

	webSocketServer.on("connection", (connection: WebSocket, request) => {
		const docName = extractDocumentName(request, collaborationPath)

		if (!docName) {
			connection.close(1008, "Missing document identifier")
			return
		}

		try {
			setupWSConnection(connection, request, {
				docName,
				gc: true,
			})
		} catch (error) {
			connection.close(1011, "Failed to initialize collaborative session")
			console.error("Failed to setup collaboration socket", error)
		}
	})

	webSocketServer.on("listening", () => {
		console.log(`Collaboration WebSocket listening on ${collaborationPath}`)
	})

	return webSocketServer
}

export type NoteCollaborationServer = ReturnType<typeof setupNoteCollaborationServer>
