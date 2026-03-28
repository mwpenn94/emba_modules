import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

function createUnauthContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
  return { ctx };
}

describe("groups router", () => {
  describe("groups.create", () => {
    it("rejects unauthenticated users", async () => {
      const { ctx } = createUnauthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.groups.create({ name: "Test Group" })
      ).rejects.toThrow();
    });

    it("validates group name is not empty", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.groups.create({ name: "" })
      ).rejects.toThrow();
    });

    it("validates group name max length", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.groups.create({ name: "A".repeat(256) })
      ).rejects.toThrow();
    });
  });

  describe("groups.join", () => {
    it("rejects unauthenticated users", async () => {
      const { ctx } = createUnauthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.groups.join({ inviteCode: "test123" })
      ).rejects.toThrow();
    });
  });

  describe("groups.leave", () => {
    it("rejects unauthenticated users", async () => {
      const { ctx } = createUnauthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.groups.leave({ groupId: 1 })
      ).rejects.toThrow();
    });
  });

  describe("groups.shareQuiz", () => {
    it("rejects unauthenticated users", async () => {
      const { ctx } = createUnauthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.groups.shareQuiz({
          groupId: 1,
          title: "Test Quiz",
          discipline: "Finance",
          questionIds: [1, 2, 3],
        })
      ).rejects.toThrow();
    });

    it("validates title is not empty", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.groups.shareQuiz({
          groupId: 1,
          title: "",
          discipline: "Finance",
          questionIds: [1, 2, 3],
        })
      ).rejects.toThrow();
    });
  });

  describe("groups.submitResult", () => {
    it("rejects unauthenticated users", async () => {
      const { ctx } = createUnauthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.groups.submitResult({
          challengeId: 1,
          score: 8,
          totalQuestions: 10,
          timeTaken: 120,
        })
      ).rejects.toThrow();
    });

    it("validates score is non-negative", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.groups.submitResult({
          challengeId: 1,
          score: -1,
          totalQuestions: 10,
          timeTaken: 120,
        })
      ).rejects.toThrow();
    });

    it("validates totalQuestions is at least 1", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.groups.submitResult({
          challengeId: 1,
          score: 0,
          totalQuestions: 0,
          timeTaken: 120,
        })
      ).rejects.toThrow();
    });
  });

  describe("groups.myGroups", () => {
    it("rejects unauthenticated users", async () => {
      const { ctx } = createUnauthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(caller.groups.myGroups()).rejects.toThrow();
    });
  });

  describe("groups.leaderboard", () => {
    it("rejects unauthenticated users", async () => {
      const { ctx } = createUnauthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.groups.leaderboard({ challengeId: 1 })
      ).rejects.toThrow();
    });
  });
});
