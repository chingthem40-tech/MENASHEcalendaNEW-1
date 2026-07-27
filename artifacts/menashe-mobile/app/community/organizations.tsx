/**
 * Community · Organizations — full list screen
 * Deep screen navigated to from the Community Hub (§5).
 * Static, curated organization/resource directory — read-only on mobile
 * (mirrors the same categories used in the web Community modal).
 */

import React, { memo } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Platform,
  StyleSheet, Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { SPACE, TEXT, RADIUS } from "@/constants/colors";
import { useLanguage } from "@/context/LanguageContext";

// ── Constants ──────────────────────────────────────────────────────────────

const SHIVTEI_URL = "https://www.shivteimenashe.org/";
// Royal blue from the Shivtei Menashe website identity
const SHIVTEI_BLUE      = "#1e3a8a";
const SHIVTEI_BLUE_MID  = "#2563eb";
const SHIVTEI_BLUE_SOFT = "#1e3a8a";

// ── Organization data ──────────────────────────────────────────────────────

interface Organization {
  id: string;
  emoji: string;
  name: string;
  descKey:
    | "commOrgShaveiDesc"
    | "commOrgFedDesc"
    | "commOrgHotlineDesc"
    | "commOrgNewsletterDesc"
    | "commOrgTorahClassesDesc"
    | "commOrgConnectDesc";
  url?: string;
  color: string;
}

const ORGANIZATIONS: Organization[] = [
  { id: "shavei",      emoji: "✡",  name: "Shavei Israel",            descKey: "commOrgShaveiDesc",       url: "https://www.shavei.org", color: "#1a3a22" },
  { id: "federation",  emoji: "🫂",  name: "Bnei Menashe Federation",  descKey: "commOrgFedDesc",          color: "#1a2e4a" },
  { id: "hotline",     emoji: "📞",  name: "Community Hotline",        descKey: "commOrgHotlineDesc",      color: "#3a2508" },
  { id: "newsletter",  emoji: "📰",  name: "Bnei Menashe Newsletter",  descKey: "commOrgNewsletterDesc",   color: "#2a1e3a" },
  { id: "torah",       emoji: "🎓",  name: "Torah Classes",            descKey: "commOrgTorahClassesDesc", color: "#0e3a2e" },
  { id: "connect",     emoji: "🤝",  name: "Connect with Members",     descKey: "commOrgConnectDesc",      color: "#3a1e1e" },
];

// ── Featured Shivtei Menashe card ──────────────────────────────────────────

function ShivteiMenasheCard({ t }: { t: ReturnType<typeof useLanguage>["t"] }) {
  function handleVisit() {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(SHIVTEI_URL);
  }

  return (
    <View style={shivteiStyles.wrapper} accessibilityLabel="Shivtei Menashe Organization">
      {/* FEATURED badge */}
      <View style={shivteiStyles.featuredBadge}>
        <Text style={shivteiStyles.featuredBadgeText}>⭐ FEATURED</Text>
      </View>

      {/* Card body */}
      <View style={shivteiStyles.card}>
        {/* Top glow bar */}
        <View style={shivteiStyles.glowBar} />

        {/* Header row — crown icon + name block */}
        <View style={shivteiStyles.headerRow}>
          <View style={shivteiStyles.crownBox}>
            <Text style={shivteiStyles.crownEmoji}>👑</Text>
          </View>

          <View style={{ flex: 1, gap: 3 }}>
            <Text style={shivteiStyles.orgName} numberOfLines={1}>
              {t.commOrgShivteiName}
            </Text>
            <Text style={shivteiStyles.tagline} numberOfLines={1}>
              {t.commOrgShivteiTagline}
            </Text>
          </View>

          {/* External link indicator */}
          <View style={shivteiStyles.linkBadge}>
            <Feather name="globe" size={13} color={SHIVTEI_BLUE_MID} />
          </View>
        </View>

        {/* Divider */}
        <View style={shivteiStyles.divider} />

        {/* Description */}
        <Text style={shivteiStyles.desc}>{t.commOrgShivteiDesc}</Text>

        {/* Info pills row */}
        <View style={shivteiStyles.pillsRow}>
          <View style={shivteiStyles.pill}><Text style={shivteiStyles.pillText}>🇮🇱 Israel</Text></View>
          <View style={shivteiStyles.pill}><Text style={shivteiStyles.pillText}>📖 Torah</Text></View>
          <View style={shivteiStyles.pill}><Text style={shivteiStyles.pillText}>🌏 Worldwide</Text></View>
        </View>

        {/* CTA button */}
        <TouchableOpacity
          onPress={handleVisit}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel={`Visit Shivtei Menashe website`}
          style={shivteiStyles.ctaBtn}
        >
          <Feather name="external-link" size={16} color="#fff" />
          <Text style={shivteiStyles.ctaBtnText}>{t.commOrgVisitSite} →</Text>
        </TouchableOpacity>

        {/* URL footnote */}
        <Text style={shivteiStyles.urlNote} numberOfLines={1}>
          shivteimenashe.org
        </Text>
      </View>
    </View>
  );
}

// ── Organization card ──────────────────────────────────────────────────────

