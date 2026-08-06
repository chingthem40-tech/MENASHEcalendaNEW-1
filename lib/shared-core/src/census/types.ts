/**
 * Canonical Census types.
 *
 * There must be ONE Census model — everything else (API validation,
 * frontend UI, stats, labels) imports these interfaces rather than
 * redeclaring its own shape.
 */

import type { AliyahStatus, MaritalStatus, Relation, Sex } from "./enums";

/** The 13 tracked fields for a single person's census record. */
export interface CensusRow {
  surname?: string;
  namePerPassport?: string;
  hebrewName?: string;
  aadharNo?: string;
  maritalStatus?: MaritalStatus;
  sex?: Sex;
  dob?: string;
  fatherName?: string;
  motherName?: string;
  dateOfJudaismPractice?: string;
  passportNo?: string;
  passportIssueDate?: string;
  passportExpiryDate?: string;
}

/** A household member other than the head of family. */
export interface FamilyMember extends CensusRow {
  id: string;
  relation: Relation;
  aliyahStatus: AliyahStatus;
}

/** A household: a head of family plus dependents. */
export interface Family {
  id: string;
  headName: string;
  headAliyah: AliyahStatus;
  headCensus: CensusRow;
  members: FamilyMember[];
}

/** A single branch leadership role (Chairman / Secretary / Khazan). */
export interface LeadershipPerson {
  name: string;
  mobile: string;
  email?: string;
}

/** The three required leadership positions for every registered branch. */
export interface BranchLeadership {
  chairman: LeadershipPerson;
  secretary: LeadershipPerson;
  khazan: LeadershipPerson;
}

export type BranchStatus =
  | "draft"          // Newly created, not yet submitted
  | "pending_review" // Submitted by Local Admin, awaiting Regional review
  | "approved"       // Approved by Regional Admin, awaiting National activation
  | "active"         // Activated — fully operational
  | "suspended"      // Temporarily suspended by National Admin
  | "archived"       // Permanently archived
  | "rejected";      // Rejected by Regional Admin

/** A local community branch, grouping families under one admin. */
export interface Branch {
  id: string;
  name: string;
  cityId: string;
  cityName: string;
  established?: string;
  adminName?: string;
  /** Community logo image — helps members identify their branch when submitting census. */
  logoUrl?: string;
  /** Photo of the local synagogue — helps members identify their branch when submitting census. */
  synagogueImageUrl?: string;
  families: Family[];
  /** Persisted leadership details (Chairman, Secretary, Khazan). */
  leadership?: BranchLeadership;
  /** Branch operational status. */
  branchStatus?: BranchStatus;
  /** Clerk user ID of the account that created this branch. */
  createdBy?: string;
  /** ISO timestamp of initial registration. */
  createdAt?: string;
  /** ISO timestamp of last update. */
  updatedAt?: string;
}
