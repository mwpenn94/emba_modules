import { describe, expect, it, vi, beforeEach } from "vitest";
import express from "express";
import { ttsRouter } from "./tts";
import type { Request, Response } from "express";

// Helper to create a mock Express request/response pair
function createMockReqRes(overrides: {
  method?: string;
  url?: string;
  query?: Record<string, string>;
  body?: any;
}) {
  const req = {
    method: overrides.method || "GET",
    url: overrides.url || "/",
    query: overrides.query || {},
    body: overrides.body || {},
    headers: {},
  } as unknown as Request;

  const resData: { statusCode: number; headers: Record<string, string>; body: any; sent: boolean } = {
    statusCode: 200,
    headers: {},
    body: null,
    sent: false,
  };

  const res = {
    status(code: number) {
      resData.statusCode = code;
      return res;
    },
    json(data: any) {
      resData.body = data;
      resData.sent = true;
      return res;
    },
    send(data: any) {
      resData.body = data;
      resData.sent = true;
      return res;
    },
    set(headers: Record<string, string>) {
      Object.assign(resData.headers, headers);
      return res;
    },
  } as unknown as Response;

  return { req, res, resData };
}

describe("TTS Router", () => {
  describe("POST /synthesize", () => {
    it("rejects empty text", async () => {
      const { req, res, resData } = createMockReqRes({
        method: "POST",
        body: { text: "" },
      });

      // Directly call the route handler
      const app = express();
      app.use(express.json());
      app.use("/api/tts", ttsRouter);

      // Use supertest-like approach with the router
      const handler = ttsRouter.stack.find(
        (layer: any) => layer.route?.path === "/synthesize" && layer.route?.methods?.post
      );

      if (handler) {
        await handler.route.stack[0].handle(req, res, () => {});
        expect(resData.statusCode).toBe(400);
        expect(resData.body).toHaveProperty("error");
      }
    });

    it("rejects non-string text", async () => {
      const { req, res, resData } = createMockReqRes({
        method: "POST",
        body: { text: 123 },
      });

      const handler = ttsRouter.stack.find(
        (layer: any) => layer.route?.path === "/synthesize" && layer.route?.methods?.post
      );

      if (handler) {
        await handler.route.stack[0].handle(req, res, () => {});
        expect(resData.statusCode).toBe(400);
      }
    });
  });

  describe("POST /synthesize-batch", () => {
    it("rejects empty items array", async () => {
      const { req, res, resData } = createMockReqRes({
        method: "POST",
        body: { items: [] },
      });

      const handler = ttsRouter.stack.find(
        (layer: any) => layer.route?.path === "/synthesize-batch" && layer.route?.methods?.post
      );

      if (handler) {
        await handler.route.stack[0].handle(req, res, () => {});
        expect(resData.statusCode).toBe(400);
        expect(resData.body).toHaveProperty("error");
      }
    });

    it("rejects non-array items", async () => {
      const { req, res, resData } = createMockReqRes({
        method: "POST",
        body: { items: "not-array" },
      });

      const handler = ttsRouter.stack.find(
        (layer: any) => layer.route?.path === "/synthesize-batch" && layer.route?.methods?.post
      );

      if (handler) {
        await handler.route.stack[0].handle(req, res, () => {});
        expect(resData.statusCode).toBe(400);
      }
    });
  });

  describe("Route registration", () => {
    it("has /voices GET route", () => {
      const voicesRoute = ttsRouter.stack.find(
        (layer: any) => layer.route?.path === "/voices" && layer.route?.methods?.get
      );
      expect(voicesRoute).toBeDefined();
    });

    it("has /synthesize POST route", () => {
      const synthesizeRoute = ttsRouter.stack.find(
        (layer: any) => layer.route?.path === "/synthesize" && layer.route?.methods?.post
      );
      expect(synthesizeRoute).toBeDefined();
    });

    it("has /synthesize-batch POST route", () => {
      const batchRoute = ttsRouter.stack.find(
        (layer: any) => layer.route?.path === "/synthesize-batch" && layer.route?.methods?.post
      );
      expect(batchRoute).toBeDefined();
    });
  });
});
