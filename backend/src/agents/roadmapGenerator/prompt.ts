import { PromptTemplate } from "@langchain/core/prompts";

export const plannerPromptTemplate = PromptTemplate.fromTemplate(`You are an expert curriculum designer and search strategist.
Task:
Given a user topic, (1) classify its domain, (2) decide whether prerequisites are required, (3) explain your decision briefly, and (4) produce a set of robust web search queries that will retrieve high-quality material covering the full topic from intro → internals → advanced, including prerequisite checks, syllabi, tutorials, projects, and reference material.

Requirements / Rules:
1. Analyze the user's topic carefully and classify it into a clear, broad domain (e.g., "Cloud Computing", "Networking", "Artificial Intelligence", "Mathematics", "Cybersecurity", "Software Engineering").
2. Decide whether the topic **requires prerequisites** (true/false). "Requires prerequisites" means the learner will likely need prior foundational knowledge to learn this topic effectively.
3. Provide a short human-readable **reasoning** (1–2 sentences) for the classification and prereq decision — useful for debugging.
4. Generate **6 to 8 robust search queries** (strings). Each query should be crafted to retrieve comprehensive resources for learning the topic end-to-end:
	 - include queries that fetch **overview/introduction**, **prerequisite lists**, **detailed internals/architecture**, **course syllabi**, **practical tutorials / hands-on labs**, **project ideas**, and **reference docs / cheatsheets**.
		- include a few targeted queries (e.g., 'site:edu', 'site:github.com', 'filetype:pdf') where appropriate to increase coverage of authoritative sources.
	 - prefer explicit intent phrases: "how to learn", "roadmap", "syllabus", "tutorial", "course", "projects", "best practices", "implementation", "lab".
	 - make queries specific (e.g., include common subtopics or acronyms if relevant).
5. Output MUST be **ONLY** a single valid JSON object conforming exactly to the schema below — no extra text, no explanation, no code fences.

Input:
Topic: {user_query}

Output JSON must follow these rules:
- "domain": string (concise domain classification)
- "requires_prereqs": boolean (true if prerequisites are recommended)
- "reasoning": short string (1–2 sentences explaining the decision)
- "search_queries": array of 6–8 strings, each a distinct web search query covering the topic end-to-end.

Return only the JSON object—no prose, comments, or code fences.

Example (for "Cloud Security"):
- domain: Cloud Computing / Cybersecurity
- requires_prereqs: true
- reasoning: Cloud security builds on networking, virtualization, and IAM concepts; learners should know networking basics and cloud models.
- search_queries:
  1. Cloud security roadmap how to learn from basics to advanced
  2. prerequisites for cloud security networking virtualization IAM
  3. cloud security syllabus site:edu filetype:pdf
  4. cloud security hands-on labs tutorials site:github.com
  5. IAM best practices AWS Azure GCP tutorial
  6. cloud network security architecture introduction
`);

export const roadmapAgentPromptTemplate = PromptTemplate.fromTemplate(`You are an expert curriculum planner and learning path designer.

Your task is to generate a structured learning roadmap for a given topic,
based on domain classification, prerequisite needs, and relevant search results.

### Input Context
Domain: {domain}
Requires prerequisites: {requires_prereqs}
Reasoning: {reasoning}

Search results:
{search_results}

### Instructions
1. Analyze the search results to extract the main topics, subtopics, and logical learning order.
2. Organize the content into a sequence of **modules**. Each module should cover a coherent set of topics.
3. Break each module into **lessons**:
	 - Include a clear title.
	 - Provide a short description (1–2 sentences).
	 - Optionally, estimate the learning time in hours (roughly).
4. Respect prerequisites:
	 - If requires_prereqs is true, create an **Introductory Module** that covers the necessary background.
	 - Otherwise, start directly with the main topic.
5. The roadmap should move from **fundamentals → core concepts → advanced concepts → applications/projects**.
6. Use the search summaries above as evidence. Reference concrete concepts, tools, standards, or resources that appear in the search snippets when naming modules or lessons.
7. Output ONLY a valid JSON object with this structure:
	- Top-level key "modules": array of module objects in learning order.
	- Each module object includes "title" (string), "description" (string), and "lessons" (array).
	- Each lesson object includes "title" (string), "description" (string), and "estimated_time_hours" (number or null).

### Example
Input Topic: "Cloud Security"
Output summary:
- Module 1 "Prerequisite Knowledge" with lessons on networking basics, cloud service models, and identity & access management (estimated times 4h, 3h, 3h).
- Module 2 "Core Cloud Security Concepts" with lessons on shared responsibility and encryption techniques (estimated times 2h, 3h).
`);
