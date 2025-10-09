import type { RunnableConfig } from "@langchain/core/runnables";
import type { RoadmapGraphState } from "../state";
import { z } from "zod";
import { db } from "../../../drizzle";
import { quiz, quizQuestion } from "../../../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Persist quizzes present in state.quizzes.quizzes to DB.
 * - Creates quiz rows and associated questions.
 * - Idempotent: uses a simple existence check by (quiz.moduleId, quiz.lessonIndex, quiz.title).
 * - Designed to be called after quizGeneration node.
 */
export const quizPersistenceNode = async (
  state: Pick<RoadmapGraphState, "quizzes">,
  config?: RunnableConfig,
) => {
  const payload = state.quizzes?.quizzes ?? [];
  if (!payload.length) return {};

  // payload item shape: { moduleTitle, lessonIndex?, questions: [{ prompt, type?, choices?, answer? }] }

  // Best-effort: try to persist each quiz and its questions within a transaction.
  for (const item of payload) {
    try {
      await db.transaction(async (tx) => {
        // We don't have moduleId/pathId in the agent state; rely on metadata if present.
        // If the quiz item contains metadata with moduleId/pathId, use them; otherwise skip persistence.
        const meta = (item as any).metadata ?? {};
        const moduleId = typeof meta.moduleId === 'number' ? meta.moduleId : undefined;
        const pathId = typeof meta.pathId === 'number' ? meta.pathId : undefined;

        if (!moduleId || !pathId) {
          // cannot persist without moduleId/pathId
          return;
        }

        // Check if quiz already exists
        const existing = await tx
          .select({ qid: quiz.quizId })
          .from(quiz)
          .where(and(eq(quiz.moduleId, moduleId), eq(quiz.pathId, pathId), eq(quiz.title, item.moduleTitle)))
          .limit(1);

        let quizId: number;
        if (existing.length > 0 && existing[0].qid) {
          quizId = existing[0].qid as number;
        } else {
          const insert = await tx.insert(quiz).values({ moduleId, pathId, lessonIndex: item.lessonIndex ?? null, title: item.moduleTitle, description: null, metadata: {} }).returning({ quizId: quiz.quizId });
          quizId = (insert as any)[0].quizId as number;
        }

        // Upsert questions: simple approach: skip duplicates by exact prompt match.
        for (const q of item.questions ?? []) {
          const found = await tx.select({ qid: quizQuestion.questionId }).from(quizQuestion).where(and(eq(quizQuestion.quizId, quizId), eq(quizQuestion.prompt, q.prompt))).limit(1);
          if (found.length > 0 && found[0].qid) continue;

          await tx.insert(quizQuestion).values({ quizId, prompt: q.prompt, questionType: q.type ?? null, choices: q.choices ?? null, answer: q.answer ?? null, explanation: null, metadata: {} });
        }
      });
    } catch (err) {
      console.warn("quizPersistenceNode: failed to persist quiz item", err);
    }
  }

  return {};
};

export default quizPersistenceNode;
