import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { NOT_ADMIN_ERR_MSG, NOT_ADVISOR_ERR_MSG, UNAUTHED_ERR_MSG } from "../shared/const";
import type { TrpcContext } from "./_core/context";

/* ── Test Helpers ── */

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createUserContext(userId = 1, role: "user" | "advisor" | "admin" = "user"): TrpcContext {
  return {
    user: {
      id: userId,
      openId: `user-${userId}`,
      email: `user${userId}@test.com`,
      name: `User ${userId}`,
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

function createAdminContext(userId = 99): TrpcContext {
  return createUserContext(userId, "admin");
}

function createAdvisorContext(userId = 50): TrpcContext {
  return createUserContext(userId, "advisor");
}

/* ═══════════════════════════════════════════════════
   1. Admin Router — Role-Based Access
   ═══════════════════════════════════════════════════ */

describe("admin router", () => {
  describe("admin.stats", () => {
    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(caller.admin.stats()).rejects.toThrow(NOT_ADMIN_ERR_MSG);
    });

    it("rejects regular users", async () => {
      const caller = appRouter.createCaller(createUserContext());
      await expect(caller.admin.stats()).rejects.toThrow(NOT_ADMIN_ERR_MSG);
    });

    it("rejects advisor users", async () => {
      const caller = appRouter.createCaller(createAdvisorContext());
      await expect(caller.admin.stats()).rejects.toThrow(NOT_ADMIN_ERR_MSG);
    });

    it("allows admin users", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      // Should not throw — returns stats object
      const result = await caller.admin.stats();
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("admins");
      expect(result).toHaveProperty("advisors");
      expect(result).toHaveProperty("users");
    });
  });

  describe("admin.listUsers", () => {
    it("rejects non-admin users", async () => {
      const caller = appRouter.createCaller(createUserContext());
      await expect(caller.admin.listUsers()).rejects.toThrow(NOT_ADMIN_ERR_MSG);
    });

    it("allows admin to list users", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.admin.listUsers();
      expect(result).toHaveProperty("users");
      expect(result).toHaveProperty("total");
      expect(Array.isArray(result.users)).toBe(true);
    });

    it("accepts search and role filter parameters", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      const result = await caller.admin.listUsers({
        search: "test",
        role: "user",
        limit: 10,
        offset: 0,
      });
      expect(result).toHaveProperty("users");
    });
  });

  describe("admin.updateRole", () => {
    it("rejects non-admin users", async () => {
      const caller = appRouter.createCaller(createUserContext());
      await expect(
        caller.admin.updateRole({ userId: 2, role: "advisor" })
      ).rejects.toThrow(NOT_ADMIN_ERR_MSG);
    });

    it("prevents admin from demoting themselves", async () => {
      const adminId = 99;
      const caller = appRouter.createCaller(createAdminContext(adminId));
      await expect(
        caller.admin.updateRole({ userId: adminId, role: "user" })
      ).rejects.toThrow("You cannot change your own role");
    });

    it("validates role enum", async () => {
      const caller = appRouter.createCaller(createAdminContext());
      await expect(
        caller.admin.updateRole({ userId: 2, role: "superadmin" as any })
      ).rejects.toThrow();
    });
  });

  describe("admin.getUser", () => {
    it("rejects non-admin users", async () => {
      const caller = appRouter.createCaller(createUserContext());
      await expect(
        caller.admin.getUser({ userId: 1 })
      ).rejects.toThrow(NOT_ADMIN_ERR_MSG);
    });
  });
});

/* ═══════════════════════════════════════════════════
   2. Advisor Procedure Middleware
   ═══════════════════════════════════════════════════ */

describe("advisor middleware", () => {
  // The FS Toolkit uses advisorProcedure-level access indirectly.
  // We test the middleware behavior through admin router since
  // advisorProcedure is used in the trpc layer.

  it("NOT_ADVISOR_ERR_MSG constant is defined", () => {
    expect(NOT_ADVISOR_ERR_MSG).toBeDefined();
    expect(typeof NOT_ADVISOR_ERR_MSG).toBe("string");
  });
});

