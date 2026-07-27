/**
 * Census — Review & Validation — SPR-P006E
 *
 * Step 3 of 4: read-only summary of Family Head + Family Members.
 * Shows ALL 13 CensusRow fields for each person (matching the web modal export).
 * Highlights missing required fields, invalid dates, empty names.
 * Edit buttons route back to the appropriate step.
 */

import React, { useMemo } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { SPACE, TEXT, RADIUS } from "@/constants/colors";
import {
  getHead,
  getMembers,
  type AliyahStatus,
  type CensusHeadData,
  type CensusMemberData,
} from "@/lib/censusStore";
import { RELATION_LABELS } from "@workspace/shared-core/census";
import type { Relation } from "@workspace/shared-core/census";

// ── Constants ─────────────────────────────────────────────────────────────────

const GOLD  = "#d4a843";
const RED   = "#e05252";
const AMBER = "#d4933a";

function haptic() {
  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

// ── Label helpers ─────────────────────────────────────────────────────────────

function aliyahLabel(s: AliyahStatus): string {
  switch (s) {
    case "in_israel": return "In Israel";
    case "awaiting":  return "Awaiting Aliyah";
    case "unknown":   return "Unknown";
  }
}

function relationLabel(r: string): string {
  if (!r) return "—";
  return RELATION_LABELS[r as Relation] ?? (r.charAt(0).toUpperCase() + r.slice(1));
}

function orDash(v: string | undefined | null): string {
  return v?.trim() || "—";
}

// ── Date validation ───────────────────────────────────────────────────────────

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const YEAR_RE = /^\d{4}$/;

function isValidDate(v: string): boolean {
  if (!v) return true;
  if (!DATE_RE.test(v)) return false;
  const d = new Date(v);
  return !isNaN(d.getTime());
}

function isValidYear(v: string): boolean {
  if (!v) return true;
  return YEAR_RE.test(v) && +v >= 1900 && +v <= new Date().getFullYear();
}

// ── Validation ────────────────────────────────────────────────────────────────

interface HeadIssues {
  namePerPassport: boolean;
  surname:         boolean;
  dob:             boolean;
  passportIssue:   boolean;
  passportExpiry:  boolean;
  judaismDate:     boolean;
}

interface MemberIssues {
  namePerPassport: boolean;
  relation:        boolean;
  dob:             boolean;
}

function validateHead(head: CensusHeadData | null): HeadIssues {
  if (!head) {
    return { namePerPassport: true, surname: false, dob: false, passportIssue: false, passportExpiry: false, judaismDate: false };
  }
  return {
    namePerPassport: !head.namePerPassport.trim(),
    surname:         !head.surname.trim(),
    dob:             !isValidDate(head.dob),
    passportIssue:   !isValidDate(head.passportIssueDate),
    passportExpiry:  !isValidDate(head.passportExpiryDate),
    judaismDate:     !isValidYear(head.dateOfJudaismPractice),
  };
}

function validateMember(m: CensusMemberData): MemberIssues {
  return {
    namePerPassport: !m.namePerPassport.trim(),
    relation:        !m.relation,
    dob:             !isValidDate(m.dob),
  };
}

function headIssueCount(issues: HeadIssues): number {
  return Object.values(issues).filter(Boolean).length;
}

function memberIssueCount(issues: MemberIssues): number {
  return Object.values(issues).filter(Boolean).length;
}

// ── Aliyah breakdown ──────────────────────────────────────────────────────────

interface AliyahBreakdown {
  in_israel: number;
  awaiting:  number;
  unknown:   number;
  total:     number;
}

function buildBreakdown(
  head: CensusHeadData | null,
  members: CensusMemberData[],
): AliyahBreakdown {
  const all: AliyahStatus[] = [];
  if (head) all.push(head.aliyahStatus);
  members.forEach((m) => all.push(m.aliyahStatus));
  return {
    in_israel: all.filter((s) => s === "in_israel").length,
    awaiting:  all.filter((s) => s === "awaiting").length,
    unknown:   all.filter((s) => s === "unknown").length,
    total:     all.length,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({
  title, onEdit, colors,
}: {
  title: string;
  onEdit?: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionLeft}>
        <View style={[styles.sectionBar, { backgroundColor: GOLD }]} />
        <Text style={[styles.sectionTitle, { color: colors.foreground }]} accessibilityRole="header">
          {title}
        </Text>
      </View>
      {onEdit && (
        <TouchableOpacity
          onPress={() => { haptic(); onEdit(); }}
          style={[styles.editBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${title}`}
        >
          <Feather name="edit-2" size={13} color={colors.mutedForeground} />
          <Text style={[styles.editBtnText, { color: colors.mutedForeground }]}>Edit</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function ReviewRow({
  label, value, invalid, colors,
}: {
  label: string;
  value: string;
  invalid?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.reviewRow}>
      <Text style={[styles.reviewLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text
        style={[
          styles.reviewValue,
          { color: invalid ? RED : value === "—" ? colors.mutedForeground : colors.foreground },
        ]}
      >
        {invalid ? `⚠ ${value === "—" ? "Required" : value}` : value}
      </Text>
    </View>
  );
}

function IssuesBanner({ count, colors }: { count: number; colors: ReturnType<typeof useColors> }) {
  if (count === 0) return null;
  return (
    <View style={[styles.issuesBanner, { backgroundColor: RED + "12", borderColor: RED + "44" }]}>
      <Feather name="alert-triangle" size={14} color={RED} />
      <Text style={[styles.issuesBannerText, { color: RED }]}>
        {count} issue{count !== 1 ? "s" : ""} to fix before submitting
      </Text>
    </View>
  );
}

function StatChip({
  label, value, color, colors,
}: {
  label: string;
  value: number | string;
  color?: string;
  colors: ReturnType<typeof useColors>;
}) {
  const fg = color ?? GOLD;
  return (
    <View style={[styles.statChip, { backgroundColor: fg + "12", borderColor: fg + "38" }]}>
      <Text style={[styles.statValue, { color: fg }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ReviewScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();

  const head    = getHead();
  const members = getMembers();

  const headIssues     = useMemo(() => validateHead(head), [head]);
  const memberIssueMap = useMemo(
    () => members.map((m) => ({ id: m.id, issues: validateMember(m) })),
    [members],
  );
  const breakdown = useMemo(() => buildBreakdown(head, members), [head, members]);

  const totalIssues =
    headIssueCount(headIssues) +
    memberIssueMap.reduce((acc, { issues }) => acc + memberIssueCount(issues), 0);

  const totalPeople = 1 + members.length;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>

      {/* ── Nav bar ── */}
      <View
        style={[
          styles.nav,
          { paddingTop: insets.top + SPACE[2], borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => { haptic(); router.back(); }}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <Text style={[styles.navTitle, { color: colors.foreground }]}>
          Review Your Census
        </Text>

        <View style={{ width: 40 }} />
      </View>

      {/* ── Progress ── */}
      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { backgroundColor: GOLD, width: "75%" }]} />
      </View>
      <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
        Step 3 of 4
      </Text>

      {/* ── Scroll body ── */}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* Global issues banner */}
        <IssuesBanner count={totalIssues} colors={colors} />

        {/* ── Summary chips ── */}
        <View style={styles.chipRow}>
          <StatChip label="Total People" value={head ? totalPeople : 0} colors={colors} />
          <StatChip label="In Israel"    value={breakdown.in_israel} color="#4a9e6b" colors={colors} />
          <StatChip label="Awaiting"     value={breakdown.awaiting}  color={AMBER}   colors={colors} />
          <StatChip label="Unknown"      value={breakdown.unknown}   color={colors.mutedForeground} colors={colors} />
        </View>

        {/* ── Family Head ── */}
        <SectionHeader
          title="Family Head"
          onEdit={() => router.push("/census/family-head" as never)}
          colors={colors}
        />

        {head ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ReviewRow label="Surname"          value={orDash(head.surname)}               invalid={headIssues.surname}         colors={colors} />
            <ReviewRow label="Passport Name"    value={orDash(head.namePerPassport)}       invalid={headIssues.namePerPassport}  colors={colors} />
            <ReviewRow label="Hebrew Name"      value={orDash(head.hebrewName)}             colors={colors} />
            <ReviewRow label="Aadhar / Teudat" value={orDash(head.aadharNo)}               colors={colors} />
            <ReviewRow
              label="Sex"
              value={head.sex === "M" ? "Male" : head.sex === "F" ? "Female" : "—"}
              colors={colors}
            />
            <ReviewRow label="Marital Status"   value={orDash(head.maritalStatus)}          colors={colors} />
            <ReviewRow label="Date of Birth"    value={orDash(head.dob)}                    invalid={headIssues.dob && !!head.dob}         colors={colors} />
            <ReviewRow label="Father's Name"    value={orDash(head.fatherName)}             colors={colors} />
            <ReviewRow label="Mother's Name"    value={orDash(head.motherName)}             colors={colors} />
            <ReviewRow label="Judaism Since"    value={orDash(head.dateOfJudaismPractice)}  invalid={headIssues.judaismDate && !!head.dateOfJudaismPractice} colors={colors} />
            <ReviewRow label="Aliyah Status"    value={aliyahLabel(head.aliyahStatus)}      colors={colors} />
            <ReviewRow label="Passport No."     value={orDash(head.passportNo)}             colors={colors} />
            <ReviewRow label="Passport Issued"  value={orDash(head.passportIssueDate)}      invalid={headIssues.passportIssue && !!head.passportIssueDate}   colors={colors} />
            <ReviewRow label="Passport Expiry"  value={orDash(head.passportExpiryDate)}     invalid={headIssues.passportExpiry && !!head.passportExpiryDate} colors={colors} />
          </View>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: RED + "55" }]}>
            <Feather name="alert-circle" size={18} color={RED} />
            <Text style={[styles.emptyText, { color: RED }]}>
              Family Head not completed. Tap Edit to go back.
            </Text>
          </View>
        )}

        {/* ── Family Members ── */}
        <SectionHeader
          title={`Family Members (${members.length})`}
          onEdit={() => router.push("/census/family-members" as never)}
          colors={colors}
        />

        {members.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="users" size={18} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No family members added. Tap Edit to add members.
            </Text>
          </View>
        ) : (
          members.map((m, idx) => {
            const mIssues = memberIssueMap[idx]?.issues;
            const mCount  = mIssues ? memberIssueCount(mIssues) : 0;
            return (
              <View
                key={m.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.card,
                    borderColor: mCount > 0 ? RED + "55" : colors.border,
                  },
                ]}
              >
                <View style={styles.memberCardHeader}>
                  <View style={[styles.memberBadge, { backgroundColor: GOLD + "18", borderColor: GOLD + "38" }]}>
                    <Text style={[styles.memberBadgeText, { color: GOLD }]}>
                      {relationLabel(m.relation)} · Member {idx + 1}
                    </Text>
                  </View>
                  {mCount > 0 && (
                    <View style={[styles.issuePill, { backgroundColor: RED + "14", borderColor: RED + "44" }]}>
                      <Text style={[styles.issuePillText, { color: RED }]}>
                        {mCount} issue{mCount !== 1 ? "s" : ""}
                      </Text>
                    </View>
                  )}
                </View>

                {/* All 13 CensusRow fields for member */}
                <ReviewRow label="Surname"          value={orDash(m.surname)}               colors={colors} />
                <ReviewRow label="Passport Name"    value={orDash(m.namePerPassport)}       invalid={mIssues?.namePerPassport} colors={colors} />
                <ReviewRow label="Hebrew Name"      value={orDash(m.hebrewName)}             colors={colors} />
                <ReviewRow label="Aadhar / Teudat" value={orDash(m.aadharNo)}               colors={colors} />
                <ReviewRow
                  label="Sex"
                  value={m.sex === "M" ? "Male" : m.sex === "F" ? "Female" : "—"}
                  colors={colors}
                />
                <ReviewRow label="Marital Status"   value={orDash(m.maritalStatus)}          colors={colors} />
                <ReviewRow label="Date of Birth"    value={orDash(m.dob)}                    invalid={mIssues?.dob && !!m.dob} colors={colors} />
                <ReviewRow label="Father's Name"    value={orDash(m.fatherName)}             colors={colors} />
                <ReviewRow label="Mother's Name"    value={orDash(m.motherName)}             colors={colors} />
                <ReviewRow label="Judaism Since"    value={orDash(m.dateOfJudaismPractice)}  colors={colors} />
                <ReviewRow label="Aliyah Status"    value={aliyahLabel(m.aliyahStatus)}      colors={colors} />
                <ReviewRow label="Passport No."     value={orDash(m.passportNo)}             colors={colors} />
                <ReviewRow label="Passport Issued"  value={orDash(m.passportIssueDate)}      colors={colors} />
                <ReviewRow label="Passport Expiry"  value={orDash(m.passportExpiryDate)}     colors={colors} />
              </View>
            );
          })
        )}

      </ScrollView>

      {/* ── Bottom bar ── */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.background,
            borderTopColor:  colors.border,
            paddingBottom:   insets.bottom + SPACE[2],
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.prevBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => { haptic(); router.back(); }}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Back to Family Members"
        >
          <Feather name="arrow-left" size={16} color={colors.mutedForeground} />
          <Text style={[styles.prevBtnText, { color: colors.mutedForeground }]}>Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.submitBtn,
            { backgroundColor: totalIssues > 0 ? GOLD + "88" : GOLD },
          ]}
          onPress={() => { haptic(); router.push("/census/submit" as never); }}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Proceed to submit census"
        >
          <Feather name="send" size={16} color="#1a1100" />
          <Text style={styles.submitBtnText}>Submit</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACE[4],
    paddingBottom: SPACE[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn:  { width: 40, height: 40, justifyContent: "center" },
  navTitle: {
    fontSize: TEXT.md,
    fontWeight: "700",
    letterSpacing: -0.3,
    flex: 1,
    textAlign: "center",
  },

  progressBar: {
    height: 3,
    marginHorizontal: SPACE[4],
    borderRadius: 2,
    marginTop: SPACE[3],
    overflow: "hidden",
  },
  progressFill: { height: 3, borderRadius: 2 },
  progressLabel: {
    fontSize: TEXT.xs,
    fontWeight: "600",
    letterSpacing: 0.4,
    marginHorizontal: SPACE[4],
    marginTop: SPACE[1],
    marginBottom: SPACE[2],
  },

  scroll: { paddingHorizontal: SPACE[4] },

  issuesBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE[2],
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACE[3],
    marginTop: SPACE[3],
    marginBottom: SPACE[1],
  },
  issuesBannerText: { fontSize: TEXT.sm, fontWeight: "600" },

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACE[2],
    paddingVertical: SPACE[4],
  },
  statChip: {
    alignItems: "center",
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[3],
    minWidth: 72,
    flex: 1,
  },
  statValue: { fontSize: TEXT.xl, fontWeight: "800", letterSpacing: -0.5 },
  statLabel: { fontSize: TEXT.xs, fontWeight: "600", marginTop: 2 },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACE[4],
    marginBottom: SPACE[3],
  },
  sectionLeft:  { flexDirection: "row", alignItems: "center", gap: SPACE[2] },
  sectionBar:   { width: 3, height: 18, borderRadius: 2 },
  sectionTitle: { fontSize: TEXT.md, fontWeight: "700", letterSpacing: 0.1 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: SPACE[3],
    paddingVertical: SPACE[1],
  },
  editBtnText: { fontSize: TEXT.xs, fontWeight: "600" },

  card: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACE[4],
    marginBottom: SPACE[4],
  },
  emptyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE[3],
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACE[4],
    marginBottom: SPACE[4],
  },
  emptyText: { flex: 1, fontSize: TEXT.sm, fontWeight: "500", lineHeight: 19 },

  memberCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACE[3],
  },
  memberBadge: {
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: SPACE[3],
    paddingVertical: SPACE[1],
  },
  memberBadgeText: { fontSize: TEXT.xs, fontWeight: "700", letterSpacing: 0.2 },
  issuePill: {
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: SPACE[2],
    paddingVertical: SPACE[1],
  },
  issuePillText: { fontSize: TEXT.xs, fontWeight: "700" },

  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: SPACE[2],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "transparent",
  },
  reviewLabel: { fontSize: TEXT.sm, fontWeight: "500", flex: 1 },
  reviewValue: { fontSize: TEXT.sm, fontWeight: "600", flex: 1, textAlign: "right" },

  bottomBar: {
    flexDirection: "row",
    gap: SPACE[3],
    paddingHorizontal: SPACE[4],
    paddingTop: SPACE[3],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  prevBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE[2],
    borderRadius: RADIUS.full,
    paddingVertical: SPACE[3],
    borderWidth: 1,
  },
  prevBtnText: { fontSize: TEXT.sm, fontWeight: "600" },
  submitBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE[2],
    borderRadius: RADIUS.full,
    paddingVertical: SPACE[4],
  },
  submitBtnText: {
    fontSize: TEXT.md,
    fontWeight: "800",
    color: "#1a1100",
    letterSpacing: -0.3,
  },
});
