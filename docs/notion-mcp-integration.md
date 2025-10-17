# Integrating Notion MCP for Module Notes

This guide explains how to connect the LMS backend to Notion using the Model Context Protocol (MCP). The integration lets learners and mentors fetch rich module notes—including formatted text, embedded media, and synced images—directly from Notion pages.

---

## 1. Goals
- Store module notes in Notion so authors can use familiar editing tools (databases, toggle lists, callouts, media blocks).
- Retrieve notes via MCP agents and expose them through LMS APIs.
- Preserve block structure and assets (images, files) so the frontend can render them.
- Keep credentials and sync jobs secure and observable.

---

## 2. Prerequisites
- **Backend**: Node.js 18+, TypeScript, LangChain/LangGraph already used in `roadmapGenerator`.
- **Data stores**: Postgres (Drizzle ORM), Redis for sessions, optional S3-compatible storage for downloaded assets.
- **Accounts**:
  - Notion workspace with API access enabled.
  - Notion integration (internal) with `Notion API` token.
- **Libraries**:
  - `@modelcontextprotocol/sdk` or equivalent MCP client implementation.
  - `@notionhq/client` (for direct fallback operations if needed).
  - Asset fetcher (e.g., `node-fetch`, `axios`) for downloading images referenced by Notion blocks.

---

## 3. Architecture Overview
1. **MCP Server**: Wraps Notion API and exposes tools (`getPage`, `listBlocks`, `searchDatabase`). Runs as a sidecar service or serverless function.
2. **LMS Backend Client**:
   - Registers MCP server inside existing LangGraph agents (e.g., roadmap generator or a new `notesAgent`).
   - Requests notes for specific module IDs mapped to Notion page IDs.
3. **Asset Handling**:
   - Download images/files from Notion signed URLs and cache in S3 or serve directly (consider URL expiry, typically 1 hour).
4. **Frontend**:
   - Extend modules page to display Notion content (render Markdown or block-based components).
5. **Sync Strategy** (optional):
   - Scheduled job to pull Notion content into Postgres for offline access, or fetch on demand with caching.

---

## 4. Step-by-Step Implementation

