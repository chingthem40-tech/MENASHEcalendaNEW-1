import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import express from "express";
import type { Server } from "node:http";

import {
  chooseAccountLink,
  mustDeferIdentityResolution,
  supabaseAuthMiddleware,
  supabaseAuthRouter,
} from "./supabaseAuth";
import { requireAdmin, requireAuth } from "./authorization";
import remembranceRouter from "../routes/remembrance";

let server: Server;
let baseUrl = "";

before(async () => {
  const app = express();
  app.use(supabaseAuthMiddleware());
  app.use(supabaseAuthRouter);
  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        throw new Error("Test server did not bind to a TCP port");
      }
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

describe("Supabase auth routes", () => {
  it("returns 401 without a Supabase access token", async () => {
    const response = await fetch(`${baseUrl}/auth/user`);
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { authenticated: false });
  });

  it("rejects malformed bearer credentials", async () => {
    const response = await fetch(`${baseUrl}/auth/user`, {
      headers: { Authorization: "Basic not-a-bearer-token" },
    });
    assert.equal(response.status, 401);
  });

  it("redirects legacy login links to the app-owned sign-in page", async () => {
    const response = await fetch(
      `${baseUrl}/auth/login?returnTo=${encodeURIComponent("/app")}`,
      { redirect: "manual" },
    );
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("location"), "/sign-in?returnTo=%2Fapp");
  });

  it("does not allow an external returnTo redirect", async () => {
    const response = await fetch(
      `${baseUrl}/auth/login?returnTo=${encodeURIComponent("//evil.example")}`,
      { redirect: "manual" },
    );
    assert.equal(response.headers.get("location"), "/sign-in?returnTo=%2F");
  });

  it("does not allow a backslash-normalized external returnTo redirect", async () => {
    const response = await fetch(
      `${baseUrl}/auth/login?returnTo=${encodeURIComponent("/\\\\evil.example")}`,
      { redirect: "manual" },
    );
    assert.equal(response.headers.get("location"), "/sign-in?returnTo=%2F");
  });

  it("keeps POST logout compatibility", async () => {
    const response = await fetch(`${baseUrl}/auth/logout`, { method: "POST" });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
  });

  it("accepts a verified Supabase token when no legacy directory is configured", async () => {
    const app = express();
    app.use(
      supabaseAuthMiddleware({
        verifyToken: async (token) =>
          token === "valid-token"
            ? ({
                id: "new-subject",
                email: "new@example.com",
                email_confirmed_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                user_metadata: {},
              } as any)
            : null,
        resolveUser: async (user) => {
          assert.equal(
            mustDeferIdentityResolution([], false, false),
            false,
          );
          const decision = chooseAccountLink(user.id, []);
          return {
            provider: "supabase",
            subject: user.id,
            userId: decision.accountId,
            email: user.email ?? null,
            name: "New member",
            imageUrl: null,
            isAdmin: false,
            createdAt: user.created_at,
          };
        },
      }),
    );
    app.use(supabaseAuthRouter);
    const testServer = await new Promise<Server>((resolve) => {
      const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
    });
    try {
      const address = testServer.address();
      assert.ok(address && typeof address !== "string");
      const response = await fetch(
        `http://127.0.0.1:${address.port}/auth/user`,
        { headers: { Authorization: "Bearer valid-token" } },
      );
      assert.equal(response.status, 200);
      const body = (await response.json()) as { user: { id: string } };
      assert.equal(body.user.id, "supabase:new-subject");
    } finally {
      await new Promise<void>((resolve, reject) => {
        testServer.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it("rejects invalid or expired bearer tokens after server-side verification", async () => {
    const app = express();
    app.use(
      supabaseAuthMiddleware({
        verifyToken: async () => null,
      }),
    );
    app.use(supabaseAuthRouter);
    const testServer = await new Promise<Server>((resolve) => {
      const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
    });
    try {
      const address = testServer.address();
      assert.ok(address && typeof address !== "string");
      const response = await fetch(
        `http://127.0.0.1:${address.port}/auth/user`,
        { headers: { Authorization: "Bearer expired-or-invalid" } },
      );
      assert.equal(response.status, 401);
    } finally {
      await new Promise<void>((resolve, reject) => {
        testServer.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it("fails closed when the Supabase verifier throws", async () => {
    const app = express();
    app.use(
      supabaseAuthMiddleware({
        verifyToken: async () => {
          throw new Error("verification unavailable");
        },
      }),
    );
    app.use(supabaseAuthRouter);
    const testServer = await new Promise<Server>((resolve) => {
      const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
    });
    try {
      const address = testServer.address();
      assert.ok(address && typeof address !== "string");
      const response = await fetch(
        `http://127.0.0.1:${address.port}/auth/user`,
        { headers: { Authorization: "Bearer malformed" } },
      );
      assert.equal(response.status, 401);
    } finally {
      await new Promise<void>((resolve, reject) => {
        testServer.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});

describe("Supabase authorization middleware", () => {
  async function withRole(
    isAdmin: boolean,
    run: (url: string) => Promise<void>,
  ): Promise<void> {
    const app = express();
    app.use((req, _res, next) => {
      req.supabaseAuth = {
        provider: "supabase",
        subject: "subject-1",
        userId: "account-1",
        email: "member@example.com",
        name: "Member",
        imageUrl: null,
        isAdmin,
        createdAt: new Date().toISOString(),
      };
      next();
    });
    app.get("/protected", requireAuth, (_req, res) => res.json({ ok: true }));
    app.get("/admin", requireAdmin, (_req, res) => res.json({ ok: true }));
    const testServer = await new Promise<Server>((resolve) => {
      const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
    });
    try {
      const address = testServer.address();
      assert.ok(address && typeof address !== "string");
      await run(`http://127.0.0.1:${address.port}`);
    } finally {
      await new Promise<void>((resolve, reject) => {
        testServer.close((error) => (error ? reject(error) : resolve()));
      });
    }
  }

  it("allows ordinary authenticated users on protected routes but returns 403 for admin routes", async () => {
    await withRole(false, async (url) => {
      assert.equal((await fetch(`${url}/protected`)).status, 200);
      assert.equal((await fetch(`${url}/admin`)).status, 403);
    });
  });

  it("allows a server-resolved application admin on admin routes", async () => {
    await withRole(true, async (url) => {
      assert.equal((await fetch(`${url}/admin`)).status, 200);
    });
  });

  it("requires authentication for every remembrance operation", async () => {
    const app = express();
    app.use(express.json());
    app.use(remembranceRouter);
    const testServer = await new Promise<Server>((resolve) => {
      const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
    });
    try {
      const address = testServer.address();
      assert.ok(address && typeof address !== "string");
      const url = `http://127.0.0.1:${address.port}/remembrance`;
      for (const request of [
        fetch(url),
        fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }),
        fetch(`${url}/event-1`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: "{}" }),
        fetch(`${url}/event-1`, { method: "DELETE" }),
      ]) {
        assert.equal((await request).status, 401);
      }
    } finally {
      await new Promise<void>((resolve, reject) => {
        testServer.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });
});

describe("Supabase account continuity", () => {
  it("preserves the only verified matching application account", () => {
    assert.deepEqual(chooseAccountLink("subject-1", ["legacy-account"]), {
      accountId: "legacy-account",
      linkStatus: "auto_linked",
    });
  });

  it("does not silently link an ambiguous verified email", () => {
    assert.deepEqual(chooseAccountLink("subject-2", ["one", "two"]), {
      accountId: "supabase:subject-2",
      linkStatus: "ambiguous",
    });
  });

  it("creates a stable provider account for unmatched users", () => {
    assert.deepEqual(chooseAccountLink("subject-3", []), {
      accountId: "supabase:subject-3",
      linkStatus: "unmatched",
    });
  });

  it("defers first-login mapping while the legacy directory is unavailable", () => {
    assert.equal(mustDeferIdentityResolution([], true, false), true);
  });

  it("can recover through a local verified mapping during a directory outage", () => {
    assert.equal(
      mustDeferIdentityResolution(["legacy-account"], true, false),
      false,
    );
    assert.deepEqual(chooseAccountLink("subject-4", ["legacy-account"]), {
      accountId: "legacy-account",
      linkStatus: "auto_linked",
    });
  });

  it("creates a new account when the legacy directory is intentionally not configured", () => {
    assert.equal(mustDeferIdentityResolution([], false, false), false);
    assert.deepEqual(chooseAccountLink("new-subject", []), {
      accountId: "supabase:new-subject",
      linkStatus: "unmatched",
    });
  });
});