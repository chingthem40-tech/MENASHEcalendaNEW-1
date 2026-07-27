/**
 * Census — Family Members — SPR-P006D
 *
 * Step 2 of 4: add / remove / edit family members.
 * Collects ALL 13 CensusRow fields for each member, matching the web modal.
 *
 * Uses canonical RELATIONS from @workspace/shared-core/census:
 *   spouse | son | daughter | grandson | granddaughter |
 *   daughter_in_law | son_in_law | other
 *
 * Draft persistence via censusStore (matches family-head.tsx pattern).
 */

import React, { useState, useEffect, useRef } from "react";
import {
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
import {
  ALIYAH_STATUSES,
  MARITAL_STATUSES,
  RELATIONS,
  RELATION_LABELS,
  SEXES,
} from "@workspace/shared-core/census";
import type { AliyahStatus, MaritalStatus, Relation, Sex } from "@workspace/shared-core/census";
import { setMembers as setMembersStore, loadDraft, saveDraft } from "@/lib/censusStore";

// ── Constants ─────────────────────────────────────────────────────────────────

const GOLD = "#d4a843";

interface FamilyMember {
  id:                    string;
  relation:              Relation | "";
  surname:               string;
  namePerPassport:       string;
  hebrewName:            string;
  aadharNo:              string;
  sex:                   Sex | "";
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

function emptyMember(): FamilyMember {
  return {
    id:                    Math.random().toString(36).slice(2),
    relation:              "",
    surname:               "",
    namePerPassport:       "",
    hebrewName:            "",
    aadharNo:              "",
    sex:                   "",
    maritalStatus:         "",
    dob:                   "",
    fatherName:            "",
    motherName:            "",
    dateOfJudaismPractice: "",
    passportNo:            "",
    passportIssueDate:     "",
    passportExpiryDate:    "",
    aliyahStatus:          "unknown",
  };
}

// ── Label helpers ─────────────────────────────────────────────────────────────

function relationLabel(r: Relation | ""): string {
  if (!r) return "Select…";
  return RELATION_LABELS[r as Relation] ?? r;
}

function aliyahLabel(s: AliyahStatus): string {
  switch (s) {
    case "in_israel": return "In Israel";
    case "awaiting":  return "Awaiting Aliyah";
    case "unknown":   return "Unknown";
    default:          return s;
  }
}

function sexLabel(s: Sex | ""): string {
  if (s === "M") return "Male";
  if (s === "F") return "Female";
  return "Select…";
}

function maritalLabel(s: MaritalStatus): string {
  return s || "Select…";
}

// ── Haptic ────────────────────────────────────────────────────────────────────

function haptic() {
  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FieldLabel({
  label, required, colors,
}: {
  label: string; required?: boolean; colors: ReturnType<typeof useColors>;
}) {
  return (
    <Text style={[styles.label, { color: colors.mutedForeground }]}>
      {label}
      {required && <Text style={{ color: GOLD }}> *</Text>}
    </Text>
  );
}

function TextRow({
  label, value, onChangeText, placeholder, keyboardType, required, colors,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "numeric";
  required?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.fieldWrap}>
      <FieldLabel label={label} required={required} colors={colors} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor={colors.mutedForeground + "88"}
        keyboardType={keyboardType ?? "default"}
        style={[
          styles.input,
          { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground },
        ]}
        accessibilityLabel={label}
      />
    </View>
  );
}

function ChipPicker<T extends string>({
  label, value, options, getLabel, onSelect, required, colors,
}: {
  label: string;
  value: T | "";
  options: readonly T[];
  getLabel: (v: T) => string;
  onSelect: (v: T) => void;
  required?: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.fieldWrap}>
      <FieldLabel label={label} required={required} colors={colors} />
      <View style={styles.chipRow}>
        {options.map((opt) => {
          const selected = value === opt;
          return (
            <TouchableOpacity
              key={opt}
              onPress={() => { haptic(); onSelect(opt); }}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? GOLD + "22" : colors.card,
                  borderColor:     selected ? GOLD         : colors.border,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={getLabel(opt)}
            >
              <Text style={[styles.chipText, { color: selected ? GOLD : colors.mutedForeground }]}>
                {getLabel(opt)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function SectionLabel({ title, colors }: { title: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.sectionLabel}>
      <View style={[styles.sectionBar, { backgroundColor: GOLD + "88" }]} />
      <Text style={[styles.sectionLabelText, { color: colors.mutedForeground }]}>{title}</Text>
    </View>
  );
}

// ── Member card ───────────────────────────────────────────────────────────────

function MemberCard({
  member, index, onChange, onRemove, colors,
}: {
  member: FamilyMember;
  index: number;
  onChange: (patch: Partial<FamilyMember>) => void;
  onRemove: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>

      {/* Card header */}
      <View style={styles.cardHeader}>
        <View style={[styles.cardBadge, { backgroundColor: GOLD + "18", borderColor: GOLD + "38" }]}>
          <Feather name="user" size={14} color={GOLD} />
          <Text style={[styles.cardBadgeText, { color: GOLD }]}>
            Member {index + 1}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => { haptic(); onRemove(); }}
          style={[styles.removeBtn, { borderColor: colors.border }]}
          accessibilityRole="button"
          accessibilityLabel={`Remove member ${index + 1}`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="trash-2" size={15} color={colors.mutedForeground} />
          <Text style={[styles.removeBtnText, { color: colors.mutedForeground }]}>Remove</Text>
        </TouchableOpacity>
      </View>

      {/* ── §A Identity ── */}
      <SectionLabel title="Identity" colors={colors} />

      {/* Relation — uses canonical RELATIONS enum */}
      <ChipPicker
        label="Relation"
        value={member.relation}
        options={RELATIONS}
        getLabel={relationLabel}
        onSelect={(v) => onChange({ relation: v })}
        required
        colors={colors}
      />

      <TextRow label="Surname"       value={member.surname}        onChangeText={(v) => onChange({ surname: v })}        colors={colors} />
      <TextRow label="Passport Name" value={member.namePerPassport} onChangeText={(v) => onChange({ namePerPassport: v })} required colors={colors} />
      <TextRow label="Hebrew Name"   value={member.hebrewName}     onChangeText={(v) => onChange({ hebrewName: v })}     colors={colors} />
      <TextRow
        label="Aadhar / Teudat Zehut No."
        value={member.aadharNo}
        onChangeText={(v) => onChange({ aadharNo: v })}
        placeholder="Aadhar No. or Teudat Zehut No."
        colors={colors}
      />

      <ChipPicker
        label="Sex"
        value={member.sex}
        options={SEXES}
        getLabel={sexLabel}
        onSelect={(v) => onChange({ sex: v })}
        colors={colors}
      />
      <ChipPicker
        label="Marital Status"
        value={member.maritalStatus}
        options={MARITAL_STATUSES}
        getLabel={maritalLabel}
        onSelect={(v) => onChange({ maritalStatus: v })}
        colors={colors}
      />
      <TextRow label="Date of Birth" value={member.dob} onChangeText={(v) => onChange({ dob: v })} placeholder="YYYY-MM-DD" colors={colors} />

      {/* ── §B Family ── */}
      <SectionLabel title="Family" colors={colors} />

      <TextRow label="Father's Name"        value={member.fatherName}            onChangeText={(v) => onChange({ fatherName: v })}            colors={colors} />
      <TextRow label="Mother's Name"        value={member.motherName}            onChangeText={(v) => onChange({ motherName: v })}            colors={colors} />
      <TextRow label="Judaism Practice Year" value={member.dateOfJudaismPractice} onChangeText={(v) => onChange({ dateOfJudaismPractice: v })} placeholder="YYYY" colors={colors} />

      {/* ── §C Aliyah ── */}
      <SectionLabel title="Aliyah" colors={colors} />

      <ChipPicker
        label="Aliyah Status"
        value={member.aliyahStatus}
        options={ALIYAH_STATUSES}
        getLabel={aliyahLabel}
        onSelect={(v) => onChange({ aliyahStatus: v })}
        required
        colors={colors}
      />

      {/* ── §D Passport ── */}
      <SectionLabel title="Passport" colors={colors} />

      <TextRow label="Passport No."    value={member.passportNo}        onChangeText={(v) => onChange({ passportNo: v })}        colors={colors} />
      <TextRow label="Passport Issued" value={member.passportIssueDate} onChangeText={(v) => onChange({ passportIssueDate: v })} placeholder="YYYY-MM-DD" colors={colors} />
      <TextRow label="Passport Expiry" value={member.passportExpiryDate} onChangeText={(v) => onChange({ passportExpiryDate: v })} placeholder="YYYY-MM-DD" colors={colors} />
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function FamilyMembersScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const [members, setMembers] = useState<FamilyMember[]>([]);

  // ── Restore draft on mount ────────────────────────────────────────────────
  const draftLoaded = useRef(false);

  useEffect(() => {
    if (draftLoaded.current) return;
    loadDraft().then((draft) => {
      if (draft?.members && draft.members.length > 0 && !draftLoaded.current) {
        draftLoaded.current = true;
        setMembers(
          draft.members.map((m) => ({
            id:                    m.id,
            relation:              (m.relation || "")              as Relation | "",
            surname:               m.surname                       ?? "",
            namePerPassport:       m.namePerPassport               ?? "",
            hebrewName:            m.hebrewName                    ?? "",
            aadharNo:              m.aadharNo                      ?? "",
            sex:                   (m.sex || "")                   as Sex | "",
            maritalStatus:         (m.maritalStatus || "")         as MaritalStatus,
            dob:                   m.dob                           ?? "",
            fatherName:            m.fatherName                    ?? "",
            motherName:            m.motherName                    ?? "",
            dateOfJudaismPractice: m.dateOfJudaismPractice         ?? "",
            passportNo:            m.passportNo                    ?? "",
            passportIssueDate:     m.passportIssueDate             ?? "",
            passportExpiryDate:    m.passportExpiryDate            ?? "",
            aliyahStatus:          m.aliyahStatus                  ?? "unknown",
          }))
        );
      } else {
        draftLoaded.current = true;
      }
    });
  }, []);

  // ── Persist draft on change (debounced 800 ms) ────────────────────────────
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!draftLoaded.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setMembersStore(
        members.map((m) => ({
          id:                    m.id,
          relation:              m.relation as Relation,
          surname:               m.surname,
          namePerPassport:       m.namePerPassport,
          hebrewName:            m.hebrewName,
          aadharNo:              m.aadharNo,
          sex:                   m.sex as Sex,
          maritalStatus:         m.maritalStatus as MaritalStatus,
          dob:                   m.dob,
          fatherName:            m.fatherName,
          motherName:            m.motherName,
          dateOfJudaismPractice: m.dateOfJudaismPractice,
          passportNo:            m.passportNo,
          passportIssueDate:     m.passportIssueDate,
          passportExpiryDate:    m.passportExpiryDate,
          aliyahStatus:          m.aliyahStatus,
        }))
      );
      saveDraft();
    }, 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [members]);

  function addMember() {
    haptic();
    setMembers((prev) => [...prev, emptyMember()]);
  }

  function removeMember(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  function patchMember(id: string, patch: Partial<FamilyMember>) {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  function handleNext() {
    haptic();
    // Flush latest state to store before navigating
    setMembersStore(
      members.map((m) => ({
        id:                    m.id,
        relation:              m.relation as Relation,
        surname:               m.surname,
        namePerPassport:       m.namePerPassport,
        hebrewName:            m.hebrewName,
        aadharNo:              m.aadharNo,
        sex:                   m.sex as Sex,
        maritalStatus:         m.maritalStatus as MaritalStatus,
        dob:                   m.dob,
        fatherName:            m.fatherName,
        motherName:            m.motherName,
        dateOfJudaismPractice: m.dateOfJudaismPractice,
        passportNo:            m.passportNo,
        passportIssueDate:     m.passportIssueDate,
        passportExpiryDate:    m.passportExpiryDate,
        aliyahStatus:          m.aliyahStatus,
      }))
    );
    router.push("/census/review" as never);
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
            accessibilityLabel="Go back"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>

          <Text style={[styles.navTitle, { color: colors.foreground }]}>
            Family Members
          </Text>

          <View style={{ width: 40 }} />
        </View>

        {/* ── Progress ── */}
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { backgroundColor: GOLD, width: "50%" }]} />
        </View>
        <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
          Step 2 of 4
        </Text>

        {/* ── Scroll body ── */}
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + 120 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionBarMain, { backgroundColor: GOLD }]} accessible={false} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]} accessibilityRole="header">
              Household Members
            </Text>
          </View>

          {members.length === 0 && (
            <View
              style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}
              accessible
              accessibilityLabel="No family members added yet"
            >
              <Feather name="users" size={32} color={colors.mutedForeground + "66"} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No members yet
              </Text>
              <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
                Tap "Add Member" below to register each person in your household.
              </Text>
            </View>
          )}

          {members.map((member, idx) => (
            <MemberCard
              key={member.id}
              member={member}
              index={idx}
              onChange={(patch) => patchMember(member.id, patch)}
              onRemove={() => removeMember(member.id)}
              colors={colors}
            />
          ))}

          {/* Add Member button */}
          <TouchableOpacity
            style={[styles.addBtn, { borderColor: GOLD + "66", backgroundColor: GOLD + "0D" }]}
            onPress={addMember}
            activeOpacity={0.78}
            accessibilityRole="button"
            accessibilityLabel="Add family member"
          >
            <Feather name="user-plus" size={17} color={GOLD} />
            <Text style={[styles.addBtnText, { color: GOLD }]}>Add Member</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ── Bottom bar ── */}
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: insets.bottom + SPACE[2],
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.prevBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => { haptic(); router.back(); }}
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel="Back to Family Head"
          >
            <Feather name="arrow-left" size={16} color={colors.mutedForeground} />
            <Text style={[styles.prevBtnText, { color: colors.mutedForeground }]}>Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: GOLD }]}
            onPress={handleNext}
            activeOpacity={0.82}
            accessibilityRole="button"
            accessibilityLabel="Continue to Review"
          >
            <Text style={styles.nextBtnText}>Next</Text>
            <Feather name="arrow-right" size={16} color="#1a1100" />
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

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE[2],
    marginTop: SPACE[6],
    marginBottom: SPACE[3],
  },
  sectionBarMain: { width: 3, height: 18, borderRadius: 2 },
  sectionTitle:   { fontSize: TEXT.md, fontWeight: "700", letterSpacing: 0.1 },

  emptyState: {
    alignItems: "center",
    gap: SPACE[2],
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderStyle: "dashed",
    padding: SPACE[8],
    marginTop: SPACE[2],
    marginBottom: SPACE[4],
  },
  emptyTitle: { fontSize: TEXT.md, fontWeight: "700" },
  emptyBody:  { fontSize: TEXT.sm, lineHeight: 20, textAlign: "center" },

  card: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACE[4],
    marginBottom: SPACE[4],
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACE[4],
  },
  cardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE[1],
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: SPACE[3],
    paddingVertical: SPACE[1],
  },
  cardBadgeText: { fontSize: TEXT.xs, fontWeight: "700", letterSpacing: 0.3 },
  removeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE[1],
    borderRadius: RADIUS.full,
    borderWidth: 1,
    paddingHorizontal: SPACE[3],
    paddingVertical: SPACE[1],
  },
  removeBtnText: { fontSize: TEXT.xs, fontWeight: "600" },

  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE[2],
    marginTop: SPACE[4],
    marginBottom: SPACE[3],
  },
  sectionBar:      { width: 2, height: 14, borderRadius: 2 },
  sectionLabelText: { fontSize: TEXT.xs, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },

  fieldWrap: { marginBottom: SPACE[4] },
  label: { fontSize: TEXT.sm, fontWeight: "600", letterSpacing: 0.2, marginBottom: SPACE[1] },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[3],
    fontSize: TEXT.base,
    fontWeight: "400",
  },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACE[2] },
  chip: {
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACE[3],
    paddingVertical: SPACE[2],
  },
  chipText: { fontSize: TEXT.sm, fontWeight: "600" },

  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE[2],
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: RADIUS.xl,
    paddingVertical: SPACE[4],
    marginTop: SPACE[2],
    marginBottom: SPACE[4],
  },
  addBtnText: { fontSize: TEXT.md, fontWeight: "700" },

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
  nextBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE[2],
    borderRadius: RADIUS.full,
    paddingVertical: SPACE[4],
  },
  nextBtnText: {
    fontSize: TEXT.md,
    fontWeight: "800",
    color: "#1a1100",
    letterSpacing: -0.3,
  },
});
