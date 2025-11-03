import http from "http"
import app from "./app"
import "dotenv/config"
import { setupNoteCollaborationServer } from "./sockets/noteCollaborationServer"

const PORT = process.env.PORT || 3000

const server = http.createServer(app)

setupNoteCollaborationServer(server)

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})