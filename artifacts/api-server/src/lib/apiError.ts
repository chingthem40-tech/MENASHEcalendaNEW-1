/**
 * Standardized API error responses.
 *
 * Use these helpers everywhere in route handlers so all error payloads
 * have a consistent shape: { error: string, details?: unknown }
 *
 * Successful response payloads are NOT touched — this only covers errors.
 */
import type { Response } from "express";

export interface ApiErrorBody {
  error: string;
  details?: unknown;
}

export const apiError = {
  badRequest(res: Response, message: string, details?: unknown): void {
    const body: ApiErrorBody = { error: message };
    if (details !== undefined) body.details = details;
    res.status(400).json(body);
  },

  unauthorized(res: Response, message = "Unauthorized"): void {
    res.status(401).json({ error: message });
  },

  forbidden(res: Response, message = "Forbidden"): void {
    res.status(403).json({ error: message });
  },

  notFound(res: Response, message = "Not found"): void {
    res.status(404).json({ error: message });
  },

  tooManyRequests(res: Response, message = "Too many requests — please try again later"): void {
    res.status(429).json({ error: message });
  },

  unavailable(res: Response, message = "Service unavailable"): void {
    res.status(503).json({ error: message });
  },

  internal(res: Response, message = "Internal server error"): void {
    res.status(500).json({ error: message });
  },
};
