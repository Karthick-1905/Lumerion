# Knowledge Graph–Driven Roadmap Agent: Implementation Plan

## 1. Purpose
Create a scalable agentic workflow that powers learning-path recommendations and prerequisite enforcement using a Neo4j knowledge graph, high-quality content harvested from the open web, and LLM-assisted reasoning. The plan below scaffolds each subsystem so we can iterate incrementally while keeping the end-to-end experience (including reflection and streaming) in sight.

## 2. System Pillars
1. **Structured Knowledge Backbone** – Domain concepts, skills, resources, and prerequisite edges stored in Neo4j with embedding support for similarity search.
2. **Data Acquisition & Normalisation** – Repeatable pipelines that ingest websites, PDFs, and video transcripts, producing clean, chunked text with rich metadata.
3. **LLM-Assisted Graph Enrichment** – Gemini or Azure OpenAI models extract entities/relationships, align them to an ontology, and generate citations.
4. **Agentic Workflow** – LangGraph-based orchestration that consults the knowledge graph, performs targeted web search, and uses reflection agents to refine outputs, streaming progress back to the React UI.

---

## 3. Data Acquisition Pipeline
### 3.1 Source Strategy
- **High-signal websites:** Open-source courseware (MIT OCW, Stanford, MDN), trusted blogs, vendor documentation.
- **Videos:** YouTube educational channels, conference talks. Use the YouTube Data API for metadata and transcripts (or Whisper for speech-to-text when captions absent).
- **PDFs & whitepapers:** Use official syllabus repositories, academic preprints (arXiv, OpenReview), and government/industry guides. Respect licensing; track provenance.

### 3.2 Harvesting Components
1. **Scheduler:** Maintains crawl lists & freshness windows (daily for breaking tech, monthly for static references).
2. **Fetcher:** Playwright/Scrapy-based HTML downloader with sitemap + RSS support; separate workers for PDF downloads.
3. **Video Processor:**
   - Retrieve transcript via API; fall back to batch speech-to-text (Whisper large-v3) with diarisation disabled.
   - Generate time-aligned segments.
4. **Format Normaliser:** Convert HTML → Markdown, PDFs → text via `pdfminer`/`pymupdf`, transcripts → JSON lines.
5. **Raw Store:** Persist artefacts + metadata (source URL, timestamp, license, topic tags) in object storage (S3-compatible bucket) plus ingestion manifest table.

---

## 4. Normalisation & Enrichment
1. **Cleaning:** Remove boilerplate (nav, ads), collapse whitespace, fix Unicode, detect language (fastText) and discard unsupported locales.
2. **Chunking:** Adaptive chunker (500–1,200 tokens) keyed by natural boundaries (headings, slide markers, transcript timestamps). Maintain references to parent resource + offsets.
3. **Metadata Augmentation:**
   - Topic heuristics using keyword dictionaries & zero-shot classifiers.
   - Difficulty estimation (rule-based + LLM rating).
   - Resource type: tutorial, lecture, reference, assessment, project.
4. **Deduplication:** SimHash + embedding similarity to collapse near-identical chunks.
5. **Canonicalisation:** Map synonyms to canonical concepts (e.g., "DL" → "Deep Learning"); leverage existing taxonomy (e.g., ACM CCS) to keep nodes consistent.

---

## 5. Entity & Relationship Extraction
1. **Extraction Prompting:**
   - Use Gemini 2.0 Pro or Azure GPT-4o with JSON schema returning `entities[]` and `relations[]` fields.
   - Entities categorised as `Concept`, `Skill`, `Tool`, `Resource`, `Assessment`, `Provider`.
   - Relations: `PREREQUISITE`, `TEACHES`, `COVERS`, `EVALUATES`, `REFERENCES`, `DERIVED_FROM`.
2. **Batch Orchestration:** Process chunks via LangSmith/LangGraph pipeline for backpressure & retries.
3. **Confidence Scoring:** Combine model-provided logprob/confidence with heuristic checks (e.g., relation validity, entity frequency). Flag low-confidence edges for manual review.
4. **Human QA Loop:** Integrate a small annotation tool for mentors to validate disputed edges; feedback fine-tunes extraction prompts.
5. **Ontology Alignment:** Map extracted entities to existing graph nodes via embedding similarity and lexical matching; create new nodes when similarity < threshold.

---

## 6. Knowledge Graph Construction (Neo4j)
1. **Graph Schema:**
   - Nodes: `Concept`, `Skill`, `Resource`, `Module`, `Assessment`, `Provider`, `Tag`.
   - Relationships:
     - `(:Concept)-[:PREREQUISITE_OF]->(:Concept)`
     - `(:Resource)-[:COVERS]->(:Concept)`
     - `(:Module)-[:AGGREGATES]->(:Resource)`
     - `(:Resource)-[:HAS_CITATION]->(:Tag {type: "citation"})`
     - `(:Skill)-[:REINFORCED_BY]->(:Assessment)`
   - Constraints: unique `id` per node, composite index on `(type, slug)` for fast lookups.
