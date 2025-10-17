import { END, START, StateGraph } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { RoadmapStateAnnotation } from "./state";
import {
	contextBootstrapNode,
	curriculumComposerNode,
	prerequisiteResolverNode,
	moduleNotesNode,
} from "./chain";
import { reflectionNode, quizGenerationNode, quizPersistenceNode } from "./chain";
import { v4 as uuidv4 } from "uuid";


const graphBuilder = new StateGraph(RoadmapStateAnnotation)
	.addNode("context_bootstrap", contextBootstrapNode)
	.addNode("prerequisite_resolver", prerequisiteResolverNode)
	.addNode("curriculum_composer", curriculumComposerNode)
	.addNode("module_notes", moduleNotesNode)
	.addNode("reflection_node", reflectionNode)
	.addNode("quiz_generation", quizGenerationNode)
	.addNode("quiz_persistence", quizPersistenceNode)
	.addEdge(START, "context_bootstrap")
	.addEdge("context_bootstrap", "prerequisite_resolver")
	.addEdge("prerequisite_resolver", "curriculum_composer")
	.addEdge("curriculum_composer", "module_notes")
	.addEdge("module_notes", "reflection_node")
	.addEdge("reflection_node", "quiz_generation")
	.addEdge("quiz_generation", "quiz_persistence")
	.addEdge("quiz_persistence", END);

const checkpoint = PostgresSaver.fromConnString(process.env.DATABASE_URL ?? "");
await checkpoint.setup()

export const roadmapGraph = graphBuilder.compile({checkpointer: checkpoint});

export type RoadmapCompiledGraph = typeof roadmapGraph;


const config = {
  configurable: {
    thread_id: uuidv4()
  }
};

//roadmapGraph.debug = true

const runRoadmapSampleQuery = async (
	topic = "I want to learn Deep Learning from scratch.",
): Promise<unknown> => {
	console.log(`Running sample roadmap query: "${topic}"`);
	
    roadmapGraph.debug = true

	const result = await roadmapGraph.invoke({
		messages: [new HumanMessage(topic)],
	}, config);

	console.log("Generated modules:");
	console.log(JSON.stringify(result?.modules ?? [], null, 2));

	return result;
};

//runRoadmapSampleQuery()

export const roadmapGraphDebug = {
	graphBuilder,
	roadmapGraph,
	runRoadmapSampleQuery,
};

export const runRoadmapWithReflectionLoop = async (
 	topic = "I want to learn Deep Learning from scratch.",
 	maxRetries = 3,
) => {
 	console.log(`Running roadmap query with reflection loop (maxRetries=${maxRetries}): "${topic}"`);

 	const config = { configurable: { thread_id: uuidv4() } };

 	let lastResult: any = null;

 	for (let attempt = 0; attempt < maxRetries; attempt++) {
 		console.log(`Invoke attempt ${attempt + 1}`);
 		lastResult = await roadmapGraph.invoke({ messages: [new HumanMessage(topic)] }, config as any);

 		const reflection = lastResult?.reflection;
 		const changes = Array.isArray(reflection?.changes) ? reflection.changes : [];
 		const retries = typeof reflection?.retries === 'number' ? reflection.retries : 0;

 		console.log(`Reflection changes: ${changes.length}, retries: ${retries}`);

 		if (!changes.length) {
 			// stable
 			break;
 		}

 		if (retries >= maxRetries) {
 			console.log('Reached max retries per state, stopping.');
 			break;
 		}

 		// otherwise loop and let the checkpointer/state drive next run
 	}

 	console.log('Reflection loop finished.');
 	console.log('Final modules:');
 	console.log(JSON.stringify(lastResult?.modules ?? [], null, 2));

 	return lastResult;
};
