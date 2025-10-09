import { z } from "zod";
import type { RunnableConfig } from "@langchain/core/runnables";

import type {
	CurriculumComposerNodeInput,
	CurriculumComposerNodeOutput,
	GraphContextSnapshot,
	PrerequisitePlanSummary,
	RoadmapLesson,
	RoadmapModule,
} from "../state";
import { curriculumComposerPromptTemplate } from "../prompt";
import { createGeminiModel } from "../utils/modelProvider";
import { normaliseStringList } from "../utils/text";

const lessonSchema = z.object({
	title: z.string().min(1),
	description: z.string().min(1),
	estimated_time_hours: z.number().nonnegative().nullable().optional(),
	recommended_resources: z.array(z.string().min(1)).optional().default([]),
	mastery_check: z.string().optional().nullable(),
});

const moduleSchema = z.object({
	title: z.string().min(1),
	description: z.string().min(1),
	lessons: z.array(lessonSchema).min(1),
});

const curriculumComposerSchema = z.object({
	modules: z.array(moduleSchema).min(1),
});

type CurriculumComposerRawOutput = z.infer<typeof curriculumComposerSchema>;

const normaliseKey = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const fallbackResourceLibrary: Array<{
	keywords: string[];
	resources: string[];
}> = [
	{
		keywords: ["network", "networking", "computer science", "cs"],
		resources: normaliseStringList([
			"Khan Academy – Internet networking (https://www.khanacademy.org/computing/computer-science/internet-intro)",
			"CS50x 2024 – Lecture on computer science fundamentals (https://cs50.harvard.edu/x/2024/)",
		]),
	},
	{
		keywords: ["cryptograph"],
		resources: normaliseStringList([
			"Khan Academy – Cryptography (https://www.khanacademy.org/computing/computer-science/cryptography)",
			"Cryptography Engineering by Ferguson, Schneier & Kohno",
		]),
	},
	{
		keywords: ["decentralization", "decentralisation", "decentralized"],
		resources: normaliseStringList([
			"The Decentralized Web Primer (https://getdweb.com/)",
			"Understanding Decentralization by Vitalik Buterin",
		]),
	},
	{
		keywords: ["blockchain"],
		resources: normaliseStringList([
			"Mastering Bitcoin by Andreas M. Antonopoulos",
			"Coursera – Blockchain Basics by University at Buffalo",
		]),
	},
	{
		keywords: ["consensus", "proof-of-work", "proof-of-stake"],
		resources: normaliseStringList([
			"Ethereum.org – Consensus mechanisms overview (https://ethereum.org/en/developers/docs/consensus-mechanisms/)",
			"Proof-of-Work vs Proof-of-Stake – Basic Mining Guide",
		]),
	},
	{
		keywords: ["nft", "non-fungible"],
		resources: normaliseStringList([
			"NFTs: A Primer by Linda Xie (https://a16zcrypto.com/content/article/nfts-a-primer/)",
			"OpenSea NFT Resource Center (https://opensea.io/learn)",
		]),
	},
	{
		keywords: ["smart contract"],
		resources: normaliseStringList([
			"Ethereum.org – Smart contract documentation (https://ethereum.org/en/developers/docs/smart-contracts/)",
			"Solidity by Example (https://solidity-by-example.org/)",
		]),
	},
	{
		keywords: ["web3", "defi", "dao"],
		resources: normaliseStringList([
			"Web3 Foundation resources (https://web3.foundation/)",
			"DappRadar – Track decentralized applications (https://dappradar.com/)",
		]),
	},
	{
		keywords: ["nft marketplace", "project", "hands-on"],
		resources: normaliseStringList([
			"OpenSea – Getting Started guide (https://support.opensea.io/hc/en-us/articles/1500006315942-Getting-Started)",
			"buildspace – Build Web3 projects (https://buildspace.so/)",
		]),
	},
];

const fallbackMasteryCheck = (lessonTitle: string, moduleTitle: string): string => {
	const concept = lessonTitle.trim();
	return `Demonstrate mastery by explaining "${concept}" to a peer, outlining a real-world example, and answering questions without notes. Share how it reinforces the "${moduleTitle}" module objectives.`;
};

