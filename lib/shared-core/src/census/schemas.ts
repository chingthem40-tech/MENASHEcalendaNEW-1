/**
 * Canonical Census Zod schemas.
 *
 * These replace loose `z.record(z.unknown())` blobs with typed, validated
 * shapes derived from the interfaces in `./types.ts`. The API must use
 * these schemas rather than declaring its own ad-hoc validation.
 */

import { z } from "zod/v4";
import { ALIYAH_STATUSES, MARITAL_STATUSES, RELATIONS, SEXES } from "./enums";

export const aliyahStatusSchema = z.enum(ALIYAH_STATUSES);
export const relationSchema = z.enum(RELATIONS);
export const maritalStatusSchema = z.union([z.enum(MARITAL_STATUSES), z.literal("")]);
export const sexSchema = z.union([z.enum(SEXES), z.literal("")]);

/** The 13 tracked fields for a single person's census record. */
export const censusRowSchema = z.object({
  surname: z.string().max(200).optional(),
  namePerPassport: z.string().max(200).optional(),
  hebrewName: z.string().max(200).optional(),
  aadharNo: z.string().max(100).optional(),
  maritalStatus: maritalStatusSchema.optional(),
  sex: sexSchema.optional(),
  dob: z.string().max(50).optional(),
  fatherName: z.string().max(200).optional(),
  motherName: z.string().max(200).optional(),
  dateOfJudaismPractice: z.string().max(50).optional(),
  passportNo: z.string().max(100).optional(),
  passportIssueDate: z.string().max(50).optional(),
  passportExpiryDate: z.string().max(50).optional(),
});

/** A household member other than the head of family. */
export const familyMemberSchema = censusRowSchema.extend({
  id: z.string().min(1).max(100),
  relation: relationSchema,
  aliyahStatus: aliyahStatusSchema,
});

/** A household: a head of family plus dependents. */
export const familySchema = z.object({
  id: z.string().min(1).max(100),
  headName: z.string().min(1).max(200),
  headAliyah: aliyahStatusSchema,
  headCensus: censusRowSchema,
  members: z.array(familyMemberSchema).max(100),
});

/** A local community branch, grouping families under one admin. */
export const branchSchema = z.object({
  id: z.string().max(100).optional(),
  name: z.string().min(1).max(200),
  cityId: z.string().max(100).optional(),
  cityName: z.string().max(200).optional(),
  adminName: z.string().max(200).optional(),
  established: z.string().max(50).optional().nullable(),
  logoUrl: z.string().max(2000000).optional().nullable(),
  synagogueImageUrl: z.string().max(2000000).optional().nullable(),
  families: z.array(familySchema).max(500).optional(),
});

/** A single household's self-service census submission (public form). */
export const memberSubmissionSchema = z.object({
  branchId: z.string().max(100).optional(),
  branchName: z.string().max(200).optional(),
  submitterName: z.string().min(1).max(200),
  submitterNote: z.string().max(1000).optional().nullable(),
  headCensus: censusRowSchema.optional(),
  members: z.array(familyMemberSchema).max(100).optional(),
});
