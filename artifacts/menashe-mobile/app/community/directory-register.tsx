/**
 * Community · Member Directory — register / edit screen
 * Deep screen reached from the Directory browse screen's "Join the Directory"
 * CTA. Mirrors the web app's registration form fields exactly, backed by the
 * same server endpoints (POST to register, PUT to edit an existing entry).
 */

import React, { useEffect, useState } from "react";
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
import { useAuth, useUser } from "@clerk/expo";

import { useColors } from "@/hooks/useColors";
import { SPACE, TEXT, RADIUS } from "@/constants/colors";
import { useLanguage } from "@/context/LanguageContext";
import { MenasheButton } from "@/src/mobile/components/foundation/MenasheButton";
import {
  fetchMyDirectoryEntry, registerDirectoryMember, updateDirectoryMember,
  type DirectoryRegistration,
} from "@/lib/directoryApi";

const GOLD = "#d4a843";
const ROLES = ["Member", "Community Leader", "Rabbi", "Cantor", "Youth Leader", "Women's Group", "Student", "Elder"];
const COUNTRIES = ["India", "Israel", "United States", "United Kingdom", "Australia", "Canada", "Other"];

function haptic() {
  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

function emptyForm(): DirectoryRegistration {
  return { name: "", city: "", country: "India", role: "Member", bio: "", whatsapp: "", phone: "", email: "", otherContact: "", birthday: "", aliyahDate: "" };
}

function FieldLabel({ label, required, colors }: { label: string; required?: boolean; colors: ReturnType<typeof useColors> }) {
  return (
    <Text style={[styles.label, { color: colors.mutedForeground }]}>
      {label}{required && <Text style={{ color: "#ef4444" }}> *</Text>}
    </Text>
  );
}

function TextRow({
  label, icon, value, onChangeText, placeholder, keyboardType, required, colors, multiline,
}: {
  label: string; icon?: React.ComponentProps<typeof Feather>["name"];
  value: string; onChangeText: (v: string) => void; placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad";
  required?: boolean; colors: ReturnType<typeof useColors>; multiline?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {icon && <Feather name={icon} size={16} color={colors.mutedForeground} style={{ width: 18 }} />}
        <View style={{ flex: 1 }}>
          <FieldLabel label={label} required={required} colors={colors} />
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder ?? label}
            placeholderTextColor={colors.mutedForeground + "88"}
            keyboardType={keyboardType ?? "default"}
            multiline={multiline}
            style={[
              styles.input,
              multiline && { minHeight: 76, textAlignVertical: "top", paddingTop: 10 },
              { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground },
            ]}
            accessibilityLabel={label}
          />
        </View>
      </View>
    </View>
  );
}

