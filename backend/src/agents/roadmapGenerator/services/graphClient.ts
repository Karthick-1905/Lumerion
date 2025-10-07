import "dotenv/config";
import neo4j, { type Driver, type ManagedTransaction } from "neo4j-driver";

import type {
	GraphConceptSummary,
	GraphContextSnapshot,
	GraphResourceSummary,
} from "../state.ts";

interface KnowledgeGraphClientOptions {
	uri?: string;
	username?: string;
	password?: string;
	database?: string;
}

interface ConceptNeighborhoodOptions {
	topic: string;
	maxPrerequisites?: number;
	maxSupportingConcepts?: number;
	maxResources?: number;
	searchLimit?: number;
}

const DEFAULT_MAX_PREREQUISITES = 8;
const DEFAULT_MAX_SUPPORTING = 12;
const DEFAULT_MAX_RESOURCES = 12;
const DEFAULT_SEARCH_LIMIT = 3;

const isNonEmptyString = (value: unknown): value is string =>
	typeof value === "string" && value.trim().length > 0;

const ensureArrayOfStrings = (value: unknown): string[] => {
	if (Array.isArray(value)) {
		return value
			.map((item) => (isNonEmptyString(item) ? item.trim() : null))
			.filter((item): item is string => Boolean(item));
	}
	if (isNonEmptyString(value)) {
		return [value.trim()];
	}
	return [];
};

const coerceNumber = (value: unknown): number | null => {
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === "string") {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : null;
	}
	return null;
};

const ensurePositiveInteger = (value: unknown, fallback: number): number => {
	const coerced = coerceNumber(value);
	if (coerced === null || Number.isNaN(coerced)) {
		return fallback;
	}
	return Math.max(0, Math.trunc(coerced));
};

const toNeo4jInteger = (value: unknown, fallback: number) =>
	neo4j.int(ensurePositiveInteger(value, fallback));

const formatConcept = (concept: any): GraphConceptSummary => {
	const properties = concept?.properties ?? {};
	return {
		conceptId: properties.id ?? properties.slug ?? properties.uid ?? properties.name ?? "unknown",
		name: properties.name ?? properties.title ?? "Unknown Concept",
		conceptType: properties.type ?? properties.category ?? null,
		description: properties.description ?? properties.summary ?? null,
		difficulty: properties.difficulty ?? properties.level ?? null,
		importance: coerceNumber(properties.importance) ?? coerceNumber(properties.rank),
		readiness: coerceNumber(properties.readiness ?? properties.masteryScore),
		recommendedDurationHours: coerceNumber(properties.estimatedDurationHours),
		links: ensureArrayOfStrings(properties.urls ?? properties.links ?? properties.resources),
	};
};

const formatResource = (resource: any): GraphResourceSummary => {
	const properties = resource?.properties ?? {};
	return {
		resourceId: properties.id ?? properties.slug ?? properties.uid ?? properties.url ?? properties.title ?? "resource",
		title: properties.title ?? properties.name ?? "Supporting Resource",
		url: properties.url ?? properties.link ?? "",
		resourceType: properties.type ?? properties.format ?? null,
		difficulty: properties.difficulty ?? properties.level ?? null,
		description: properties.description ?? properties.summary ?? null,
		recommendedOrder: coerceNumber(properties.recommendedOrder ?? properties.rank ?? properties.position),
	};
};

class KnowledgeGraphClient {
	private static instance: KnowledgeGraphClient | null = null;
	private static missingConfigWarned = false;
	private driver: Driver | null = null;
	private readonly database?: string;

