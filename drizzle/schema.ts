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

/**
 * Study groups — collaborative study spaces.
 */
export const studyGroups = mysqlTable("study_groups", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  inviteCode: varchar("inviteCode", { length: 32 }).notNull().unique(),
  ownerId: int("ownerId").notNull(),
  isPublic: boolean("isPublic").default(true).notNull(),
  maxMembers: int("maxMembers").default(50).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudyGroupRow = typeof studyGroups.$inferSelect;
export type InsertStudyGroup = typeof studyGroups.$inferInsert;

/**
 * Group members — tracks membership in study groups.
 */
export const groupMembers = mysqlTable("group_members", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("memberRole", ["owner", "admin", "member"]).default("member").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type GroupMemberRow = typeof groupMembers.$inferSelect;
export type InsertGroupMember = typeof groupMembers.$inferInsert;

/**
 * Shared quizzes — quiz sets shared within a group.
 */
export const sharedQuizzes = mysqlTable("shared_quizzes", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  creatorId: int("creatorId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  discipline: varchar("discipline", { length: 255 }).notNull(),
  difficulty: varchar("difficulty", { length: 32 }).default("medium").notNull(),
  questionIds: json("questionIds").notNull(), // array of aiQuizQuestions IDs
  timeLimit: int("timeLimit"), // seconds, null = no limit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SharedQuizRow = typeof sharedQuizzes.$inferSelect;
export type InsertSharedQuiz = typeof sharedQuizzes.$inferInsert;

/**
 * Quiz challenges — timed competitions between group members.
 */
export const quizChallenges = mysqlTable("quiz_challenges", {
  id: int("id").autoincrement().primaryKey(),
  sharedQuizId: int("sharedQuizId").notNull(),
  groupId: int("groupId").notNull(),
  challengerId: int("challengerId").notNull(),
  status: mysqlEnum("challengeStatus", ["open", "active", "completed"]).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  endsAt: timestamp("endsAt"),
});

export type QuizChallengeRow = typeof quizChallenges.$inferSelect;
export type InsertQuizChallenge = typeof quizChallenges.$inferInsert;

/**
 * Challenge results — individual scores for challenge participants.
 */
export const challengeResults = mysqlTable("challenge_results", {
  id: int("id").autoincrement().primaryKey(),
  challengeId: int("challengeId").notNull(),
  userId: int("userId").notNull(),
  score: int("score").default(0).notNull(),
  totalQuestions: int("totalQuestions").default(0).notNull(),
  completedAt: timestamp("completedAt"),
  timeTaken: int("timeTaken"), // seconds
});

export type ChallengeResultRow = typeof challengeResults.$inferSelect;
export type InsertChallengeResult = typeof challengeResults.$inferInsert;

/**
 * Content bookmarks — users can bookmark definitions, formulas, cases, and FS applications with personal notes.
 */
export const bookmarks = mysqlTable("bookmarks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contentType: varchar("contentType", { length: 64 }).notNull(), // "definition", "formula", "case", "fs_application"
  contentId: varchar("contentId", { length: 255 }).notNull(), // unique key for the content item
  contentTitle: varchar("contentTitle", { length: 512 }).notNull(),
  discipline: varchar("discipline", { length: 255 }),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BookmarkRow = typeof bookmarks.$inferSelect;
export type InsertBookmark = typeof bookmarks.$inferInsert;

/**
 * Study playlists — user-curated ordered lists of content items.
 */
export const playlists = mysqlTable("playlists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isPublic: boolean("isPublic").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlaylistRow = typeof playlists.$inferSelect;
export type InsertPlaylist = typeof playlists.$inferInsert;

/**
 * Playlist items — ordered content items within a playlist.
 */
export const playlistItems = mysqlTable("playlist_items", {
  id: int("id").autoincrement().primaryKey(),
  playlistId: int("playlistId").notNull(),
  contentType: varchar("contentType", { length: 64 }).notNull(),
  contentId: varchar("contentId", { length: 255 }).notNull(),
  contentTitle: varchar("contentTitle", { length: 512 }).notNull(),
  discipline: varchar("discipline", { length: 255 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PlaylistItemRow = typeof playlistItems.$inferSelect;
export type InsertPlaylistItem = typeof playlistItems.$inferInsert;
