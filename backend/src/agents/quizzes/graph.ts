import { END, START, StateGraph } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { QuizzesStateAnnotation } from "./state";
import { quizzesGeneratorNode } from "./nodes/quizzesGenerator"; 

const graphBuilder = new StateGraph(QuizzesStateAnnotation)
    .addNode("quizzes_generator", quizzesGeneratorNode)
    .addEdge(START, "quizzes_generator")
    .addEdge("quizzes_generator", END);

const checkpoint = PostgresSaver.fromConnString(process.env.DATABASE_URL ?? "");
await checkpoint.setup();

export const quizzesGraph = graphBuilder.compile({ checkpointer: checkpoint });

export type QuizzesCompiledGraph = typeof quizzesGraph;