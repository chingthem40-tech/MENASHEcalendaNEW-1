/**
 * Lightweight Census store — in-memory singleton + AsyncStorage draft persistence.
 *
 * Written to by family-head and family-members screens.
 * Read by review and submit screens.
 * Cleared on submit.
 *
 * Types match the canonical shared-core enums exactly:
 *   - MaritalStatus: "Single" | "Married" | "Divorced" | "Widowed" | ""
 *   - Relation: "spouse" | "son" | "daughter" | "grandson" | "granddaughter" |
 *               "daughter_in_law" | "son_in_law" | "other"
 *
 * Draft key bumped to v2 (v1 had wrong casing for MaritalStatus and wrong
 * Relation values that don't match the shared-core / API enums).
 */

import { storageGet, storageSet, storageRemove } from "./storageUtils";

// Re-export canonical types so screens can import from one place.
export type AliyahStatus   = "in_israel" | "awaiting" | "unknown";
export type MaritalStatus  = "Single" | "Married" | "Divorced" | "Widowed" | "";
export type Sex            = "M" | "F" | "";
export type Relation       =
  | "spouse"
  | "son"
  | "daughter"
  | "grandson"
  | "granddaughter"
  | "daughter_in_law"
  | "son_in_law"
  | "other"
  | "";

/** All 13 CensusRow fields + aliyahStatus for the family head. */
export interface CensusHeadData {
  surname:               string;
  namePerPassport:       string;
  hebrewName:            string;
  aadharNo:              string;
  sex:                   Sex;
  maritalStatus:         MaritalStatus;
  dob:                   string;
  fatherName:            string;
  motherName:            string;
  dateOfJudaismPractice: string;
  passportNo:            string;
  passportIssueDate:     string;
  passportExpiryDate:    string;
  aliyahStatus:          AliyahStatus;
}

/** All 13 CensusRow fields + relation + aliyahStatus for a household member. */
export interface CensusMemberData {
  id:                    string;
  relation:              Relation;
  surname:               string;
  namePerPassport:       string;
  hebrewName:            string;
  aadharNo:              string;
  sex:                   Sex;
  maritalStatus:         MaritalStatus;
  dob:                   string;
  fatherName:            string;
  motherName:            string;
  dateOfJudaismPractice: string;
  passportNo:            string;
  passportIssueDate:     string;
  passportExpiryDate:    string;
  aliyahStatus:          AliyahStatus;
}

interface CensusStore {
  head:    CensusHeadData | null;
  members: CensusMemberData[];
}

const _store: CensusStore = {
  head:    null,
  members: [],
};

const DRAFT_KEY = "census_draft_v2";

// ── In-memory accessors ───────────────────────────────────────────────────────

export function setHead(data: CensusHeadData)         { _store.head    = data; }
export function setMembers(data: CensusMemberData[])  { _store.members = data; }
export function getHead()    { return _store.head;    }
export function getMembers() { return _store.members; }
export function clearCensus() { _store.head = null; _store.members = []; }

// ── AsyncStorage draft persistence ───────────────────────────────────────────

/** Persist the current in-memory store to AsyncStorage. */
export async function saveDraft(): Promise<void> {
  await storageSet<CensusStore>(DRAFT_KEY, { head: _store.head, members: _store.members });
}

/** Load draft from AsyncStorage into the in-memory store. Returns null if no draft. */
export async function loadDraft(): Promise<CensusStore | null> {
  const draft = await storageGet<CensusStore | null>(DRAFT_KEY, null);
  if (draft) {
    _store.head    = draft.head;
    _store.members = draft.members;
  }
  return draft;
}

/** Returns true if a draft exists in AsyncStorage (without loading it). */
export async function hasDraft(): Promise<boolean> {
  const draft = await storageGet<CensusStore | null>(DRAFT_KEY, null);
  return draft !== null && (draft.head !== null || draft.members.length > 0);
}

/** Remove draft from AsyncStorage. Call after successful submission. */
export async function clearDraft(): Promise<void> {
  await storageRemove(DRAFT_KEY);
  _store.head    = null;
  _store.members = [];
}