2. **Loading Strategy:**
   - Stage CSV/JSONL exports; leverage `neo4j-admin bulk import` for initial load, followed by APOC procedures for incremental updates.
   - Use `MERGE` operations with deterministic IDs (`slugified_name + version`).
3. **Embedding Integration:**
   - Generate embeddings (Gemini Text-Embedding-004 or Azure text-embedding-3-large) for concepts/resources.
   - Store vectors either in Neo4j Graph Data Science (GDS) `graph catalog` or external vector store (Qdrant) with cross-IDs.
   - Use similarity search to recommend related nodes and detect prerequisite gaps.
4. **Graph Analytics:** Employ GDS algorithms (PageRank, Personalized PageRank, community detection) to rank resources and identify learning clusters.

---

## 7. Agent Workflow Scaffolding
### 7.1 High-Level Flow
```
START
  ↓
ContextBootstrap (load roadmap_session by thread_id, fetch user profile via user_profile_tool)
  ↓
KnowledgeGraphPlanner (query Neo4j for relevant concepts, run embeddings for similarity)
  ↓
WebResearchNode (reuse Tavily tool to augment gaps + capture citations)
  ↓
PrerequisiteResolver (walk PREREQUISITE_OF edges, enforce ordering, surface missing concepts)
  ↓
CurriculumComposer (LLM generates modules/lessons using KG + web evidence)
  ↓
ReflectionAgent (self-critique & fix coverage holes)
  ↓
Streamer (incrementally send updates to React UI via SSE/WebSocket)
  ↓
Finalizer (persist roadmap, quizzes, citations)
  ↓
END
```

### 7.2 Reflection Agent
- Implement as a LangGraph branch using a second LLM pass ("critic" prompt). It checks:
  - Coverage of core concepts present in KG but missing in roadmap.
  - Prerequisite compliance (no module lacks required precursor).
  - Balance between theory/resources/quizzes.
- If issues found, feed structured feedback back into `CurriculumComposer` for targeted fixes.

### 7.3 Streaming
- Each node emits partial artefacts (concept set, prerequisite graph, module drafts).
- The frontend subscribes via SSE; renders incremental updates and displays progress spinner per node.

---

## 8. Data Acquisition → Knowledge Graph → Agent Traceability
1. Every node stores origin metadata (URL, video/timestamp, PDF page) so citations remain attached to lessons.
2. Roadmap payload includes provenance for auditing and future refresh jobs.
3. For user customisation, expose sliders or toggles to weight graph-derived vs. web-sourced recommendations; reflection agent honours user feedback before finalising.

---

## 9. Infrastructure & Tooling
- **Ingestion Workers:** Containerised tasks orchestrated by Temporal or BullMQ; store job state in Redis.
- **Neo4j Deployment:** Managed AuraDB or self-hosted cluster with GDS plugin; enable APOC.
- **Vector Store:** Evaluate Neo4j native vector indices vs. external (Qdrant/Weaviate) for scale.
- **LLM Access:** Vertex AI (Gemini) + Azure OpenAI with fallback/concurrency controls.
- **Monitoring:** Grafana dashboards for ingestion throughput, graph size, agent latency; LangSmith traces for prompt debugging.

---

## 10. Phased Implementation Roadmap
1. **Sprint 1 – Foundations**
   - Stand up ingestion skeleton (scheduler + fetcher + raw store).
   - Define ontology, create initial Neo4j schema, wire vector embedding generator.
2. **Sprint 2 – Extraction MVP**
   - Implement LLM-based entity/relation extraction with QA tooling.
   - Load first batch of nodes/edges; run sanity queries.
3. **Sprint 3 – Agent Integration**
   - Extend roadmap LangGraph with `KnowledgeGraphPlanner` + `PrerequisiteResolver` nodes.
   - Surface KG outputs in UI for transparency.
4. **Sprint 4 – Reflection & Streaming**
   - Add critic/reflection pass; implement SSE streaming adapter.
   - Bake in human-in-the-loop review workflow.
5. **Sprint 5 – Hardening**
   - Add automated evaluations (precision/recall on prereq edges, user satisfaction surveys).
   - Optimise graph queries, enable incremental ingestion scheduling.

---

## 11. Risks & Mitigations
- **Data Quality Variance:** Mitigate with source whitelists, quality scoring, and periodic audits.
- **LLM Extraction Drift:** Version prompts, log outputs, and retrain on annotated failures.
- **Graph Explosion:** Apply concept canonicalisation + dedup heuristics; enforce naming conventions.
- **Licensing Constraints:** Track license metadata; exclude non-redistributable resources from recommendations.
- **Latency:** Cache frequent KG queries, precompute prerequisite closures, and reuse embeddings.

---

## 12. Next Steps
1. Finalise ontology + node/relationship definitions; configure Neo4j constraints.
2. Implement ingestion MVP targeting 2–3 high-quality domains for pilot graph.
3. Stand up extraction pipeline leveraging Gemini/GPT with JSON schema validation.
4. Prototype `KnowledgeGraphPlanner` LangGraph node using placeholder data, ensuring streaming contract works with the React shell.
