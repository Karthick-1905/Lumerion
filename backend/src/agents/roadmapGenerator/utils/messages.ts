import { type BaseMessage } from "@langchain/core/messages";

export const messageContentToString = (message: BaseMessage): string => {
	const { content } = message;

	if (typeof content === "string") {
		return content;
	}

	if (Array.isArray(content)) {
		return content
			.map((item) => {
				if (typeof item === "string") {
					return item;
				}
				if (item && typeof item === "object" && "text" in item) {
					return typeof item.text === "string" ? item.text : "";
				}
				return "";
			})
			.filter(Boolean)
			.join("\n");
	}

	if (content && typeof content === "object" && "text" in content) {
		return typeof (content as { text?: unknown }).text === "string"
			? ((content as { text?: string }).text ?? "")
			: "";
	}

	return JSON.stringify(content);
};
