export const normaliseStringList = (values: string[] | undefined | null): string[] => {
	if (!values || values.length === 0) {
		return [];
	}
	const seen = new Set<string>();
	const normalised: string[] = [];
	for (const value of values) {
		const trimmed = value.trim();
		if (!trimmed) {
			continue;
		}
		const sentenceCase = trimmed.replace(/^(\w)(.*)$/s, (_, first: string, rest: string) => first.toUpperCase() + rest);
		const key = sentenceCase.toLowerCase();
		if (!seen.has(key)) {
			seen.add(key);
			normalised.push(sentenceCase);
		}
	}
	return normalised;
};

export const truncateAndJoin = (items: string[], max = 10): string => {
	const trimmed = items.slice(0, max);
	return trimmed.join("; ");
};
