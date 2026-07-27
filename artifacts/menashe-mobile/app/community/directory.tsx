/**
 * Community · Member Directory — browse screen
 * Deep screen navigated to from the Community Hub.
 * Server-backed (member_directory table) — public read of approved members,
 * mirrors the web app's Member Directory modal (search + role/country filters
 * + tap-to-connect via WhatsApp/email/phone).
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Platform,
  StyleSheet, Linking, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { SPACE, TEXT, RADIUS } from "@/constants/colors";
import { useLanguage } from "@/context/LanguageContext";
import { EmptyState, ErrorState } from "@/src/mobile/components/feedback";
import { fetchDirectory, type DirectoryMember } from "@/lib/directoryApi";

const ROLES = ["Member", "Community Leader", "Rabbi", "Cantor", "Youth Leader", "Women's Group", "Student", "Elder"];
const COUNTRIES = ["India", "Israel", "United States", "United Kingdom", "Australia", "Canada", "Other"];

const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  "Rabbi":             { bg: "rgba(212,168,67,0.18)", color: "#d4a843" },
  "Cantor":            { bg: "rgba(212,168,67,0.12)", color: "#c9a03a" },
  "Community Leader":  { bg: "rgba(139,92,246,0.18)", color: "#a78bfa" },
  "Youth Leader":      { bg: "rgba(59,130,246,0.18)", color: "#60a5fa" },
  "Women's Group":     { bg: "rgba(236,72,153,0.15)", color: "#f472b6" },
  "Student":           { bg: "rgba(74,222,128,0.12)", color: "#4ade80" },
  "Elder":             { bg: "rgba(255,180,50,0.15)", color: "#fbbf24" },
  "Member":            { bg: "rgba(100,116,139,0.15)", color: "#94a3b8" },
};

const FLAG: Record<string, string> = {
  "India": "🇮🇳", "Israel": "🇮🇱", "United States": "🇺🇸",
  "United Kingdom": "🇬🇧", "Australia": "🇦🇺", "Canada": "🇨🇦", "Other": "🌐",
};

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("");
}

function avatarBg(name: string): string {
  const colors = ["#1a3050", "#2a1a40", "#1a2a20", "#30200a", "#1a1a30", "#2a1030", "#0f2030", "#301020"];
  let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
}

function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" }); }
  catch { return ""; }
}

function haptic() {
  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

function MemberAvatar({ member, size = 48 }: { member: DirectoryMember; size?: number }) {
  const hasPhoto = !!member.profilePhotoUrl;
  const hasEmoji = member.avatarEmoji && member.avatarEmoji !== "👤";
  return (
    <View style={{
      width: size, height: size, borderRadius: RADIUS.md, flexShrink: 0,
      backgroundColor: hasPhoto || hasEmoji ? "transparent" : avatarBg(member.name),
      alignItems: "center", justifyContent: "center", overflow: "hidden",
    }}>
      {hasEmoji ? (
        <Text style={{ fontSize: size * 0.5 }}>{member.avatarEmoji}</Text>
      ) : (
        <Text style={{ fontSize: size * 0.33, fontWeight: "800", color: "rgba(255,255,255,0.85)" }}>
          {initials(member.name)}
        </Text>
      )}
    </View>
  );
}

// ── Member card ──────────────────────────────────────────────────────────────

function MemberCard({
  member, colors, t, open, onToggle,
}: {
  member: DirectoryMember;
  colors: ReturnType<typeof useColors>;
  t: ReturnType<typeof useLanguage>["t"];
  open: boolean;
  onToggle: () => void;
}) {
  const rc = ROLE_COLORS[member.role] || ROLE_COLORS["Member"];
  const hasContact = !!(member.whatsapp || member.phone || member.email || member.otherContact);
  const introMsg = "Shalom! I found you in the Bnei Menashe Member Directory and would love to connect. 🕍";

  function openWhatsApp() {
    haptic();
    if (!member.whatsapp) return;
    Linking.openURL(`https://wa.me/${member.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(introMsg)}`);
  }
  function openEmail() {
    haptic();
    if (!member.email) return;
    Linking.openURL(`mailto:${member.email}?subject=${encodeURIComponent("Bnei Menashe Community — Hello!")}&body=${encodeURIComponent(introMsg)}`);
  }
  function openCall() {
    haptic();
    if (!member.phone) return;
    Linking.openURL(`tel:${member.phone.replace(/\s/g, "")}`);
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: open ? colors.primary + "55" : colors.border }]}>
      <View style={styles.cardHeader}>
        <MemberAvatar member={member} />
        <View style={{ flex: 1, gap: 3 }}>
          <View style={styles.badgeRow}>
            <Text style={[styles.roleBadge, { color: rc.color, backgroundColor: rc.bg }]}>{member.role}</Text>
            {hasContact && (
              <TouchableOpacity
                onPress={onToggle}
                accessibilityRole="button"
                accessibilityLabel={open ? t.dirClose : t.dirConnect}
                style={[styles.connectBtn, { backgroundColor: open ? colors.primary + "2E" : colors.primary + "1A" }]}
              >
                <Text style={[styles.connectBtnText, { color: colors.primary }]}>
                  {open ? `✕ ${t.dirClose}` : `💬 ${t.dirConnect}`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.memberName, { color: colors.foreground }]} numberOfLines={1}>{member.name}</Text>
          <Text style={[styles.memberMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
            {FLAG[member.country] || "🌐"} {member.city}, {member.country} · {t.dirMemberSince} {fmtDate(member.joinedAt)}
          </Text>
          {!!member.bio && <Text style={[styles.memberBio, { color: colors.foreground }]}>{member.bio}</Text>}
        </View>
      </View>

      {open && hasContact && (
        <View style={[styles.connectPanel, { borderTopColor: colors.border }]}>
          {member.whatsapp && (
            <TouchableOpacity onPress={openWhatsApp} style={[styles.contactBtn, { backgroundColor: "rgba(37,211,102,0.14)", borderColor: "rgba(37,211,102,0.35)" }]} accessibilityRole="button" accessibilityLabel="WhatsApp">
              <Feather name="message-circle" size={14} color="#25d366" />
              <Text style={[styles.contactBtnText, { color: "#25d366" }]}>WhatsApp</Text>
            </TouchableOpacity>
          )}
          {member.email && (
            <TouchableOpacity onPress={openEmail} style={[styles.contactBtn, { backgroundColor: colors.primary + "1E", borderColor: colors.primary + "4D" }]} accessibilityRole="button" accessibilityLabel="Email">
              <Feather name="mail" size={14} color={colors.primary} />
              <Text style={[styles.contactBtnText, { color: colors.primary }]}>Email</Text>
            </TouchableOpacity>
          )}
          {member.phone && (
            <TouchableOpacity onPress={openCall} style={[styles.contactBtn, { backgroundColor: "rgba(96,165,250,0.14)", borderColor: "rgba(96,165,250,0.35)" }]} accessibilityRole="button" accessibilityLabel="Call">
              <Feather name="phone" size={14} color="#60a5fa" />
              <Text style={[styles.contactBtnText, { color: "#60a5fa" }]}>Call</Text>
            </TouchableOpacity>
          )}
          {member.otherContact && (
            <Text style={[styles.otherContact, { color: "#a78bfa" }]}>💬 {member.otherContact}</Text>
          )}
        </View>
      )}
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────

export default function DirectoryScreen() {
  const colors = useColors();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === "web" ? 60 : 20);

  const [members, setMembers] = useState<DirectoryMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [filterCountry, setFilterCountry] = useState("All");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const list = await fetchDirectory();
      setMembers(list);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(() => {
    let list = members;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(m => m.name.toLowerCase().includes(q) || m.city.toLowerCase().includes(q));
    }
    if (filterRole !== "All") list = list.filter(m => m.role === filterRole);
    if (filterCountry !== "All") list = list.filter(m => m.country === filterCountry);
    return list;
  }, [members, search, filterRole, filterCountry]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + SPACE[2] }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={t.commBack}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={[styles.screenEyebrow, { color: colors.primary }]}>COMMUNITY</Text>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>{t.dirTitle}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACE[4], paddingBottom: insets.bottom + 100 }}
        accessibilityLabel="Member directory"
      >
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {members.filter(m => m.status === "approved").length} {t.dirMembersWorldwide}
        </Text>

        <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t.dirSearchPlaceholder}
            placeholderTextColor={colors.mutedForeground + "99"}
            style={[styles.searchInput, { color: colors.foreground }]}
            accessibilityLabel={t.dirSearchPlaceholder}
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch("")} accessibilityRole="button" accessibilityLabel="Clear">
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={{ gap: SPACE[2] }}>
          {["All", ...ROLES].map(r => {
            const active = filterRole === r;
            const rc = ROLE_COLORS[r];
            return (
              <TouchableOpacity
                key={r}
                onPress={() => { haptic(); setFilterRole(r); }}
                accessibilityRole="button"
                accessibilityLabel={r}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? (rc?.bg || colors.primary + "26") : colors.card,
                    borderColor: active ? (rc?.color || colors.primary) : colors.border,
                  },
                ]}
              >
                <Text style={{ fontSize: TEXT.xs, fontWeight: "700", color: active ? (rc?.color || colors.primary) : colors.mutedForeground }}>{r}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.chipRow, { marginBottom: SPACE[4] }]} contentContainerStyle={{ gap: SPACE[2] }}>
          {["All", ...COUNTRIES].map(c => {
            const active = filterCountry === c;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => { haptic(); setFilterCountry(c); }}
                accessibilityRole="button"
                accessibilityLabel={c}
                style={[styles.chip, { backgroundColor: active ? colors.primary + "1F" : colors.card, borderColor: active ? colors.primary : colors.border }]}
              >
                <Text style={{ fontSize: TEXT.xs, fontWeight: "700", color: active ? colors.primary : colors.mutedForeground }}>
                  {c !== "All" ? `${FLAG[c] || "🌐"} ` : ""}{c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={{ paddingVertical: SPACE[10], alignItems: "center" }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error ? (
          <ErrorState message={t.dirLoadError} onRetry={load} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="users"
            title={search || filterRole !== "All" || filterCountry !== "All" ? t.dirNoMatch : t.dirNoMembers}
            subtitle={search ? undefined : t.dirBeFirst}
          />
        ) : (
          filtered.map(m => (
            <MemberCard
              key={m.id}
              member={m}
              colors={colors}
              t={t}
              open={openId === m.id}
              onToggle={() => setOpenId(openId === m.id ? null : m.id)}
            />
          ))
        )}

        <TouchableOpacity
          style={[styles.joinCta, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "33" }]}
          onPress={() => { haptic(); router.push("/community/directory-register" as never); }}
          accessibilityRole="button"
          accessibilityLabel={t.dirJoinButton}
        >
          <Text style={[styles.joinTitle, { color: colors.foreground }]}>{t.dirJoinQuestion}</Text>
          <Text style={[styles.joinDesc, { color: colors.mutedForeground }]}>{t.dirJoinDesc}</Text>
          <View style={[styles.joinButton, { backgroundColor: colors.primary }]}>
            <Text style={[styles.joinButtonText, { color: colors.primaryForeground }]}>+ {t.dirJoinButton}</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: SPACE[4], paddingBottom: SPACE[4], gap: SPACE[3] },
  backBtn: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  headerText: { flex: 1 },
  screenEyebrow: { fontSize: TEXT.xs, fontWeight: "700", letterSpacing: 1.2, marginBottom: 2 },
  screenTitle: { fontSize: TEXT["2xl"], fontWeight: "800", letterSpacing: -0.3 },
  subtitle: { fontSize: TEXT.sm, marginBottom: SPACE[3] },

  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: SPACE[2],
    borderWidth: 1, borderRadius: RADIUS.md, paddingHorizontal: SPACE[3], height: 44, marginBottom: SPACE[3],
  },
  searchInput: { flex: 1, fontSize: TEXT.sm, height: "100%" },
  chipRow: { flexGrow: 0, marginBottom: SPACE[2] },
  chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1 },

  card: { borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACE[4], marginBottom: SPACE[3], overflow: "hidden" },
  cardHeader: { flexDirection: "row", gap: SPACE[3], alignItems: "flex-start" },
  badgeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: SPACE[2] },
  roleBadge: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5, borderRadius: 5, paddingVertical: 2, paddingHorizontal: 7, overflow: "hidden" },
  connectBtn: { borderRadius: 20, paddingVertical: 4, paddingHorizontal: 11 },
  connectBtnText: { fontSize: 11, fontWeight: "800" },
  memberName: { fontSize: TEXT.base, fontWeight: "800", marginTop: 2 },
  memberMeta: { fontSize: TEXT.xs },
  memberBio: { fontSize: TEXT.sm, lineHeight: 18, marginTop: 4 },

  connectPanel: { borderTopWidth: 1, marginTop: SPACE[3], paddingTop: SPACE[3], flexDirection: "row", flexWrap: "wrap", gap: SPACE[2] },
  contactBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: RADIUS.md, borderWidth: 1, paddingVertical: 8, paddingHorizontal: 14 },
  contactBtnText: { fontSize: TEXT.sm, fontWeight: "800" },
  otherContact: { fontSize: TEXT.sm, width: "100%" },

  joinCta: { borderRadius: RADIUS.lg, borderWidth: 1, padding: SPACE[4], alignItems: "center", marginTop: SPACE[2], marginBottom: SPACE[4] },
  joinTitle: { fontSize: TEXT.base, fontWeight: "700", marginBottom: 4 },
  joinDesc: { fontSize: TEXT.sm, marginBottom: SPACE[3], textAlign: "center" },
  joinButton: { borderRadius: RADIUS.md, paddingVertical: 10, paddingHorizontal: 24 },
  joinButtonText: { fontSize: TEXT.sm, fontWeight: "800" },
});