const OrgCard = memo(function OrgCard({
  org, colors, t,
}: {
  org: Organization;
  colors: ReturnType<typeof useColors>;
  t: ReturnType<typeof useLanguage>["t"];
}) {
  function handleVisit() {
    if (!org.url) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(org.url);
  }

  return (
    <View
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      accessibilityLabel={org.name}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: org.color }]}>
          <Text style={{ fontSize: 22 }}>{org.emoji}</Text>
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
            {org.name}
          </Text>
          <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>
            {t[org.descKey]}
          </Text>
        </View>
      </View>

      {org.url && (
        <TouchableOpacity
          onPress={handleVisit}
          style={[styles.actionBtn, { borderColor: colors.primary + "55", backgroundColor: colors.primary + "0E" }]}
          accessibilityRole="button"
          accessibilityLabel={`${t.commOrgVisitSite} ${org.name}`}
        >
          <Feather name="external-link" size={14} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary }]}>{t.commOrgVisitSite}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

// ── Screen ─────────────────────────────────────────────────────────────────

export default function OrganizationsScreen() {
  const colors = useColors();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === "web" ? 60 : 20);

  // +1 for Shivtei Menashe featured org
  const totalOrgs = ORGANIZATIONS.length + 1;

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
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>
            {t.commOrgsTitle}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACE[4], paddingBottom: insets.bottom + 100 }}
        accessibilityLabel="Organizations directory"
      >
        <Text style={[styles.intro, { color: colors.mutedForeground }]}>
          {t.commOrgsScreenDesc}
        </Text>

        <View style={[styles.statsBar, { backgroundColor: colors.primary + "0C", borderColor: colors.primary + "22" }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.primary }]}>{totalOrgs}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{t.commOrgsStatOrgs.toUpperCase()}</Text>
          </View>
        </View>

        {/* ── Featured: Shivtei Menashe ── */}
        <ShivteiMenasheCard t={t} />

        {/* ── Rest of directory ── */}
        {ORGANIZATIONS.map((org) => (
          <OrgCard key={org.id} org={org} colors={colors} t={t} />
        ))}
      </ScrollView>
    </View>
  );
}

// ── Styles — Shivtei Menashe featured card ────────────────────────────────

const shivteiStyles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACE[5],
    position: "relative",
  },
  featuredBadge: {
    position: "absolute",
    top: -10,
    right: 12,
    zIndex: 10,
    backgroundColor: SHIVTEI_BLUE_MID,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    // shadow
    shadowColor: SHIVTEI_BLUE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 6,
  },
  featuredBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: SHIVTEI_BLUE + "55",
    backgroundColor: SHIVTEI_BLUE_SOFT + "18",
    overflow: "hidden",
    // glow shadow
    shadowColor: SHIVTEI_BLUE_MID,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
    paddingBottom: 16,
  },
  glowBar: {
    height: 4,
    backgroundColor: SHIVTEI_BLUE_MID,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACE[3],
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  crownBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: SHIVTEI_BLUE,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: SHIVTEI_BLUE_MID + "88",
    flexShrink: 0,
    // inner glow
    shadowColor: SHIVTEI_BLUE_MID,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  crownEmoji: {
    fontSize: 26,
  },
  orgName: {
    fontSize: 18,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.2,
  },
  tagline: {
    fontSize: 12,
    fontWeight: "500",
    color: SHIVTEI_BLUE_MID,
    letterSpacing: 0.2,
  },
  linkBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: SHIVTEI_BLUE_MID + "22",
    borderWidth: 1,
    borderColor: SHIVTEI_BLUE_MID + "44",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  divider: {
    height: 1,
    backgroundColor: SHIVTEI_BLUE_MID + "33",
    marginHorizontal: 16,
    marginBottom: 12,
  },
  desc: {
    fontSize: 13,
    lineHeight: 19,
    color: "#c7d2fe",
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  pillsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  pill: {
    backgroundColor: SHIVTEI_BLUE + "55",
    borderWidth: 1,
    borderColor: SHIVTEI_BLUE_MID + "44",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#bfdbfe",
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: SHIVTEI_BLUE_MID,
    borderRadius: 12,
    paddingVertical: 13,
    marginHorizontal: 16,
    marginBottom: 10,
    // glow
    shadowColor: SHIVTEI_BLUE_MID,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  ctaBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.2,
  },
  urlNote: {
    fontSize: 11,
    color: SHIVTEI_BLUE_MID + "99",
    textAlign: "center",
  },
});

// ── Styles — general ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACE[4],
    paddingBottom: SPACE[4],
    gap: SPACE[3],
  },
  backBtn: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  screenEyebrow: {
    fontSize: TEXT.xs,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  screenTitle: {
    fontSize: TEXT["2xl"],
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  intro: {
    fontSize: TEXT.sm,
    lineHeight: 20,
    marginBottom: SPACE[4],
    marginTop: SPACE[2],
  },
  statsBar: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACE[4],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACE[6],
    marginBottom: SPACE[6],
  },
  statItem: { alignItems: "center", gap: 2 },
  statNum: { fontSize: TEXT["2xl"], fontWeight: "900" },
  statLabel: { fontSize: TEXT.xs, fontWeight: "700", letterSpacing: 0.5 },

  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACE[4],
    marginBottom: SPACE[3],
    gap: SPACE[3],
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACE[3],
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardName: { fontSize: TEXT.base, fontWeight: "700" },
  cardDesc: { fontSize: TEXT.sm, lineHeight: 18, marginTop: 2 },

  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingVertical: SPACE[2],
    paddingHorizontal: SPACE[3],
    minHeight: 44,
    alignSelf: "flex-start",
  },
  actionText: { fontSize: TEXT.sm, fontWeight: "600" },
});
