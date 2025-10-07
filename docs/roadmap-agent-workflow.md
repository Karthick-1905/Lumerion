# Roadmap Agent Workflow Architecture

## Objectives
- Enforce prerequisite and module dependency requirements derived from the relational schema (`module_dependency`, `learning_module`, `learning_path_module`).
- Upgrade the agent workflow to support a React-based experience with streaming updates and interactive human-in-the-loop checkpoints.
- Generate adaptive learning roadmaps that include mid-module quizzes, dependency-aware sequencing, and source citations referencing openly accessible material.
- Provide a reusable prompt and tool library so we can iterate on behaviour without rewriting orchestration code.

## High-Level System Overview
- **Backend orchestration:** LangGraph state machine composed of specialised nodes that read from and write to the shared `RoadmapState`. The graph integrates deterministic utilities (SQL tooling) with LLM-driven planners.
- **Data sources:** Postgres via Drizzle ORM for user profile, learning paths, modules, module dependencies, and progress data; external web search APIs for fresh content; optional vector store for re-using curated content.
- **Frontend experience:** React SPA that streams node transitions, renders intermediate artefacts (dependency graph, quiz drafts, citation list), and captures human feedback before committing the roadmap.
- **Human-in-the-loop:** The workflow pauses at a `Review` node, allowing users (or staff) to adjust prerequisites, exclude resources, or request new quizzes before the graph resumes.

```
START → ContextBootstrap → KnowledgeGapAssessment → PrereqDependencyAnalyzer
      → ResearchOrchestrator → CurriculumComposer → QuizPlanner → HumanReviewGate
      → Finalizer → END
```

## Node Catalogue
| Node | Responsibility | Inputs | Outputs | Primary Tools |
| --- | --- | --- | --- | --- |
| `ContextBootstrap` | Normalise incoming prompt, resolve user/session metadata, load existing learning paths & progress. | User message, auth context | `messages`, `userProfile`, `activePaths`, `priorModules` | `UserProfileTool`, `LearningPathTool` |
| `KnowledgeGapAssessment` | Extend planning step to identify domain, standards, missing skills, and required competency level. | Bootstrapped state | `domain`, `targetLevel`, `skills`, `requiresPrereqs`, `reasoning`, `searchQueries` | `PlannerChain` (LLM) |
| `PrereqDependencyAnalyzer` | Map recommended modules to stored dependencies; surface prerequisite modules and enforce ordering. | Planning output | `dependencyGraph`, `missingPrereqs`, `availablePrereqModules` | `ModuleDependencyTool`, `ModuleGraphBuilder` |
| `ResearchOrchestrator` | Run targeted web searches with citation capture; optionally enrich with curated library hits. | Search queries, dependency hints | `searchResults` (with URL, snippet, license), `citationCandidates` | `SearchQueriesTool`, optional `VectorRecallTool` |
| `CurriculumComposer` | Synthesize modules & lessons honouring dependencies, embed citations, mark quiz checkpoints. | Planning data, dependency graph, search results | `modules`, `recommendedOrder`, `moduleCitations`, `projectIdeas` | `CurriculumChain` (LLM), `CitationAssembler` |
| `QuizPlanner` | Generate formative quizzes and practical checks between modules/sections. | Modules, dependency data | `moduleQuizzes`, `quizMetadata` | `QuizGenerationChain` |
| `HumanReviewGate` | Pause graph, surface plan in React UI, apply adjustments from user (add/remove modules, request new quiz). | Roadmap draft | Updated `modules`, `moduleQuizzes`, `notes` | `HumanFeedbackTool` (LangGraph interrupt) |
| `Finalizer` | Emit final payload (roadmap, quizzes, citations, prerequisites) and persist to DB. | Post-review state | `finalRoadmap`, `persistedPathId`, `auditTrail` | `RoadmapPersistenceTool`, `NotificationTool` |

## Tooling Overview
- **UserProfileTool:** Reads `users`, `learning_path`, `user_module_progress` to gather persona, goals, and current standing.
- **LearningPathTool:** Fetches modules already assigned to avoid duplication and to reuse modules that satisfy prerequisites.
- **ModuleDependencyTool:** Queries `module_dependency` / `learning_module` to build a DAG representing prerequisite relationships; exposes helper to topologically sort modules.
- **ModuleGraphBuilder:** Pure TypeScript utility that merges DB dependencies with newly proposed modules to ensure acyclicity and consistent ordering.
- **SearchQueriesTool (existing):** Continue using Google/Tavily search, but extend to return license type and capture top-`k` citations.
- **CitationAssembler:** Deduplicates URLs, formats MLA/APA snippets, and flags paid resources (to be filtered out).
- **CurriculumChain:** LLM prompt that transforms structured context into dependency-aware modules.
- **QuizGenerationChain:** LLM prompt specialised for generating different question types (MCQ, short answer, scenario) tied to module objectives; returns JSON with answers/explanations.
- **HumanFeedbackTool:** Implements LangGraph’s `interrupt` semantics, signalling the frontend to request approval or edits and resume with patched state.
- **RoadmapPersistenceTool:** Persists final modules/quizzes/citations to Drizzle tables (`learning_path`, `learning_path_module`, custom `quiz` tables).

## Prompt Library (Initial Drafts)
### KnowledgeGapAssessment Prompt
```
System: You are a senior curriculum analyst.
User Context: {user_profile}
Existing Progress: {progress_summary}
User Goal: {user_query}

Tasks:
1. Classify domain and target proficiency level (beginner/intermediate/advanced).
2. List 3-6 critical prerequisite skills pulled from existing module catalog; mark those already satisfied by the user.
3. Decide if new prerequisites must be scheduled.
4. Produce 6-10 high-yield search queries covering fundamentals, implementation, best practices, assessments, and community projects.
5. Return JSON { domain, target_level, requires_prereqs, reasoning, prerequisite_skills[], search_queries[] }.
```