### 4.1 Configure Notion Integration
1. Go to [Notion Developers](https://www.notion.com/my-integrations).
2. Create a new internal integration.
3. Copy the secret API token; store it in `.env` as `NOTION_API_KEY` (use secrets manager in production).
4. Share desired pages or databases with the integration by using the **Share** button in Notion UI.

### 4.2 Define Module → Notion Mapping
- Add a column to `learning_module` table (`notionPageId TEXT`) using a Drizzle migration.
- Update `learningModule` schema in `/backend/src/drizzle/schema.ts`.
- Extend admin UI or seed scripts to populate page IDs.

### 4.3 Implement MCP Server
1. Create a new package, e.g., `/backend/src/mcp/notionServer.ts`.
2. Use MCP SDK to expose tools:
   ```ts
   import { MCPServer } from "@modelcontextprotocol/sdk";
   import { Client } from "@notionhq/client";

   const notion = new Client({ auth: process.env.NOTION_API_KEY });

   const server = new MCPServer({
     name: "notion-notes",
     tools: {
       getModulePage: async ({ pageId }) => {
         const page = await notion.pages.retrieve({ page_id: pageId });
         return page;
       },
       listModuleBlocks: async ({ pageId, startCursor }) => {
         return notion.blocks.children.list({ block_id: pageId, start_cursor: startCursor });
       },
       searchByModuleName: async ({ query }) => {
         return notion.search({ query, filter: { property: "object", value: "page" } });
       },
     },
   });

   server.listen({ port: process.env.NOTION_MCP_PORT ?? 8787 });
   ```
3. Add authentication (shared secret or mTLS) when deploying.

### 4.4 Create Notes Agent Node
- Add a new node in `backend/src/agents/roadmapGenerator/nodes/` (e.g., `fetchModuleNotes.ts`).
- The node should:
  1. Receive module metadata (module ID, Notion page ID).
  2. Query MCP server for blocks.
  3. Normalize blocks into LMS-friendly JSON (preserve hierarchy).
  4. Optionally transform to Markdown using libraries like `notion-to-md` if the frontend expects Markdown.
- Example snippet:
  ```ts
  import { createMCPClient } from "@modelcontextprotocol/sdk";

  const client = await createMCPClient({ endpoint: process.env.NOTION_MCP_URL });

  export async function fetchModuleNotes(pageId: string) {
    const blocks: any[] = [];
    let cursor: string | undefined;

    do {
      const res = await client.invoke("listModuleBlocks", { pageId, startCursor: cursor });
      blocks.push(...res.results);
      cursor = res.has_more ? res.next_cursor : undefined;
    } while (cursor);

    return blocks;
  }
  ```

### 4.5 Handle Images & Files
1. Notion returns signed URLs valid for a short period.
2. For each block with `type === "image"` or `"file"`:
   - Download content via `fetch`.
   - Upload to your storage (S3/GCS) and store the new URL.
3. Save asset metadata in a `module_note_asset` table (module ID, original URL, cached URL, mime type).
4. Provide the cached URL to the frontend.

### 4.6 Update API Layer
- Add a controller in `backend/src/controller/userController.ts` or create `notesController.ts`.
- Endpoint: `GET /api/modules/:moduleId/notes`
  - Validate session, ensure user has access to the module.
  - Fetch module to obtain `notionPageId`.
  - Call `fetchModuleNotes` and return normalized blocks + cached asset URLs.
- Optionally add query params: `format=markdown|blocks`, `forceRefresh=true`.

### 4.7 Frontend Rendering
- Create React components for Notion block types or parse Markdown.
- Lazy-load large assets; handle galleries and multi-column layouts.
- Allow download of linked files.

### 4.8 Caching & Sync
- Implement Redis cache keyed by `moduleId` + `updatedAt` version from Notion.
- Add a cron job (`backend/src/utils/cronjob.ts`) to refresh popular modules periodically.
- Detect updates using Notion `last_edited_time`.

---

## 5. Security & Compliance
- Rotate `NOTION_API_KEY` regularly; never log it.
- Use HTTPS or private networking between LMS backend and MCP server.
- Enforce row-level permissions so only authorized learners see notes.
- Respect Notion rate limits (3 requests/sec). Implement exponential backoff.
- Keep an audit trail: log page IDs requested, user IDs, timestamps (without storing content in logs).

---

## 6. Observability
- Track MCP request latency and error rates (Prometheus, OpenTelemetry).
- Add structured logs for fetch operations (moduleId, pageId, blockCount).
- Alert on repeated failures, auth errors, or cache misses.

---

## 7. Deployment Checklist
1. Add `NOTION_API_KEY`, `NOTION_MCP_URL`, `NOTION_MCP_PORT` env vars to `.env` and deployment secrets.
2. Deploy MCP server (Docker container, Cloud Run, or Lambda). Ensure health checks.
3. Set `NOTION_MCP_URL` in the backend environment to the HTTPS base URL of the MCP server. The roadmap agent will skip note fetching (without throwing) when this variable is absent, so populate it before expecting Notion-backed notes to appear.
4. Roll out backend changes behind feature flag.
4. Run integration tests:
   - Fetch notes for sample module.
   - Validate block rendering on frontend.
   - Confirm asset caching works.
5. Monitor logs and adjust caching thresholds.

---

## 8. Future Enhancements
- Bidirectional sync (push LMS annotations back to Notion).
- Support databases for module collections (one row per module with linked pages).
- Add GPT-powered summarization of long notes on the fly.
- Enable offline exports (PDF) using stored block data.
- Integrate with version history to rollback to prior note states.

---

By following the steps above, the LMS gains a flexible, rich note-taking workflow powered by Notion, while keeping control over asset caching, permissions, and API performance.
