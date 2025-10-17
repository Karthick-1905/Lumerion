import { contextBootstrapNode } from "./nodes/contextBootstrap";
import { prerequisiteResolverNode } from "./nodes/prerequisiteResolver";
import { curriculumComposerNode } from "./nodes/curriculumComposer";
import { reflectionNode } from "./nodes/reflectionNode";
import { quizGenerationNode } from "./nodes/quizGenerationNode";
import { quizPersistenceNode } from "./nodes/quizPersistenceNode";
import { moduleNotesNode } from "./nodes/moduleNotesNode";

export { contextBootstrapNode } from "./nodes/contextBootstrap";
export { prerequisiteResolverNode } from "./nodes/prerequisiteResolver";
export { curriculumComposerNode } from "./nodes/curriculumComposer";
export { reflectionNode } from "./nodes/reflectionNode";
export { quizGenerationNode } from "./nodes/quizGenerationNode";
export { quizPersistenceNode } from "./nodes/quizPersistenceNode";
export { moduleNotesNode } from "./nodes/moduleNotesNode";

export const roadmapNodes = {
	contextBootstrapNode,
	prerequisiteResolverNode,
	curriculumComposerNode,
	reflectionNode,
	quizGenerationNode,
	quizPersistenceNode,
	moduleNotesNode,
};
