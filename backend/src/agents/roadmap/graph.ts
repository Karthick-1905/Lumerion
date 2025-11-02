import { END, START, StateGraph } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { RoadmapStateAnnotation } from "./state";
import {
    contextBootstrapNode,
    curriculumComposerNode,
    prerequisiteResolverNode,
} from "./chain";


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

export const roadmapGraph = graphBuilder.compile({ checkpointer: checkpoint });

export type RoadmapCompiledGraph = typeof roadmapGraph;


export const roadmapGraphDebug = {
    graphBuilder,
    roadmapGraph,
};