const findPlanStepMatch = (
	lessonTitle: string,
	plan: PrerequisitePlanSummary | null,
): PrerequisitePlanSummary["steps"][number] | null => {
	if (!plan) return null;
	const lessonKey = normaliseKey(lessonTitle);
	if (!lessonKey) return null;
	const directMatch = plan.steps.find((step) => {
		const stepKey = normaliseKey(step.conceptName);
		return stepKey.length > 0 && (lessonKey.includes(stepKey) || stepKey.includes(lessonKey));
	});
	if (directMatch) return directMatch;
	return (
		plan.steps
			.map((step) => ({
				step,
				score: step.conceptName
					.toLowerCase()
					.split(/\s+/)
					.filter((token) => lessonKey.includes(token))
					.length,
			}))
			.filter(({ score }) => score > 0)
			.sort((a, b) => b.score - a.score)[0]?.step ?? null
	);
};

const gatherGraphResources = (
	lessonTitle: string,
	graphContext: GraphContextSnapshot | null,
	limit = 3,
): string[] => {
	if (!graphContext) return [];
	const lessonKey = normaliseKey(lessonTitle);
	return graphContext.relatedResources
		.filter((resource) => {
			const titleKey = normaliseKey(resource.title ?? "");
			return titleKey.length > 0 && (lessonKey.includes(titleKey) || titleKey.includes(lessonKey));
		})
		.slice(0, limit)
		.map((resource) => {
			const parts: string[] = [resource.title];
			if (resource.url) parts.push(resource.url);
			return parts.filter(Boolean).join(" – ");
		});
};

const fallbackResourcesForLesson = (lessonTitle: string): string[] => {
	const lessonKey = normaliseKey(lessonTitle);
	for (const entry of fallbackResourceLibrary) {
		const matches = entry.keywords.some((keyword) => lessonKey.includes(keyword));
		if (matches) {
			return entry.resources;
		}
	}
	return normaliseStringList([
		`${lessonTitle} – explore official documentation and reputable tutorials (e.g., freeCodeCamp, Coursera, or vendor docs).`,
		`Watch a conference talk or workshop on ${lessonTitle} to see practical implementations.`,
	]);
};

const enrichModules = (
	modules: RoadmapModule[],
	plan: PrerequisitePlanSummary | null,
	graphContext: GraphContextSnapshot | null,
): RoadmapModule[] => {
	return modules.map((module) => {
		const updatedLessons = module.lessons.map((lesson) => {
			const baseResources = normaliseStringList(lesson.recommendedResources ?? []);
			const planMatch = findPlanStepMatch(lesson.title, plan);
			const planResources = planMatch ? normaliseStringList(planMatch.recommendedResources ?? []) : [];
			const graphResources = gatherGraphResources(lesson.title, graphContext);
			const combinedResources = normaliseStringList([
				...baseResources,
				...planResources,
				...graphResources,
			]);

			const resources = combinedResources.length > 0
				? combinedResources
				: fallbackResourcesForLesson(lesson.title);

			const masteryCheck = lesson.masteryCheck && lesson.masteryCheck.trim().length > 0
				? lesson.masteryCheck.trim()
				: planMatch && planMatch.masteryCheck
					? planMatch.masteryCheck.trim()
					: fallbackMasteryCheck(lesson.title, module.title);

			return {
				...lesson,
				recommendedResources: resources,
				masteryCheck,
			};
		});

		return {
			...module,
			lessons: updatedLessons,
		};
	});
};

export const curriculumComposerInternals = {
	enrichModules,
	fallbackResourcesForLesson,
	fallbackMasteryCheck,
};

