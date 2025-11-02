import { QuizzesGraphState } from "../state";
import { QUIZZES_GENERATION_PROMPT } from "../prompt";
import { createGeminiModel } from "../../utils/modelProvider";
import {QuizQuestion, Quiz} from '../state'


const extractJsonPayload = (raw: string): string => {
    let trimmed = raw.trim();

    const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fencedMatch) {
        return fencedMatch[1].trim();
    }

    const firstBracket = trimmed.indexOf("[");
    const firstBrace = trimmed.indexOf("{");
    const startIdx = [firstBracket, firstBrace]
        .filter((idx) => idx >= 0)
        .sort((a, b) => a - b)[0];

    if (typeof startIdx === "number") {
        trimmed = trimmed.slice(startIdx).trim();
    }

    const lastBracket = trimmed.lastIndexOf("]");
    const lastBrace = trimmed.lastIndexOf("}");
    const endIdx = Math.max(lastBracket, lastBrace);

    if (endIdx >= 0) {
        trimmed = trimmed.slice(0, endIdx + 1).trim();
    }

    return trimmed;
};

const coerceString = (value: unknown): string => {
    if (typeof value === "string") return value.trim();
    if (Array.isArray(value)) return value.map(coerceString).join(" ").trim();
    if (value && typeof value === "object" && "text" in (value as Record<string, unknown>)) {
        return coerceString((value as Record<string, unknown>).text);
    }
    return "";
};

const coerceNumber = (value: unknown, fallback: number): number => {
    const num = typeof value === "number" ? value : Number(value);
    if (Number.isFinite(num)) {
        return Math.min(100, Math.max(0, Math.round(num)));
    }
    return fallback;
};

const normaliseQuestion = (raw: any): QuizQuestion | null => {
    const prompt = coerceString(raw?.prompt);
    const type = coerceString(raw?.type) as QuizQuestion["type"];
    if (!prompt || !["multiple_choice", "true_false", "short_answer"].includes(type)) {
        return null;
    }

    const answer = coerceString(raw?.answer);
    if (!answer) return null;

    const explanation = coerceString(raw?.explanation) || undefined;

    let choices: string[] | undefined;
    if (type === "multiple_choice") {
        const rawChoices = Array.isArray(raw?.choices) ? raw.choices : [];
        choices = rawChoices.map(coerceString).filter(Boolean).slice(0, 4);
        if (choices.length !== 4) {
            return null;
        }
    }

    return {
        prompt,
        type,
        choices,
        answer,
        explanation,
    };
};

export const quizzesGeneratorNode = async (state: QuizzesGraphState): Promise<Partial<QuizzesGraphState>> => {
    const { roadmapModules } = state;

    const prompt = QUIZZES_GENERATION_PROMPT.replace("{roadmapModules}", JSON.stringify(roadmapModules));

    const geminiModel = createGeminiModel()
    const response = await geminiModel.invoke([{ role: "user", content: prompt }]);
    const content = response.content as string;

    const jsonString = extractJsonPayload(content);

    const parsed = JSON.parse(jsonString);
    const quizzes = Array.isArray(parsed) ? parsed : [];

    const sanitisedQuizzes = quizzes
        .map((entry) => {
            const moduleTitle = coerceString(entry?.moduleTitle);
            const lessonIndex = coerceNumber(entry?.lessonIndex, 0);
            const passingPercentage = coerceNumber(entry?.passingPercentage, 70);
            const rawQuestions = Array.isArray(entry?.questions) ? entry.questions : [];
            const questions = rawQuestions
                .map(normaliseQuestion)
                .filter((question): question is QuizQuestion => question !== null);

            if (!moduleTitle || questions.length === 0) {
                return null;
            }

            return {
                moduleTitle,
                lessonIndex,
                passingPercentage,
                questions,
            };
        })
        .filter((quiz): quiz is Quiz => quiz !== null);

    return {
        quizzes: sanitisedQuizzes,
    };
};