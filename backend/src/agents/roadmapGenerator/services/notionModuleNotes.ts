import type { ModuleNoteContent } from "../state";
import { isNotionMcpConfigured, notionMcpClient } from "../tools/notionMcpClient";

const MAX_BLOCK_DEPTH = 4;
const MAX_PAGINATION_LOOPS = 50;

const normalise = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const unwrapRichText = (value: any): string => {
	if (!value) return "";
	if (Array.isArray(value)) {
		return value
			.map((item) => {
				if (typeof item === "string") return item;
				if (item && typeof item === "object") {
					if (typeof item.plain_text === "string") return item.plain_text;
					if (item.text && typeof item.text.content === "string") return item.text.content;
				}
				return "";
			})
			.join("")
			.trim();
	}
	if (typeof value === "object") {
		if (Array.isArray((value as any).title)) {
			return unwrapRichText((value as any).title);
		}
		if (Array.isArray((value as any).rich_text)) {
			return unwrapRichText((value as any).rich_text);
		}
	}
	if (typeof value === "string") return value.trim();
	return "";
};

const extractTitleFromPage = (page: any): string | null => {
	if (!page || typeof page !== "object") {
		return null;
	}

	const directTitle =
		typeof (page as any).title === "string" && (page as any).title.trim().length > 0
			? (page as any).title.trim()
			: null;
	if (directTitle) return directTitle;

	const properties = (page as any).properties;
	if (properties && typeof properties === "object") {
		for (const key of Object.keys(properties)) {
			const property = (properties as any)[key];
			if (property && typeof property === "object" && property.type === "title") {
				const text = unwrapRichText(property.title);
				if (text.length > 0) return text;
			}
		}
	}

	if (typeof (page as any).name === "string" && (page as any).name.trim().length > 0) {
		return (page as any).name.trim();
	}

	return null;
};

const extractPageId = (candidate: any): string | null => {
	if (!candidate || typeof candidate !== "object") return null;
	const possibleKeys = ["id", "pageId", "page_id"] as const;
	for (const key of possibleKeys) {
		const value = (candidate as any)[key];
		if (typeof value === "string" && value.trim().length > 0) {
			return value;
		}
	}
	return null;
};

const selectCandidate = (results: any[], moduleTitle: string) => {
	const normalisedTarget = normalise(moduleTitle);

	const scored = results
		.map((result) => {
			const title = extractTitleFromPage(result);
			const normalised = title ? normalise(title) : null;
			return { result, title, normalised };
		})
		.filter((entry) => Boolean(entry.normalised));

	const exact = scored.find((entry) => entry.normalised === normalisedTarget);
	if (exact) return exact;

	const partial = scored.find((entry) => entry.normalised && normalisedTarget.includes(entry.normalised));
	if (partial) return partial;

	return scored[0] ?? null;
};

const listBlockChildren = async (blockId: string, startCursor?: string) => {
	const response = await notionMcpClient.listBlocks({ pageId: blockId, startCursor });
	const results = Array.isArray((response as any)?.results) ? (response as any).results : [];
	const hasMore = Boolean((response as any)?.has_more);
	const nextCursor = typeof (response as any)?.next_cursor === "string" ? (response as any).next_cursor : undefined;
	return { results, hasMore, nextCursor };
};

const collectBlocksRecursive = async (
	blockId: string,
	depth = 0,
): Promise<Array<Record<string, any>>> => {
	const collected: Array<Record<string, any>> = [];
	let cursor: string | undefined;
	let loopCount = 0;

	do {
		if (loopCount++ > MAX_PAGINATION_LOOPS) break;
		const { results, hasMore, nextCursor } = await listBlockChildren(blockId, cursor);
		for (const block of results) {
			if (block && typeof block === "object" && (block as any).has_children && depth < MAX_BLOCK_DEPTH) {
				const childId = typeof (block as any).id === "string" ? (block as any).id : null;
				if (childId) {
					const children = await collectBlocksRecursive(childId, depth + 1);
					collected.push({ ...block, children });
				} else {
					collected.push(block);
				}
			} else {
				collected.push(block);
			}
		}
		cursor = hasMore ? nextCursor : undefined;
	} while (cursor);

	return collected;
};

let hasLoggedMissingConfig = false;

export const fetchNotionNotesForModule = async (
	moduleTitle: string,
	options?: { notionPageId?: string | null },
): Promise<ModuleNoteContent | null> => {
	if (!isNotionMcpConfigured) {
		if (!hasLoggedMissingConfig) {
			hasLoggedMissingConfig = true;
			console.warn("NotionModuleNotesService: NOTION_MCP_URL is not configured; skipping note fetches.");
		}
		return null;
	}
	try {
		let pageId = typeof options?.notionPageId === "string" && options.notionPageId.trim().length > 0
			? options.notionPageId
			: null;
		let candidateEntry: ReturnType<typeof selectCandidate> | null = null;
		let candidate: any = null;

		if (!pageId) {
			const searchResponse = await notionMcpClient.searchPages(moduleTitle);
			const searchResults = Array.isArray((searchResponse as any)?.results)
				? (searchResponse as any).results
				: [];

			if (searchResults.length === 0) {
				return null;
			}

			candidateEntry = selectCandidate(searchResults, moduleTitle);
			if (!candidateEntry) {
				return null;
			}

			candidate = candidateEntry.result;
			pageId = extractPageId(candidate);
			if (!pageId) {
				return null;
			}
		}

		const page = await notionMcpClient.getPage(pageId);
		const resolvedTitle = extractTitleFromPage(page) ?? candidateEntry?.title ?? moduleTitle;
		const url =
			typeof (page as any)?.url === "string" && (page as any).url.trim().length > 0
				? (page as any).url
				: typeof (candidate as any)?.url === "string"
					? (candidate as any).url
					: null;
		const lastEditedTime =
			typeof (page as any)?.last_edited_time === "string"
				? (page as any).last_edited_time
				: typeof (candidate as any)?.last_edited_time === "string"
					? (candidate as any).last_edited_time
					: null;

		const blocks = await collectBlocksRecursive(pageId);

		return {
			pageId,
			title: resolvedTitle,
			url,
			lastEditedTime,
			fetchedAt: new Date().toISOString(),
			blocks,
			metadata: {
				source: "notion",
				searchQuery: moduleTitle,
				notionPageId: pageId,
				candidateTitle: candidateEntry?.title ?? null,
				score: candidate && typeof (candidate as any)?.score !== "undefined" ? (candidate as any).score : null,
			},
		};
	} catch (error) {
		console.warn("NotionModuleNotesService: failed to fetch notes", error);
		return null;
	}
};

export default {
	fetchNotionNotesForModule,
};
