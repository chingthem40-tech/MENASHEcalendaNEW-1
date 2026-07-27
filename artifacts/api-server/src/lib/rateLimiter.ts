import type { Request, Response, NextFunction } from "express";

// Self-contained in-memory rate limiter — no external dependency required.
// Three tiers:
//  - global   : 300 req / 15 min per IP  (applied globally)
//  - ai       : 20  req / 15 min per IP  (chat, parsha/holiday insights)
//  - payment  : 10  req / 15 min per IP  (order creation, verification)
//  - push     : 20  req / 60 min per IP  (push subscription)

interface WindowRecord {
  count: number;
  resetAt: number;
}

function makeRateLimiter(
  windowMs: number,
  max: number,
  message: string,
  skip?: (req: Request) => boolean,
) {
  const store = new Map<string, WindowRecord>();

  // Periodically prune stale entries
  setInterval(() => {
    const now = Date.now();
    for (const [key, rec] of store) {
      if (rec.resetAt <= now) store.delete(key);
    }
  }, 60_000).unref();

  return function rateLimit(req: Request, res: Response, next: NextFunction) {
    if (skip && skip(req)) return next();

    const ip =
      String((req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? "") ||
      req.socket.remoteAddress ||
      "unknown";

    const now = Date.now();
    const existing = store.get(ip);

    if (!existing || existing.resetAt <= now) {
      store.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    existing.count++;
    if (existing.count > max) {
      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", 0);
      res.setHeader("Retry-After", Math.ceil((existing.resetAt - now) / 1000));
      return res.status(429).json({ error: message });
    }

    return next();
  };
}

export const globalRateLimiter = makeRateLimiter(
  15 * 60 * 1000,
  300,
  "Too many requests — please try again later",
  (req) => req.path === "/healthz",
);

export const aiRateLimiter = makeRateLimiter(
  15 * 60 * 1000,
  20,
  "AI request limit reached — please wait before trying again",
);

export const paymentRateLimiter = makeRateLimiter(
  15 * 60 * 1000,
  10,
  "Too many payment requests — please wait before trying again",
);

export const pushSubscribeRateLimiter = makeRateLimiter(
  60 * 60 * 1000,
  20,
  "Too many subscription attempts — please try again later",
);