const formatPrerequisitePlanForPrompt = (plan: PrerequisitePlanSummary | null): string => {
	if (!plan || plan.steps.length === 0) {
		return "No explicit prerequisites detected. Proceed with a foundational on-ramp module.";
	}

	const lines = plan.steps.map((step) => {
		const resources = step.recommendedResources.length
			? `Resources: ${step.recommendedResources.join(", ")}`
			: "Resources: leverage generic introductions.";
		return `${step.sequence}. ${step.conceptName} [${step.categorisation}] — ${step.justification} | ${resources} | Mastery: ${step.masteryCheck}`;
	});

	if (plan.missingFoundations.length > 0) {
		lines.push(`Missing foundations to address: ${plan.missingFoundations.join(", ")}`);
	}

	if (plan.integrationGuidance.length > 0) {
		lines.push(`Integration guidance: ${plan.integrationGuidance.join("; ")}`);
	}

	if (plan.refresherAdvice.length > 0) {
		lines.push(`Refresher advice: ${plan.refresherAdvice.join("; ")}`);
	}

	lines.push(`Summary: ${plan.summary}`);

	return lines.join("\n");
};

const formatResourceCatalogue = (graphContext: GraphContextSnapshot | null): string => {
	if (!graphContext || graphContext.relatedResources.length === 0) {
		return "No pre-indexed resources supplied; curate trustworthy materials during module planning.";
	}

	return graphContext.relatedResources
		.map((resource) => {
			const parts: string[] = [resource.title];
			if (resource.resourceType) {
				parts.push(`type: ${resource.resourceType}`);
			}
			if (resource.difficulty) {
				parts.push(`difficulty: ${resource.difficulty}`);
			}
			if (resource.description) {
				parts.push(`summary: ${resource.description}`);
			}
			if (resource.url) {
				parts.push(`url: ${resource.url}`);
			}
			return `- ${parts.join(" | ")}`;
		})
		.join("\n");
};

const mapModule = (module: CurriculumComposerRawOutput["modules"][number]): RoadmapModule => {
	const lessons: RoadmapLesson[] = module.lessons.map((lesson) => ({
		title: lesson.title,
		description: lesson.description,
		estimatedTimeHours:
			lesson.estimated_time_hours === undefined || lesson.estimated_time_hours === null
				? null
				: Number(lesson.estimated_time_hours),
		recommendedResources: normaliseStringList(lesson.recommended_resources ?? []),
		masteryCheck:
			typeof lesson.mastery_check === "string" && lesson.mastery_check.trim().length > 0
				? lesson.mastery_check.trim()
				: null,
	}));

	return {
		title: module.title,
		description: module.description,
		lessons,
	};
};

const isPrerequisiteModule = (module: RoadmapModule): boolean => {
	const title = module.title.toLowerCase();
	return ["on-ramp", "prerequisite", "foundation", "readiness", "essentials"].some((token) =>
		title.includes(token),
	);
};

const buildDescriptionWithPlan = (baseDescription: string | undefined, plan: PrerequisitePlanSummary): string => {
	const parts: string[] = [];
	if (baseDescription && baseDescription.trim().length > 0) {
		parts.push(baseDescription.trim());
	}
	if (plan.summary.trim().length > 0) {
		parts.push(plan.summary.trim());
	}
	if (plan.integrationGuidance.length > 0) {
		parts.push(`Integration guidance: ${plan.integrationGuidance.join("; ")}.`);
	}
	if (plan.refresherAdvice.length > 0) {
		parts.push(`Refresher advice: ${plan.refresherAdvice.join("; ")}.`);
	}
	return parts.join(" ").trim();
};

const createLessonFromStep = (step: PrerequisitePlanSummary["steps"][number]): RoadmapLesson => ({
	title: step.conceptName,
	description: step.justification,
	estimatedTimeHours: null,
	recommendedResources: normaliseStringList(step.recommendedResources),
	masteryCheck: step.masteryCheck ?? null,
});

