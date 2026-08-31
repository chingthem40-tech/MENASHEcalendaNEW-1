import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer, request as httpRequest, type Server } from "node:http";
import test from "node:test";
import express from "express";

// These values must be present before the auth module is loaded because its
// OIDC configuration is read once at module initialization.
process.env.NODE_ENV = "test";
process.env.SESSION_SECRET = "replit-auth-test-secret-with-at-least-32-bytes";
process.env.REPLIT_AUTH_CLIENT_ID = "replit-test-client";
process.env.ISSUER_URL = "https://oidc.example.test";
process.env.CLERK_SECRET_KEY = "";

const { pool } = await import("@workspace/db");
const { replitAuthMiddleware, replitAuthRouter } = await import("./replitAuth");
const { requireAdmin, requireAuth } = await import("./authorization");
const { requireNationalAdmin, requireRegionalAdmin } =
  await import("./branchAuth");

type QueryResult = { rows: Array<Record<string, unknown>> };
type Query = (
  text: string,
  values?: readonly unknown[],
) => Promise<QueryResult>;

type Flow = {
  id: string;
  state: string;
  codeVerifier: string;
  returnTo: string;
};

type Session = {
  id: string;
  accountId: string;
  subject: string;
  email: string | null;
  name: string;
  imageUrl: string | null;
  isAdmin: boolean;
  createdAt: string;
};

class FakeAuthDatabase {
  readonly flows = new Map<string, Flow>();
  readonly identities = new Map<string, Record<string, unknown>>();
  readonly sessions = new Map<string, Session>();
  readonly expiredFlows = new Set<string>();
  readonly expiredSessions = new Set<string>();
  readonly adminAccounts = new Set<string>();
  readonly deletedSessionIds: string[] = [];

  query: Query = async (text, values = []) => {
    const sql = text.replace(/\s+/g, " ").trim();
    const params = [...values];

    if (sql.startsWith("INSERT INTO auth_login_flows")) {
      const [id, state, codeVerifier, returnTo] = params as string[];
      this.flows.set(id, { id, state, codeVerifier, returnTo });
      return { rows: [] };
    }

    if (sql.startsWith("DELETE FROM auth_login_flows")) {
      const [id, state] = params as string[];
      const flow = this.flows.get(id);
      if (!flow || flow.state !== state || this.expiredFlows.has(id)) {
        return { rows: [] };
      }
      this.flows.delete(id);
      return {
        rows: [
          {
            state: flow.state,
            code_verifier: flow.codeVerifier,
            return_to: flow.returnTo,
          },
        ],
      };
    }

    if (sql.startsWith("SELECT account_id, email, display_name")) {
      const subject = String(params[0]);
      const identity = this.identities.get(subject);
      return { rows: identity ? [identity] : [] };
    }

    if (sql.startsWith("INSERT INTO auth_identities")) {
      const [
        subject,
        accountId,
        email,
        emailVerified,
        linkStatus,
        displayName,
        imageUrl,
      ] = params as [
        string,
        string,
        string | null,
        boolean,
        string,
        string,
        string | null,
      ];
      this.identities.set(subject, {
        account_id: accountId,
        email,
        email_verified: emailVerified,
        link_status: linkStatus,
        display_name: displayName,
        image_url: imageUrl,
        created_at: "2026-08-31T00:00:00.000Z",
      });
      return { rows: [{ created_at: "2026-08-31T00:00:00.000Z" }] };
    }

    if (sql.startsWith("SELECT 1 FROM app_admin_assignments")) {
      return {
        rows: this.adminAccounts.has(String(params[0])) ? [{}] : [],
      };
    }

    if (sql.startsWith("INSERT INTO auth_sessions")) {
      const [
        id,
        accountId,
        provider,
        subject,
        email,
        displayName,
        imageUrl,
        isAdmin,
      ] = params as [
        string,
        string,
        string,
        string,
        string | null,
        string,
        string | null,
        boolean,
      ];
      this.sessions.set(id, {
        id,
        accountId,
        subject,
        email,
        name: displayName,
        imageUrl,
        isAdmin,
        createdAt: "2026-08-31T00:00:00.000Z",
      });
      return { rows: [] };
    }

    if (sql.startsWith("SELECT s.account_id")) {
      const session = this.sessions.get(String(params[0]));
      if (!session || this.expiredSessions.has(session.id)) return { rows: [] };
      return {
        rows: [
          {
            account_id: session.accountId,
            provider: "replit",
            provider_subject: session.subject,
            email: session.email,
            display_name: session.name,
            image_url: session.imageUrl,
            is_admin: session.isAdmin,
            created_at: session.createdAt,
          },
        ],
      };
    }

    if (sql.startsWith("UPDATE auth_sessions")) return { rows: [] };

    if (sql.startsWith("DELETE FROM auth_sessions")) {
      const id = String(params[0]);
      this.sessions.delete(id);
      this.deletedSessionIds.push(id);
      return { rows: [] };
    }

    // Branch authorization queries use this default as "no database role".
    return { rows: [] };
  };

