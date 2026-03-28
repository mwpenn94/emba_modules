import { eq, desc, like, or, sql } from "drizzle-orm";
import { getDb } from "./db";
import { users } from "../drizzle/schema";

/* ── Admin: User Management ── */

export async function listUsers(opts: {
  limit?: number;
  offset?: number;
  search?: string;
  role?: string;
}) {
  const db = await getDb();
  if (!db) return { users: [], total: 0 };

  const { limit = 50, offset = 0, search, role } = opts;

  let query = db.select().from(users);

  const conditions: any[] = [];
  if (search) {
    conditions.push(
      or(
        like(users.name, `%${search}%`),
        like(users.email, `%${search}%`)
      )
    );
  }
  if (role && role !== "all") {
    conditions.push(eq(users.role, role as any));
  }

  if (conditions.length > 0) {
    for (const cond of conditions) {
      query = query.where(cond) as any;
    }
  }

  const rows = await (query as any)
    .orderBy(desc(users.lastSignedIn))
    .limit(limit)
    .offset(offset);

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(users);
  const total = countResult[0]?.count ?? 0;

  return { users: rows, total };
}

export async function updateUserRole(
  userId: number,
  role: "user" | "advisor" | "admin"
) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getUserStats() {
  const db = await getDb();
  if (!db) return { total: 0, admins: 0, advisors: 0, users: 0 };

  const rows = await db
    .select({
      role: users.role,
      count: sql<number>`count(*)`,
    })
    .from(users)
    .groupBy(users.role);

  const stats = { total: 0, admins: 0, advisors: 0, users: 0 };
  for (const row of rows) {
    const c = Number(row.count);
    stats.total += c;
    if (row.role === "admin") stats.admins = c;
    else if (row.role === "advisor") stats.advisors = c;
    else stats.users = c;
  }
  return stats;
}
