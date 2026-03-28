import { eq, desc } from "drizzle-orm";
import { getDb } from "./db";
import { discoveryHistory, InsertDiscoveryHistory } from "../drizzle/schema";

/* ── Save Discovery Entry ── */

export async function saveDiscoveryEntry(
  data: Omit<InsertDiscoveryHistory, "id">
) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(discoveryHistory).values(data);
  return result[0]?.insertId ?? null;
}

/* ── Get User's Discovery History ── */

export async function getDiscoveryHistory(
  userId: number,
  opts: { limit?: number; offset?: number } = {}
) {
  const db = await getDb();
  if (!db) return [];
  const { limit = 50, offset = 0 } = opts;
  return db
    .select()
    .from(discoveryHistory)
    .where(eq(discoveryHistory.userId, userId))
    .orderBy(desc(discoveryHistory.createdAt))
    .limit(limit)
    .offset(offset);
}

/* ── Delete a Discovery Entry ── */

export async function deleteDiscoveryEntry(entryId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  // Only delete if owned by the user
  const rows = await db
    .select()
    .from(discoveryHistory)
    .where(eq(discoveryHistory.id, entryId))
    .limit(1);
  if (rows.length > 0 && rows[0].userId === userId) {
    await db.delete(discoveryHistory).where(eq(discoveryHistory.id, entryId));
  }
}

/* ── Clear All Discovery History for a User ── */

export async function clearDiscoveryHistory(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(discoveryHistory)
    .where(eq(discoveryHistory.userId, userId));
}
