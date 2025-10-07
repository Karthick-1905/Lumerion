import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

interface GeminiModelOptions {
	temperature?: number;
	model?: string;
}

const DEFAULT_MODEL = "gemini-2.0-flash";

const ensureApiKey = (): string => {
	const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
	if (!apiKey) {
		throw new Error(
			"Google Generative AI API key not found. Set GOOGLE_API_KEY or GEMINI_API_KEY in the environment.",
		);
	}
	return apiKey;
};

export const createGeminiModel = (options: GeminiModelOptions = {}): ChatGoogleGenerativeAI => {
	const apiKey = ensureApiKey();
	return new ChatGoogleGenerativeAI({
		model: options.model ?? DEFAULT_MODEL,
		temperature: options.temperature ?? 0,
		apiKey,
	});
};
