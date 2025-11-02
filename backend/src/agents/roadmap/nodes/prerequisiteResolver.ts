import { z } from "zod";
import type { RunnableConfig } from "@langchain/core/runnables";

import type {
	PrerequisitePlanSummary,
	PrerequisitePlanStep,
	PrerequisiteResolverNodeInput,
	PrerequisiteResolverNodeOutput,
} from "../state";
import { prerequisiteResolverPromptTemplate } from "../prompt";
import { createGeminiModel } from "../../utils/modelProvider";
import { normaliseStringList } from "../../utils/text";

const prerequisiteResolverSchema = z.object({
	prerequisite_sequence: z
		.array(
			z.object({
				concept_name: z.string().min(1),
				concept_id: z.string().min(1).optional().nullable(),
				category: z.enum(["fundamental", "core", "advanced", "enrichment"]).default("core"),
				justification: z.string().min(1),
				recommended_resources: z.array(z.string().min(1)).optional().default([]),
				mastery_check: z.string().min(1),
			}),
		)
		.optional()
		.default([]),
	missing_foundations: z.array(z.string().min(1)).optional().default([]),
	integration_guidance: z.array(z.string().min(1)).optional().default([]),
	refresher_advice: z.array(z.string().min(1)).optional().default([]),
	summary: z.string().min(1),
});

type PrerequisiteResolverRawOutput = z.infer<typeof prerequisiteResolverSchema>;

const formatLearnerList = (items: string[], fallback = "None stated") => {
	if (!items.length) {
		return fallback;
	}
	return items
		.map((item, index) => `${index + 1}. ${item}`)
		.join("\n");
};

const mapPlan = (raw: PrerequisiteResolverRawOutput): PrerequisitePlanSummary => {
	const steps: PrerequisitePlanStep[] = raw.prerequisite_sequence.map((step, index) => ({
		conceptId: step.concept_id ?? undefined,
		conceptName: step.concept_name,
		sequence: index + 1,
		categorisation: step.category,
		justification: step.justification,
		recommendedResources: normaliseStringList(step.recommended_resources),
		masteryCheck: step.mastery_check,
	}));

	return {
		steps,
		missingFoundations: normaliseStringList(raw.missing_foundations),
		integrationGuidance: normaliseStringList(raw.integration_guidance),
		refresherAdvice: normaliseStringList(raw.refresher_advice),
		summary: raw.summary.trim(),
	};
};

export const prerequisiteResolverNode = async (
	state: PrerequisiteResolverNodeInput,
	config?: RunnableConfig,
): Promise<PrerequisiteResolverNodeOutput> => {
	const topic = state.topic;
	if (!topic) {
		throw new Error("Prerequisite resolver node requires a topic from context bootstrap.");
	}

	const bootstrapSummary = state.bootstrapSummary;
	if (!bootstrapSummary) {
		throw new Error("Prerequisite resolver node requires a bootstrap summary.");
	}


	const model = createGeminiModel({ temperature: 0 });
	const chain = prerequisiteResolverPromptTemplate.pipe(
		model.withStructuredOutput(prerequisiteResolverSchema),
	);

	const rawOutput = (await chain.invoke(
		{
			topic_statement: bootstrapSummary.topicStatement,
			learner_persona: bootstrapSummary.learnerPersona,
			experience_summary: bootstrapSummary.experienceSummary,
			learning_objectives: formatLearnerList(bootstrapSummary.learningObjectives, "Learner did not specify objectives."),
			knowledge_gaps: formatLearnerList(bootstrapSummary.knowledgeGaps, "No explicit gaps provided."),
			learning_constraints: formatLearnerList(bootstrapSummary.learningConstraints, "No hard constraints mentioned."),
			learning_preferences: formatLearnerList(bootstrapSummary.learningPreferences, "No specific preferences provided."),
		},
		config,
	)) as PrerequisiteResolverRawOutput;

	const prerequisitePlan = mapPlan(rawOutput);

	return {
		prerequisitePlan,
	};
};