	private constructor(options: KnowledgeGraphClientOptions) {
		const uri = options.uri ?? process.env.NEO4J_URI;
		const username = options.username ?? process.env.NEO4J_USERNAME;
		const password = options.password ?? process.env.NEO4J_PASSWORD;
		this.database = options.database ?? process.env.NEO4J_DATABASE;

		if (!uri || !username || !password) {
			if (!KnowledgeGraphClient.missingConfigWarned) {
				KnowledgeGraphClient.missingConfigWarned = true;
				console.warn(
					"KnowledgeGraphClient: Neo4j connection details are missing. Set NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD to enable knowledge graph context.",
				);
			}
			return;
		}

		try {
			this.driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
				disableLosslessIntegers: true,
			});
		} catch (error) {
			console.error("KnowledgeGraphClient: failed to initialise Neo4j driver:", error);
			this.driver = null;
		}
	}

	public static getInstance(options: KnowledgeGraphClientOptions = {}): KnowledgeGraphClient {
		if (!KnowledgeGraphClient.instance) {
			KnowledgeGraphClient.instance = new KnowledgeGraphClient(options);
		}
		return KnowledgeGraphClient.instance;
	}

	public isConfigured(): boolean {
		return this.driver !== null;
	}

	public async close(): Promise<void> {
		if (this.driver) {
			await this.driver.close();
			this.driver = null;
		}
	}

	public async getConceptNeighborhood(
		options: ConceptNeighborhoodOptions,
	): Promise<GraphContextSnapshot> {
		const {
			topic,
			maxPrerequisites = DEFAULT_MAX_PREREQUISITES,
			maxSupportingConcepts = DEFAULT_MAX_SUPPORTING,
			maxResources = DEFAULT_MAX_RESOURCES,
			searchLimit = DEFAULT_SEARCH_LIMIT,
		} = options;

		if (!this.driver) {
			return {
				focusConcept: null,
				directPrerequisites: [],
				supportingConcepts: [],
				relatedResources: [],
				graphNotes:
					"Knowledge graph connection unavailable. Set NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD to enable graph-powered context.",
			};
		}

		const session = this.driver.session({ database: this.database ?? undefined });

		try {
			const query = `
				MATCH (candidate:Concept)
				WHERE toLower(candidate.name) CONTAINS toLower($topic)
				WITH candidate
				ORDER BY coalesce(candidate.rank, candidate.importance, candidate.popularity, 0) DESC, candidate.name
				LIMIT $searchLimit
				WITH head(collect(candidate)) AS target
				CALL {
					WITH target
					OPTIONAL MATCH (pr:Concept)-[:PREREQUISITE_OF]->(target)
					RETURN collect(DISTINCT pr) AS directPrereqsRaw
				}
				CALL {
					WITH target
					OPTIONAL MATCH (target)<-[:COVERS|TEACHES|REFERENCES]-(resource:Resource)
					RETURN collect(DISTINCT resource) AS resourcesRaw
				}
				CALL {
					WITH target, directPrereqsRaw
					UNWIND directPrereqsRaw AS dr
					OPTIONAL MATCH (support:Concept)-[:PREREQUISITE_OF]->(dr)
					RETURN collect(DISTINCT support) AS supportingRaw
				}
				RETURN target AS focusConceptRaw,
					directPrereqsRaw[0..$maxPrerequisites] AS directPrereqs,
					supportingRaw[0..$maxSupportingConcepts] AS supportingConcepts,
					resourcesRaw[0..$maxResources] AS resources
			`;

			const result = await session.executeRead((tx: ManagedTransaction) =>
				tx.run(query, {
					topic,
					searchLimit: toNeo4jInteger(searchLimit, DEFAULT_SEARCH_LIMIT),
					maxPrerequisites: toNeo4jInteger(maxPrerequisites, DEFAULT_MAX_PREREQUISITES),
					maxSupportingConcepts: toNeo4jInteger(
						maxSupportingConcepts,
						DEFAULT_MAX_SUPPORTING,
					),
					maxResources: toNeo4jInteger(maxResources, DEFAULT_MAX_RESOURCES),
				}),
			);

			if (result.records.length === 0) {
				return {
					focusConcept: null,
					directPrerequisites: [],
					supportingConcepts: [],
					relatedResources: [],
					graphNotes: "No matching concept found in knowledge graph for the provided topic.",
				};
			}

			const record = result.records[0];

			const focusConcept = record.get("focusConceptRaw")
				? formatConcept(record.get("focusConceptRaw"))
				: null;

			const directPrerequisites = (record.get("directPrereqs") ?? [])
				.filter(Boolean)
				.map((concept: any, index: number) => {
					const formatted = formatConcept(concept);
					return {
						...formatted,
						recommendedDurationHours:
							formatted.recommendedDurationHours ?? Math.max(2, index + 2),
					};
				});

			const supportingConcepts = (record.get("supportingConcepts") ?? [])
				.filter(Boolean)
				.map((concept: any) => formatConcept(concept));

			const relatedResources = (record.get("resources") ?? [])
				.filter(Boolean)
				.map((resource: any, index: number) => {
					const formatted = formatResource(resource);
					return {
						...formatted,
						recommendedOrder: formatted.recommendedOrder ?? index + 1,
					};
				});

			const noteParts: string[] = [];
			if (focusConcept) {
				noteParts.push(`Matched focus concept: ${focusConcept.name}`);
			}
			noteParts.push(
				`Prerequisites: ${directPrerequisites.length}, supporting concepts: ${supportingConcepts.length}, resources: ${relatedResources.length}`,
			);

			return {
				focusConcept,
				directPrerequisites,
				supportingConcepts,
				relatedResources,
				graphNotes: noteParts.join(" | "),
			};
		} catch (error) {
			console.error("Failed to query knowledge graph:", error);
			return {
				focusConcept: null,
				directPrerequisites: [],
				supportingConcepts: [],
				relatedResources: [],
				graphNotes: "Error encountered while querying knowledge graph. Returning empty context.",
			};
		} finally {
			await session.close();
		}
	}
}

export const knowledgeGraphClient = KnowledgeGraphClient.getInstance();

export type KnowledgeGraphClientType = KnowledgeGraphClient;
