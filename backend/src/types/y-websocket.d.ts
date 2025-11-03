declare module "@y/websocket-server/utils" {
  import type { IncomingMessage } from "http"
  import type { WebSocket } from "ws"

  export interface SetupWSOptions {
    docName: string
    gc?: boolean
  }

  export function setupWSConnection(
    ws: WebSocket,
    req: IncomingMessage,
    options: SetupWSOptions
  ): void
}
