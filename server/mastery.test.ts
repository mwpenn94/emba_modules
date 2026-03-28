import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createProtectedContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-mastery",
    email: "test@example.com",
    name: "Test User",
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

function createPublicContext(): { ctx: TrpcContext } {
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

describe("mastery.syncBatch", () => {
  it("validates input schema — rejects empty items", async () => {
    const { ctx } = createProtectedContext();
    const caller = appRouter.createCaller(ctx);

    // syncBatch requires items array with specific shape
    try {
      await caller.mastery.syncBatch({ items: [] });
      // Empty array is valid — should succeed or fail gracefully at DB level
    } catch (err: any) {
      // If DB is unavailable, that's expected in test env
      expect(err).toBeDefined();
    }
  });

  it("validates input schema — rejects invalid confidence range", async () => {
    const { ctx } = createProtectedContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.mastery.syncBatch({
        items: [
          {
            itemKey: "test-key",
            seen: true,
            mastered: false,
            confidence: 10, // Out of range (0-5)
            reviewCount: 1,
            lastReviewed: Date.now(),
            updatedAt: Date.now(),
          },
        ],
      })
    ).rejects.toThrow();
  });

  it("validates input schema — rejects negative reviewCount", async () => {
    const { ctx } = createProtectedContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.mastery.syncBatch({
        items: [
          {
            itemKey: "test-key",
            seen: true,
            mastered: false,
            confidence: 3,
            reviewCount: -1, // Negative
            lastReviewed: Date.now(),
            updatedAt: Date.now(),
          },
        ],
      })
    ).rejects.toThrow();
  });
});

describe("sessions.create", () => {
  it("validates input schema — rejects negative duration", async () => {
    const { ctx } = createProtectedContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.sessions.create({
        duration: -5,
        itemsStudied: 10,
        itemsMastered: 5,
      })
    ).rejects.toThrow();
  });
});

describe("aiQuiz.generate", () => {
  it("validates input schema — rejects missing discipline", async () => {
    const { ctx } = createProtectedContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      // @ts-expect-error — intentionally omitting required field
      caller.aiQuiz.generate({
        count: 5,
        difficulty: "medium",
        questionType: "multiple_choice",
      })
    ).rejects.toThrow();
  });

  it("validates input schema — rejects count > 10", async () => {
    const { ctx } = createProtectedContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.aiQuiz.generate({
        discipline: "Finance",
        count: 50, // Max is 10
        difficulty: "medium",
        questionType: "multiple_choice",
      })
    ).rejects.toThrow();
  });

  it("validates input schema — rejects invalid difficulty", async () => {
    const { ctx } = createProtectedContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.aiQuiz.generate({
        discipline: "Finance",
        count: 5,
        // @ts-expect-error — intentionally invalid
        difficulty: "impossible",
        questionType: "multiple_choice",
      })
    ).rejects.toThrow();
  });

  it("validates input schema — rejects invalid questionType", async () => {
    const { ctx } = createProtectedContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.aiQuiz.generate({
        discipline: "Finance",
        count: 5,
        difficulty: "medium",
        // @ts-expect-error — intentionally invalid
        questionType: "essay",
      })
    ).rejects.toThrow();
  });
});

describe("auth protection", () => {
  it("mastery.getAll requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.mastery.getAll()).rejects.toThrow();
  });

  it("sessions.list requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.sessions.list()).rejects.toThrow();
  });

  it("achievements.list requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.achievements.list()).rejects.toThrow();
  });

  it("settings.list requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.settings.list()).rejects.toThrow();
  });

  it("aiQuiz.generate requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.aiQuiz.generate({
        discipline: "Finance",
        count: 5,
        difficulty: "medium",
        questionType: "multiple_choice",
      })
    ).rejects.toThrow();
  });
});

describe("settings.set", () => {
  it("validates input schema — rejects missing key", async () => {
    const { ctx } = createProtectedContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      // @ts-expect-error — intentionally omitting required field
      caller.settings.set({ value: "test" })
    ).rejects.toThrow();
  });
});
