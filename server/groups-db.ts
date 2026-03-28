/**
 * Database helpers for collaborative study groups.
 */
import { eq, and, desc, inArray } from "drizzle-orm";
import { getDb } from "./db";
import {
  studyGroups,
  groupMembers,
  sharedQuizzes,
  quizChallenges,
  challengeResults,
  users,
  type InsertStudyGroup,
  type InsertGroupMember,
  type InsertSharedQuiz,
  type InsertQuizChallenge,
  type InsertChallengeResult,
} from "../drizzle/schema";

/* ── Study Groups ── */

export async function createGroup(group: InsertStudyGroup) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(studyGroups).values(group);
  return result[0]?.insertId;
}

export async function getGroupById(groupId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(studyGroups).where(eq(studyGroups.id, groupId)).limit(1);
  return rows[0] ?? null;
}

export async function getGroupByInviteCode(code: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(studyGroups).where(eq(studyGroups.inviteCode, code)).limit(1);
  return rows[0] ?? null;
}

export async function getUserGroups(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const memberships = await db.select().from(groupMembers).where(eq(groupMembers.userId, userId));
  if (memberships.length === 0) return [];
  const groupIds = memberships.map(m => m.groupId);
  const groups = await db.select().from(studyGroups).where(inArray(studyGroups.id, groupIds));
  return groups.map(g => ({
    ...g,
    memberRole: memberships.find(m => m.groupId === g.id)?.role ?? 'member',
  }));
}

export async function getPublicGroups(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(studyGroups).where(eq(studyGroups.isPublic, true)).orderBy(desc(studyGroups.createdAt)).limit(limit);
}

export async function updateGroup(groupId: number, data: { name?: string; description?: string; isPublic?: boolean; maxMembers?: number }) {
  const db = await getDb();
  if (!db) return;
  await db.update(studyGroups).set(data).where(eq(studyGroups.id, groupId));
}

export async function deleteGroup(groupId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(challengeResults).where(
    inArray(challengeResults.challengeId,
      db.select({ id: quizChallenges.id }).from(quizChallenges).where(eq(quizChallenges.groupId, groupId))
    )
  );
  await db.delete(quizChallenges).where(eq(quizChallenges.groupId, groupId));
  await db.delete(sharedQuizzes).where(eq(sharedQuizzes.groupId, groupId));
  await db.delete(groupMembers).where(eq(groupMembers.groupId, groupId));
  await db.delete(studyGroups).where(eq(studyGroups.id, groupId));
}

/* ── Group Members ── */

export async function addMember(member: InsertGroupMember) {
  const db = await getDb();
  if (!db) return;
  // Check if already a member
  const existing = await db.select().from(groupMembers)
    .where(and(eq(groupMembers.groupId, member.groupId!), eq(groupMembers.userId, member.userId!)));
  if (existing.length > 0) return;
  await db.insert(groupMembers).values(member);
}

export async function removeMember(groupId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(groupMembers).where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
}

export async function getGroupMembers(groupId: number) {
  const db = await getDb();
  if (!db) return [];
  const members = await db.select().from(groupMembers).where(eq(groupMembers.groupId, groupId));
  if (members.length === 0) return [];
  const userIds = members.map(m => m.userId);
  const userRows = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(inArray(users.id, userIds));
  return members.map(m => ({
    ...m,
    user: userRows.find(u => u.id === m.userId) ?? { id: m.userId, name: 'Unknown', email: null },
  }));
}

export async function getMemberCount(groupId: number) {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select().from(groupMembers).where(eq(groupMembers.groupId, groupId));
  return rows.length;
}

/* ── Shared Quizzes ── */

export async function createSharedQuiz(quiz: InsertSharedQuiz) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(sharedQuizzes).values(quiz);
  return result[0]?.insertId;
}

export async function getGroupQuizzes(groupId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(sharedQuizzes).where(eq(sharedQuizzes.groupId, groupId)).orderBy(desc(sharedQuizzes.createdAt));
}

/* ── Challenges ── */

export async function createChallenge(challenge: InsertQuizChallenge) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(quizChallenges).values(challenge);
  return result[0]?.insertId;
}

export async function getGroupChallenges(groupId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quizChallenges).where(eq(quizChallenges.groupId, groupId)).orderBy(desc(quizChallenges.createdAt));
}

export async function submitChallengeResult(result: InsertChallengeResult) {
  const db = await getDb();
  if (!db) return;
  await db.insert(challengeResults).values(result);
}

export async function getChallengeResults(challengeId: number) {
  const db = await getDb();
  if (!db) return [];
  const results = await db.select().from(challengeResults).where(eq(challengeResults.challengeId, challengeId)).orderBy(desc(challengeResults.score));
  if (results.length === 0) return [];
  const userIds = results.map(r => r.userId);
  const userRows = await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, userIds));
  return results.map(r => ({
    ...r,
    userName: userRows.find(u => u.id === r.userId)?.name ?? 'Unknown',
  }));
}
