/**
 * Canonical Census display labels.
 *
 * Display labels only — no business logic. Consumers (web/mobile UI) look
 * up labels here instead of hardcoding their own copies.
 */

import type { AliyahStatus, MaritalStatus, Relation, Sex } from "./enums";

export const RELATION_LABELS: Record<Relation, string> = {
  spouse: "Spouse",
  son: "Son",
  daughter: "Daughter",
  grandson: "Grandson",
  granddaughter: "Granddaughter",
  daughter_in_law: "Daughter-in-Law",
  son_in_law: "Son-in-Law",
  other: "Other",
};

export const ALIYAH_LABELS: Record<AliyahStatus, { label: string; color: string; dot: string }> = {
  in_israel: { label: "In Israel", color: "#4ade80", dot: "🇮🇱" },
  awaiting: { label: "Awaiting Aliyah", color: "#facc15", dot: "🕊️" },
  unknown: { label: "Unknown", color: "#94a3b8", dot: "❓" },
};

export const MARITAL_STATUS_LABELS: Record<Exclude<MaritalStatus, "">, string> = {
  Single: "Single",
  Married: "Married",
  Divorced: "Divorced",
  Widowed: "Widowed",
};

export const SEX_LABELS: Record<Exclude<Sex, "">, string> = {
  M: "Male",
  F: "Female",
};

export const CENSUS_FIELD_LABELS: Record<string, string> = {
  surname: "Surname",
  namePerPassport: "Name (Passport)",
  hebrewName: "Hebrew Name",
  maritalStatus: "Marital Status",
  sex: "Sex",
  dob: "DOB",
  fatherName: "Father's Name",
  motherName: "Mother's Name",
  dateOfJudaismPractice: "Judaism Practice Date",
  passportNo: "Passport No.",
  passportIssueDate: "Passport Issue",
  passportExpiryDate: "Passport Expiry",
};
