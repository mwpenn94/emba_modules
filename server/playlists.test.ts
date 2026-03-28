import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createAuthContext(userId = 1): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `user-${userId}`,
      email: `user${userId}@test.com`,
      name: `User ${userId}`,
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

describe("playlists router", () => {
  describe("playlists.list", () => {
    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(caller.playlists.list()).rejects.toThrow();
    });
  });

  describe("playlists.create", () => {
    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(
        caller.playlists.create({ name: "Test Playlist" })
      ).rejects.toThrow();
    });

    it("validates name is not empty", async () => {
      const caller = appRouter.createCaller(createAuthContext());
      await expect(
        caller.playlists.create({ name: "" })
      ).rejects.toThrow();
    });
  });

  describe("playlists.addItem", () => {
    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(
        caller.playlists.addItem({
          playlistId: 1,
          contentType: "definition",
          contentId: "test-1",
          contentTitle: "Test Item",
          discipline: "Finance",
        })
      ).rejects.toThrow();
    });

    it("validates content type", async () => {
      const caller = appRouter.createCaller(createAuthContext());
      await expect(
        caller.playlists.addItem({
          playlistId: 1,
          contentType: "invalid" as any,
          contentId: "test-1",
          contentTitle: "Test Item",
          discipline: "Finance",
        })
      ).rejects.toThrow();
    });
  });

  describe("playlists.removeItem", () => {
    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(
        caller.playlists.removeItem({ itemId: 1 })
      ).rejects.toThrow();
    });
  });

  describe("playlists.delete", () => {
    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(
        caller.playlists.delete({ playlistId: 1 })
      ).rejects.toThrow();
    });
  });

  describe("playlists.discover", () => {
    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(caller.playlists.discover()).rejects.toThrow();
    });
  });
});
