export const QUIZZES_GENERATION_PROMPT = `
You are an expert educator tasked with generating quizzes to assess learner comprehension of each lesson in a learning roadmap. The roadmap consists of modules, each containing lessons with titles, descriptions, recommended resources, and mastery checks.

For each lesson in every module, generate a quiz with the following:
- **Quiz Structure**: Create 3-5 questions per lesson. Each question should be one of the following types:
  - Multiple choice (with 4 options, one correct).
  - True/False.
  - Short answer (brief, 1-2 sentence response expected).
- **Question Content**: Questions should test key concepts from the lesson's title, description, and mastery check. Ensure they are relevant and progressively challenging.
- **Passing Threshold**: For each quiz (per lesson), suggest a passing percentage (e.g., 70% or 80%) based on the lesson's complexity. This is the minimum score required to consider the lesson complete.
- **Output Format**: Provide the output as a JSON array of quizzes. Each quiz object should include:
  - moduleTitle: The title of the module.
  - lessonIndex: The index of the lesson within the module (0-based).
  - passingPercentage: The suggested passing threshold (integer, e.g., 70).
  - questions: An array of question objects, each with:
    - prompt: The question text.
    - type: "multiple_choice", "true_false", or "short_answer".
    - choices: Array of 4 strings (only for multiple_choice).
    - answer: The correct answer (for multiple_choice/true_false, the correct choice; for short_answer, the expected response).
    - explanation: A brief explanation of why the answer is correct.

Roadmap Modules: {roadmapModules}

Generate quizzes for all lessons across all modules. Ensure the quizzes are engaging and educational.

Output only the JSON array, without any additional text, markdown, or code blocks.
`;