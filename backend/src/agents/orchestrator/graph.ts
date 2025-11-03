import { END, START, StateGraph } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { OrchestratorStateAnnotation } from "./state";
import { roadmapGraph } from "../roadmap/graph";
import { notesGraph } from "../notes/graph";
import { quizzesGraph } from "../quizzes/graph"; 

const roadmapNode = async (state: typeof OrchestratorStateAnnotation.State) => {
    const result = await roadmapGraph.invoke({
        messages: state.messages,
        topic: state.topic,
        learnerProfile: state.learnerProfile,
    });
    return {
        roadmapModules: result.modules,
        domain: result.domain,
        requiresPrereqs: result.requiresPrereqs,
        bootstrapSummary: result.bootstrapSummary,
        prerequisitePlan: result.prerequisitePlan,
    };
};

const notesNode = async (state: typeof OrchestratorStateAnnotation.State) => {
    const result = await notesGraph.invoke({
        messages: state.messages,
        roadmapModules: state.roadmapModules,
    });
    return {
        notes: result.notes,
    };
};

const quizzesNode = async (state: typeof OrchestratorStateAnnotation.State) => {
    const result = await quizzesGraph.invoke({
        messages: state.messages,
        roadmapModules: state.roadmapModules,
        notes: state.notes,
    });
    return {
        quizzes: result.quizzes,
        finalOutput: {
            roadmap: state.roadmapModules,
            notes: state.notes,
            quizzes: result.quizzes,
        },
    };
};

const graphBuilder = new StateGraph(OrchestratorStateAnnotation)
    .addNode("roadmap_generator", roadmapNode)
    // .addNode("notes_generator", notesNode)
    .addNode("quizzes_generator", quizzesNode)
    .addEdge(START, "roadmap_generator")
    // .addEdge("roadmap_generator", "notes_generator")
    // .addEdge("notes_generator", "quizzes_generator")
    .addEdge('roadmap_generator', 'quizzes_generator')
    .addEdge("quizzes_generator", END);

const checkpoint = PostgresSaver.fromConnString(process.env.DATABASE_URL ?? "");
await checkpoint.setup();

export const orchestratorGraph = graphBuilder.compile({ checkpointer: checkpoint });

orchestratorGraph.debug = true



export type OrchestratorCompiledGraph = typeof orchestratorGraph;