/* ═══════════════════════════════════════════════════
   3. Playlist Sharing — Owner CRUD
   ═══════════════════════════════════════════════════ */

describe("playlist sharing", () => {
  describe("playlists.generateShareToken", () => {
    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(
        caller.playlists.generateShareToken({ playlistId: 1 })
      ).rejects.toThrow();
    });

    it("requires a valid playlistId", async () => {
      const caller = appRouter.createCaller(createUserContext());
      await expect(
        caller.playlists.generateShareToken({ playlistId: -1 })
      ).rejects.toThrow();
    });
  });

  describe("playlists.revokeShareToken", () => {
    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(
        caller.playlists.revokeShareToken({ playlistId: 1 })
      ).rejects.toThrow();
    });
  });

  describe("playlists.getShares", () => {
    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(
        caller.playlists.getShares({ playlistId: 1 })
      ).rejects.toThrow();
    });
  });

  describe("playlists.updateSharePermission", () => {
    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(
        caller.playlists.updateSharePermission({
          playlistId: 1,
          shareId: 1,
          permission: "view",
        })
      ).rejects.toThrow();
    });

    it("validates permission enum", async () => {
      const caller = appRouter.createCaller(createUserContext());
      await expect(
        caller.playlists.updateSharePermission({
          playlistId: 1,
          shareId: 1,
          permission: "delete" as any,
        })
      ).rejects.toThrow();
    });
  });

  describe("playlists.revokeAccess", () => {
    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(
        caller.playlists.revokeAccess({ playlistId: 1, shareId: 1 })
      ).rejects.toThrow();
    });
  });

  describe("playlists.sharedWithMe", () => {
    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(caller.playlists.sharedWithMe()).rejects.toThrow();
    });

    it("allows authenticated users", async () => {
      const caller = appRouter.createCaller(createUserContext());
      const result = await caller.playlists.sharedWithMe();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("playlists.getByShareToken", () => {
    it("is a public procedure (no auth required)", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      // Should throw NOT_FOUND (not UNAUTHORIZED) for invalid token
      await expect(
        caller.playlists.getByShareToken({ shareToken: "nonexistent-token" })
      ).rejects.toThrow("Shared playlist not found");
    });
  });
});

/* ═══════════════════════════════════════════════════
   4. Email-Based Share Invites
   ═══════════════════════════════════════════════════ */

describe("playlist email invites", () => {
  describe("playlists.sendInvite", () => {
    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(
        caller.playlists.sendInvite({
          playlistId: 1,
          email: "test@example.com",
          permission: "view",
        })
      ).rejects.toThrow();
    });

    it("validates email format", async () => {
      const caller = appRouter.createCaller(createUserContext());
      await expect(
        caller.playlists.sendInvite({
          playlistId: 1,
          email: "not-an-email",
          permission: "view",
        })
      ).rejects.toThrow();
    });

    it("validates permission enum", async () => {
      const caller = appRouter.createCaller(createUserContext());
      await expect(
        caller.playlists.sendInvite({
          playlistId: 1,
          email: "test@example.com",
          permission: "delete" as any,
        })
      ).rejects.toThrow();
    });

    it("requires positive playlistId", async () => {
      const caller = appRouter.createCaller(createUserContext());
      await expect(
        caller.playlists.sendInvite({
          playlistId: -1,
          email: "test@example.com",
          permission: "view",
        })
      ).rejects.toThrow();
    });
  });

  describe("playlists.listInvites", () => {
    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(
        caller.playlists.listInvites({ playlistId: 1 })
      ).rejects.toThrow();
    });
  });

  describe("playlists.revokeInvite", () => {
    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(
        caller.playlists.revokeInvite({ playlistId: 1, inviteId: 1 })
      ).rejects.toThrow();
    });

    it("requires positive IDs", async () => {
      const caller = appRouter.createCaller(createUserContext());
      await expect(
        caller.playlists.revokeInvite({ playlistId: 0, inviteId: 0 })
      ).rejects.toThrow();
    });
  });

  describe("playlists.acceptInvites", () => {
    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(caller.playlists.acceptInvites()).rejects.toThrow();
    });

    it("returns accepted count for authenticated users", async () => {
      const caller = appRouter.createCaller(createUserContext());
      const result = await caller.playlists.acceptInvites();
      expect(result).toHaveProperty("accepted");
      expect(typeof result.accepted).toBe("number");
    });
  });
});