  latestFlow(): Flow {
    const flow = [...this.flows.values()].at(-1);
    assert.ok(flow, "login should persist an auth flow");
    return flow;
  }

  latestSession(): Session {
    const session = [...this.sessions.values()].at(-1);
    assert.ok(session, "callback should persist a session");
    return session;
  }
}

type HttpResponse = {
  statusCode: number;
  headers: Record<string, string | string[] | undefined>;
  body: string;
};

function request(
  server: Server,
  path: string,
  headers: Record<string, string> = {},
): Promise<HttpResponse> {
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return new Promise((resolve, reject) => {
    const req = httpRequest(
      {
        hostname: "127.0.0.1",
        port: address.port,
        path,
        headers,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode ?? 0,
            headers: res.headers,
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

async function openServer(withSessionMiddleware = true): Promise<Server> {
  const app = express();
  if (withSessionMiddleware) app.use(replitAuthMiddleware());
  app.use(replitAuthRouter);
  const server = createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return server;
}

async function closeServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function withDatabase<T>(
  database: FakeAuthDatabase,
  run: () => Promise<T>,
): Promise<T> {
  const originalQuery = (pool as unknown as { query: Query }).query;
  (pool as unknown as { query: Query }).query = (...args) =>
    database.query(...args);
  try {
    return await run();
  } finally {
    (pool as unknown as { query: Query }).query = originalQuery;
  }
}

async function withFetch<T>(
  handler: typeof globalThis.fetch,
  run: () => Promise<T>,
): Promise<T> {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = handler;
  try {
    return await run();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function oidcFetch(
  userInfo: Record<string, unknown>,
  expectedVerifier: () => string | undefined,
  tokenRequests: URLSearchParams[] = [],
): typeof globalThis.fetch {
  return async (input, init) => {
    const url = String(input);
    if (url === "https://oidc.example.test/.well-known/openid-configuration") {
      return new Response(
        JSON.stringify({
          authorization_endpoint: "https://oidc.example.test/authorize",
          token_endpoint: "https://oidc.example.test/token",
          userinfo_endpoint: "https://oidc.example.test/userinfo",
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }
    if (url === "https://oidc.example.test/token") {
      const params = new URLSearchParams(String(init?.body ?? ""));
      tokenRequests.push(params);
      if (params.get("code_verifier") !== expectedVerifier()) {
        return new Response("PKCE verifier mismatch", { status: 400 });
      }
      return new Response(
        JSON.stringify({ access_token: "test-access-token" }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }
    if (url === "https://oidc.example.test/userinfo") {
      assert.equal(
        (init?.headers as Record<string, string>)?.Authorization,
        "Bearer test-access-token",
      );
      return new Response(JSON.stringify(userInfo), {
        headers: { "Content-Type": "application/json" },
      });
    }
    throw new Error(`Unexpected test fetch: ${url}`);
  };
}

function cookieFrom(response: HttpResponse, name: string): string {
  const cookies = response.headers["set-cookie"];
  const cookie = (Array.isArray(cookies) ? cookies : []).find((value) =>
    value.startsWith(`${name}=`),
  );
  assert.ok(cookie, `response should set ${name}`);
  return cookie.split(";", 1)[0];
}

async function beginLogin(
  server: Server,
  database: FakeAuthDatabase,
  returnTo = "/calendar",
): Promise<{ flow: Flow; cookie: string; response: HttpResponse }> {
  const response = await request(
    server,
    `/auth/login?returnTo=${encodeURIComponent(returnTo)}`,
    {
      "x-forwarded-host": "calendar.example.test",
      "x-forwarded-proto": "https",
    },
  );
  assert.equal(response.statusCode, 302);
  const flow = database.latestFlow();
  return {
    flow,
    cookie: cookieFrom(response, "menashe_auth_flow"),
    response,
  };
}

test("successful callback validates PKCE, fetches OIDC identity, and creates a session", async () => {
  const database = new FakeAuthDatabase();
  const tokenRequests: URLSearchParams[] = [];
  let expectedVerifier: string | undefined;

  await withFetch(
    oidcFetch(
      {
        sub: "replit-subject-1",
        email: "Member@Example.test",
        email_verified: true,
        given_name: "Menashe",
        family_name: "Member",
        picture: "https://images.example.test/member.png",
      },
      () => expectedVerifier,
      tokenRequests,
    ),
    () =>
      withDatabase(database, async () => {
        const server = await openServer();
        try {
          const login = await beginLogin(server, database);
          expectedVerifier = login.flow.codeVerifier;
          const location = new URL(login.response.headers.location as string);
          const expectedChallenge = createHash("sha256")
            .update(login.flow.codeVerifier)
            .digest("base64url");

          assert.equal(location.origin, "https://oidc.example.test");
          assert.equal(location.pathname, "/authorize");
          assert.equal(
            location.searchParams.get("client_id"),
            "replit-test-client",
          );
          assert.equal(
            location.searchParams.get("redirect_uri"),
            "https://calendar.example.test/api/auth/callback",
          );
          assert.equal(location.searchParams.get("state"), login.flow.state);
          assert.equal(
            location.searchParams.get("code_challenge"),
            expectedChallenge,
          );
          assert.equal(
            location.searchParams.get("code_challenge_method"),
            "S256",
          );

          const callback = await request(
            server,
            `/auth/callback?code=authorization-code&state=${encodeURIComponent(login.flow.state)}`,
            {
              cookie: login.cookie,
              "x-forwarded-host": "calendar.example.test",
              "x-forwarded-proto": "https",
            },
          );

          assert.equal(callback.statusCode, 302);
          assert.equal(callback.headers.location, "/calendar");
          assert.equal(tokenRequests.length, 1);
          assert.match(
            (callback.headers["set-cookie"] as string[]).find((value) =>
              value.startsWith("menashe_auth_flow="),
            ) ?? "",
            /Max-Age=0/,
          );
          assert.equal(tokenRequests[0].get("code"), "authorization-code");
          assert.equal(
            tokenRequests[0].get("redirect_uri"),
            "https://calendar.example.test/api/auth/callback",
          );
          assert.equal(
            tokenRequests[0].get("code_verifier"),
            login.flow.codeVerifier,
          );
          const sessionCookie = cookieFrom(callback, "menashe_session");
          assert.match(sessionCookie, /^menashe_session=.+\..+$/);
          assert.equal(
            database.latestSession().accountId,
            "replit:replit-subject-1",
          );
          assert.equal(database.latestSession().email, "member@example.test");
        } finally {
          await closeServer(server);
        }
      }),
  );
});

test("invalid and expired callback state is rejected before token exchange", async () => {
  for (const scenario of ["invalid state", "expired state"]) {
    const database = new FakeAuthDatabase();
    let tokenCalls = 0;
    await withFetch(
      async (input, init) => {
        const response = await oidcFetch(
          { sub: "unused", email_verified: true },
          () => undefined,
        )(input, init);
        if (String(input).endsWith("/token")) tokenCalls += 1;
        return response;
      },
      () =>
        withDatabase(database, async () => {
          const server = await openServer();
          try {
            const login = await beginLogin(server, database);
            if (scenario === "expired state") {
              database.expiredFlows.add(login.flow.id);
            }
            const state =
              scenario === "invalid state"
                ? "attacker-state"
                : login.flow.state;
            const callback = await request(
              server,
              `/auth/callback?code=authorization-code&state=${encodeURIComponent(state)}`,
              {
                cookie: login.cookie,
                "x-forwarded-host": "calendar.example.test",
                "x-forwarded-proto": "https",
              },
            );
            assert.equal(callback.statusCode, 400, scenario);
            assert.match(callback.body, /Expired or invalid/);
            assert.equal(tokenCalls, 0);
          } finally {
            await closeServer(server);
          }
        }),
    );
  }
});

test("PKCE verifier mismatch fails the callback and creates no session", async () => {
  const database = new FakeAuthDatabase();
  const tokenRequests: URLSearchParams[] = [];
  let expectedVerifier: string | undefined;

  await withFetch(
    oidcFetch(
      {
        sub: "replit-subject-mismatch",
        email: "member@example.test",
        email_verified: true,
      },
      () => expectedVerifier,
      tokenRequests,
    ),
    () =>
      withDatabase(database, async () => {
        const server = await openServer();
        try {
          const login = await beginLogin(server, database);
          expectedVerifier = login.flow.codeVerifier;
          database.flows.get(login.flow.id)!.codeVerifier = "tampered-verifier";

          const callback = await request(
            server,
            `/auth/callback?code=authorization-code&state=${encodeURIComponent(login.flow.state)}`,
            {
              cookie: login.cookie,
              "x-forwarded-host": "calendar.example.test",
              "x-forwarded-proto": "https",
            },
          );

          assert.equal(callback.statusCode, 502);
          assert.match(callback.body, /sign-in failed/);
          assert.equal(
            tokenRequests[0].get("code_verifier"),
            "tampered-verifier",
          );
          assert.equal(database.sessions.size, 0);
        } finally {
          await closeServer(server);
        }
      }),
  );
});

test("unverified email cannot auto-link a Replit subject to another account", async () => {
  const database = new FakeAuthDatabase();
  let expectedVerifier: string | undefined;

  await withFetch(
    oidcFetch(
      {
        sub: "replit-subject-without-verified-email",
        email: "legacy@example.test",
        email_verified: false,
        name: "Unverified Member",
      },
      () => expectedVerifier,
    ),
    () =>
      withDatabase(database, async () => {
        const server = await openServer();
        try {
          const login = await beginLogin(server, database);
          expectedVerifier = login.flow.codeVerifier;
          const callback = await request(
            server,
            `/auth/callback?code=authorization-code&state=${encodeURIComponent(login.flow.state)}`,
            {
              cookie: login.cookie,
              "x-forwarded-host": "calendar.example.test",
              "x-forwarded-proto": "https",
            },
          );

          assert.equal(callback.statusCode, 302);
          const identity = database.identities.get(
            "replit-subject-without-verified-email",
          );
          assert.ok(identity);
          assert.equal(
            identity.account_id,
            "replit:replit-subject-without-verified-email",
          );
          assert.equal(identity.email, null);
          assert.equal(identity.email_verified, false);
          assert.equal(identity.link_status, "unmatched");
        } finally {
          await closeServer(server);
        }
      }),
  );
});

test("expired sessions are rejected and logout deletes the active session", async () => {
  const database = new FakeAuthDatabase();
  let expectedVerifier: string | undefined;

  await withFetch(
    oidcFetch(
      {
        sub: "replit-session-user",
        email: "session@example.test",
        email_verified: true,
      },
      () => expectedVerifier,
    ),
    () =>
      withDatabase(database, async () => {
        const server = await openServer();
        try {
          const firstLogin = await beginLogin(server, database, "/");
          expectedVerifier = firstLogin.flow.codeVerifier;
          const firstCallback = await request(
            server,
            `/auth/callback?code=code-1&state=${encodeURIComponent(firstLogin.flow.state)}`,
            {
              cookie: firstLogin.cookie,
              "x-forwarded-host": "calendar.example.test",
              "x-forwarded-proto": "https",
            },
          );
          const sessionCookie = cookieFrom(firstCallback, "menashe_session");

          const authenticated = await request(server, "/auth/user", {
            cookie: sessionCookie,
          });
          assert.equal(authenticated.statusCode, 200);
          assert.match(authenticated.body, /session@example\.test/);

          const logout = await request(server, "/auth/logout", {
            cookie: sessionCookie,
          });
          assert.equal(logout.statusCode, 302);
          assert.equal(logout.headers.location, "/");
          assert.match(
            (logout.headers["set-cookie"] as string[]).find((value) =>
              value.startsWith("menashe_session="),
            ) ?? "",
            /Max-Age=0/,
          );
          assert.equal(database.deletedSessionIds.length, 1);

          const afterLogout = await request(server, "/auth/user", {
            cookie: sessionCookie,
          });
          assert.equal(afterLogout.statusCode, 401);

          const secondLogin = await beginLogin(server, database, "/");
          expectedVerifier = secondLogin.flow.codeVerifier;
          const secondCallback = await request(
            server,
            `/auth/callback?code=code-2&state=${encodeURIComponent(secondLogin.flow.state)}`,
            {
              cookie: secondLogin.cookie,
              "x-forwarded-host": "calendar.example.test",
              "x-forwarded-proto": "https",
            },
          );
          const expiredCookie = cookieFrom(secondCallback, "menashe_session");
          database.expiredSessions.add(database.latestSession().id);
          const expired = await request(server, "/auth/user", {
            cookie: expiredCookie,
          });
          assert.equal(expired.statusCode, 401);
        } finally {
          await closeServer(server);
        }
      }),
  );
});

test("provider-neutral authorization rejects signed-out Clerk requests and gates admin routes", async () => {
  const app = express();
  app.use((req, _res, next) => {
    const authHeader = req.get("x-test-auth");
    const clerkAuth = (userId: string | null, orgRole: string | null) => {
      const authObject = userId
        ? {
            tokenType: "session_token",
            sessionClaims: { sub: userId },
            sessionId: "test-session",
            sessionStatus: "active",
            userId,
            actor: null,
            orgId: null,
            orgRole,
            orgSlug: null,
            orgPermissions: null,
            factorVerificationAge: null,
            getToken: async () => null,
            has: () => false,
            debug: () => ({}),
            isAuthenticated: true,
          }
        : { userId: null, orgRole: null };
      return Object.assign(() => authObject, {
        [Symbol.for("@clerk/express.auth")]: true,
      });
    };
    if (authHeader === "member") {
      (req as any).auth = clerkAuth("clerk-member", "org:member");
    } else if (authHeader === "admin") {
      (req as any).auth = clerkAuth("clerk-admin", "org:admin");
    } else if (authHeader === "signed-out") {
      (req as any).auth = clerkAuth(null, null);
    }
    next();
  });
  app.get("/protected", requireAuth, (_req, res) => res.json({ ok: true }));
  app.get("/admin-only", requireAdmin, (_req, res) => res.json({ ok: true }));
  const server = createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  try {
    assert.equal((await request(server, "/protected")).statusCode, 401);
    assert.equal(
      (await request(server, "/protected", { "x-test-auth": "signed-out" }))
        .statusCode,
      401,
    );
    assert.equal(
      (await request(server, "/admin-only", { "x-test-auth": "member" }))
        .statusCode,
      403,
    );
    assert.equal(
      (await request(server, "/admin-only", { "x-test-auth": "admin" }))
        .statusCode,
      200,
    );
  } finally {
    await closeServer(server);
  }
});

test("branch admin helpers enforce authentication and national role boundaries", async () => {
  const database = new FakeAuthDatabase();
  await withDatabase(database, async () => {
    const unauthorizedResponse = {
      status: (code: number) => ({
        json: (body: unknown) => ({ code, body }),
      }),
    } as any;
    let unauthorizedNext = false;
    await requireRegionalAdmin({} as any, unauthorizedResponse, () => {
      unauthorizedNext = true;
    });
    assert.equal(unauthorizedNext, false);

    let memberNext = false;
    const memberResponse = {
      status: (code: number) => ({
        json: (body: unknown) => {
          assert.equal(code, 403);
          assert.match(JSON.stringify(body), /National Admin/);
        },
      }),
    } as any;
    await requireNationalAdmin(
      { auth: { userId: "clerk-member", orgRole: "org:member" } } as any,
      memberResponse,
      () => {
        memberNext = true;
      },
    );
    assert.equal(memberNext, false);

    let adminNext = false;
    const adminRequest = {
      replitAuth: {
        provider: "replit",
        userId: "replit-admin",
        subject: "subject",
        email: "admin@example.test",
        name: "Admin",
        imageUrl: null,
        isAdmin: true,
        createdAt: "2026-08-31T00:00:00.000Z",
      },
    } as any;
    await requireNationalAdmin(adminRequest, {} as any, () => {
      adminNext = true;
      assert.equal(adminRequest.userId, "replit-admin");
      assert.equal(adminRequest.adminRole, "national_admin");
    });
    assert.equal(adminNext, true);
  });
});
