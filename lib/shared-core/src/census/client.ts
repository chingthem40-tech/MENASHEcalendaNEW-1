/**
 * Canonical Census client.
 *
 * This is the only supported client for the Census API endpoints.
 * Web and Mobile both consume it — neither owns it.
 *
 * The fetcher is injectable (baseUrl + auth token getter) so this module
 * stays platform-agnostic: web passes a Clerk-backed token getter today,
 * mobile can wire in its own token source later without duplicating any
 * of this logic.
 */

import type { Branch, CensusRow, FamilyMember } from "./types";

export interface CensusClientConfig {
  /** Defaults to "/api" (same-origin), matching the web app's dev proxy. */
  baseUrl?: string;
  /** Optional async/sync getter for a bearer token, e.g. Clerk's session token. */
  getAuthToken?: () => Promise<string | null> | string | null;
}

export type SubmissionStatus = "pending" | "approved" | "rejected";

export interface CensusSubmission {
  id: string;
  branch: Branch;
  submittedAt: string;
  status: SubmissionStatus;
  reviewNote?: string;
  reviewedAt?: string;
}

export interface CensusMemberSubmission {
  id: string;
  branchId: string;
  branchName: string;
  submitterName: string;
  submitterNote?: string;
  headCensus: CensusRow;
  members: FamilyMember[];
  status: SubmissionStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
}

const DEFAULT_BASE_URL = "/api";

async function censusFetch<T>(path: string, config: CensusClientConfig, options: RequestInit = {}): Promise<T> {
  const baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
  const token = config.getAuthToken ? await config.getAuthToken() : null;
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Census API ${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

/* ── Branch (Local Admin) ─────────────────────────────────────────────────── */

export async function getBranch(config: CensusClientConfig = {}): Promise<Branch | null> {
  try {
    return await censusFetch<Branch>("/census/branch", config);
  } catch {
    return null;
  }
}

export async function saveBranch(branch: Branch, config: CensusClientConfig = {}): Promise<void> {
  try {
    await censusFetch<void>("/census/branch", config, { method: "PUT", body: JSON.stringify(branch) });
  } catch {}
}

/* ── Submissions (Global Admin review) ───────────────────────────────────── */

export async function getSubmissions(config: CensusClientConfig = {}): Promise<CensusSubmission[]> {
  try {
    return await censusFetch<CensusSubmission[]>("/census/submissions", config);
  } catch {
    return [];
  }
}

export async function submitBranch(branch: Branch, config: CensusClientConfig = {}): Promise<CensusSubmission> {
  return await censusFetch<CensusSubmission>("/census/submissions", config, {
    method: "POST",
    body: JSON.stringify({ branch }),
  });
}

export async function approveSubmission(
  id: string,
  status: Extract<SubmissionStatus, "approved" | "rejected">,
  reviewNote: string | undefined,
  config: CensusClientConfig = {},
): Promise<void> {
  try {
    await censusFetch<void>(`/census/submissions/${id}`, config, {
      method: "PATCH",
      body: JSON.stringify({ status, reviewNote }),
    });
  } catch {}
}

/* ── Member submissions ───────────────────────────────────────────────────── */

export async function getMemberSubmissions(config: CensusClientConfig = {}): Promise<CensusMemberSubmission[]> {
  try {
    return await censusFetch<CensusMemberSubmission[]>("/census/member-submissions", config);
  } catch {
    return [];
  }
}

export async function submitMember(
  entry: Omit<CensusMemberSubmission, "id" | "submittedAt" | "status">,
  config: CensusClientConfig = {},
): Promise<CensusMemberSubmission> {
  return await censusFetch<CensusMemberSubmission>("/census/member-submissions", config, {
    method: "POST",
    body: JSON.stringify(entry),
  });
}

export async function approveMember(
  id: string,
  status: SubmissionStatus,
  reviewNote: string | undefined,
  config: CensusClientConfig = {},
): Promise<void> {
  try {
    await censusFetch<void>(`/census/member-submissions/${id}`, config, {
      method: "PATCH",
      body: JSON.stringify({ status, reviewNote }),
    });
  } catch {}
}
