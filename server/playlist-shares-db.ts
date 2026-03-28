import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./db";
import {
  playlists,
  playlistShares,
  playlistItems,
  users,
  InsertPlaylistShare,
} from "../drizzle/schema";

/* ── Share Token Management ── */

export async function setPlaylistShareToken(
  playlistId: number,
  shareToken: string | null
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(playlists)
    .set({ shareToken })
    .where(eq(playlists.id, playlistId));
}

export async function getPlaylistByShareToken(shareToken: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(playlists)
    .where(eq(playlists.shareToken, shareToken))
    .limit(1);
  return rows[0] ?? null;
}

/* ── Playlist Shares CRUD ── */

export async function createPlaylistShare(
  data: Omit<InsertPlaylistShare, "id">
) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(playlistShares).values(data);
  return result[0]?.insertId ?? null;
}

export async function getPlaylistShares(playlistId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      share: playlistShares,
      userName: users.name,
      userEmail: users.email,
    })
    .from(playlistShares)
    .leftJoin(users, eq(playlistShares.sharedWithUserId, users.id))
    .where(eq(playlistShares.playlistId, playlistId))
    .orderBy(desc(playlistShares.createdAt));
  return rows;
}

export async function updateSharePermission(
  shareId: number,
  permission: "view" | "edit"
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(playlistShares)
    .set({ permission })
    .where(eq(playlistShares.id, shareId));
}

export async function deletePlaylistShare(shareId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(playlistShares).where(eq(playlistShares.id, shareId));
}

export async function getSharesForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({
      share: playlistShares,
      playlist: playlists,
    })
    .from(playlistShares)
    .innerJoin(playlists, eq(playlistShares.playlistId, playlists.id))
    .where(eq(playlistShares.sharedWithUserId, userId))
    .orderBy(desc(playlistShares.createdAt));
  return rows;
}

export async function getPublicPlaylistData(shareToken: string) {
  const db = await getDb();
  if (!db) return null;

  const playlist = await getPlaylistByShareToken(shareToken);
  if (!playlist) return null;

  const items = await db
    .select()
    .from(playlistItems)
    .where(eq(playlistItems.playlistId, playlist.id));

  // Get owner name
  const ownerRows = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, playlist.userId))
    .limit(1);

  return {
    playlist,
    items,
    ownerName: ownerRows[0]?.name ?? "Unknown",
  };
}
