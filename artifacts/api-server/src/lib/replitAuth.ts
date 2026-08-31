import { createHash, createHmac, randomBytes } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { pool } from "@workspace/db";
import { logger } from "./logger";
import { findLegacyClerkMatches } from "./authMigration";

const ISSUER_URL = process.env.ISSUER_URL ?? "https://replit.com/oidc";
const CLIENT_ID = process.env.REPLIT_AUTH_CLIENT_ID ?? process.env.REPL_ID;
const SESSION_COOKIE = "menashe_session";
const FLOW_COOKIE = "menashe_auth_flow";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const FLOW_TTL_SECONDS = 10 * 60;

type OidcConfiguration = {
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint?: string;
};

type OidcUserInfo = {
  sub?: unknown;
  email?: unknown;
  email_verified?: unknown;
  name?: unknown;
  given_name?: unknown;
  family_name?: unknown;
  picture?: unknown;
};

export type RequestAuth = {
  provider: "replit" | "clerk";
  subject: string;
  userId: string;
  email: string | null;
  name: string;
  imageUrl: string | null;
  isAdmin: boolean;
  createdAt: string;
};

declare global {
  namespace Express {
    interface Request {
      replitAuth?: RequestAuth;
      userId?: string;
    }
  }
}

let oidcConfigurationPromise: Promise<OidcConfiguration> | null = null;

function sessionSecret(): string {
  const value = process.env.SESSION_SECRET?.trim();
  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET must be set to at least 32 characters");
  }
  return value;
}

function base64Url(value: Buffer | string): string {
  return Buffer.from(value).toString("base64url");
}

function randomToken(bytes = 32): string {
  return base64Url(randomBytes(bytes));
}

function sign(value: string): string {
  return base64Url(
    createHmac("sha256", sessionSecret()).update(value).digest(),
  );
}

function signedValue(value: string): string {
  return `${value}.${sign(value)}`;
}

function verifySignedValue(raw: string | undefined): string | null {
  if (!raw) return null;
  const separator = raw.lastIndexOf(".");
  if (separator <= 0) return null;
  const value = raw.slice(0, separator);
  const signature = raw.slice(separator + 1);
  const expected = sign(value);
  if (signature.length !== expected.length) return null;
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) mismatch |= a[i] ^ b[i];
  return mismatch === 0 ? value : null;
}

