import { z } from "zod";
import { router } from "../_core/trpc";
import { adminProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { listUsers, updateUserRole, getUserById, getUserStats } from "../admin-db";

export const adminRouter = router({
  /** Get user statistics */
  stats: adminProcedure.query(async () => {
    return getUserStats();
  }),

  /** List all users with search and filter */
  listUsers: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
        search: z.string().optional(),
        role: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      return listUsers({
        limit: input?.limit ?? 50,
        offset: input?.offset ?? 0,
        search: input?.search,
        role: input?.role,
      });
    }),

  /** Update a user's role */
  updateRole: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["user", "advisor", "admin"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Prevent self-demotion
      if (input.userId === ctx.user.id && input.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot change your own role",
        });
      }

      const user = await getUserById(input.userId);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      await updateUserRole(input.userId, input.role);
      return { success: true };
    }),

  /** Get a single user's details */
  getUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const user = await getUserById(input.userId);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      return user;
    }),
});
