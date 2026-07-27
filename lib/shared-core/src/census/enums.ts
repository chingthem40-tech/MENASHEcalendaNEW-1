/**
 * Canonical Census enums.
 *
 * Single source of truth for Census-related enumerated values. Anything
 * that needs to validate, label, or branch on these values must import
 * them from here instead of redeclaring string unions locally.
 */

export const ALIYAH_STATUSES = ["in_israel", "awaiting", "unknown"] as const;
export type AliyahStatus = (typeof ALIYAH_STATUSES)[number];

export const RELATIONS = [
  "spouse",
  "son",
  "daughter",
  "grandson",
  "granddaughter",
  "daughter_in_law",
  "son_in_law",
  "other",
] as const;
export type Relation = (typeof RELATIONS)[number];

export const MARITAL_STATUSES = ["Single", "Married", "Divorced", "Widowed"] as const;
export type MaritalStatus = (typeof MARITAL_STATUSES)[number] | "";

export const SEXES = ["M", "F"] as const;
export type Sex = (typeof SEXES)[number] | "";