### PrereqDependencyAnalyzer Prompt
```
System: You orchestrate learning module dependencies.
Inputs:
- Proposed Modules Draft: {draft_modules}
- Dependency Graph (DB): {dependency_graph}

Tasks:
1. For each proposed module, list prerequisite modules (existing or to-be-created).
2. Flag gaps where prerequisites do not exist and recommend module outlines to fill them.
3. Output JSON { module_id?, title, prerequisites: [module_id|"NEW:<title>"], dependency_notes }.
```

### CurriculumComposer Prompt
```
System: Expert curriculum designer.
Context: Domain {domain}, target level {target_level}, reasoning {reasoning}
Dependencies: {resolved_dependencies}
Search Evidence:
{citation_snippets}

Requirements:
- Produce ordered modules respecting dependencies.
- Each module: title, description, learning_goals[], lessons[]. Lessons include title, description, estimated_hours.
- Attach citations (URL + short note) covering the module. Prioritise open/free sources.
- Suggest a practical checkpoint or mini-project for each module.
- Return JSON { modules: [...], citations: [...] }.
```

### QuizPlanner Prompt
```
System: Instructional assessment expert.
Input Modules: {modules}
Dependencies: {resolved_dependencies}

Generate quizzes after each module & before dependency-critical transitions.
For each quiz:
- type (pre-check, formative, mastery)
- questions[] with fields { prompt, type, choices?, answer, explanation, estimated_minutes }
- map questions to module objectives.
Return JSON { quizzes: [...] }.
```

### HumanReviewGate Behaviour
- Graph emits an `interrupt` payload: `{ modules, prerequisites, quizzes, citations }`.
- Frontend renders editable cards (drag/drop modules, toggle prerequisites, edit quiz difficulty).
- User actions are posted back to resume endpoint; state is patched before entering `Finalizer`.

## React Frontend Architecture
```
<AgentApp>
 ├─ <SessionProvider>
 │   ├─ useRoadmapAgent() // SWR/React Query hook streaming LangGraph events
 │   └─ <AgentSocketBridge> // SSE or WebSocket listener
 ├─ <AgentShell>
 │   ├─ <UserGoalForm>
 │   ├─ <TimelinePanel> // displays node transitions & intermediate outputs
 │   ├─ <PrereqDependencyGraph> // DAG visual using vis.js/d3
 │   ├─ <ModuleComposerPreview>
 │   ├─ <QuizPreview>
 │   └─ <HumanReviewDrawer>
 └─ <ToastHub />
```
- **State management:** React Query for async mutations, Zustand for optimistic edits during review.
- **Streaming:** Use Server-Sent Events (SSE) from LangGraph `streamEvents` to push node completions; buffer partial LLM deltas for UX.
- **Human-in-loop:** `HumanReviewDrawer` opens when `interrupt` event occurs. User can request regeneration (kicking graph back to `CurriculumComposer` or `QuizPlanner` with revised constraints).
- **Customization controls:** Tag modules as "skip", "replace", or adjust estimated hours; these map to structured feedback for the graph.

## Data Contracts
```jsonc
{
  "roadmap": {
    "domain": "string",
    "targetLevel": "beginner|intermediate|advanced",
    "modules": [
      {
        "moduleId": "uuid",
        "title": "string",
        "description": "string",
        "prerequisites": ["moduleId"],
        "lessons": [
          { "lessonId": "uuid", "title": "string", "description": "string", "estimatedHours": 1.5 }
        ],
        "checkpoint": { "type": "project|quiz", "summary": "string" },
        "citations": ["url"]
      }
    ]
  },
  "quizzes": [
    {
      "moduleId": "uuid",
      "type": "pre-check|formative|mastery",
      "questions": [
        { "prompt": "string", "type": "mcq|short_answer|scenario", "choices": [""], "answer": "string", "explanation": "string" }
      ]
    }
  ],
  "citations": [
    { "moduleId": "uuid", "url": "string", "title": "string", "publisher": "string", "license": "CC-BY" }
  ],
  "audit": {
    "generatedAt": "iso",
    "version": 1,
    "humanAdjustments": [
      { "actor": "user|mentor", "timestamp": "iso", "change": "string" }
    ]
  }
}
```

## Implementation Roadmap
1. **Foundations (Backend):**
   - Expand `RoadmapStateAnnotation` to include `userProfile`, `dependencies`, `quizzes`, `citations`.
   - Implement Postgres tools (`UserProfileTool`, `ModuleDependencyTool`) using Drizzle queries.
   - Add new LangGraph nodes and wire edges as defined.
2. **Prompt & Chain Development:**
   - Craft prompts above with guardrails and structured output schemas.
   - Add JSON schema validation (Zod) for quizzes, citations.
3. **Frontend React Upgrade:**
   - Scaffold `AgentApp` with session provider, SSE bridge, and the review drawer.
   - Implement DAG visualisation and quiz preview components.
4. **Human-in-loop Integration:**
   - Hook LangGraph interrupts to frontend review cycle.
   - Persist feedback adjustments to DB/audit log.
5. **Testing & QA:**
   - Unit-test utilities (dependency sorting, quiz validation).
   - Run end-to-end scenario (greenfield learner, experienced learner).
6. **Iterative Enhancements:**
   - Add caching for search results & citations.
   - Introduce adaptive quiz difficulty based on user feedback.

## Next Steps
- Finalise database schema additions for quizzes/citations.
- Prioritise building `ModuleDependencyTool` and `QuizGenerationChain` since they unlock prerequisite enforcement and assessments.
- Align with frontend team on the streaming contract before implementing the React components.
