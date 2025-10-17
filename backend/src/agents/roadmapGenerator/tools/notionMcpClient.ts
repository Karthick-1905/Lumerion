import "dotenv/config";
import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";

const NOTION_MCP_URL = process.env.NOTION_MCP_URL;
export const isNotionMcpConfigured = Boolean(NOTION_MCP_URL);

const PageIdInputSchema = z.object({
  pageId: z.string().min(1, "pageId is required"),
  startCursor: z.string().min(1).optional(),
});

const SearchInputSchema = z.object({
  query: z.string().min(1, "query is required"),
});

async function invokeMcpTool<T>(tool: string, payload: Record<string, unknown>): Promise<T> {
  if (!NOTION_MCP_URL) {
    throw new Error("NOTION_MCP_URL is not configured");
  }

  const response = await fetch(`${NOTION_MCP_URL}/tools/${tool}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`MCP tool ${tool} failed (${response.status}): ${text}`);
  }

  return response.json() as Promise<T>;
}

export const notionGetPageTool = new DynamicStructuredTool({
  name: "notion_get_page",
  description: "Retrieve raw metadata for a Notion page by pageId",
  schema: PageIdInputSchema.pick({ pageId: true }),
  func: ({ pageId }) => invokeMcpTool("getModulePage", { pageId }),
});

export const notionListBlocksTool = new DynamicStructuredTool({
  name: "notion_list_blocks",
  description: "List direct child blocks for a Notion page or block",
  schema: PageIdInputSchema,
  func: ({ pageId, startCursor }) =>
    invokeMcpTool("listModuleBlocks", { pageId, startCursor }),
});

export const notionSearchTool = new DynamicStructuredTool({
  name: "notion_search_pages",
  description: "Search Notion pages by title keyword",
  schema: SearchInputSchema,
  func: ({ query }) => invokeMcpTool("searchByModuleName", { query }),
});

export const notionMcpClient = {
  getPage: (pageId: string) => notionGetPageTool.invoke({ pageId }),
  listBlocks: (params: { pageId: string; startCursor?: string }) =>
    notionListBlocksTool.invoke(params),
  searchPages: (query: string) => notionSearchTool.invoke({ query }),
};
