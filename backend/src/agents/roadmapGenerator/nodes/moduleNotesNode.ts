import { z } from "zod";
import type { RunnableConfig } from "@langchain/core/runnables";
import type { RoadmapGraphState, RoadmapModule } from "../state";
import { fetchNotionNotesForModule } from "../services/notionModuleNotes";

const moduleNotesInputSchema = z.object({
  modules: z.array(
    z.object({
      title: z.string(),
      description: z.string().optional(),
      notes: z
        .object({
          pageId: z.string().optional(),
        })
        .optional()
        .nullable(),
    }),
  ),
});

const shouldFetchNotes = (module: RoadmapModule): boolean => {
  if ((module.notes as any)?.pageId) {
    return false;
  }
  return true;
};

export const moduleNotesNode = async (
  state: Pick<RoadmapGraphState, "modules">,
  _config?: RunnableConfig,
): Promise<Pick<RoadmapGraphState, "modules">> => {
  const parseResult = moduleNotesInputSchema.safeParse({ modules: state.modules ?? [] });
  const modules = parseResult.success
    ? state.modules ?? []
    : (state.modules ?? []).filter((module) => typeof module.title === "string" && module.title.trim().length > 0);

  if (!modules.length) {
    return { modules };
  }

  const updatedModules: RoadmapModule[] = [];

  for (const module of modules) {
    if (!shouldFetchNotes(module)) {
      updatedModules.push(module);
      continue;
    }

    const title = module.title;
    const explicitPageId = typeof (module.notes as any)?.pageId === "string" ? (module.notes as any).pageId : undefined;

    const notes = await fetchNotionNotesForModule(title, { notionPageId: explicitPageId });

    updatedModules.push({
      ...module,
      notes: notes ?? module.notes ?? null,
    });
  }

  return { modules: updatedModules };
};

export default moduleNotesNode;