const mergePrerequisiteLessons = (
	existingLessons: RoadmapLesson[],
	plan: PrerequisitePlanSummary,
): RoadmapLesson[] => {
	const merged: RoadmapLesson[] = existingLessons.map((lesson) => ({
		...lesson,
		recommendedResources: normaliseStringList(lesson.recommendedResources ?? []),
		masteryCheck: lesson.masteryCheck ?? null,
	}));

	for (const step of plan.steps) {
		const conceptKey = step.conceptName.toLowerCase();
		const matchIndex = merged.findIndex((lesson) =>
			lesson.title.toLowerCase().includes(conceptKey) || conceptKey.includes(lesson.title.toLowerCase()),
		);

		if (matchIndex >= 0) {
			const targetLesson = merged[matchIndex];
			const combinedResources = normaliseStringList([
				...(targetLesson.recommendedResources ?? []),
				...step.recommendedResources,
			]);
			const justification = step.justification.trim();
			const description = targetLesson.description.includes(justification)
				? targetLesson.description
				: `${targetLesson.description.trim()} ${justification}`.trim();

			merged[matchIndex] = {
				...targetLesson,
				description,
				recommendedResources: combinedResources,
				masteryCheck: targetLesson.masteryCheck ?? (step.masteryCheck ?? null),
			};
		} else {
			merged.push(createLessonFromStep(step));
		}
	}

	return merged.map((lesson) => ({
		...lesson,
		recommendedResources: normaliseStringList(lesson.recommendedResources ?? []),
	}));
};

const integratePrerequisitePlan = (
	modules: RoadmapModule[],
	plan: PrerequisitePlanSummary | null,
): RoadmapModule[] => {
	if (!plan || plan.steps.length === 0) {
		return modules;
	}

	const modulesCopy = modules.map((module) => ({
		...module,
		lessons: module.lessons.map((lesson) => ({
			...lesson,
			recommendedResources: normaliseStringList(lesson.recommendedResources ?? []),
		})),
	}));

	const existingIndex = modulesCopy.findIndex(isPrerequisiteModule);

	if (existingIndex >= 0) {
		const existing = modulesCopy[existingIndex];
		modulesCopy[existingIndex] = {
			...existing,
			description: buildDescriptionWithPlan(existing.description, plan),
			lessons: mergePrerequisiteLessons(existing.lessons, plan),
		};
		return modulesCopy;
	}

	const planModule: RoadmapModule = {
		title: "On-Ramp: Prerequisite Foundations",
		description: buildDescriptionWithPlan("Fast-track the essential foundations before tackling the core journey.", plan),
		lessons: plan.steps.map(createLessonFromStep),
	};

	return [planModule, ...modulesCopy];
};


//TODO : Review The Circullum Composer

export const curriculumComposerNode = async (
	state: CurriculumComposerNodeInput,
	config?: RunnableConfig,
): Promise<CurriculumComposerNodeOutput> => {
	const topic = state.topic;
	if (!topic) {
		throw new Error("Curriculum composer node requires a topic.");
	}

	const bootstrapSummary = state.bootstrapSummary;
	if (!bootstrapSummary) {
		throw new Error("Curriculum composer node requires a bootstrap summary.");
	}

	const plan = state.prerequisitePlan ?? null;
	const graphContext = state.graphContext ?? null;

	const model = createGeminiModel({ temperature: 0.15 });
	const chain = curriculumComposerPromptTemplate.pipe(
		model.withStructuredOutput(curriculumComposerSchema),
	);

	const rawOutput = (await chain.invoke(
		{
			topic_statement: bootstrapSummary.topicStatement,
			learner_persona: bootstrapSummary.learnerPersona,
			experience_summary: bootstrapSummary.experienceSummary,
			learning_objectives: bootstrapSummary.learningObjectives.join(" | "),
			learning_constraints: bootstrapSummary.learningConstraints.join(" | "),
			learning_preferences: bootstrapSummary.learningPreferences.join(" | "),
			prerequisite_plan: formatPrerequisitePlanForPrompt(plan),
			resource_catalogue: formatResourceCatalogue(graphContext),
		},
		config,
	)) as CurriculumComposerRawOutput;

	const integratedModules: RoadmapModule[] = integratePrerequisitePlan(
		rawOutput.modules.map(mapModule),
		plan,
	);

	const enrichedModules = enrichModules(integratedModules, plan, graphContext);

	return { modules: enrichedModules };
};
