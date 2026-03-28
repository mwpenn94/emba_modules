import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getUserMastery,
  upsertMasteryBatch,
  getUserStudySessions,
  insertStudySession,
  getUserAchievements,
  insertAchievementsBatch,
  getUserSettings,
  upsertUserSetting,
  getQuizQuestions,
  insertQuizQuestionsBatch,
} from "./mastery-db";
import { invokeLLM } from "./_core/llm";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  /* ── Cloud Progress Sync ── */
  mastery: router({
    /** Get all mastery progress for the current user */
    getAll: protectedProcedure.query(async ({ ctx }) => {
      const rows = await getUserMastery(ctx.user.id);
      return rows;
    }),

    /** Batch upsert mastery items (client sends changed items) */
    syncBatch: protectedProcedure
      .input(
        z.object({
          items: z.array(
            z.object({
              itemKey: z.string(),
              seen: z.boolean(),
              mastered: z.boolean(),
              confidence: z.number().min(0).max(5),
              reviewCount: z.number().min(0),
              lastReviewed: z.number(),
              updatedAt: z.number(),
            })
          ),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await upsertMasteryBatch(ctx.user.id, input.items);
        return { synced: input.items.length };
      }),
  }),

  sessions: router({
    /** Get recent study sessions */
    list: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(200).optional() }).optional())
      .query(async ({ ctx, input }) => {
        return getUserStudySessions(ctx.user.id, input?.limit ?? 50);
      }),

    /** Record a study session */
    create: protectedProcedure
      .input(
        z.object({
          discipline: z.string().optional(),
          duration: z.number().min(0),
          itemsStudied: z.number().min(0),
          itemsMastered: z.number().min(0),
          quizScore: z.number().optional(),
          quizTotal: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await insertStudySession({
          userId: ctx.user.id,
          discipline: input.discipline ?? null,
          duration: input.duration,
          itemsStudied: input.itemsStudied,
          itemsMastered: input.itemsMastered,
          quizScore: input.quizScore ?? null,
          quizTotal: input.quizTotal ?? null,
        });
        return { success: true };
      }),
  }),

  achievements: router({
    /** Get all unlocked achievements */
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserAchievements(ctx.user.id);
    }),

    /** Sync newly unlocked achievements */
    syncBatch: protectedProcedure
      .input(z.object({ achievementIds: z.array(z.string()) }))
      .mutation(async ({ ctx, input }) => {
        await insertAchievementsBatch(ctx.user.id, input.achievementIds);
        return { synced: input.achievementIds.length };
      }),
  }),

  settings: router({
    /** Get all user settings */
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserSettings(ctx.user.id);
    }),

    /** Set a single setting */
    set: protectedProcedure
      .input(z.object({ key: z.string(), value: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await upsertUserSetting(ctx.user.id, input.key, input.value);
        return { success: true };
      }),
  }),

  /* ── AI-Powered Quiz Generation ── */
  aiQuiz: router({
    /** Generate new questions using LLM */
    generate: protectedProcedure
      .input(
        z.object({
          discipline: z.string(),
          topic: z.string().optional(),
          difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
          count: z.number().min(1).max(10).default(5),
          questionType: z.enum(["multiple_choice", "fill_blank", "scenario", "explain"]).default("multiple_choice"),
          context: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const typeInstructions: Record<string, string> = {
          multiple_choice: 'Generate multiple-choice questions with exactly 4 options (A, B, C, D). One must be correct.',
          fill_blank: 'Generate fill-in-the-blank questions where a key term or concept is replaced with "___".',
          scenario: 'Generate scenario-based questions that present a real-world business situation requiring analysis.',
          explain: 'Generate open-ended questions asking the student to explain a concept, its significance, and practical applications.',
        };

        const prompt = `You are an expert EMBA professor creating assessment questions.

Discipline: ${input.discipline}
${input.topic ? `Topic: ${input.topic}` : ''}
Difficulty: ${input.difficulty}
Question Type: ${input.questionType}
Number of Questions: ${input.count}

${typeInstructions[input.questionType]}

${input.context ? `Additional context for question generation:\n${input.context}` : ''}

Requirements:
- Questions should test understanding and application, not just recall
- Include financial services applications where relevant
- Each question should have a detailed explanation of the correct answer
- For multiple choice, make distractors plausible but clearly wrong upon analysis
- Difficulty levels: easy = definition/recall, medium = application/analysis, hard = synthesis/evaluation

Return a JSON array of questions. Each question object must have:
- "questionText": the question stem
- "options": array of {text, isCorrect} objects (for MC) or null (for fill_blank/explain)
- "correctAnswer": the correct answer text
- "explanation": detailed explanation connecting to EMBA concepts`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are an expert EMBA assessment creator. Always respond with valid JSON." },
            { role: "user", content: prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "quiz_questions",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        questionText: { type: "string" },
                        options: {
                          type: ["array", "null"],
                          items: {
                            type: "object",
                            properties: {
                              text: { type: "string" },
                              isCorrect: { type: "boolean" },
                            },
                            required: ["text", "isCorrect"],
                            additionalProperties: false,
                          },
                        },
                        correctAnswer: { type: "string" },
                        explanation: { type: "string" },
                      },
                      required: ["questionText", "options", "correctAnswer", "explanation"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["questions"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        if (!content || typeof content !== "string") {
          throw new Error("LLM returned empty response");
        }

        const parsed = JSON.parse(content);
        const questions = parsed.questions || [];

        // Cache generated questions in database
        const dbQuestions = questions.map((q: any) => ({
          discipline: input.discipline,
          topic: input.topic ?? null,
          difficulty: input.difficulty,
          questionType: input.questionType,
          questionText: q.questionText,
          options: q.options ? JSON.stringify(q.options) : null,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation ?? null,
          sourceItemKey: null,
        }));

        try {
          await insertQuizQuestionsBatch(dbQuestions);
        } catch (e) {
          console.warn("[AI Quiz] Failed to cache questions:", e);
        }

        return { questions };
      }),

    /** Get cached questions */
    getCached: protectedProcedure
      .input(
        z.object({
          discipline: z.string(),
          difficulty: z.string().default("medium"),
          limit: z.number().min(1).max(50).default(10),
        })
      )
      .query(async ({ input }) => {
        const rows = await getQuizQuestions(input.discipline, input.difficulty, input.limit);
        return rows.map(r => ({
          ...r,
          options: typeof r.options === "string" ? JSON.parse(r.options) : r.options,
        }));
      }),
  }),
});

export type AppRouter = typeof appRouter;
