import { eq, and, desc, asc } from "drizzle-orm";
import { getDb } from "./db";
import {
  playlists,
  playlistItems,
  InsertPlaylist,
  InsertPlaylistItem,
} from "../drizzle/schema";

/* ── Playlist CRUD ── */

export async function createPlaylist(data: Omit<InsertPlaylist, "id">) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(playlists).values(data);
  return result[0]?.insertId ?? null;
}

export async function getUserPlaylists(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(playlists)
    .where(eq(playlists.userId, userId))
    .orderBy(desc(playlists.updatedAt));
}

export async function getPlaylistById(playlistId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(playlists)
    .where(eq(playlists.id, playlistId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getPublicPlaylists(limit: number = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(playlists)
    .where(eq(playlists.isPublic, true))
    .orderBy(desc(playlists.updatedAt))
    .limit(limit);
}

export async function updatePlaylist(
  playlistId: number,
  data: Partial<Pick<InsertPlaylist, "name" | "description" | "isPublic">>
) {
  const db = await getDb();
  if (!db) return;
  await db.update(playlists).set(data).where(eq(playlists.id, playlistId));
}

export async function deletePlaylist(playlistId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(playlistItems)
    .where(eq(playlistItems.playlistId, playlistId));
  await db.delete(playlists).where(eq(playlists.id, playlistId));
}

/* ── Playlist Items ── */

export async function getPlaylistItems(playlistId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(playlistItems)
    .where(eq(playlistItems.playlistId, playlistId))
    .orderBy(asc(playlistItems.sortOrder));
}

export async function addPlaylistItem(data: Omit<InsertPlaylistItem, "id">) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(playlistItems).values(data);
  return result[0]?.insertId ?? null;
}

export async function removePlaylistItem(itemId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(playlistItems).where(eq(playlistItems.id, itemId));
}

export async function reorderPlaylistItems(
  playlistId: number,
  itemIds: number[]
) {
  const db = await getDb();
  if (!db) return;
  for (let i = 0; i < itemIds.length; i++) {
    await db
      .update(playlistItems)
      .set({ sortOrder: i })
      .where(
        and(
          eq(playlistItems.id, itemIds[i]),
          eq(playlistItems.playlistId, playlistId)
        )
      );
  }
}

export async function getPlaylistItemCount(playlistId: number) {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db
    .select()
    .from(playlistItems)
    .where(eq(playlistItems.playlistId, playlistId));
  return rows.length;
}
