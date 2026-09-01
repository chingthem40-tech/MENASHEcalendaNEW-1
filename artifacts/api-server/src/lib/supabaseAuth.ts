import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { pool } from "@workspace/db";
import { logger } from "./logger";
import { listLegacyClerkIdentities } from "./authMigration";

export type RequestAuth = {
  provider: "supabase";
  subject: string;
  userId: string;
  email: string | null;
  name: string;
  imageUrl: string | null;
  isAdmin: boolean;
  createdAt: string;
};

function safeReturnTo(raw: unknown): string {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.includes("\\")) {
    return "/";
  }
  try {
    const parsed = new URL(raw, "https://menashe.invalid");
    if (parsed.origin !== "https://menashe.invalid") return "/";
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/";
  }
}

declare global {
  namespace Express {
    interface Request {
      supabaseAuth?: RequestAuth;
      supabaseAuthError?: "legacy_identity_unavailable";
      userId?: string;
    }
  }
}

let serverClient: SupabaseClient | null = null;

function config(): { url: string; publishableKey: string } | null {
  const url = process.env.VITE_SUPABASE_URL?.trim();
  const publishableKey =
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !publishableKey) return null;
  return { url, publishableKey };
}

function getServerClient(): SupabaseClient | null {
  if (serverClient) return serverClient;
  const current = config();
  if (!current) return null;
  serverClient = createClient(current.url, current.publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
  return serverClient;
}

function bearerToken(req: Request): string | null {
  const header = req.get("authorization");
  if (!header) return null;
  const [scheme, token, ...rest] = header.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== "bearer" || !token || rest.length > 0) {
    return null;
  }
  return token;
}

function normalizedEmail(user: User): string | null {
  const email = user.email?.trim().toLowerCase();
  return email && email.includes("@") ? email : null;
}

function displayName(user: User, email: string | null): string {
  const metadata = user.user_metadata ?? {};
  const value =
    (typeof metadata.full_name === "string" && metadata.full_name.trim()) ||
    (typeof metadata.name === "string" && metadata.name.trim()) ||
    email?.split("@")[0] ||
    "Menashe member";
  return value;
}

