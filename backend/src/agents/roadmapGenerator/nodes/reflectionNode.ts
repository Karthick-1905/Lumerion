import { z } from "zod";
import type { RunnableConfig } from "@langchain/core/runnables";

import type { RoadmapModule, RoadmapGraphState, RoadmapLesson } from "../state";
import { createGeminiModel } from "../utils/modelProvider";
import { PromptTemplate } from "@langchain/core/prompts";
import { curriculumComposerInternals } from "./curriculumComposer";
import { normaliseStringList } from "../utils/text";

const { fallbackResourcesForLesson, fallbackMasteryCheck } = curriculumComposerInternals;

const normaliseKey = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const buildLessonKey = (moduleTitle: string, lessonTitle: string) => `${normaliseKey(moduleTitle)}::${normaliseKey(lessonTitle)}`;

export const mergeModulesWithOriginal = (
    rawModules: Array<{ title: string; description: string; lessons: Array<{ title: string; description: string }> }> | undefined,
    originalModules: RoadmapModule[],
): RoadmapModule[] => {
    if (!rawModules || rawModules.length === 0) {
        return originalModules;
    }

    const moduleMap = new Map<string, RoadmapModule>();
    const lessonMap = new Map<string, RoadmapLesson>();

    for (const module of originalModules) {
        const moduleKey = normaliseKey(module.title);
        moduleMap.set(moduleKey, module);
        for (const lesson of module.lessons) {
            lessonMap.set(buildLessonKey(module.title, lesson.title), lesson);
            if (!lessonMap.has(normaliseKey(lesson.title))) {
                lessonMap.set(normaliseKey(lesson.title), lesson);
            }
        }
    }

    const findLesson = (moduleTitle: string, lessonTitle: string): RoadmapLesson | undefined => {
        const directKey = buildLessonKey(moduleTitle, lessonTitle);
        const moduleKey = normaliseKey(moduleTitle);
        const lessonKey = normaliseKey(lessonTitle);

        if (lessonMap.has(directKey)) {
            return lessonMap.get(directKey);
        }

        const parentModule = moduleMap.get(moduleKey);
        if (parentModule) {
            const match = parentModule.lessons.find((lesson) => normaliseKey(lesson.title) === lessonKey);
            if (match) {
                return match;
            }
        }

        return lessonMap.get(lessonKey);
    };

    return rawModules.map((module) => {
        const lessons = module.lessons.map((lesson) => {
            const sourceLesson = findLesson(module.title, lesson.title);

            const recommendedResources = sourceLesson?.recommendedResources && sourceLesson.recommendedResources.length > 0
                ? normaliseStringList(sourceLesson.recommendedResources)
                : normaliseStringList(fallbackResourcesForLesson(lesson.title));

            const masteryCheck = sourceLesson?.masteryCheck && sourceLesson.masteryCheck.trim().length > 0
                ? sourceLesson.masteryCheck.trim()
                : fallbackMasteryCheck(lesson.title, module.title);

            return {
                title: lesson.title,
                description: lesson.description,
                estimatedTimeHours: sourceLesson?.estimatedTimeHours ?? null,
                recommendedResources,
                masteryCheck,
            } satisfies RoadmapLesson;
        });

        return {
            title: module.title,
            description: module.description,
            lessons,
        } satisfies RoadmapModule;
    });
};

const reflectionSchema = z.object({
    changes: z.array(z.string()).optional().default([]),
    modules: z.array(
        z.object({
            title: z.string(),
            description: z.string(),
            lessons: z.array(z.object({ title: z.string(), description: z.string() })),
        }),
    ),
});

const reflectionPrompt = PromptTemplate.fromTemplate(`You are a curriculum critic. Evaluate the proposed modules and prerequisite plan.

Tasks:
1. Identify any modules that contain an excessive number of lessons (>4). For each, propose splitting into sub-modules and list new module titles and assignments of lessons.
2. Identify conflicts or overlaps between prerequisites and modules and propose rectifications.
3. Return a JSON object with keys: changes (array of human-readable changes) and modules (possibly updated module list: title, description, lessons[] with titles & descriptions).

Input:
{modules_json}

Return ONLY the JSON object matching the schema.`);

export const reflectionNode = async (
    state: Pick<RoadmapGraphState, "modules" | "prerequisitePlan" | "reflection">,
    config?: RunnableConfig,
) => {
    const model = createGeminiModel({ temperature: 0 });
    const chain = reflectionPrompt.pipe(model.withStructuredOutput(reflectionSchema));

    const modulesJson = JSON.stringify(
        state.modules.map((m) => ({ title: m.title, description: m.description, lessons: m.lessons.map((l) => ({ title: l.title, description: l.description })) })),
    );

    const raw = (await chain.invoke({ modules_json: modulesJson }, config)) as z.infer<typeof reflectionSchema>;

    const originalModules = state.modules ?? [];

    const updatedModules: RoadmapModule[] = mergeModulesWithOriginal(raw.modules, originalModules);

    const changes = Array.isArray(raw.changes) ? raw.changes : [];

    // increment retry counter if changes proposed
    const newReflection = {
        changes,
        retries: changes.length > 0 ? (state.reflection?.retries ?? 0) + 1 : (state.reflection?.retries ?? 0),
    };

    return {
        modules: updatedModules,
        reflection: newReflection,
    };
};
