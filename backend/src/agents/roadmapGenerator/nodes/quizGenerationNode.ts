import { z } from "zod";
import type { RunnableConfig } from "@langchain/core/runnables";
import { PromptTemplate } from "@langchain/core/prompts";
import { createGeminiModel } from "../utils/modelProvider";
import type { RoadmapGraphState } from "../state";

const quizQuestionSchema = z.object({
    prompt: z.string(),
    type: z.string().optional(),
    choices: z.array(z.string()).optional(),
    answer: z.string().optional(),
});

const quizItemSchema = z.object({
    moduleTitle: z.string(),
    moduleId: z.number().int().min(1).optional(),
    pathId: z.number().int().min(1).optional(),
    lessonIndex: z.number().int().min(0).optional(),
    questions: z.array(quizQuestionSchema).min(1),
});

const quizSchema = z.object({
    quizzes: z.array(quizItemSchema).optional().default([]),
});

const quizPrompt = PromptTemplate.fromTemplate(`You are an assessment designer. For the given modules and lessons, produce 1-2 concise formative questions per lesson.

<Input JSON>
{modules_json}
</Input JSON>

Output requirements:
- Return a valid JSON object with a top-level key "quizzes".
- "quizzes" must be an array. Include one quiz entry per module that actually has lessons.
- Each quiz entry must be a JSON object containing EXACTLY these keys:
    * moduleTitle (string)
    * moduleId (integer, optional if you cannot infer it)
    * pathId (integer, optional if you cannot infer it)
    * lessonIndex (integer, optional; index of the lesson within the module if the question targets a specific lesson)
    * questions (array of question objects; length 1-3)
- Each question object must contain EXACTLY these keys:
    * prompt (string)
    * type (string, optional; e.g. "multiple_choice", "short_answer")
    * choices (array of strings, optional; required for multiple choice)
    * answer (string, optional; concise expected response or the correct option)
- Do not add trailing comments, Markdown, or additional text. Return ONLY the JSON object.
- Escaping must follow strict JSON rules (use double quotes, escape any embedded double quotes).

If information is unavailable (e.g., moduleId/pathId), omit those fields instead of inventing values.`);

export const quizGenerationNode = async (
    state: Pick<RoadmapGraphState, "modules" | "quizzes">,
    config?: RunnableConfig,
) => {
    const model = createGeminiModel({ temperature: 0.2 });
    const chain = quizPrompt.pipe(model.withStructuredOutput(quizSchema));

    const modulesJson = JSON.stringify(state.modules.map((m) => ({ title: m.title, lessons: m.lessons.map((l) => ({ title: l.title, description: l.description })) })));

    const raw = (await chain.invoke({ modules_json: modulesJson }, config)) as z.infer<typeof quizSchema>;

    const quizzes = raw.quizzes ?? [];

    return {
        quizzes: { quizzes },
    };
};