function imageUrl(user: User): string | null {
  const metadata = user.user_metadata ?? {};
  const value =
    (typeof metadata.avatar_url === "string" && metadata.avatar_url.trim()) ||
    (typeof metadata.picture === "string" && metadata.picture.trim());
  return value || null;
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

async function verifiedAccountMatches(email: string): Promise<string[]> {
  const { rows } = await pool.query<{ account_id: string }>(
    `SELECT DISTINCT account_id
       FROM auth_identities
      WHERE email_verified = true
        AND lower(email) = lower($1)
      ORDER BY account_id`,
    [email],
  );
  return rows.map((row) => row.account_id);
}

async function legacyAccountMatches(
  email: string,
): Promise<{
  accountIds: string[];
  directoryConfigured: boolean;
  directoryAvailable: boolean;
}> {
  const inventory = await listLegacyClerkIdentities();
  return {
    accountIds: inventory.users
      .filter((user) => user.verifiedEmails.includes(email))
      .map((user) => user.id),
    directoryConfigured: inventory.configured,
    directoryAvailable: inventory.available,
  };
}

export function chooseAccountLink(
  subject: string,
  matches: string[],
): {
  accountId: string;
  linkStatus: "auto_linked" | "ambiguous" | "unmatched";
} {
  if (matches.length === 1) {
    return { accountId: matches[0], linkStatus: "auto_linked" };
  }
  return {
    accountId: `supabase:${subject}`,
    linkStatus: matches.length > 1 ? "ambiguous" : "unmatched",
  };
}

export function mustDeferIdentityResolution(
  localMatches: string[],
  legacyDirectoryConfigured: boolean,
  legacyDirectoryAvailable: boolean,
): boolean {
  return (
    localMatches.length === 0 &&
    legacyDirectoryConfigured &&
    !legacyDirectoryAvailable
  );
}

class LegacyIdentityUnavailableError extends Error {
  constructor() {
    super("Legacy identity directory is temporarily unavailable");
    this.name = "LegacyIdentityUnavailableError";
  }
}

async function resolveAccount(user: User): Promise<RequestAuth> {
  const existing = await pool.query<{
    account_id: string;
    link_status: string;
    created_at: string;
  }>(
    `SELECT account_id, link_status, created_at
       FROM auth_identities
      WHERE provider = 'supabase' AND provider_subject = $1`,
    [user.id],
  );

  const email = normalizedEmail(user);
  const emailVerified = Boolean(user.email_confirmed_at);
  let accountId: string | undefined = existing.rows[0]?.account_id;
  let linkStatus: string | undefined = existing.rows[0]?.link_status;
  if (linkStatus === "legacy_unavailable") {
    accountId = undefined;
    linkStatus = undefined;
  }

  if (!accountId) {
    const localMatches =
      email && emailVerified ? await verifiedAccountMatches(email) : [];
    const legacy =
      email && emailVerified
        ? await legacyAccountMatches(email)
        : {
            accountIds: [],
            directoryConfigured: false,
            directoryAvailable: false,
          };
    if (
      mustDeferIdentityResolution(
        localMatches,
        legacy.directoryConfigured,
        legacy.directoryAvailable,
      )
    ) {
      throw new LegacyIdentityUnavailableError();
    }
    const matches = [...new Set([...localMatches, ...legacy.accountIds])];
    const decision = chooseAccountLink(user.id, matches);
    accountId = decision.accountId;
    linkStatus = decision.linkStatus;
  }

  const name = displayName(user, email);
  const avatar = imageUrl(user);
  const identity = await pool.query<{ created_at: string }>(
    `INSERT INTO auth_identities
       (provider, provider_subject, account_id, email, email_verified, link_status,
        display_name, image_url, updated_at)
     VALUES ('supabase', $1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (provider, provider_subject)
     DO UPDATE SET account_id =
                     CASE WHEN auth_identities.link_status = 'legacy_unavailable'
                          THEN EXCLUDED.account_id ELSE auth_identities.account_id END,
                   link_status =
                     CASE WHEN auth_identities.link_status = 'legacy_unavailable'
                          THEN EXCLUDED.link_status ELSE auth_identities.link_status END,
                   email = EXCLUDED.email,
                   email_verified = EXCLUDED.email_verified,
                   display_name = EXCLUDED.display_name,
                   image_url = EXCLUDED.image_url,
                   updated_at = NOW()
     RETURNING created_at`,
    [user.id, accountId, email, emailVerified, linkStatus, name, avatar],
  );

  return {
    provider: "supabase",
    subject: user.id,
    userId: accountId,
    email,
    name,
    imageUrl: avatar,
    isAdmin: await applicationAdminForAccount(accountId),
    createdAt: String(
      identity.rows[0]?.created_at ??
        existing.rows[0]?.created_at ??
        user.created_at,
    ),
  };
}

type SupabaseAuthMiddlewareOptions = {
  verifyToken?: (token: string) => Promise<User | null>;
  resolveUser?: (user: User) => Promise<RequestAuth>;
};

export function supabaseAuthMiddleware(
  options: SupabaseAuthMiddlewareOptions = {},
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const token = bearerToken(req);
    if (!token) {
      next();
      return;
    }

    const supabase = options.verifyToken ? null : getServerClient();
    if (!options.verifyToken && !supabase) {
      logger.error(
        "Supabase Auth is not configured — set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY",
      );
      next();
      return;
    }

    const verifyToken =
      options.verifyToken ??
      (async (value: string) => {
        const { data, error } = await supabase!.auth.getUser(value);
        return error ? null : data.user;
      });

    verifyToken(token)
      .then(async (user) => {
        if (!user) return;
        const auth = await (options.resolveUser ?? resolveAccount)(user);
        req.supabaseAuth = auth;
        req.userId = auth.userId;
      })
      .catch((error) => {
        if (error instanceof LegacyIdentityUnavailableError) {
          req.supabaseAuthError = "legacy_identity_unavailable";
          return;
        }
        logger.warn({ err: error }, "Could not verify Supabase access token");
      })
      .finally(next);
  };
}

export const supabaseAuthRouter = Router();

supabaseAuthRouter.get("/auth/user", (req, res) => {
  if (req.supabaseAuthError === "legacy_identity_unavailable") {
    res.status(503).json({
      authenticated: false,
      code: "legacy_identity_unavailable",
      error: "Account migration is temporarily unavailable",
    });
    return;
  }
  if (!req.supabaseAuth) {
    res.status(401).json({ authenticated: false });
    return;
  }
  res.json({
    authenticated: true,
    user: {
      id: req.supabaseAuth.userId,
      subject: req.supabaseAuth.subject,
      email: req.supabaseAuth.email,
      name: req.supabaseAuth.name,
      imageUrl: req.supabaseAuth.imageUrl,
      isAdmin: req.supabaseAuth.isAdmin,
      createdAt: req.supabaseAuth.createdAt,
    },
  });
});

supabaseAuthRouter.get("/auth/login", (req, res) => {
  const returnTo = safeReturnTo(req.query.returnTo);
  res.redirect(`/sign-in?returnTo=${encodeURIComponent(returnTo)}`);
});

supabaseAuthRouter.post("/auth/logout", (_req, res) => {
  res.json({ ok: true });
});

supabaseAuthRouter.get("/auth/logout", (_req, res) => {
  res.redirect("/");
});

export function getRequestAuth(req: Request): RequestAuth | null {
  return req.supabaseAuth ?? null;
}