import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./db";
import {
  pendingShareInvites,
  playlistShares,
  playlists,
  users,
  InsertPendingShareInvite,
} from "../drizzle/schema";

/* ── Create Invite ── */

export async function createShareInvite(
  data: Omit<InsertPendingShareInvite, "id" | "status">
) {
  const db = await getDb();
  if (!db) return null;

  // Check if invite already exists for this email + playlist
  const existing = await db
    .select()
    .from(pendingShareInvites)
    .where(
      and(
        eq(pendingShareInvites.playlistId, data.playlistId),
        eq(pendingShareInvites.invitedEmail, data.invitedEmail),
        eq(pendingShareInvites.status, "pending")
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return { id: existing[0].id, alreadyExists: true };
  }

  const result = await db.insert(pendingShareInvites).values(data);
  return { id: result[0]?.insertId ?? null, alreadyExists: false };
}

/* ── List Pending Invites for a Playlist ── */

export async function getPendingInvites(playlistId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(pendingShareInvites)
    .where(
      and(
        eq(pendingShareInvites.playlistId, playlistId),
        eq(pendingShareInvites.status, "pending")
      )
    )
    .orderBy(desc(pendingShareInvites.createdAt));
}

/* ── Revoke Invite ── */

export async function revokeShareInvite(inviteId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(pendingShareInvites)
    .set({ status: "revoked" })
    .where(eq(pendingShareInvites.id, inviteId));
}

/* ── Accept Pending Invites on Login ── */

export async function acceptPendingInvites(userId: number, email: string) {
  const db = await getDb();
  if (!db) return 0;

  // Find all pending invites for this email
  const pending = await db
    .select()
    .from(pendingShareInvites)
    .where(
      and(
        eq(pendingShareInvites.invitedEmail, email),
        eq(pendingShareInvites.status, "pending")
      )
    );

  if (pending.length === 0) return 0;

  let accepted = 0;
  for (const invite of pending) {
    // Check if share already exists
    const existingShare = await db
      .select()
      .from(playlistShares)
      .where(
        and(
          eq(playlistShares.playlistId, invite.playlistId),
          eq(playlistShares.sharedWithUserId, userId)
        )
      )
      .limit(1);

    if (existingShare.length === 0) {
      // Create the share
      await db.insert(playlistShares).values({
        playlistId: invite.playlistId,
        sharedWithUserId: userId,
        permission: invite.permission,
        grantedBy: invite.invitedBy,
      });
      accepted++;
    }

    // Mark invite as accepted
    await db
      .update(pendingShareInvites)
      .set({ status: "accepted" })
      .where(eq(pendingShareInvites.id, invite.id));
  }

  return accepted;
}
