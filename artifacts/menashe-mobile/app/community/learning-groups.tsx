/**
 * Community · Learning Groups — full list screen
 * Deep screen navigated to from the Community Hub (§6).
 * Curated static learning groups — no API needed.
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

// ── Data ──────────────────────────────────────────────────────────────────────

type Schedule = "daily" | "weekly" | "monthly";

interface LearningGroup {
  id: string;
  emoji: string;
  name: string;
  nameTK: string;
  subject: string;
  subjectTK: string;
  description: string;
  descriptionTK: string;
  schedule: Schedule;
  day?: string;
  time?: string;
  location: string;
  locationTK?: string;
  virtual: boolean;
  language: string;
  contact?: string;
  openToAll: boolean;
}

const LEARNING_GROUPS: LearningGroup[] = [
  {
    id: "daf-yomi",
    emoji: "📖",
    name: "Daf Yomi Circle",
    nameTK: "Daf Yomi Kihilna",
    subject: "Talmud Bavli",
    subjectTK: "Talmud Bavli",
    description:
      "Daily one-page Talmud study. All are welcome — from first-time learners to advanced scholars. Join the worldwide Jewish learning cycle.",
    descriptionTK:
      "Talmud kihilna zingkhan — thu dawt zawng zawng tan. Khawvel tangtvi Yudah kihilna cycle-ah join rawh.",
    schedule: "daily",
    time: "06:30",
    location: "Virtual · WhatsApp Group",
    locationTK: "Virtual · WhatsApp Group",
    virtual: true,
    language: "English / Hebrew",
    contact: "dafyomi@bneimenashe.org",
    openToAll: true,
  },
  {
    id: "parasha",
    emoji: "📜",
    name: "Weekly Parasha Study",
    nameTK: "Parasha Kihilna",
    subject: "Torah · Weekly Portion",
    subjectTK: "Torah · Sunthal Parasha",
    description:
      "Explore the weekly Torah portion with commentary from Rashi, Ramban, and contemporary Bnei Menashe teachers.",
    descriptionTK:
      "Sunthal Torah parasha Rashi, Ramban leh Bnei Menashe zuau-te in kikupna.",
    schedule: "weekly",
    day: "Shabbat",
    time: "09:30",
    location: "Beit Knesset Bnei Menashe, Churachandpur",
    locationTK: "Beit Knesset Bnei Menashe, Churachandpur",
    virtual: false,
    language: "Thadou-Kukish / Hebrew",
    openToAll: true,
  },
  {
    id: "womens-torah",
    emoji: "🌸",
    name: "Women's Torah Study",
    nameTK: "Nu-te Torah Kihilna",
    subject: "Halacha · Jewish Home",
    subjectTK: "Halacha · Yudah Inn",
    description:
      "A warm, supportive learning circle for women covering Shabbat, family purity, Jewish holidays, and practical Halacha.",
    descriptionTK:
      "Nu-te tan kihilna — Shabbat, nu-te thupha, lawmman, halacha ngaih.",
    schedule: "weekly",
    day: "Wednesday",
    time: "17:00",
    location: "Community Hall, Churachandpur",
    locationTK: "Mipil Hall, Churachandpur",
    virtual: false,
    language: "Thadou-Kukish",
    openToAll: false,
  },
  {
    id: "halacha-class",
    emoji: "🕍",
    name: "Halacha for Bnei Menashe",
    nameTK: "Bnei Menashe Halacha",
    subject: "Practical Halacha",
    subjectTK: "Halacha Ngaihdan",
    description:
      "Weekly Halacha shiur addressing questions specific to Bnei Menashe families — kashrut, Shabbat observance, aliyah transitions, and more.",
    descriptionTK:
      "Bnei Menashe chhungkua halacha — kashrut, Shabbat, aliyah leh dangte.",
    schedule: "weekly",
    day: "Thursday",
    time: "20:00",
    location: "Virtual · Zoom",
    locationTK: "Virtual · Zoom",
    virtual: true,
    language: "English",
    contact: "halacha@bneimenashe.org",
    openToAll: true,
  },
  {
    id: "youth-mishnah",
    emoji: "⭐",
    name: "Youth Mishnah Program",
    nameTK: "Sipai-te Mishnah",
    subject: "Mishnah · Ages 10–18",
    subjectTK: "Mishnah · 10–18 kumte tan",
    description:
      "Structured Mishnah study for Bnei Menashe youth. Builds Hebrew reading, Talmudic reasoning, and a love for Torah learning.",
    descriptionTK:
      "Sipai-te Mishnah kihilna — Hebrew zawng, thupha ngaihdan leh Torah ngaina.",
    schedule: "weekly",
    day: "Sunday",
    time: "10:00",
    location: "Multiple Locations: Churachandpur, Imphal, Aizawl",
    locationTK: "Hmun tampi: Churachandpur, Imphal, Aizawl",
    virtual: false,
    language: "Thadou-Kukish / English",
    openToAll: true,
  },
  {
    id: "hebrew",
    emoji: "🔤",
    name: "Hebrew Language Class",
    nameTK: "Hebrew Thu Kihilna",
    subject: "Hebrew · Beginner to Advanced",
    subjectTK: "Hebrew · Birte pan kipakhat tan",
    description:
      "Learn modern and liturgical Hebrew essential for aliyah, prayer, and Torah study. Beginner and intermediate tracks available.",
    descriptionTK:
      "Hebrew zir — aliyah, thupui leh Torah tan. Birte leh kipak trak um.",
    schedule: "weekly",
    day: "Tuesday",
    time: "18:30",
    location: "Virtual · Zoom + Local Study Groups",
    locationTK: "Virtual · Zoom + Mipil Kihilna",
    virtual: true,
    language: "English / Thadou-Kukish",
    contact: "hebrew@bneimenashe.org",
    openToAll: true,
  },
];

const SCHED_COLOR: Record<Schedule, string> = {
  daily:   "#4ade80",
  weekly:  "#818cf8",
  monthly: "#fb923c",
};

// ── Group card ─────────────────────────────────────────────────────────────────

const GroupCard = memo(function GroupCard({
  group,
  colors,
  lang,
  t,
}: {
  group: LearningGroup;
  colors: ReturnType<typeof useColors>;
  lang: string;
  t: ReturnType<typeof useLanguage>["t"];
}) {
  const name    = lang === "tk" ? group.nameTK : group.name;
  const subject = lang === "tk" ? group.subjectTK : group.subject;
  const desc    = lang === "tk" ? group.descriptionTK : group.description;
  const loc     = lang === "tk" && group.locationTK ? group.locationTK : group.location;
  const accentColor = SCHED_COLOR[group.schedule];

  function handleContact() {
    if (group.contact) {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Linking.openURL(`mailto:${group.contact}`);
    }
  }

  function handleOpenDetail() {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/community/learning-detail/${group.id}`);
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handleOpenDetail}
      accessibilityRole="button"
      accessibilityLabel={`${name}. ${t.commLearningOpenToAll ?? "View learning details"}`}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {/* Top */}
      <View style={styles.cardTop}>
        <View style={[styles.emojiBox, { backgroundColor: accentColor + "1A" }]}>
          <Text style={{ fontSize: TEXT.xl }}>{group.emoji}</Text>
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={[styles.cardName, { color: colors.foreground }]}>{name}</Text>
          <Text style={[styles.cardSubject, { color: colors.primary }]}>{subject}</Text>
        </View>
        <View style={[styles.schedBadge, { backgroundColor: accentColor + "1A", borderColor: accentColor + "44" }]}>
          <Text style={[styles.schedText, { color: accentColor }]}>
            {group.schedule.charAt(0).toUpperCase() + group.schedule.slice(1)}
          </Text>
        </View>
      </View>

      {/* Description */}
      <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>{desc}</Text>

      {/* Details */}
      <View style={[styles.detailsBox, { backgroundColor: colors.muted + "80", borderColor: colors.border }]}>
        {(group.day || group.time) && (
          <View style={styles.detailRow}>
            <Feather name="clock" size={12} color={colors.mutedForeground} />
            <Text style={[styles.detailText, { color: colors.foreground }]}>
              {[group.day, group.time].filter(Boolean).join(" · ")}
            </Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Feather name={group.virtual ? "video" : "map-pin"} size={12} color={colors.mutedForeground} />
          <Text style={[styles.detailText, { color: colors.foreground }]} numberOfLines={2}>{loc}</Text>
        </View>
        <View style={styles.detailRow}>
          <Feather name="globe" size={12} color={colors.mutedForeground} />
          <Text style={[styles.detailText, { color: colors.foreground }]}>{group.language}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.cardFooter}>
        <View style={[
          styles.openBadge,
          { backgroundColor: group.openToAll ? "#4ade8016" : "#fb923c16",
            borderColor:     group.openToAll ? "#4ade8044" : "#fb923c44" },
        ]}>
          <Feather
            name={group.openToAll ? "users" : "user-check"}
            size={11}
            color={group.openToAll ? "#4ade80" : "#fb923c"}
          />
          <Text style={[styles.openText, { color: group.openToAll ? "#4ade80" : "#fb923c" }]}>
            {group.openToAll ? t.commLearningOpenToAll : t.commLearningWomenOnly}
          </Text>
        </View>

        {group.contact && (
          <TouchableOpacity
            onPress={(e) => {
              // Prevent the tap from also bubbling to the parent card's
              // onPress (observed on RN Web, where touch events bubble).
              e.stopPropagation();
              handleContact();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`${t.commContact} ${name}`}
            style={[styles.contactBtn, { borderColor: colors.primary + "55" }]}
          >
            <Feather name="mail" size={12} color={colors.primary} />
            <Text style={[styles.contactText, { color: colors.primary }]}>{t.commContact}</Text>
          </TouchableOpacity>
        )}
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
});

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function LearningGroupsScreen() {
  const colors = useColors();
  const { t, lang } = useLanguage();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === "web" ? 60 : 20);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
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
            {t.commLearningTitle}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACE[4], paddingBottom: insets.bottom + 100 }}
        accessibilityLabel="Learning groups list"
      >
        {/* Sub-heading */}
        <Text style={[styles.intro, { color: colors.mutedForeground }]}>
          {t.commLearningScreenDesc}
        </Text>

        {LEARNING_GROUPS.map((g) => (
          <GroupCard key={g.id} group={g} colors={colors} lang={lang} t={t} />
        ))}

        {/* Join CTA */}
        <View style={[styles.ctaBox, { backgroundColor: colors.primary + "0C", borderColor: colors.primary + "33" }]}>
          <Text style={{ fontSize: TEXT["2xl"] }}>📬</Text>
          <Text style={[styles.ctaTitle, { color: colors.foreground }]}>
            {t.commLearningNewGroupTitle}
          </Text>
          <Text style={[styles.ctaDesc, { color: colors.mutedForeground }]}>
            {t.commLearningNewGroupDesc}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

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
    marginBottom: SPACE[5],
    marginTop: SPACE[2],
  },

  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACE[4],
    marginBottom: SPACE[3],
    gap: SPACE[3],
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACE[3],
  },
  emojiBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardName:    { fontSize: TEXT.base, fontWeight: "700" },
  cardSubject: { fontSize: TEXT.sm, fontWeight: "600" },
  schedBadge: {
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  schedText: { fontSize: TEXT.xs, fontWeight: "700" },
  cardDesc: { fontSize: TEXT.sm, lineHeight: 18 },

  detailsBox: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: SPACE[3],
    gap: SPACE[2],
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACE[2],
  },
  detailText: { fontSize: TEXT.sm, flex: 1 },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  openBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  openText: { fontSize: TEXT.xs, fontWeight: "600" },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 48,
  },
  contactText: { fontSize: TEXT.xs, fontWeight: "600" },

  ctaBox: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACE[6],
    alignItems: "center",
    gap: SPACE[2],
    marginTop: SPACE[4],
    marginBottom: SPACE[2],
  },
  ctaTitle: { fontSize: TEXT.base, fontWeight: "700" },
  ctaDesc:  { fontSize: TEXT.sm, textAlign: "center", lineHeight: 18 },
});
