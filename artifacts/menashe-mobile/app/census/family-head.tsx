/**
 * Census — Family Head Registration — SPR-P006C
 *
 * Collects all 13 CensusRow fields + aliyah status for the family head.
 * Navigates to /census/family-members on save.
 *
 * Rules:
 *   ✓ All 13 CensusRow fields: surname, namePerPassport, hebrewName, aadharNo,
 *     sex, maritalStatus, dob, fatherName, motherName, dateOfJudaismPractice,
 *     passportNo, passportIssueDate, passportExpiryDate
 *   ✓ Uses shared-core types (CensusRow, AliyahStatus)
 *   ✓ Uses submitMember (POST /census/member-submissions) via submit.tsx
 *   ✓ All UI text via useLanguage()
 *   ✓ Draft persistence via censusStore.saveDraft/loadDraft
 *   ✓ Inline step validation before proceeding
 */

import React, { useState, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { ALIYAH_STATUSES, MARITAL_STATUSES, SEXES } from "@workspace/shared-core/census";
import type { AliyahStatus, MaritalStatus, Sex } from "@workspace/shared-core/census";
import { setHead, loadDraft, saveDraft } from "@/lib/censusStore";

const GOLD = "#d4a843";
const ERR  = "#c0392b";

function haptic() {
  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

// ── Validation helpers ────────────────────────────────────────────────────────

function isValidDateString(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s);
  return !isNaN(d.getTime());
}

function isFutureDate(s: string): boolean {
  return new Date(s) > new Date();
}

function isValidYear(s: string): boolean {
  return /^\d{4}$/.test(s);
}

function isFutureYear(s: string): boolean {
  return parseInt(s, 10) > new Date().getFullYear();
}

// ── Field components ─────────────────────────────────────────────────────────

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
  label, value, onChangeText, placeholder, keyboardType, required, colors, error,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "numeric";
  required?: boolean;
  colors: ReturnType<typeof useColors>;
  error?: string;
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
          {
            backgroundColor: colors.card,
            borderColor: error ? ERR : colors.border,
            color: colors.foreground,
          },
        ]}
        accessibilityLabel={label}
      />
      {!!error && <Text style={styles.errorText}>{error}</Text>}
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

