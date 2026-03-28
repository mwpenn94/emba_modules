/**
 * Database helpers for mastery progress, study sessions, achievements, and settings.
 */
import { eq, and, inArray } from "drizzle-orm";
import { getDb } from "./db";
import {
  masteryProgress,
  studySessions,
  userAchievements,
  userSettings,
  aiQuizQuestions,
  type InsertMasteryProgress,
  type InsertStudySession,
  type InsertUserAchievement,
  type InsertAiQuizQuestion,
} from "../drizzle/schema";

/* ── Mastery Progress ── */

export async function getUserMastery(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(masteryProgress).where(eq(masteryProgress.userId, userId));
}

export async function upsertMasteryBatch(
  userId: number,
  items: Array<{
    itemKey: string;
    seen: boolean;
    mastered: boolean;
    confidence: number;
    reviewCount: number;
    lastReviewed: number;
    updatedAt: number;
  }>
) {
  const db = await getDb();
  if (!db || items.length === 0) return;

  // Process in batches of 50 to avoid query size limits
  for (let i = 0; i < items.length; i += 50) {
    const batch = items.slice(i, i + 50);
    for (const item of batch) {
      await db
        .insert(masteryProgress)
        .values({
          userId,
          itemKey: item.itemKey,
          seen: item.seen,
          mastered: item.mastered,
          confidence: item.confidence,
          reviewCount: item.reviewCount,
          lastReviewed: item.lastReviewed,
          updatedAt: item.updatedAt,
        })
        .onDuplicateKeyUpdate({
          set: {
            seen: item.seen,
            mastered: item.mastered,
            confidence: item.confidence,
            reviewCount: item.reviewCount,
            lastReviewed: item.lastReviewed,
            updatedAt: item.updatedAt,
          },
        });
    }
  }
}

/* ── Study Sessions ── */

export async function getUserStudySessions(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(studySessions)
    .where(eq(studySessions.userId, userId))
    .orderBy(studySessions.createdAt)
    .limit(limit);
}

export async function insertStudySession(session: InsertStudySession) {
  const db = await getDb();
  if (!db) return;
  await db.insert(studySessions).values(session);
}

/* ── Achievements ── */

export async function getUserAchievements(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userAchievements).where(eq(userAchievements.userId, userId));
}

export async function insertAchievement(achievement: InsertUserAchievement) {
  const db = await getDb();
  if (!db) return;
  // Avoid duplicates
  const existing = await db
    .select()
    .from(userAchievements)
    .where(
      and(
        eq(userAchievements.userId, achievement.userId),
        eq(userAchievements.achievementId, achievement.achievementId)
      )
    );
  if (existing.length === 0) {
    await db.insert(userAchievements).values(achievement);
  }
}

export async function insertAchievementsBatch(userId: number, achievementIds: string[]) {
  const db = await getDb();
  if (!db || achievementIds.length === 0) return;
  const existing = await db
    .select()
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));
  const existingIds = new Set(existing.map(a => a.achievementId));
  const newIds = achievementIds.filter(id => !existingIds.has(id));
  for (const id of newIds) {
    await db.insert(userAchievements).values({ userId, achievementId: id });
  }
}

/* ── User Settings ── */

export async function getUserSettings(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userSettings).where(eq(userSettings.userId, userId));
}

export async function upsertUserSetting(userId: number, key: string, value: string) {
  const db = await getDb();
  if (!db) return;
  const existing = await db
    .select()
    .from(userSettings)
    .where(and(eq(userSettings.userId, userId), eq(userSettings.settingKey, key)));
  if (existing.length > 0) {
    await db
      .update(userSettings)
      .set({ settingValue: value })
      .where(and(eq(userSettings.userId, userId), eq(userSettings.settingKey, key)));
  } else {
    await db.insert(userSettings).values({ userId, settingKey: key, settingValue: value });
  }
}

/* ── AI Quiz Questions ── */

export async function getQuizQuestions(discipline: string, difficulty: string, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(aiQuizQuestions)
    .where(
      and(
        eq(aiQuizQuestions.discipline, discipline),
        eq(aiQuizQuestions.difficulty, difficulty)
      )
    )
    .limit(limit);
}

export async function insertQuizQuestion(question: InsertAiQuizQuestion) {
  const db = await getDb();
  if (!db) return;
  await db.insert(aiQuizQuestions).values(question);
}

export async function insertQuizQuestionsBatch(questions: InsertAiQuizQuestion[]) {
  const db = await getDb();
  if (!db || questions.length === 0) return;
  for (const q of questions) {
    await db.insert(aiQuizQuestions).values(q);
  }
}