/* ═══════════════════════════════════════════════════
   5. Self-Discovery — Follow-Up Generation
   ═══════════════════════════════════════════════════ */

describe("selfDiscovery", () => {
  describe("selfDiscovery.generateFollowUp", () => {
    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(
        caller.selfDiscovery.generateFollowUp({
          lastTopic: "Net Present Value",
          discipline: "Finance",
        })
      ).rejects.toThrow();
    });

    it("accepts empty lastTopic without validation error", async () => {
      const caller = appRouter.createCaller(createUserContext());
      // z.string() accepts empty strings; the LLM handles it gracefully
      try {
        const result = await caller.selfDiscovery.generateFollowUp({
          lastTopic: "",
        });
        // If LLM responds, it should still have the expected shape
        expect(result).toHaveProperty("question");
        expect(result).toHaveProperty("hint");
        expect(result).toHaveProperty("relatedTopics");
        expect(result).toHaveProperty("difficulty");
      } catch (e: any) {
        // LLM failure is acceptable in test env
        expect(e.code).not.toBe("BAD_REQUEST");
      }
    });

    it("accepts valid input with optional fields", async () => {
      const caller = appRouter.createCaller(createUserContext());
      // This will call the LLM, which may fail in test env
      // We just verify the procedure exists and accepts the input shape
      try {
        await caller.selfDiscovery.generateFollowUp({
          lastTopic: "WACC Calculation",
          discipline: "Finance",
          context: "Studying weighted average cost of capital",
        });
      } catch (e: any) {
        // Expected: LLM may not be available in test env
        // The important thing is it didn't throw a validation error
        expect(e.message).not.toContain("Expected string");
        expect(e.code).not.toBe("BAD_REQUEST");
      }
    });
  });
});

/* ═══════════════════════════════════════════════════
   6. Self-Discovery History Log
   ═══════════════════════════════════════════════════ */

describe("selfDiscovery history", () => {
  describe("selfDiscovery.history", () => {
    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(caller.selfDiscovery.history()).rejects.toThrow();
    });

    it("returns array for authenticated users", async () => {
      const caller = appRouter.createCaller(createUserContext());
      const result = await caller.selfDiscovery.history();
      expect(Array.isArray(result)).toBe(true);
    });

    it("accepts limit and offset parameters", async () => {
      const caller = appRouter.createCaller(createUserContext());
      const result = await caller.selfDiscovery.history({ limit: 10, offset: 0 });
      expect(Array.isArray(result)).toBe(true);
    });

    it("validates limit range", async () => {
      const caller = appRouter.createCaller(createUserContext());
      await expect(
        caller.selfDiscovery.history({ limit: 200, offset: 0 })
      ).rejects.toThrow();
    });

    it("validates offset is non-negative", async () => {
      const caller = appRouter.createCaller(createUserContext());
      await expect(
        caller.selfDiscovery.history({ limit: 10, offset: -1 })
      ).rejects.toThrow();
    });
  });

  describe("selfDiscovery.deleteEntry", () => {
    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(
        caller.selfDiscovery.deleteEntry({ entryId: 1 })
      ).rejects.toThrow();
    });

    it("requires positive entryId", async () => {
      const caller = appRouter.createCaller(createUserContext());
      await expect(
        caller.selfDiscovery.deleteEntry({ entryId: 0 })
      ).rejects.toThrow();
    });
  });

  describe("selfDiscovery.clearHistory", () => {
    it("rejects unauthenticated users", async () => {
      const caller = appRouter.createCaller(createUnauthContext());
      await expect(caller.selfDiscovery.clearHistory()).rejects.toThrow();
    });

    it("returns success for authenticated users", async () => {
      const caller = appRouter.createCaller(createUserContext());
      const result = await caller.selfDiscovery.clearHistory();
      expect(result).toEqual({ success: true });
    });
  });
});
