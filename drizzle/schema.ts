import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Mastery progress — one row per user per content item.
 * Stores SRS state, confidence, review history.
 */
export const masteryProgress = mysqlTable("mastery_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  itemKey: varchar("itemKey", { length: 255 }).notNull(),
  seen: boolean("seen").default(false).notNull(),
  mastered: boolean("mastered").default(false).notNull(),
  confidence: int("confidence").default(0).notNull(),
  reviewCount: int("reviewCount").default(0).notNull(),
  lastReviewed: bigint("lastReviewed", { mode: "number" }).default(0).notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).default(0).notNull(),
});

export type MasteryProgressRow = typeof masteryProgress.$inferSelect;
export type InsertMasteryProgress = typeof masteryProgress.$inferInsert;

/**
 * Study sessions — records each study session for analytics.
 */
export const studySessions = mysqlTable("study_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  discipline: varchar("discipline", { length: 255 }),
  duration: int("duration").default(0).notNull(),
  itemsStudied: int("itemsStudied").default(0).notNull(),
  itemsMastered: int("itemsMastered").default(0).notNull(),
  quizScore: int("quizScore").default(0),
  quizTotal: int("quizTotal").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type StudySessionRow = typeof studySessions.$inferSelect;
export type InsertStudySession = typeof studySessions.$inferInsert;

/**
 * User achievements — tracks unlocked achievements per user.
 */
export const userAchievements = mysqlTable("user_achievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  achievementId: varchar("achievementId", { length: 128 }).notNull(),
  unlockedAt: timestamp("unlockedAt").defaultNow().notNull(),
});

export type UserAchievementRow = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;

/**
 * User settings — stores preferences like daily goals, TTS settings, etc.
 */
export const userSettings = mysqlTable("user_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  settingKey: varchar("settingKey", { length: 128 }).notNull(),
  settingValue: text("settingValue"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSettingRow = typeof userSettings.$inferSelect;
export type InsertUserSetting = typeof userSettings.$inferInsert;

/**
 * AI-generated quiz questions — cached for reuse.
 */
export const aiQuizQuestions = mysqlTable("ai_quiz_questions", {
  id: int("id").autoincrement().primaryKey(),
  discipline: varchar("discipline", { length: 255 }).notNull(),
  topic: varchar("topic", { length: 512 }),
  difficulty: varchar("difficulty", { length: 32 }).default("medium").notNull(),
  questionType: varchar("questionType", { length: 64 }).notNull(),
  questionText: text("questionText").notNull(),
  options: json("options"),
  correctAnswer: text("correctAnswer").notNull(),
  explanation: text("explanation"),
  sourceItemKey: varchar("sourceItemKey", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiQuizQuestionRow = typeof aiQuizQuestions.$inferSelect;
export type InsertAiQuizQuestion = typeof aiQuizQuestions.$inferInsert;
