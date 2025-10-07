import { END, START, StateGraph } from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { RoadmapStateAnnotation } from "./state.ts";
import {
	contextBootstrapNode,
	curriculumComposerNode,
	prerequisiteResolverNode,
} from "./chain.ts";
import { v4 as uuidv4 } from "uuid";


const graphBuilder = new StateGraph(RoadmapStateAnnotation)
	.addNode("context_bootstrap", contextBootstrapNode)
	.addNode("prerequisite_resolver", prerequisiteResolverNode)
	.addNode("curriculum_composer", curriculumComposerNode)
	.addEdge(START, "context_bootstrap")
	.addEdge("context_bootstrap", "prerequisite_resolver")
	.addEdge("prerequisite_resolver", "curriculum_composer")
	.addEdge("curriculum_composer", END);

const checkpoint = PostgresSaver.fromConnString(process.env.DATABASE_URL ?? "");
await checkpoint.setup()

export const roadmapGraph = graphBuilder.compile({checkpointer: checkpoint});

export type RoadmapCompiledGraph = typeof roadmapGraph;


const config = {
  configurable: {
    thread_id: uuidv4()
  }
};

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