function SectionHeader({ title, colors }: { title: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionBar, { backgroundColor: GOLD }]} accessible={false} />
      <Text style={[styles.sectionTitle, { color: colors.foreground }]} accessibilityRole="header">
        {title}
      </Text>
    </View>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function FamilyHeadScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { t }  = useLanguage();

  // All 13 CensusRow fields
  const [surname,               setSurname]               = useState("");
  const [namePerPassport,       setNamePerPassport]       = useState("");
  const [hebrewName,            setHebrewName]            = useState("");
  const [aadharNo,              setAadharNo]              = useState("");
  const [maritalStatus,         setMaritalStatus]         = useState<MaritalStatus>("");
  const [sex,                   setSex]                   = useState<Sex | "">("");
  const [dob,                   setDob]                   = useState("");
  const [fatherName,            setFatherName]            = useState("");
  const [motherName,            setMotherName]            = useState("");
  const [dateOfJudaismPractice, setDateOfJudaismPractice] = useState("");
  const [passportNo,            setPassportNo]            = useState("");
  const [passportIssueDate,     setPassportIssueDate]     = useState("");
  const [passportExpiryDate,    setPassportExpiryDate]    = useState("");

  // Aliyah status (required — surfaced on Family level)
  const [aliyahStatus, setAliyahStatus] = useState<AliyahStatus>("unknown");

  const [saveDone, setSaveDone] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [errors,   setErrors]   = useState<Record<string, string>>({});

  // ── t-aware label helpers ─────────────────────────────────────────────────
  const getAliyahLabel = (s: AliyahStatus): string => {
    switch (s) {
      case "in_israel": return t.censusAliyahInIsrael;
      case "awaiting":  return t.censusAliyahAwaiting;
      case "unknown":   return t.censusAliyahUnknown;
      default:          return s;
    }
  };

  const getSexLabel = (s: Sex | ""): string => {
    if (s === "M") return t.censusSexMale;
    if (s === "F") return t.censusSexFemale;
    return t.censusSelectPlaceholder;
  };

  const getMaritalLabel = (s: MaritalStatus): string => {
    switch (s) {
      case "Single":   return t.censusMaritalSingle;
      case "Married":  return t.censusMaritalMarried;
      case "Divorced": return t.censusMaritalDivorced;
      case "Widowed":  return t.censusMaritalWidowed;
      default:         return t.censusSelectPlaceholder;
    }
  };

  // ── Load draft on mount ───────────────────────────────────────────────────
  const draftLoaded = useRef(false);

  useEffect(() => {
    loadDraft().then((draft) => {
      if (draft?.head && !draftLoaded.current) {
        draftLoaded.current = true;
        const h = draft.head;
        setSurname(h.surname);
        setNamePerPassport(h.namePerPassport);
        setHebrewName(h.hebrewName);
        setAadharNo(h.aadharNo);
        setSex(h.sex || "");
        setMaritalStatus(h.maritalStatus || "");
        setDob(h.dob);
        setFatherName(h.fatherName);
        setMotherName(h.motherName);
        setDateOfJudaismPractice(h.dateOfJudaismPractice);
        setPassportNo(h.passportNo);
        setPassportIssueDate(h.passportIssueDate);
        setPassportExpiryDate(h.passportExpiryDate);
        setAliyahStatus(h.aliyahStatus);
      }
    });
  }, []);

  // ── Auto-save draft (debounced 800 ms) ────────────────────────────────────
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setHead({
        surname:               surname.trim(),
        namePerPassport:       namePerPassport.trim(),
        hebrewName:            hebrewName.trim(),
        aadharNo:              aadharNo.trim(),
        sex:                   sex as Sex,
        maritalStatus:         maritalStatus as MaritalStatus,
        dob:                   dob.trim(),
        fatherName:            fatherName.trim(),
        motherName:            motherName.trim(),
        dateOfJudaismPractice: dateOfJudaismPractice.trim(),
        passportNo:            passportNo.trim(),
        passportIssueDate:     passportIssueDate.trim(),
        passportExpiryDate:    passportExpiryDate.trim(),
        aliyahStatus,
      });
      saveDraft();
    }, 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [
    surname, namePerPassport, hebrewName, aadharNo, sex, maritalStatus, dob,
    fatherName, motherName, dateOfJudaismPractice,
    passportNo, passportIssueDate, passportExpiryDate, aliyahStatus,
  ]);

  // ── Validation ────────────────────────────────────────────────────────────

  function validate(): boolean {
    const errs: Record<string, string> = {};

    if (!namePerPassport.trim()) errs.namePerPassport = t.censusNameRequired;
    if (!surname.trim())         errs.surname         = t.censusErrSurnameRequired;

    const dobVal = dob.trim();
    if (dobVal) {
      if (!isValidDateString(dobVal))  errs.dob = t.censusErrDobFormat;
      else if (isFutureDate(dobVal))   errs.dob = t.censusErrDobFuture;
    }

    const judaismVal = dateOfJudaismPractice.trim();
    if (judaismVal) {
      if (!isValidYear(judaismVal))    errs.dateOfJudaismPractice = t.censusErrYearFormat;
      else if (isFutureYear(judaismVal)) errs.dateOfJudaismPractice = t.censusErrYearFuture;
    }

    const issueVal  = passportIssueDate.trim();
    const expiryVal = passportExpiryDate.trim();
    if (issueVal  && !isValidDateString(issueVal))  errs.passportIssueDate  = t.censusErrPassportDateFormat;
    if (expiryVal && !isValidDateString(expiryVal)) errs.passportExpiryDate = t.censusErrPassportDateFormat;
    if (!errs.passportIssueDate && !errs.passportExpiryDate &&
        issueVal && expiryVal && expiryVal <= issueVal) {
      errs.passportExpiryDate = t.censusErrExpiryAfterIssue;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  function persistToStore() {
    setHead({
      surname:               surname.trim(),
      namePerPassport:       namePerPassport.trim(),
      hebrewName:            hebrewName.trim(),
      aadharNo:              aadharNo.trim(),
      sex:                   sex as Sex,
      maritalStatus:         maritalStatus as MaritalStatus,
      dob:                   dob.trim(),
      fatherName:            fatherName.trim(),
      motherName:            motherName.trim(),
      dateOfJudaismPractice: dateOfJudaismPractice.trim(),
      passportNo:            passportNo.trim(),
      passportIssueDate:     passportIssueDate.trim(),
      passportExpiryDate:    passportExpiryDate.trim(),
      aliyahStatus,
    });
  }

  function handleSaveDraft() {
    haptic();
    setSaving(true);
    try {
      persistToStore();
      saveDraft();
      setSaveDone(true);
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit() {
    if (!validate()) { haptic(); return; }
    haptic();
    setSaving(true);
    try {
      persistToStore();
      saveDraft();
      router.push("/census/family-members");
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.root, { backgroundColor: colors.background }]}>

        {/* ── Nav bar ── */}
        <View style={[styles.nav, { paddingTop: insets.top + SPACE[2], borderBottomColor: colors.border }]}>
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
            {t.censusFamilyHeadTitle}
          </Text>

          <TouchableOpacity
            onPress={handleSaveDraft}
            style={styles.saveDraftBtn}
            accessibilityRole="button"
            accessibilityLabel={t.censusSaveDraft}
          >
            <Feather name="save" size={20} color={saveDone ? GOLD : colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* ── Progress indicator ── */}
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View style={[styles.progressFill, { backgroundColor: GOLD, width: "25%" }]} />
        </View>
        <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>
          Step 1 of 4
        </Text>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── §1 Identity ── */}
          <SectionHeader title={t.censusSectionIdentity} colors={colors} />

          <TextRow label={t.censusFieldSurname}      value={surname}        onChangeText={setSurname}        required colors={colors} error={errors.surname} />
          <TextRow label={t.censusFieldNamePassport}  value={namePerPassport} onChangeText={setNamePerPassport} required colors={colors} error={errors.namePerPassport} />
          <TextRow label={t.censusFieldHebrewName}    value={hebrewName}     onChangeText={setHebrewName}     colors={colors} />
          <TextRow
            label="Aadhar / Teudat Zehut No."
            value={aadharNo}
            onChangeText={setAadharNo}
            colors={colors}
            placeholder="Aadhar No. or Teudat Zehut No."
          />

          <ChipPicker
            label={t.censusFieldSex}
            value={sex}
            options={SEXES}
            getLabel={getSexLabel}
            onSelect={setSex}
            colors={colors}
          />
          <ChipPicker
            label={t.censusFieldMaritalStatus}
            value={maritalStatus}
            options={MARITAL_STATUSES}
            getLabel={getMaritalLabel}
            onSelect={setMaritalStatus}
            colors={colors}
          />
          <TextRow label={t.censusFieldDob} value={dob} onChangeText={setDob} placeholder="YYYY-MM-DD" colors={colors} error={errors.dob} />

          {/* ── §2 Family ── */}
          <SectionHeader title={t.censusSectionFamily} colors={colors} />

          <TextRow label={t.censusFieldFatherName} value={fatherName} onChangeText={setFatherName} colors={colors} />
          <TextRow label={t.censusFieldMotherName} value={motherName} onChangeText={setMotherName} colors={colors} />
          <TextRow
            label={t.censusFieldJudaismDate}
            value={dateOfJudaismPractice}
            onChangeText={setDateOfJudaismPractice}
            placeholder="YYYY"
            colors={colors}
            error={errors.dateOfJudaismPractice}
          />

          {/* ── §3 Aliyah ── */}
          <SectionHeader title={t.censusSectionAliyah} colors={colors} />

          <ChipPicker
            label={t.censusFieldAliyahStatus}
            value={aliyahStatus}
            options={ALIYAH_STATUSES}
            getLabel={getAliyahLabel}
            onSelect={setAliyahStatus}
            required
            colors={colors}
          />

          {/* ── §4 Passport ── */}
          <SectionHeader title={t.censusSectionPassport} colors={colors} />

          <TextRow label={t.censusFieldPassportNo}     value={passportNo}         onChangeText={setPassportNo}         colors={colors} />
          <TextRow label={t.censusFieldPassportIssue}  value={passportIssueDate}  onChangeText={setPassportIssueDate}  placeholder="YYYY-MM-DD" colors={colors} error={errors.passportIssueDate} />
          <TextRow label={t.censusFieldPassportExpiry} value={passportExpiryDate} onChangeText={setPassportExpiryDate} placeholder="YYYY-MM-DD" colors={colors} error={errors.passportExpiryDate} />

          {/* ── Privacy note ── */}
          <View
            style={[styles.privacyNote, { backgroundColor: colors.card, borderColor: colors.border }]}
            accessible
            accessibilityLabel={t.censusPrivacyNote}
          >
            <Feather name="lock" size={14} color={colors.mutedForeground} />
            <Text style={[styles.privacyText, { color: colors.mutedForeground }]}>
              {t.censusPrivacyNote}
            </Text>
          </View>

          {/* ── Actions ── */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: GOLD }]}
              onPress={handleSubmit}
              activeOpacity={0.82}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel={t.censusSubmitCta}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#1a1100" />
              ) : (
                <>
                  <Feather name="arrow-right" size={17} color="#1a1100" />
                  <Text style={styles.submitBtnText}>{t.censusSubmitCta}</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.draftBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={handleSaveDraft}
              activeOpacity={0.82}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel={t.censusSaveDraft}
            >
              <Feather name="save" size={16} color={colors.mutedForeground} />
              <Text style={[styles.draftBtnText, { color: colors.mutedForeground }]}>
                {t.censusSaveDraft}
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
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
  backBtn:      { width: 40, height: 40, justifyContent: "center" },
  saveDraftBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "flex-end" },
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
  sectionBar:  { width: 3, height: 18, borderRadius: 2 },
  sectionTitle: { fontSize: TEXT.md, fontWeight: "700", letterSpacing: 0.1 },

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
  errorText: { color: ERR, fontSize: 12, fontWeight: "500", marginTop: 3 },

  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: SPACE[2] },
  chip: {
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACE[3],
    paddingVertical: SPACE[2],
  },
  chipText: { fontSize: TEXT.sm, fontWeight: "600" },

  privacyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACE[2],
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACE[4],
    marginTop: SPACE[4],
    marginBottom: SPACE[2],
  },
  privacyText: { flex: 1, fontSize: TEXT.sm, lineHeight: 19 },

  actions: { gap: SPACE[3], marginTop: SPACE[5] },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE[2],
    borderRadius: RADIUS.full,
    paddingVertical: SPACE[4],
  },
  submitBtnText: { fontSize: TEXT.md, fontWeight: "800", color: "#1a1100", letterSpacing: -0.3 },
  draftBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE[2],
    borderRadius: RADIUS.full,
    paddingVertical: SPACE[3],
    borderWidth: 1,
  },
  draftBtnText: { fontSize: TEXT.sm, fontWeight: "600" },
});
