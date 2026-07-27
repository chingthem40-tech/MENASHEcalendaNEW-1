/**
 * Canonical Census stats.
 *
 * Pure functions only — no I/O, no side effects. Given Census data
 * structures, compute derived counts/breakdowns used by dashboards and
 * reports.
 */

import type { AliyahStatus } from "./enums";
import type { Branch, Family } from "./types";

/** Total number of people in a family, including the head of family. */
export function memberCount(family: Family): number {
  return 1 + family.members.length;
}

/** Total number of families in a branch. */
export function familyCount(branch: Branch): number {
  return branch.families.length;
}

/** Total number of people (heads + members) across a branch. */
export function totalPeopleCount(branch: Branch): number {
  return branch.families.reduce((sum, family) => sum + memberCount(family), 0);
}

/** Breakdown of every person's Aliyah status across a branch. */
export function aliyahBreakdown(branch: Branch): Record<AliyahStatus, number> {
  const counts: Record<AliyahStatus, number> = {
    in_israel: 0,
    awaiting: 0,
    unknown: 0,
  };
  for (const family of branch.families) {
    counts[family.headAliyah] = (counts[family.headAliyah] ?? 0) + 1;
    for (const member of family.members) {
      counts[member.aliyahStatus] = (counts[member.aliyahStatus] ?? 0) + 1;
    }
  }
  return counts;
}

export interface BranchStats {
  familyCount: number;
  totalPeopleCount: number;
  aliyahBreakdown: Record<AliyahStatus, number>;
}

/** Aggregate statistics for a single branch. */
export function branchStats(branch: Branch): BranchStats {
  return {
    familyCount: familyCount(branch),
    totalPeopleCount: totalPeopleCount(branch),
    aliyahBreakdown: aliyahBreakdown(branch),
  };
}
