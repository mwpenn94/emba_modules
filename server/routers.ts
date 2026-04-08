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
  getUserBookmarks,
  getBookmarksByType,
  createBookmark,
  updateBookmarkNote,
  deleteBookmark,
  isBookmarked,
} from "./mastery-db";
import { invokeLLM } from "./_core/llm";
import {
  createGroup,
  getGroupById,
  getGroupByInviteCode,
  getUserGroups,
  getPublicGroups,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  getGroupMembers,
  getMemberCount,
  createSharedQuiz,
  getGroupQuizzes,
  createChallenge,
  getGroupChallenges,
  submitChallengeResult,
  getChallengeResults,
} from "./groups-db";
import {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  getPublicPlaylists,
  updatePlaylist,
  deletePlaylist,
  getPlaylistItems,
  addPlaylistItem,
  removePlaylistItem,
  reorderPlaylistItems,
  getPlaylistItemCount,
} from "./playlists-db";
import {
  setPlaylistShareToken,
  getPlaylistByShareToken,
  createPlaylistShare,
  getPlaylistShares,
  updateSharePermission,
  deletePlaylistShare,
  getSharesForUser,
  getPublicPlaylistData,
} from "./playlist-shares-db";
import {
  createShareInvite,
  getPendingInvites,
  revokeShareInvite,
  acceptPendingInvites,
} from "./invite-db";
import {
  saveDiscoveryEntry,
  getDiscoveryHistory,
  deleteDiscoveryEntry,
  clearDiscoveryHistory,
} from "./discovery-db";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { adminRouter } from "./routers/admin";

