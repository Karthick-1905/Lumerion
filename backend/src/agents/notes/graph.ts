import { END, START, StateGraph } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { NotesStateAnnotation } from "./state";
import { notesGeneratorNode } from "./nodes/notesGenerator"; // You'll need to create this node

const graphBuilder = new StateGraph(NotesStateAnnotation)
    .addNode("notes_generator", notesGeneratorNode)
    .addEdge(START, "notes_generator")
    .addEdge("notes_generator", END);

const checkpoint = PostgresSaver.fromConnString(process.env.DATABASE_URL ?? "");
await checkpoint.setup();

export const notesGraph = graphBuilder.compile({ checkpointer: checkpoint });

export type NotesCompiledGraph = typeof notesGraph;