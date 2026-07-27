/**
 * Census — Submit — SPR-P006F
 *
 * Step 4 of 4: confirm and submit the census.
 *
 * Uses submitMember() — POST /census/member-submissions (public, no auth needed).
 * This is the correct API for community members submitting their own family data.
 * saveBranch() (PUT /census/branch) is for Local Admins only — not used here.
 *
 * Payload shape matches memberSubmissionSchema exactly:
 *   { submitterName, submitterNote?, headCensus, members: FamilyMember[] }
 */

import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { SPACE, TEXT, RADIUS } from "@/constants/colors";
import { useLanguage } from "@/context/LanguageContext";
import { getHead, getMembers, clearCensus, clearDraft } from "@/lib/censusStore";
import { submitMember } from "@workspace/shared-core/census";
import type { MaritalStatus, Sex, Relation, AliyahStatus } from "@workspace/shared-core/census";

// ── Constants ─────────────────────────────────────────────────────────────────

const GOLD = "#d4a843";
const RED  = "#e05252";

function haptic() {
  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function SubmitScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t }  = useLanguage();

  const [submitting,     setSubmitting]     = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [submitterNote,  setSubmitterNote]  = useState("");

  const head    = getHead();
  const members = getMembers();

  const baseUrl = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

  async function handleSubmit() {
    haptic();
    setError(null);
    setSubmitting(true);

    try {
      // POST /census/member-submissions — public endpoint, no auth required.
      await submitMember(
        {
          // submitterName is the family head's passport name (required by schema)
          submitterName: head?.namePerPassport?.trim() || head?.surname?.trim() || "Unknown",
          submitterNote: submitterNote.trim() || undefined,
          // branchId / branchName resolved server-side for community submissions
          branchId: "",
          branchName: "",

          // headCensus: all 13 CensusRow fields, omitting empty strings.
          // All CensusRow fields are optional, so an empty object is valid
          // when the family head hasn't filled anything in yet.
          headCensus: {
            surname:               head?.surname               || undefined,
            namePerPassport:       head?.namePerPassport       || undefined,
            hebrewName:            head?.hebrewName            || undefined,
            aadharNo:              head?.aadharNo              || undefined,
            maritalStatus:         (head?.maritalStatus        || undefined) as MaritalStatus | undefined,
            sex:                   (head?.sex                  || undefined) as Sex | undefined,
            dob:                   head?.dob                   || undefined,
            fatherName:            head?.fatherName            || undefined,
            motherName:            head?.motherName            || undefined,
            dateOfJudaismPractice: head?.dateOfJudaismPractice || undefined,
            passportNo:            head?.passportNo            || undefined,
            passportIssueDate:     head?.passportIssueDate     || undefined,
            passportExpiryDate:    head?.passportExpiryDate    || undefined,
          },

          // members: full FamilyMember shape — id + relation + aliyahStatus + all CensusRow fields
          members: members.map((m) => ({
            id:                    m.id,
            relation:              m.relation as Relation,
            aliyahStatus:          m.aliyahStatus as AliyahStatus,
            surname:               m.surname               || undefined,
            namePerPassport:       m.namePerPassport       || undefined,
            hebrewName:            m.hebrewName            || undefined,
            aadharNo:              m.aadharNo              || undefined,
            maritalStatus:         (m.maritalStatus        || undefined) as MaritalStatus | undefined,
            sex:                   (m.sex                  || undefined) as Sex | undefined,
            dob:                   m.dob                   || undefined,
            fatherName:            m.fatherName            || undefined,
            motherName:            m.motherName            || undefined,
            dateOfJudaismPractice: m.dateOfJudaismPractice || undefined,
            passportNo:            m.passportNo            || undefined,
            passportIssueDate:     m.passportIssueDate     || undefined,
            passportExpiryDate:    m.passportExpiryDate    || undefined,
          })),
        },
        { baseUrl },
      );

      clearCensus();
      await clearDraft();
      router.replace("/census/success" as never);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t.censusSubmissionFailedMsg;
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
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
            accessibilityLabel={t.censusGoBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>

          <Text style={[styles.navTitle, { color: colors.foreground }]}>
            {t.censusSubmitScreenTitle}
          </Text>

          <View style={{ width: 40 }} />
        </View>

        {/* ── Progress 100% ── */}
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { backgroundColor: GOLD, width: "100%" }]} />
        </View>
        <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
          {t.censusStep4of4}
        </Text>

        {/* ── Scroll body ── */}
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Hero */}
          <View style={[styles.hero, { backgroundColor: GOLD + "0D" }]}>
            <View style={[styles.heroIcon, { borderColor: GOLD + "44", backgroundColor: GOLD + "16" }]}>
              <Text style={styles.heroEmoji}>📋</Text>
            </View>
            <Text style={[styles.overline, { color: GOLD }]}>{t.censusAlmostDone}</Text>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>
              {t.censusReadyToSubmit}
            </Text>
            <Text style={[styles.heroBody, { color: colors.mutedForeground }]}>
              {t.censusReadBeforeSubmit}
            </Text>
          </View>

          {/* Summary counts */}
          <View style={[styles.summaryRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: GOLD }]}>
                {head ? 1 + members.length : 0}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                {t.censusPeople}
              </Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: GOLD }]}>
                {members.length}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                {t.censusMembers}
              </Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: GOLD }]}>
                {[head, ...members].filter(Boolean).filter((p) => (p as { aliyahStatus: string }).aliyahStatus === "awaiting").length}
              </Text>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
                {t.censusAliyahAwaiting}
              </Text>
            </View>
          </View>

          {/* ── Optional submitter note ── */}
          <View style={styles.noteSection}>
            <Text style={[styles.noteLabel, { color: colors.mutedForeground }]}>
              Note for local admin{" "}
              <Text style={{ fontWeight: "400", fontSize: TEXT.xs }}>(optional)</Text>
            </Text>
            <TextInput
              value={submitterNote}
              onChangeText={setSubmitterNote}
              placeholder="Any additional information for your local admin…"
              placeholderTextColor={colors.mutedForeground + "88"}
              multiline
              numberOfLines={3}
              maxLength={1000}
              style={[
                styles.noteInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              accessibilityLabel="Submitter note"
            />
          </View>

          {/* Bullets */}
          {(() => {
            const BULLETS: { icon: "lock" | "eye" | "edit" | "shield"; textKey: keyof typeof t }[] = [
              { icon: "lock",   textKey: "censusBullet1" },
              { icon: "eye",    textKey: "censusBullet2" },
              { icon: "edit",   textKey: "censusBullet3" },
              { icon: "shield", textKey: "censusBullet4" },
            ];
            return (
              <View style={styles.bullets}>
                {BULLETS.map(({ icon, textKey }, i) => (
                  <View
                    key={i}
                    style={[styles.bullet, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={[styles.bulletIcon, { backgroundColor: GOLD + "18", borderColor: GOLD + "38" }]}>
                      <Feather name={icon} size={16} color={GOLD} />
                    </View>
                    <Text style={[styles.bulletText, { color: colors.mutedForeground }]}>{t[textKey]}</Text>
                  </View>
                ))}
              </View>
            );
          })()}

          {/* Error card */}
          {error && (
            <View style={[styles.errorCard, { backgroundColor: RED + "10", borderColor: RED + "44" }]}>
              <View style={styles.errorHeader}>
                <Feather name="alert-triangle" size={18} color={RED} />
                <Text style={[styles.errorTitle, { color: RED }]}>{t.censusSubmissionFailed}</Text>
              </View>
              <Text style={[styles.errorBody, { color: RED + "cc" }]}>{error}</Text>
              <TouchableOpacity
                style={[styles.retryBtn, { borderColor: RED + "66" }]}
                onPress={handleSubmit}
                accessibilityRole="button"
                accessibilityLabel={t.censusRetry}
              >
                <Feather name="refresh-cw" size={14} color={RED} />
                <Text style={[styles.retryBtnText, { color: RED }]}>{t.censusRetry}</Text>
              </TouchableOpacity>
            </View>
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
            disabled={submitting}
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel={t.censusBackToReview}
          >
            <Feather name="arrow-left" size={16} color={colors.mutedForeground} />
            <Text style={[styles.prevBtnText, { color: colors.mutedForeground }]}>{t.censusPrevious}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: GOLD, opacity: submitting ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel={t.censusConfirmSubmit}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#1a1100" />
            ) : (
              <>
                <Feather name="check-circle" size={17} color="#1a1100" />
                <Text style={styles.confirmBtnText}>{t.censusConfirmSubmit}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
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

  hero: {
    alignItems: "center",
    gap: SPACE[2],
    paddingTop: SPACE[8],
    paddingBottom: SPACE[6],
    paddingHorizontal: SPACE[6],
    marginBottom: SPACE[4],
    borderRadius: RADIUS.xl,
    marginTop: SPACE[3],
  },
  heroIcon: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACE[2],
  },
  heroEmoji:  { fontSize: 48 },
  overline: {
    fontSize: TEXT.xs,
    fontWeight: "800",
    letterSpacing: 2.5,
  },
  heroTitle: {
    fontSize: TEXT["2xl"],
    fontWeight: "800",
    letterSpacing: -0.6,
    textAlign: "center",
  },
  heroBody: {
    fontSize: TEXT.base,
    textAlign: "center",
    lineHeight: 22,
    marginTop: SPACE[1],
  },

  summaryRow: {
    flexDirection: "row",
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    paddingVertical: SPACE[4],
    marginBottom: SPACE[5],
  },
  summaryItem:    { flex: 1, alignItems: "center", gap: 4 },
  summaryDivider: { width: 1, marginVertical: SPACE[1] },
  summaryValue:   { fontSize: TEXT["2xl"], fontWeight: "800", letterSpacing: -0.5 },
  summaryLabel:   { fontSize: TEXT.xs, fontWeight: "600" },

  noteSection: { marginBottom: SPACE[5] },
  noteLabel: {
    fontSize: TEXT.sm,
    fontWeight: "600",
    letterSpacing: 0.2,
    marginBottom: SPACE[2],
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[3],
    fontSize: TEXT.base,
    fontWeight: "400",
    minHeight: 80,
    textAlignVertical: "top",
  },

  bullets: { gap: SPACE[3], marginBottom: SPACE[4] },
  bullet: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACE[3],
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACE[4],
  },
  bulletIcon: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bulletText: { flex: 1, fontSize: TEXT.sm, lineHeight: 20, marginTop: 2 },

  errorCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACE[4],
    gap: SPACE[3],
    marginBottom: SPACE[4],
  },
  errorHeader: { flexDirection: "row", alignItems: "center", gap: SPACE[2] },
  errorTitle:  { fontSize: TEXT.md, fontWeight: "700" },
  errorBody:   { fontSize: TEXT.sm, lineHeight: 20 },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE[2],
    alignSelf: "flex-start",
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[2],
  },
  retryBtnText: { fontSize: TEXT.sm, fontWeight: "700" },

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
  prevBtnText:   { fontSize: TEXT.sm, fontWeight: "600" },
  confirmBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE[2],
    borderRadius: RADIUS.full,
    paddingVertical: SPACE[4],
  },
  confirmBtnText: {
    fontSize: TEXT.md,
    fontWeight: "800",
    color: "#1a1100",
    letterSpacing: -0.3,
  },
});