export const appRouter = router({
  system: systemRouter,
  admin: adminRouter,
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

  /* ── Collaborative Study Groups ── */
  groups: router({
    /** List user's groups */
    myGroups: protectedProcedure.query(async ({ ctx }) => {
      return getUserGroups(ctx.user.id);
    }),

    /** List public groups to discover */
    discover: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(20) }).optional())
      .query(async ({ input }) => {
        return getPublicGroups(input?.limit ?? 20);
      }),

    /** Get group details with members */
    getById: protectedProcedure
      .input(z.object({ groupId: z.number() }))
      .query(async ({ ctx, input }) => {
        const group = await getGroupById(input.groupId);
        if (!group) throw new TRPCError({ code: 'NOT_FOUND', message: 'Group not found' });
        const members = await getGroupMembers(input.groupId);
        const quizzes = await getGroupQuizzes(input.groupId);
        const challenges = await getGroupChallenges(input.groupId);
        return { group, members, quizzes, challenges };
      }),

    /** Create a new study group */
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        description: z.string().max(1000).optional(),
        isPublic: z.boolean().default(true),
        maxMembers: z.number().min(2).max(200).default(50),
      }))
      .mutation(async ({ ctx, input }) => {
        const inviteCode = nanoid(8);
        const groupId = await createGroup({
          name: input.name,
          description: input.description ?? null,
          inviteCode,
          ownerId: ctx.user.id,
          isPublic: input.isPublic,
          maxMembers: input.maxMembers,
        });
        if (!groupId) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create group' });
        // Add creator as owner member
        await addMember({ groupId, userId: ctx.user.id, role: 'owner' });
        return { groupId, inviteCode };
      }),

    /** Join a group by invite code */
    join: protectedProcedure
      .input(z.object({ inviteCode: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const group = await getGroupByInviteCode(input.inviteCode);
        if (!group) throw new TRPCError({ code: 'NOT_FOUND', message: 'Invalid invite code' });
        const count = await getMemberCount(group.id);
        if (count >= group.maxMembers) throw new TRPCError({ code: 'FORBIDDEN', message: 'Group is full' });
        await addMember({ groupId: group.id, userId: ctx.user.id, role: 'member' });
        return { groupId: group.id, name: group.name };
      }),

    /** Leave a group */
    leave: protectedProcedure
      .input(z.object({ groupId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const group = await getGroupById(input.groupId);
        if (!group) throw new TRPCError({ code: 'NOT_FOUND' });
        if (group.ownerId === ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN', message: 'Owner cannot leave. Transfer ownership or delete the group.' });
        await removeMember(input.groupId, ctx.user.id);
        return { success: true };
      }),

    /** Update group (owner only) */
    update: protectedProcedure
      .input(z.object({
        groupId: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().max(1000).optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const group = await getGroupById(input.groupId);
        if (!group || group.ownerId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });
        const { groupId, ...data } = input;
        await updateGroup(groupId, data);
        return { success: true };
      }),

    /** Delete group (owner only) */
    delete: protectedProcedure
      .input(z.object({ groupId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const group = await getGroupById(input.groupId);
        if (!group || group.ownerId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });
        await deleteGroup(input.groupId);
        return { success: true };
      }),

    /** Share a quiz to the group */
    shareQuiz: protectedProcedure
      .input(z.object({
        groupId: z.number(),
        title: z.string().min(1).max(255),
        discipline: z.string(),
        difficulty: z.string().default('medium'),
        questionIds: z.array(z.number()),
        timeLimit: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const quizId = await createSharedQuiz({
          groupId: input.groupId,
          creatorId: ctx.user.id,
          title: input.title,
          discipline: input.discipline,
          difficulty: input.difficulty,
          questionIds: input.questionIds,
          timeLimit: input.timeLimit ?? null,
        });
        return { quizId };
      }),

    /** Create a challenge from a shared quiz */
    createChallenge: protectedProcedure
      .input(z.object({
        sharedQuizId: z.number(),
        groupId: z.number(),
        endsAt: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const challengeId = await createChallenge({
          sharedQuizId: input.sharedQuizId,
          groupId: input.groupId,
          challengerId: ctx.user.id,
          status: 'open',
          endsAt: input.endsAt ? new Date(input.endsAt) : null,
        });
        return { challengeId };
      }),

    /** Submit a challenge result */
    submitResult: protectedProcedure
      .input(z.object({
        challengeId: z.number(),
        score: z.number().min(0),
        totalQuestions: z.number().min(1),
        timeTaken: z.number().min(0),
      }))
      .mutation(async ({ ctx, input }) => {
        await submitChallengeResult({
          challengeId: input.challengeId,
          userId: ctx.user.id,
          score: input.score,
          totalQuestions: input.totalQuestions,
          completedAt: new Date(),
          timeTaken: input.timeTaken,
        });
        return { success: true };
      }),

    /** Get challenge leaderboard */
    leaderboard: protectedProcedure
      .input(z.object({ challengeId: z.number() }))
      .query(async ({ input }) => {
        return getChallengeResults(input.challengeId);
      }),
  }),

  /* ── Content Bookmarks ── */
  bookmarks: router({
    /** Get all user bookmarks */
    list: protectedProcedure
      .input(z.object({ contentType: z.string().optional() }).optional())
      .query(async ({ ctx, input }) => {
        if (input?.contentType) {
          return getBookmarksByType(ctx.user.id, input.contentType);
        }
        return getUserBookmarks(ctx.user.id);
      }),

    /** Check if content is bookmarked */
    check: protectedProcedure
      .input(z.object({ contentType: z.string(), contentId: z.string() }))
      .query(async ({ ctx, input }) => {
        const result = await isBookmarked(ctx.user.id, input.contentType, input.contentId);
        return { bookmarked: !!result, bookmark: result };
      }),

    /** Create or update a bookmark */
    create: protectedProcedure
      .input(z.object({
        contentType: z.string(),
        contentId: z.string(),
        contentTitle: z.string(),
        discipline: z.string().optional(),
        note: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createBookmark({
          userId: ctx.user.id,
          contentType: input.contentType,
          contentId: input.contentId,
          contentTitle: input.contentTitle,
          discipline: input.discipline ?? null,
          note: input.note ?? null,
        });
        return { id };
      }),

    /** Update bookmark note */
    updateNote: protectedProcedure
      .input(z.object({
        bookmarkId: z.number(),
        note: z.string().nullable(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateBookmarkNote(input.bookmarkId, ctx.user.id, input.note);
        return { success: true };
      }),

    /** Delete a bookmark */
    delete: protectedProcedure
      .input(z.object({ bookmarkId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteBookmark(input.bookmarkId, ctx.user.id);
        return { success: true };
      }),
  }),

  /* ── Custom Study Playlists ── */
  playlists: router({
    /** List user's playlists */
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserPlaylists(ctx.user.id);
    }),

    /** Discover public playlists */
    discover: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(20) }).optional())
      .query(async ({ input }) => {
        return getPublicPlaylists(input?.limit ?? 20);
      }),

    /** Get playlist with items */
    getById: protectedProcedure
      .input(z.object({ playlistId: z.number() }))
      .query(async ({ input }) => {
        const playlist = await getPlaylistById(input.playlistId);
        if (!playlist) throw new TRPCError({ code: 'NOT_FOUND', message: 'Playlist not found' });
        const items = await getPlaylistItems(input.playlistId);
        return { playlist, items };
      }),

    /** Create a new playlist */
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        description: z.string().max(1000).optional(),
        isPublic: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createPlaylist({
          userId: ctx.user.id,
          name: input.name,
          description: input.description ?? null,
          isPublic: input.isPublic,
        });
        return { id };
      }),

    /** Update a playlist */
    update: protectedProcedure
      .input(z.object({
        playlistId: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().max(1000).optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const playlist = await getPlaylistById(input.playlistId);
        if (!playlist || playlist.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });
        const { playlistId, ...data } = input;
        await updatePlaylist(playlistId, data);
        return { success: true };
      }),

    /** Delete a playlist */
    delete: protectedProcedure
      .input(z.object({ playlistId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const playlist = await getPlaylistById(input.playlistId);
        if (!playlist || playlist.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });
        await deletePlaylist(input.playlistId);
        return { success: true };
      }),

    /** Add an item to a playlist */
    addItem: protectedProcedure
      .input(z.object({
        playlistId: z.number(),
        contentType: z.string(),
        contentId: z.string(),
        contentTitle: z.string(),
        discipline: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const playlist = await getPlaylistById(input.playlistId);
        if (!playlist || playlist.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });
        const count = await getPlaylistItemCount(input.playlistId);
        const id = await addPlaylistItem({
          playlistId: input.playlistId,
          contentType: input.contentType,
          contentId: input.contentId,
          contentTitle: input.contentTitle,
          discipline: input.discipline ?? null,
          sortOrder: count,
        });
        return { id };
      }),

    /** Remove an item from a playlist */
    removeItem: protectedProcedure
      .input(z.object({ itemId: z.number(), playlistId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const playlist = await getPlaylistById(input.playlistId);
        if (!playlist || playlist.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });
        await removePlaylistItem(input.itemId);
        return { success: true };
      }),

    /** Reorder items in a playlist */
    reorder: protectedProcedure
      .input(z.object({
        playlistId: z.number(),
        itemIds: z.array(z.number()),
      }))
      .mutation(async ({ ctx, input }) => {
        const playlist = await getPlaylistById(input.playlistId);
        if (!playlist || playlist.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });
        await reorderPlaylistItems(input.playlistId, input.itemIds);
        return { success: true };
      }),

    /* ── Shareable Links ── */

    /** Generate or regenerate a share token for a playlist */
    generateShareToken: protectedProcedure
      .input(z.object({ playlistId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const playlist = await getPlaylistById(input.playlistId);
        if (!playlist || playlist.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });
        const token = nanoid(16);
        await setPlaylistShareToken(input.playlistId, token);
        return { shareToken: token };
      }),

    /** Revoke a share token */
    revokeShareToken: protectedProcedure
      .input(z.object({ playlistId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const playlist = await getPlaylistById(input.playlistId);
        if (!playlist || playlist.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });
        await setPlaylistShareToken(input.playlistId, null);
        return { success: true };
      }),

    /** Get share access list for a playlist (owner only) */
    getShares: protectedProcedure
      .input(z.object({ playlistId: z.number() }))
      .query(async ({ ctx, input }) => {
        const playlist = await getPlaylistById(input.playlistId);
        if (!playlist || playlist.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });
        return getPlaylistShares(input.playlistId);
      }),

    /** Grant share access to a user */
    grantAccess: protectedProcedure
      .input(z.object({
        playlistId: z.number(),
        sharedWithUserId: z.number(),
        permission: z.enum(['view', 'edit']).default('view'),
      }))
      .mutation(async ({ ctx, input }) => {
        const playlist = await getPlaylistById(input.playlistId);
        if (!playlist || playlist.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });
        const id = await createPlaylistShare({
          playlistId: input.playlistId,
          sharedWithUserId: input.sharedWithUserId,
          permission: input.permission,
          grantedBy: ctx.user.id,
        });
        return { id };
      }),

    /** Update share permission */
    updateSharePermission: protectedProcedure
      .input(z.object({
        playlistId: z.number(),
        shareId: z.number(),
        permission: z.enum(['view', 'edit']),
      }))
      .mutation(async ({ ctx, input }) => {
        const playlist = await getPlaylistById(input.playlistId);
        if (!playlist || playlist.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });
        await updateSharePermission(input.shareId, input.permission);
        return { success: true };
      }),

    /** Revoke share access */
    revokeAccess: protectedProcedure
      .input(z.object({
        playlistId: z.number(),
        shareId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const playlist = await getPlaylistById(input.playlistId);
        if (!playlist || playlist.userId !== ctx.user.id) throw new TRPCError({ code: 'FORBIDDEN' });
        await deletePlaylistShare(input.shareId);
        return { success: true };
      }),

    /** Get playlists shared with the current user */
    sharedWithMe: protectedProcedure.query(async ({ ctx }) => {
      return getSharesForUser(ctx.user.id);
    }),

    /** Get public playlist data by share token (no auth required) */
    getByShareToken: publicProcedure
      .input(z.object({ shareToken: z.string() }))
      .query(async ({ input }) => {
        const data = await getPublicPlaylistData(input.shareToken);
        if (!data) throw new TRPCError({ code: 'NOT_FOUND', message: 'Shared playlist not found' });
        return data;
      }),

    /** Send an email-based share invite */
    sendInvite: protectedProcedure
      .input(
        z.object({
          playlistId: z.number().min(1),
          email: z.string().email(),
          permission: z.enum(["view", "edit"]).default("view"),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const playlist = await getPlaylistById(input.playlistId);
        if (!playlist || playlist.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only the playlist owner can send invites" });
        }
        // Don't allow inviting yourself
        if (input.email.toLowerCase() === ctx.user.email?.toLowerCase()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot invite yourself" });
        }
        const result = await createShareInvite({
          playlistId: input.playlistId,
          invitedEmail: input.email.toLowerCase(),
          permission: input.permission,
          invitedBy: ctx.user.id,
        });
        if (result?.alreadyExists) {
          return { success: true, message: "Invite already sent to this email" };
        }
        return { success: true, message: "Invite sent successfully" };
      }),

    /** List pending invites for a playlist */
    listInvites: protectedProcedure
      .input(z.object({ playlistId: z.number().min(1) }))
      .query(async ({ ctx, input }) => {
        const playlist = await getPlaylistById(input.playlistId);
        if (!playlist || playlist.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only the playlist owner can view invites" });
        }
        return getPendingInvites(input.playlistId);
      }),

    /** Revoke a pending invite */
    revokeInvite: protectedProcedure
      .input(z.object({ playlistId: z.number().min(1), inviteId: z.number().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const playlist = await getPlaylistById(input.playlistId);
        if (!playlist || playlist.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only the playlist owner can revoke invites" });
        }
        await revokeShareInvite(input.inviteId);
        return { success: true };
      }),

    /** Accept pending invites for current user (called on login/page load) */
    acceptInvites: protectedProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user.email) return { accepted: 0 };
      const accepted = await acceptPendingInvites(ctx.user.id, ctx.user.email);
      return { accepted };
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

        const prompt = `You are an expert professor creating assessment questions.

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
- "explanation": detailed explanation connecting to key concepts`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are an expert assessment creator. Always respond with valid JSON." },
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

  /* ── Continuous Self-Discovery ── */
  selfDiscovery: router({
    /** Generate a deeper follow-up question based on last studied topic */
    generateFollowUp: protectedProcedure
      .input(
        z.object({
          lastTopic: z.string(),
          discipline: z.string().optional(),
          context: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const prompt = `You are a Socratic tutor. The student just studied the following topic:

Topic: ${input.lastTopic}
${input.discipline ? `Discipline: ${input.discipline}` : ''}
${input.context ? `Context: ${input.context}` : ''}

Generate ONE thought-provoking follow-up question that:
1. Goes deeper into the topic or connects it to a related concept
2. Encourages critical thinking and application to real business scenarios
3. Is concise (1-2 sentences)
4. Includes a brief hint about where to explore the answer

Also suggest 1-2 related content areas the student should explore next.

Return JSON with:
- "question": the follow-up question text
- "hint": a brief hint or starting point for thinking about the answer
- "relatedTopics": array of {"topic": string, "discipline": string} objects to explore next
- "difficulty": "foundational" | "intermediate" | "advanced" based on depth`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a Socratic tutor. Always respond with valid JSON." },
            { role: "user", content: prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "follow_up_question",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  hint: { type: "string" },
                  relatedTopics: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        topic: { type: "string" },
                        discipline: { type: "string" },
                      },
                      required: ["topic", "discipline"],
                      additionalProperties: false,
                    },
                  },
                  difficulty: {
                    type: "string",
                    enum: ["foundational", "intermediate", "advanced"],
                  },
                },
                required: ["question", "hint", "relatedTopics", "difficulty"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices?.[0]?.message?.content;
        if (!content || typeof content !== 'string') throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to generate follow-up' });

        const parsed = JSON.parse(content);

        // Auto-save to discovery history
        await saveDiscoveryEntry({
          userId: ctx.user.id,
          topic: input.lastTopic,
          discipline: input.discipline ?? null,
          question: parsed.question,
          hint: parsed.hint,
          difficulty: parsed.difficulty,
          relatedTopics: parsed.relatedTopics,
        });

        return parsed;
      }),

    /** Get discovery history for the current user */
    history: protectedProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        }).optional()
      )
      .query(async ({ ctx, input }) => {
        return getDiscoveryHistory(ctx.user.id, {
          limit: input?.limit ?? 50,
          offset: input?.offset ?? 0,
        });
      }),

    /** Delete a single discovery entry */
    deleteEntry: protectedProcedure
      .input(z.object({ entryId: z.number().min(1) }))
      .mutation(async ({ ctx, input }) => {
        await deleteDiscoveryEntry(input.entryId, ctx.user.id);
        return { success: true };
      }),

    /** Clear all discovery history */
    clearHistory: protectedProcedure.mutation(async ({ ctx }) => {
      await clearDiscoveryHistory(ctx.user.id);
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