export default function DirectoryRegisterScreen() {
  const colors = useColors();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const { user } = useUser();

  const [form, setForm] = useState<DirectoryRegistration>(emptyForm);
  const [loadingMe, setLoadingMe] = useState(true);
  const [isEdit, setIsEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const mine = await fetchMyDirectoryEntry(getToken);
        if (mine) {
          setForm({
            name: mine.name, city: mine.city, country: mine.country, role: mine.role, bio: mine.bio,
            whatsapp: mine.whatsapp ?? "", phone: mine.phone ?? "", email: mine.email ?? "",
            otherContact: mine.otherContact ?? "", birthday: mine.birthday ?? "", aliyahDate: mine.aliyahDate ?? "",
          });
          setIsEdit(true);
        } else if (user) {
          setForm(f => ({ ...f, name: user.fullName ?? f.name, email: user.primaryEmailAddress?.emailAddress ?? f.email }));
        }
      } catch {
        // Not signed in or no entry yet — proceed with the blank/prefilled form.
      } finally {
        setLoadingMe(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set<K extends keyof DirectoryRegistration>(key: K, value: DirectoryRegistration[K]) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function submit() {
    if (!form.name.trim()) { setError(t.dirNameRequired); return; }
    if (!form.city.trim()) { setError(t.dirCityRequired); return; }
    setError("");
    setSaving(true);
    haptic();
    try {
      const payload: DirectoryRegistration = {
        ...form,
        whatsapp: form.whatsapp || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        otherContact: form.otherContact || undefined,
        birthday: form.birthday || undefined,
        aliyahDate: form.aliyahDate || undefined,
      };
      if (isEdit) await updateDirectoryMember(payload, getToken);
      else await registerDirectoryMember(payload, getToken);
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.dirSubmitFailed);
    } finally {
      setSaving(false);
    }
  }

  const topPad = insets.top > 0 ? insets.top : (Platform.OS === "web" ? 60 : 20);

  if (done) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center", paddingTop: topPad }]}>
        <Text style={{ fontSize: 52, marginBottom: 14 }}>✅</Text>
        <Text style={[styles.doneTitle, { color: colors.foreground }]}>{isEdit ? t.dirUpdateSuccessTitle : t.dirSuccessTitle}</Text>
        <Text style={[styles.doneDesc, { color: colors.mutedForeground }]}>
          {isEdit ? t.dirUpdateSuccessDesc : t.dirSuccessDesc}
        </Text>
        <MenasheButton label={t.dirBackToDirectory} onPress={() => router.replace("/community/directory" as never)} variant="primary" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + SPACE[2] }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} accessibilityRole="button" accessibilityLabel={t.commBack} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={[styles.screenEyebrow, { color: colors.primary }]}>COMMUNITY</Text>
            <Text style={[styles.screenTitle, { color: colors.foreground }]}>{isEdit ? t.dirEditTitle : t.dirRegisterTitle}</Text>
          </View>
        </View>

        {loadingMe ? (
          <View style={{ paddingTop: SPACE[10], alignItems: "center" }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingHorizontal: SPACE[4], paddingBottom: insets.bottom + 60 }} showsVerticalScrollIndicator={false}>
            <View style={[styles.noteBox, { backgroundColor: GOLD + "0F", borderColor: GOLD + "33" }]}>
              <Text style={{ fontSize: TEXT.xs, color: colors.mutedForeground, lineHeight: 17 }}>
                {isEdit ? t.dirAlreadyRegisteredNote : t.dirReviewNote}
              </Text>
            </View>

            <TextRow label={t.dirFullName} value={form.name} onChangeText={v => set("name", v)} required colors={colors} placeholder={t.dirFullNamePlaceholder} />
            <TextRow label={t.dirCity} value={form.city} onChangeText={v => set("city", v)} required colors={colors} placeholder={t.dirCityPlaceholder} />

            <View style={styles.fieldWrap}>
              <FieldLabel label={t.dirCountry} colors={colors} />
              <View style={styles.chipWrap}>
                {COUNTRIES.map(c => {
                  const selected = form.country === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      onPress={() => { haptic(); set("country", c); }}
                      style={[styles.chip, { backgroundColor: selected ? GOLD + "22" : colors.card, borderColor: selected ? GOLD : colors.border }]}
                      accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={c}
                    >
                      <Text style={{ fontSize: TEXT.xs, fontWeight: "700", color: selected ? GOLD : colors.mutedForeground }}>{c}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.fieldWrap}>
              <FieldLabel label={t.dirRole} colors={colors} />
              <View style={styles.chipWrap}>
                {ROLES.map(r => {
                  const selected = form.role === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      onPress={() => { haptic(); set("role", r); }}
                      style={[styles.chip, { backgroundColor: selected ? GOLD + "22" : colors.card, borderColor: selected ? GOLD : colors.border }]}
                      accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={r}
                    >
                      <Text style={{ fontSize: TEXT.xs, fontWeight: "700", color: selected ? GOLD : colors.mutedForeground }}>{r}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TextRow label={t.dirBio} value={form.bio} onChangeText={v => set("bio", v)} colors={colors} multiline placeholder={t.dirBioPlaceholder} />

            <View style={styles.sectionDivider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerLabel, { color: colors.mutedForeground }]}>📡 {t.dirContactSection}</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>
            <View style={[styles.noteBox, { backgroundColor: GOLD + "0C", borderColor: GOLD + "26" }]}>
              <Text style={{ fontSize: TEXT.xs, color: colors.mutedForeground, lineHeight: 17 }}>{t.dirContactNote}</Text>
            </View>
            <TextRow label={t.dirWhatsapp} icon="message-circle" value={form.whatsapp ?? ""} onChangeText={v => set("whatsapp", v)} keyboardType="phone-pad" colors={colors} placeholder="+91 98765 43210" />
            <TextRow label={t.dirPhone} icon="phone" value={form.phone ?? ""} onChangeText={v => set("phone", v)} keyboardType="phone-pad" colors={colors} placeholder="+91 98765 43210" />
            <TextRow label={t.dirEmail} icon="mail" value={form.email ?? ""} onChangeText={v => set("email", v)} keyboardType="email-address" colors={colors} placeholder="you@example.com" />
            <TextRow label={t.dirOtherContact} icon="message-square" value={form.otherContact ?? ""} onChangeText={v => set("otherContact", v)} colors={colors} placeholder={t.dirOtherContactPlaceholder} />

            <View style={styles.sectionDivider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerLabel, { color: colors.mutedForeground }]}>🎉 {t.dirCelebrationSection}</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>
            <View style={[styles.noteBox, { backgroundColor: GOLD + "0C", borderColor: GOLD + "26" }]}>
              <Text style={{ fontSize: TEXT.xs, color: colors.mutedForeground, lineHeight: 17 }}>{t.dirCelebrationNote}</Text>
            </View>
            <TextRow label={`${t.dirBirthday} (YYYY-MM-DD)`} icon="gift" value={form.birthday ?? ""} onChangeText={v => set("birthday", v)} colors={colors} placeholder="1990-06-22" />
            <TextRow label={`${t.dirAliyahDate} (YYYY-MM-DD)`} icon="send" value={form.aliyahDate ?? ""} onChangeText={v => set("aliyahDate", v)} colors={colors} placeholder="2015-06-22" />

            {!!error && <Text style={styles.errorText}>⚠️ {error}</Text>}

            <MenasheButton
              label={saving ? t.dirSubmitting : (isEdit ? t.dirUpdate : t.dirSubmit)}
              onPress={submit}
              disabled={saving}
              loading={saving}
              variant="primary"
              fullWidth
              style={{ marginTop: SPACE[2] }}
            />
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 16, gap: 12 },
  backBtn: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  headerText: { flex: 1 },
  screenEyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2, marginBottom: 2 },
  screenTitle: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },

  noteBox: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 14 },

  fieldWrap: { marginBottom: 14 },
  label: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, marginBottom: 5, textTransform: "uppercase" },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, minHeight: 44 },

  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1 },

  sectionDivider: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6, marginBottom: 10 },
  dividerLine: { flex: 1, height: 1 },
  dividerLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },

  errorText: { color: "#ef4444", fontSize: 12, marginBottom: 10 },

  doneTitle: { fontSize: 18, fontWeight: "800", marginBottom: 8, textAlign: "center" },
  doneDesc: { fontSize: 13, lineHeight: 20, textAlign: "center", marginBottom: 24, paddingHorizontal: 24 },
});
