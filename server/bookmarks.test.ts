import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createAnonContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

describe("bookmarks router", () => {
  it("list requires authentication", async () => {
    const caller = appRouter.createCaller(createAnonContext());
    await expect(caller.bookmarks.list()).rejects.toThrow();
  });

  it("check requires authentication", async () => {
    const caller = appRouter.createCaller(createAnonContext());
    await expect(
      caller.bookmarks.check({ contentType: "definition", contentId: "test-1" })
    ).rejects.toThrow();
  });

  it("create requires authentication", async () => {
    const caller = appRouter.createCaller(createAnonContext());
    await expect(
      caller.bookmarks.create({
        contentType: "definition",
        contentId: "test-1",
        contentTitle: "Test Definition",
      })
    ).rejects.toThrow();
  });

  it("delete requires authentication", async () => {
    const caller = appRouter.createCaller(createAnonContext());
    await expect(
      caller.bookmarks.delete({ bookmarkId: 1 })
    ).rejects.toThrow();
  });

  it("updateNote requires authentication", async () => {
    const caller = appRouter.createCaller(createAnonContext());
    await expect(
      caller.bookmarks.updateNote({ bookmarkId: 1, note: "test" })
    ).rejects.toThrow();
  });

  it("create validates required fields", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(
      // @ts-expect-error - testing missing fields
      caller.bookmarks.create({ contentType: "definition" })
    ).rejects.toThrow();
  });

  it("create validates contentType is a string", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    await expect(
      // @ts-expect-error - testing invalid type
      caller.bookmarks.create({ contentType: 123, contentId: "test", contentTitle: "Test" })
    ).rejects.toThrow();
  });
});