function cookieValue(req: Request, name: string): string | null {
  const header = req.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function setCookie(
  res: Response,
  name: string,
  value: string,
  maxAgeSeconds: number,
): void {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.append(
    "Set-Cookie",
    `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=/; HttpOnly; SameSite=Lax${secure}`,
  );
}

function clearCookie(res: Response, name: string): void {
  setCookie(res, name, "", 0);
}

function safeReturnTo(raw: unknown): string {
  if (typeof raw !== "string") return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

function callbackOrigin(req: Request): string {
  const forwardedHost = req.get("x-forwarded-host") ?? req.get("host");
  if (!forwardedHost) throw new Error("Unable to determine callback host");
  const forwardedProto = req.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol =
    forwardedProto === "https" || process.env.NODE_ENV === "production"
      ? "https"
      : "http";
  return `${protocol}://${forwardedHost}`;
}

function callbackUrl(req: Request): string {
  return `${callbackOrigin(req)}/api/auth/callback`;
}

async function oidcConfiguration(): Promise<OidcConfiguration> {
  if (!oidcConfigurationPromise) {
    oidcConfigurationPromise = fetch(
      `${ISSUER_URL.replace(/\/$/, "")}/.well-known/openid-configuration`,
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Replit Auth discovery failed (${response.status})`);
        }
        const json = (await response.json()) as Partial<OidcConfiguration>;
        if (!json.authorization_endpoint || !json.token_endpoint) {
          throw new Error("Replit Auth discovery response is incomplete");
        }
        return json as OidcConfiguration;
      })
      .catch((error) => {
        oidcConfigurationPromise = null;
        throw error;
      });
  }
  return oidcConfigurationPromise;
}

async function resolveAccount(
  subject: string,
  email: string | null,
  emailVerified: boolean,
  name: string,
  imageUrl: string | null,
): Promise<RequestAuth> {
  const existing = await pool.query<{
    account_id: string;
    email: string | null;
    email_verified: boolean;
    link_status: string;
    display_name: string;
    image_url: string | null;
    created_at: string;
  }>(
    `SELECT account_id, email, display_name, image_url
            , email_verified, link_status
       FROM auth_identities
      WHERE provider = 'replit' AND provider_subject = $1`,
    [subject],
  );

  const existingIdentity = existing.rows[0];
  let userId: string;
  let linkStatus: string;
  if (existingIdentity) {
    userId = existingIdentity.account_id;
    linkStatus = existingIdentity.link_status;
  } else {
    const matches =
      email && emailVerified ? await findLegacyClerkMatches(email) : [];
    userId = matches.length === 1 ? matches[0] : `replit:${subject}`;
    linkStatus =
      matches.length === 1
        ? "auto_linked"
        : matches.length > 1
          ? "ambiguous"
          : "unmatched";
  }

  const identity = await pool.query<{ created_at: string }>(
    `INSERT INTO auth_identities
       (provider, provider_subject, account_id, email, email_verified, link_status,
        display_name, image_url, updated_at)
     VALUES ('replit', $1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (provider, provider_subject)
     DO UPDATE SET email = EXCLUDED.email,
                   email_verified = EXCLUDED.email_verified,
                   display_name = EXCLUDED.display_name,
                   image_url = EXCLUDED.image_url,
                    updated_at = NOW()
      RETURNING created_at`,
    [subject, userId, email, emailVerified, linkStatus, name, imageUrl],
  );

  const isAdmin = await applicationAdminForAccount(userId);
  return {
    provider: "replit",
    subject,
    userId,
    email,
    name,
    imageUrl,
    isAdmin,
    createdAt: String(
      identity.rows[0]?.created_at ??
        existing.rows[0]?.created_at ??
        new Date().toISOString(),
    ),
  };
}

async function applicationAdminForAccount(accountId: string): Promise<boolean> {
  const { rows } = await pool.query(
    `SELECT 1 FROM app_admin_assignments WHERE account_id = $1
      UNION ALL
      SELECT 1 WHERE $1 = $2
      LIMIT 1`,
    [accountId, process.env.ADMIN_USER_ID ?? ""],
  );
  return rows.length > 0;
}

async function createSession(auth: RequestAuth): Promise<string> {
  const id = randomToken(32);
  await pool.query(
    `INSERT INTO auth_sessions
       (id, account_id, provider, provider_subject, email, display_name, image_url, is_admin, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() + INTERVAL '30 days')`,
    [
      id,
      auth.userId,
      auth.provider,
      auth.subject,
      auth.email,
      auth.name,
      auth.imageUrl,
      auth.isAdmin,
    ],
  );
  return id;
}

async function loadSession(sessionId: string): Promise<RequestAuth | null> {
  const result = await pool.query<{
    account_id: string;
    provider: "replit" | "clerk";
    provider_subject: string;
    email: string | null;
    display_name: string;
    image_url: string | null;
    is_admin: boolean;
    created_at: string;
  }>(
    `SELECT s.account_id, s.provider, s.provider_subject, s.email, s.display_name,
            s.image_url, (s.is_admin OR a.account_id IS NOT NULL) AS is_admin,
            s.created_at
       FROM auth_sessions s
       LEFT JOIN app_admin_assignments a ON a.account_id = s.account_id
      WHERE id = $1 AND expires_at > NOW()`,
    [sessionId],
  );
  const row = result.rows[0];
  if (!row) return null;
  void pool.query(
    "UPDATE auth_sessions SET last_seen_at = NOW() WHERE id = $1",
    [sessionId],
  );
  return {
    provider: row.provider,
    subject: row.provider_subject,
    userId: row.account_id,
    email: row.email,
    name: row.display_name,
    imageUrl: row.image_url,
    isAdmin: row.is_admin || row.account_id === process.env.ADMIN_USER_ID,
    createdAt: String(row.created_at),
  };
}

async function userInfoFromCode(
  code: string,
  codeVerifier: string,
  req: Request,
): Promise<OidcUserInfo> {
  const configuration = await oidcConfiguration();
  if (!CLIENT_ID) throw new Error("REPL_ID is required for Replit Auth");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: CLIENT_ID,
    redirect_uri: callbackUrl(req),
    code_verifier: codeVerifier,
  });
  const response = await fetch(configuration.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    throw new Error(`Replit Auth token exchange failed (${response.status})`);
  }
  const tokens = (await response.json()) as { access_token?: unknown };
  if (typeof tokens.access_token !== "string")
    throw new Error("Replit Auth token response did not include an access token");
  if (!configuration.userinfo_endpoint)
    throw new Error("Replit Auth discovery did not include a userinfo endpoint");
  const userResponse = await fetch(configuration.userinfo_endpoint, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!userResponse.ok) {
    throw new Error(`Replit Auth userinfo failed (${userResponse.status})`);
  }
  return (await userResponse.json()) as OidcUserInfo;
}

function normalizeUserInfo(info: OidcUserInfo): {
  subject: string;
  email: string | null;
  emailVerified: boolean;
  name: string;
  imageUrl: string | null;
} {
  const subject = typeof info.sub === "string" ? info.sub : "";
  if (!subject)
    throw new Error("Replit Auth userinfo did not include a subject");
  const emailVerified =
    info.email_verified === true || info.email_verified === "true";
  const email =
    emailVerified && typeof info.email === "string" && info.email.includes("@")
      ? info.email.trim().toLowerCase()
      : null;
  const name =
    (typeof info.name === "string" && info.name.trim()) ||
    [info.given_name, info.family_name]
      .filter((value): value is string => typeof value === "string")
      .join(" ")
      .trim() ||
    email ||
    "Menashe member";
  return {
    subject,
    email,
    emailVerified,
    name,
    imageUrl: typeof info.picture === "string" ? info.picture : null,
  };
}

export const replitAuthMiddleware = () => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const raw = cookieValue(req, SESSION_COOKIE);
    const sessionId = verifySignedValue(raw ?? undefined);
    if (!sessionId) {
      next();
      return;
    }
    loadSession(sessionId)
      .then((auth) => {
        if (auth) {
          req.replitAuth = auth;
          req.userId = auth.userId;
        }
        next();
      })
      .catch((error) => {
        logger.warn({ err: error }, "Could not load Replit Auth session");
        next();
      });
  };
};

export const replitAuthRouter = Router();

replitAuthRouter.get("/auth/login", async (req, res) => {
  try {
    if (!CLIENT_ID) throw new Error("REPL_ID is required for Replit Auth");
    const configuration = await oidcConfiguration();
    const state = randomToken(32);
    const codeVerifier = randomToken(48);
    const codeChallenge = base64Url(
      createHash("sha256").update(codeVerifier).digest(),
    );
    const flowId = randomToken(32);
    const returnTo = safeReturnTo(req.query.returnTo);
    await pool.query(
      `INSERT INTO auth_login_flows (id, state, code_verifier, return_to, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '10 minutes')`,
      [flowId, state, codeVerifier, returnTo],
    );
    setCookie(res, FLOW_COOKIE, signedValue(flowId), FLOW_TTL_SECONDS);
    const authUrl = new URL(configuration.authorization_endpoint);
    authUrl.search = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: callbackUrl(req),
      response_type: "code",
      scope: "openid email profile",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    }).toString();
    res.redirect(authUrl.toString());
  } catch (error) {
    logger.error({ err: error }, "Could not start Replit Auth login");
    res.status(503).json({ error: "Replit Auth is not ready" });
  }
});

replitAuthRouter.get("/auth/callback", async (req, res) => {
  const flowId = verifySignedValue(cookieValue(req, FLOW_COOKIE) ?? undefined);
  clearCookie(res, FLOW_COOKIE);
  if (
    !flowId ||
    typeof req.query.code !== "string" ||
    typeof req.query.state !== "string"
  ) {
    res.status(400).send("Invalid Replit Auth callback");
    return;
  }

  try {
    const flow = await pool.query<{
      state: string;
      code_verifier: string;
      return_to: string;
    }>(
      `DELETE FROM auth_login_flows
        WHERE id = $1 AND state = $2 AND expires_at > NOW()
        RETURNING state, code_verifier, return_to`,
      [flowId, req.query.state],
    );
    const stored = flow.rows[0];
    if (!stored) {
      res.status(400).send("Expired or invalid Replit Auth callback");
      return;
    }

    const info = normalizeUserInfo(
      await userInfoFromCode(req.query.code, stored.code_verifier, req),
    );
    const auth = await resolveAccount(
      info.subject,
      info.email,
      info.emailVerified,
      info.name,
      info.imageUrl,
    );
    const sessionId = await createSession(auth);
    setCookie(res, SESSION_COOKIE, signedValue(sessionId), SESSION_TTL_SECONDS);
    res.redirect(safeReturnTo(stored.return_to));
  } catch (error) {
    logger.error({ err: error }, "Replit Auth callback failed");
    res.status(502).send("Replit Auth sign-in failed");
  }
});

replitAuthRouter.get("/auth/user", (req, res) => {
  if (!req.replitAuth) {
    res.status(401).json({ authenticated: false });
    return;
  }
  res.json({
    authenticated: true,
    user: {
      id: req.replitAuth.userId,
      subject: req.replitAuth.subject,
      email: req.replitAuth.email,
      name: req.replitAuth.name,
      imageUrl: req.replitAuth.imageUrl,
      isAdmin: req.replitAuth.isAdmin,
      createdAt: req.replitAuth.createdAt,
    },
  });
});

replitAuthRouter.get("/auth/logout", async (req, res) => {
  const sessionId = verifySignedValue(
    cookieValue(req, SESSION_COOKIE) ?? undefined,
  );
  if (sessionId) {
    await pool.query("DELETE FROM auth_sessions WHERE id = $1", [sessionId]);
  }
  clearCookie(res, SESSION_COOKIE);
  res.redirect("/");
});

export function getRequestAuth(req: Request): RequestAuth | null {
  return req.replitAuth ?? null;
}