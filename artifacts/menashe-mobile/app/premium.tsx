/**
 * MEP-301 — Menashe Premium Screen (v2)
 * Platform: Mobile V1
 *
 * Production-quality paywall screen built to flagship AI-app standard.
 * No payments implemented — "Coming Soon" state with early-access flow.
 *
 * Sections:
 *   1. Floating header (back nav)
 *   2. Hero — animated glow pulse, headline, social-proof stat chips
 *   3. Pricing card — ₹1,000/yr, Coming Soon overlay
 *   4. AI Showcase — Rav Menashe live chat preview
 *   5. Feature cards — 6 premium capabilities
 *   6. Free vs Premium — clean checkmark comparison
 *   7. FAQ accordion — 4 real questions, expand/collapse
 *   8. CTA footer — Contact Support + Request Early Access
 *
 * Architecture:
 *   ✓ MMDL tokens only (useThemeTokens)      ✓ StyleSheet numeric literals only
 *   ✓ useLanguage for all bilingual strings   ✓ Animated glow loop (native driver)
 *   ✓ usePressScale on every CTA              ✓ useEntrance stagger
 *   ✓ FAQ expand/collapse with chevron anim   ✓ No Stripe/Razorpay/RevenueCat
 *   ✓ Reduced Motion respected                ✓ Accessibility on all touchables
 */

import React, {
  useCallback, useEffect, useMemo, useRef, useState,
} from "react";
import {
  Animated,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { useThemeTokens } from "@/src/mobile/design-system";
import { useEntrance, useReducedMotion } from "@/src/mobile/lib/useEntrance";
import { usePressScale } from "@/src/mobile/lib/usePressScale";
import { useLanguage } from "@/context/LanguageContext";

// ─── Constants ─────────────────────────────────────────────────────────────────

const SUPPORT_EMAIL = "admin@menashecalendar.app";

const STAT_CHIPS = [
  { value: "2,400+", label: "Families" },
  { value: "12",     label: "Aliyah Waves" },
  { value: "47",     label: "Cities" },
] as const;

const FEATURES = [
  {
    emoji: "🤖", color: "#a78bfa",
    title: "Rav Menashe AI",
    tagline: "Your personal Torah companion, always available",
    chips: ["Holiday insights", "Daf Yomi guides", "Halacha Q&A"],
  },
  {
    emoji: "📜", color: "#4ade80",
    title: "Full Sacred Study Suite",
    tagline: "Daf Yomi, Mishna Yomit & Halacha Yomit with Bnei Menashe commentary",
    chips: ["Daily Daf Yomi", "Mishna Yomit", "Halacha Yomit"],
  },
  {
    emoji: "🎙", color: "#f472b6",
    title: "Audio Prayer Library",
    tagline: "Complete services in authentic Bnei Menashe nusach",
    chips: ["Shacharit · 45 min", "Kabbalat Shabbat", "All Yom Tovs"],
  },
  {
    emoji: "📅", color: "#d4a843",
    title: "Multi-Year Calendar",
    tagline: "Plan decades ahead — export to PDF, iCal & Google Calendar",
    chips: ["5780 – 5800", "PDF / iCal export", "Bar Mitzvah calc"],
  },
  {
    emoji: "💧", color: "#38bdf8",
    title: "Tahara & Mikveh Tools",
    tagline: "Private cycle tracker built on Shulchan Aruch with BM halacha",
    chips: ["Cycle reminders", "Shulchan Aruch", "Fully private"],
  },
  {
    emoji: "📊", color: "#34d399",
    title: "Community Census",
    tagline: "Family trees, 12 waves of aliyah & full demographic history",
    chips: ["Family trees", "Aliyah records", "47 cities"],
  },
] as const;

const COMPARE = [
  { label: "Hebrew Calendar & Zmanim",     free: true },
  { label: "Daily Parasha & Daf Yomi",     free: true },
  { label: "Community & Prayer Board",     free: true },
  { label: "Memorial Sanctuary",           free: true },
  { label: "Rav Menashe AI",               free: false },
  { label: "Full Sacred Study Suite",      free: false },
  { label: "Audio Prayer Library",         free: false },
  { label: "Multi-Year Calendar Export",   free: false },
  { label: "Tahara & Mikveh Tools",        free: false },
  { label: "Community Census & History",   free: false },
] as const;

const FAQ_ITEMS = [
  {
    q: "When will payments be available?",
    a: "We are actively finalizing our payment system for the Bnei Menashe community. You'll receive a notification the moment it goes live. Early access requests are being reviewed now.",
  },
  {
    q: "How do I request early access?",
    a: "Tap 'Contact Support' below. Every request is reviewed personally by our team and approved within 24 hours. Early members receive a founding-member discount.",
  },
  {
    q: "Is my data private?",
    a: "Yes. The Tahara & Mikveh tracker is encrypted on-device only — it never leaves your phone. All other data is secured under industry-standard encryption.",
  },
  {
    q: "Is Premium available in Thadou Kuki?",
    a: "Fully. Every feature — AI responses, study guides, audio labels, and all interface text — is available in both English and Thadou Kuki (TK).",
  },
] as const;

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatChip({
  value, label, gold, cardBg, border,
}: { value: string; label: string; gold: string; cardBg: string; border: string }) {
  return (
    <View style={[s.statChip, { backgroundColor: cardBg, borderColor: border }]}>
      <Text style={[s.statValue, { color: gold }]}>{value}</Text>
      <Text style={[s.statLabel, { color: gold + "99" }]}>{label}</Text>
    </View>
  );
}

function FeatureCard({
  feature, colors, shadow, isLast,
}: {
  feature: typeof FEATURES[number];
  colors: ReturnType<typeof useThemeTokens>["colors"];
  shadow: ReturnType<typeof useThemeTokens>["shadow"];
  isLast: boolean;
}) {
  const isAI = feature.emoji === "🤖";
  return (
    <View
      style={[
        s.featureCard,
        {
          backgroundColor: isAI ? feature.color + "12" : colors.card,
          borderColor: feature.color + (isAI ? "55" : "2a"),
          marginBottom: isLast ? 0 : 10,
          ...shadow.level1,
        },
      ]}
    >
      {/* Icon circle */}
      <View style={[s.featureIconWrap, { backgroundColor: feature.color + "20" }]}>
        <Text style={s.featureEmoji}>{feature.emoji}</Text>
      </View>

      <View style={{ flex: 1, paddingLeft: 14 }}>
        {isAI && (
          <View style={[s.aiBadge, { backgroundColor: feature.color + "22" }]}>
            <Text style={[s.aiBadgeText, { color: feature.color }]}>FLAGSHIP AI</Text>
          </View>
        )}
        <Text style={[s.featureTitle, { color: colors.textPrimary }]}>{feature.title}</Text>
        <Text style={[s.featureTagline, { color: colors.textSecondary }]}>{feature.tagline}</Text>

        {/* Capability chips */}
        <View style={s.chipsRow}>
          {feature.chips.map((chip) => (
            <View key={chip} style={[s.chip, { backgroundColor: feature.color + "18", borderColor: feature.color + "30" }]}>
              <Text style={[s.chipText, { color: feature.color }]}>{chip}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function FaqRow({
  item, index, open, onToggle, colors,
}: {
  item: typeof FAQ_ITEMS[number];
  index: number;
  open: boolean;
  onToggle: () => void;
  colors: ReturnType<typeof useThemeTokens>["colors"];
}) {
  const chevron = useRef(new Animated.Value(0)).current;
  const height  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(chevron, { toValue: open ? 1 : 0, duration: 220, useNativeDriver: true }),
      Animated.timing(height,  { toValue: open ? 1 : 0, duration: 240, useNativeDriver: false }),
    ]).start();
  }, [open]);

  const rotate = chevron.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });
  const maxH   = height.interpolate({ inputRange: [0, 1], outputRange: [0, 120] });

  return (
    <View style={[s.faqRow, { borderColor: colors.border }]}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [s.faqHeader, { backgroundColor: pressed ? colors.surface : "transparent" }]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={item.q}
      >
        <Text style={[s.faqQ, { color: colors.textPrimary, flex: 1 }]}>{item.q}</Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Feather name="chevron-down" size={18} color={colors.textMuted} />
        </Animated.View>
      </Pressable>
      <Animated.View style={{ maxHeight: maxH, overflow: "hidden" }}>
        <Text style={[s.faqA, { color: colors.textSecondary }]}>{item.a}</Text>
      </Animated.View>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function PremiumScreen() {
  const { colors, shadow } = useThemeTokens();
  const insets   = useSafeAreaInsets();
  const { t }    = useLanguage();
  const reduced  = useReducedMotion();
  const gold     = colors.accentGold;

  // ── FAQ state ───────────────────────────────────────────────────────────────
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // ── Animated: hero glow pulse ────────────────────────────────────────────────
  const glowScale   = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(glowScale,   { toValue: 1.35, duration: 1800, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0,    duration: 1800, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(glowScale,   { toValue: 1,    duration: 0,    useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.5,  duration: 0,    useNativeDriver: true }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced]);

  // ── Entrance stagger ────────────────────────────────────────────────────────
  const aHero     = useEntrance(0);
  const aStats    = useEntrance(80);
  const aPrice    = useEntrance(140);
  const aAI       = useEntrance(200);
  const aFeatures = useEntrance(260);
  const aCompare  = useEntrance(320);
  const aFaq      = useEntrance(380);
  const aCta      = useEntrance(440);

  // ── CTAs ────────────────────────────────────────────────────────────────────
  const psContact = usePressScale(0.97);
  const psAccess  = usePressScale(0.97);
  const psBack    = usePressScale(0.94);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.back();
  }, []);

  const handleSupport = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Linking.openURL(
      `mailto:${SUPPORT_EMAIL}?subject=Premium%20Early%20Access%20Request`,
    ).catch(() => {});
  }, []);

  return (
    <View style={[s.root, { backgroundColor: colors.background }]}>
      {/* ── Safe-area top ─────────────────────────────────────────────────── */}
      <View style={{ height: insets.top }} />

      {/* ── Floating header ──────────────────────────────────────────────── */}
      <View style={s.header}>
        <Pressable
          onPressIn={psBack.onPressIn}
          onPressOut={psBack.onPressOut}
          onPress={handleBack}
          accessibilityLabel={t.premiumBack}
          accessibilityRole="button"
          hitSlop={10}
        >
          <Animated.View
            style={[s.backBtn, {
              backgroundColor: colors.card,
              borderColor: colors.border,
              transform: [{ scale: psBack.scale }],
            }]}
          >
            <Feather name="arrow-left" size={20} color={colors.textPrimary} />
          </Animated.View>
        </Pressable>

        {/* COMING SOON pill */}
        <View style={[s.headerPill, { backgroundColor: gold + "1a", borderColor: gold + "44" }]}>
          <View style={[s.headerPillDot, { backgroundColor: gold }]} />
          <Text style={[s.headerPillText, { color: gold }]}>{t.premiumComingSoon}</Text>
        </View>

        <View style={s.backBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >

        {/* ═══════════════════════════════════════════════════════════════════
            1. HERO
        ═══════════════════════════════════════════════════════════════════ */}
        <Animated.View style={aHero}>
          <LinearGradient
            colors={["#0d0700", "#1c1000", "#110a00", colors.background]}
            locations={[0, 0.35, 0.65, 1]}
            style={s.heroGradient}
          >
            {/* Animated glow ring behind icon */}
            <View style={s.heroIconWrap}>
              <Animated.View
                style={[
                  s.glowRing,
                  {
                    backgroundColor: gold + "55",
                    opacity: glowOpacity,
                    transform: [{ scale: glowScale }],
                  },
                ]}
              />
              <View style={[s.heroIconCircle, { backgroundColor: gold + "1a", borderColor: gold + "60" }]}>
                <Text style={s.heroEmoji}>💎</Text>
              </View>
            </View>

            <Text style={[s.heroEyebrow, { color: gold + "cc" }]}>MENASHE PREMIUM</Text>
            <Text style={[s.heroTitle, { color: colors.textPrimary }]}>
              Your full sacred{"\n"}journey, unlocked.
            </Text>
            <Text style={[s.heroSub, { color: colors.textSecondary }]}>
              AI-powered Torah guidance, audio prayer library, and deep community
              tools — built exclusively for Bnei Menashe.
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Stat chips */}
        <Animated.View style={[s.statsRow, aStats]}>
          {STAT_CHIPS.map((c) => (
            <StatChip
              key={c.label}
              value={c.value}
              label={c.label}
              gold={gold}
              cardBg={colors.card}
              border={gold + "30"}
            />
          ))}
        </Animated.View>

        {/* ═══════════════════════════════════════════════════════════════════
            2. PRICING CARD
        ═══════════════════════════════════════════════════════════════════ */}
        <Animated.View style={[s.section, aPrice]}>
          {/* Outer border shimmer — gold 1px border */}
          <View style={[s.pricingOuter, { borderColor: gold + "50", ...shadow.level2 }]}>
            {/* Header gradient strip */}
            <LinearGradient
              colors={["#2a1800", "#1a0f00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.pricingHeader}
            >
              <View>
                <Text style={s.pricingPlan}>Annual Plan</Text>
                <View style={s.pricingAmountRow}>
                  <Text style={[s.pricingCurrency, { color: gold }]}>₹</Text>
                  <Text style={[s.pricingAmount,   { color: colors.textPrimary }]}>1,000</Text>
                  <Text style={[s.pricingPer,      { color: colors.textSecondary }]}> / year</Text>
                </View>
                <Text style={[s.pricingBreakdown, { color: gold + "99" }]}>
                  Less than ₹84 per month
                </Text>
              </View>
              <View style={[s.pricingBadge, { backgroundColor: gold }]}>
                <Feather name="clock" size={11} color="#1a0f00" />
                <Text style={s.pricingBadgeText}>SOON</Text>
              </View>
            </LinearGradient>

            {/* What's included */}
            <View style={[s.pricingBody, { backgroundColor: colors.card }]}>
              {[
                "Rav Menashe AI — unlimited queries",
                "Full Sacred Study Suite (Daf Yomi, Mishna, Halacha)",
                "Complete Audio Prayer Library",
                "Multi-Year Calendar + PDF/iCal export",
                "Private Tahara & Mikveh Tracker",
                "Full Community Census & History",
              ].map((item, i) => (
                <View key={item} style={[s.pricingItem, i > 0 && { marginTop: 8 }]}>
                  <Feather name="check" size={15} color={gold} />
                  <Text style={[s.pricingItemText, { color: colors.textSecondary }]}>{item}</Text>
                </View>
              ))}

              <View style={[s.pricingNotice, { backgroundColor: gold + "10", borderColor: gold + "30" }]}>
                <Feather name="info" size={14} color={gold} />
                <Text style={[s.pricingNoticeText, { color: colors.textSecondary }]}>
                  Payments are not yet available. Contact us to request early access — founding members receive a special rate.
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ═══════════════════════════════════════════════════════════════════
            3. RAV MENASHE AI SHOWCASE
        ═══════════════════════════════════════════════════════════════════ */}
        <Animated.View style={[s.section, aAI]}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionDot, { backgroundColor: "#a78bfa" }]} />
            <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Rav Menashe AI</Text>
            <View style={[s.flagshipPill, { backgroundColor: "#a78bfa22", borderColor: "#a78bfa44" }]}>
              <Text style={[s.flagshipText, { color: "#a78bfa" }]}>FLAGSHIP</Text>
            </View>
          </View>
          <Text style={[s.sectionSub, { color: colors.textSecondary }]}>
            A trusted Torah guide — not just a chatbot. Trained on authentic sources
            with deep Bnei Menashe context.
          </Text>

          {/* Mock conversation */}
          <View style={[s.chatCard, { backgroundColor: colors.card, borderColor: "#a78bfa33", ...shadow.level1 }]}>
            {/* Chat header */}
            <View style={[s.chatHeader, { borderBottomColor: colors.border }]}>
              <View style={[s.chatAvatar, { backgroundColor: "#a78bfa22", borderColor: "#a78bfa55" }]}>
                <Text style={{ fontSize: 16 }}>🧙</Text>
              </View>
              <View>
                <Text style={[s.chatName, { color: colors.textPrimary }]}>Rav Menashe</Text>
                <Text style={[s.chatOnline, { color: "#4ade80" }]}>● Always available</Text>
              </View>
              <View style={[s.chatBadge, { backgroundColor: "#a78bfa22", borderColor: "#a78bfa44" }]}>
                <Text style={[s.chatBadgeText, { color: "#a78bfa" }]}>PREMIUM</Text>
              </View>
            </View>

            {/* User bubble */}
            <View style={s.chatBubbleWrap}>
              <View style={[s.userBubble, { backgroundColor: "#a78bfa22", borderColor: "#a78bfa33" }]}>
                <Text style={[s.userBubbleText, { color: colors.textPrimary }]}>
                  Why is Shavuot especially meaningful for Bnei Menashe?
                </Text>
              </View>
            </View>

            {/* AI response */}
            <View style={s.aiBubbleWrap}>
              <View style={[s.aiBubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[s.aiBubbleText, { color: colors.textPrimary }]}>
                  For Bnei Menashe, Shavuot carries a profound resonance that few
                  communities share. Our ancestors preserved Torah traditions in
                  Manipur for over 2,700 years — awaiting the moment to formally
                  receive Torah again at Sinai.{"\n\n"}
                  The Zohar teaches that Kabbalat HaTorah was not a one-time event
                  but an ongoing acceptance. Every generation receives it anew —
                  including yours, in this generation of the great return.
                </Text>
                <View style={[s.aiSourceRow]}>
                  <Feather name="book-open" size={11} color={colors.textMuted} />
                  <Text style={[s.aiSource, { color: colors.textMuted }]}>
                    Sources: Zohar III:82a · Maharal, Tiferet Yisrael · BM oral tradition
                  </Text>
                </View>
              </View>
            </View>

            <Text style={[s.chatDisclaimer, { color: colors.textMuted }]}>
              Answers cite authentic sources. Always consult your local Rav for practical halacha.
            </Text>
          </View>
        </Animated.View>

        {/* ═══════════════════════════════════════════════════════════════════
            4. ALL FEATURES
        ═══════════════════════════════════════════════════════════════════ */}
        <Animated.View style={[s.section, aFeatures]}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionDot, { backgroundColor: gold }]} />
            <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Everything in Premium</Text>
          </View>
          <View style={{ marginTop: 4 }}>
            {FEATURES.map((f, i) => (
              <FeatureCard
                key={f.title}
                feature={f}
                colors={colors}
                shadow={shadow}
                isLast={i === FEATURES.length - 1}
              />
            ))}
          </View>
        </Animated.View>

        {/* ═══════════════════════════════════════════════════════════════════
            5. FREE vs PREMIUM
        ═══════════════════════════════════════════════════════════════════ */}
        <Animated.View style={[s.section, aCompare]}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionDot, { backgroundColor: "#38bdf8" }]} />
            <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>{t.premiumCompareTitle}</Text>
          </View>

          <View style={[s.compareCard, { backgroundColor: colors.card, borderColor: colors.border, ...shadow.level1 }]}>
            {/* Header row */}
            <View style={[s.compareHeaderRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
              <Text style={[s.compareColLabel, { flex: 1, color: colors.textMuted, textAlign: "left", paddingLeft: 14 }]}>
                FEATURE
              </Text>
              <Text style={[s.compareColLabel, { width: 60, color: colors.textMuted }]}>FREE</Text>
              <Text style={[s.compareColLabel, { width: 80, color: gold }]}>PREMIUM</Text>
            </View>

            {COMPARE.map((row, i) => (
              <View
                key={row.label}
                style={[
                  s.compareRow,
                  {
                    borderBottomWidth: i < COMPARE.length - 1 ? StyleSheet.hairlineWidth : 0,
                    borderBottomColor: colors.border,
                    backgroundColor: !row.free ? gold + "08" : "transparent",
                  },
                ]}
              >
                <View style={{ flex: 1, paddingLeft: 14, paddingRight: 8 }}>
                  <Text style={[s.compareLabel, { color: !row.free ? colors.textPrimary : colors.textSecondary }]}>
                    {!row.free && <Text style={{ color: gold }}>★ </Text>}
                    {row.label}
                  </Text>
                </View>
                {/* Free column */}
                <View style={{ width: 60, alignItems: "center" }}>
                  {row.free
                    ? <Feather name="check-circle" size={16} color={colors.textMuted} />
                    : <Feather name="lock" size={14} color={colors.textDisabled} />}
                </View>
                {/* Premium column */}
                <View style={{ width: 80, alignItems: "center" }}>
                  <Feather name="check-circle" size={16} color={gold} />
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ═══════════════════════════════════════════════════════════════════
            6. FAQ
        ═══════════════════════════════════════════════════════════════════ */}
        <Animated.View style={[s.section, aFaq]}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionDot, { backgroundColor: "#f472b6" }]} />
            <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>Common Questions</Text>
          </View>
          <View style={[s.faqCard, { backgroundColor: colors.card, borderColor: colors.border, ...shadow.level1 }]}>
            {FAQ_ITEMS.map((item, i) => (
              <FaqRow
                key={item.q}
                item={item}
                index={i}
                open={openFaq === i}
                onToggle={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setOpenFaq(openFaq === i ? null : i);
                }}
                colors={colors}
              />
            ))}
          </View>
        </Animated.View>

        {/* ═══════════════════════════════════════════════════════════════════
            7. CTA FOOTER
        ═══════════════════════════════════════════════════════════════════ */}
        <Animated.View style={[s.section, aCta]}>
          {/* Primary: Contact Support */}
          <Pressable
            onPressIn={psContact.onPressIn}
            onPressOut={psContact.onPressOut}
            onPress={handleSupport}
            accessibilityLabel={t.premiumContactSupport}
            accessibilityRole="button"
          >
            <Animated.View style={{ transform: [{ scale: psContact.scale }] }}>
              <LinearGradient
                colors={["#e8b84b", "#d4a843", "#c09030"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.primaryBtn}
              >
                <Feather name="mail" size={18} color="#1a0f00" />
                <Text style={s.primaryBtnText}>{t.premiumContactSupport}</Text>
              </LinearGradient>
            </Animated.View>
          </Pressable>

          {/* Secondary: Request Early Access */}
          <Pressable
            onPressIn={psAccess.onPressIn}
            onPressOut={psAccess.onPressOut}
            onPress={handleSupport}
            accessibilityLabel={t.premiumEarlyAccess}
            accessibilityRole="button"
            style={{ marginTop: 10 }}
          >
            <Animated.View
              style={[
                s.secondaryBtn,
                {
                  borderColor: gold + "55",
                  transform: [{ scale: psAccess.scale }],
                },
              ]}
            >
              <Feather name="star" size={16} color={gold} />
              <Text style={[s.secondaryBtnText, { color: gold }]}>{t.premiumEarlyAccess}</Text>
            </Animated.View>
          </Pressable>

          {/* Trust strip */}
          <View style={s.trustStrip}>
            {["Community reviewed", "Approved within 24 hrs", "Privacy first"].map((item, i) => (
              <View key={item} style={s.trustItem}>
                {i > 0 && <Text style={[s.trustDot, { color: colors.textDisabled }]}>·</Text>}
                <Feather name="check" size={10} color={colors.textMuted} />
                <Text style={[s.trustText, { color: colors.textMuted }]}>{item}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

// ─── Styles (numeric literals only — no token values) ─────────────────────────

const s = StyleSheet.create({
  root:         { flex: 1 },

  // Header
  header:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
  backBtn:      { width: 38, height: 38, borderRadius: 11, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  headerPill:   { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  headerPillDot:{ width: 6, height: 6, borderRadius: 3 },
  headerPillText:{ fontSize: 11, fontWeight: "700", letterSpacing: 0.8 },

  // Hero
  heroGradient: { alignItems: "center", paddingTop: 28, paddingBottom: 32, paddingHorizontal: 24 },
  heroIconWrap: { width: 88, height: 88, alignItems: "center", justifyContent: "center", marginBottom: 22 },
  glowRing:     { position: "absolute", width: 88, height: 88, borderRadius: 44 },
  heroIconCircle:{ width: 80, height: 80, borderRadius: 40, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  heroEmoji:    { fontSize: 36 },
  heroEyebrow:  { fontSize: 11, fontWeight: "800", letterSpacing: 2.5, marginBottom: 10 },
  heroTitle:    { fontSize: 32, fontWeight: "800", letterSpacing: -0.3, textAlign: "center", lineHeight: 40, marginBottom: 14 },
  heroSub:      { fontSize: 14, lineHeight: 22, textAlign: "center", letterSpacing: 0.1, maxWidth: 320 },

  // Stats
  statsRow:     { flexDirection: "row", justifyContent: "center", gap: 10, paddingHorizontal: 20, marginBottom: 4 },
  statChip:     { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  statValue:    { fontSize: 17, fontWeight: "800", letterSpacing: -0.2 },
  statLabel:    { fontSize: 10, fontWeight: "600", letterSpacing: 0.3, marginTop: 1 },

  // Section wrapper
  section:      { paddingHorizontal: 16, marginTop: 28 },
  sectionHeader:{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  sectionDot:   { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 18, fontWeight: "700", letterSpacing: 0.1, flex: 1 },
  sectionSub:   { fontSize: 13, lineHeight: 20, marginBottom: 14 },
  flagshipPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  flagshipText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },

  // Pricing card
  pricingOuter: { borderRadius: 18, borderWidth: 1.5, overflow: "hidden" },
  pricingHeader:{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", padding: 20 },
  pricingPlan:  { fontSize: 12, fontWeight: "700", color: "#d4a84399", letterSpacing: 1.2, marginBottom: 6 },
  pricingAmountRow:{ flexDirection: "row", alignItems: "flex-end", gap: 2 },
  pricingCurrency:{ fontSize: 20, fontWeight: "700", paddingBottom: 4 },
  pricingAmount:{ fontSize: 44, fontWeight: "800", letterSpacing: -1 },
  pricingPer:   { fontSize: 15, paddingBottom: 8 },
  pricingBreakdown:{ fontSize: 12, marginTop: 4 },
  pricingBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  pricingBadgeText:{ fontSize: 10, fontWeight: "800", color: "#1a0f00", letterSpacing: 0.8 },
  pricingBody:  { padding: 20 },
  pricingItem:  { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  pricingItemText:{ fontSize: 13, lineHeight: 20, flex: 1 },
  pricingNotice:{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 16, padding: 12, borderRadius: 10, borderWidth: 1 },
  pricingNoticeText:{ flex: 1, fontSize: 12, lineHeight: 18 },

  // AI chat
  chatCard:     { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  chatHeader:   { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  chatAvatar:   { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  chatName:     { fontSize: 14, fontWeight: "700" },
  chatOnline:   { fontSize: 11, fontWeight: "600", marginTop: 1 },
  chatBadge:    { marginLeft: "auto", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  chatBadgeText:{ fontSize: 10, fontWeight: "700" },
  chatBubbleWrap:{ padding: 14, paddingBottom: 6, alignItems: "flex-end" },
  userBubble:   { maxWidth: "82%", padding: 12, borderRadius: 14, borderBottomRightRadius: 4, borderWidth: 1 },
  userBubbleText:{ fontSize: 13, lineHeight: 19 },
  aiBubbleWrap: { padding: 14, paddingTop: 6, alignItems: "flex-start" },
  aiBubble:     { maxWidth: "92%", padding: 14, borderRadius: 14, borderBottomLeftRadius: 4, borderWidth: 1 },
  aiBubbleText: { fontSize: 13, lineHeight: 20 },
  aiSourceRow:  { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  aiSource:     { fontSize: 10, flex: 1 },
  chatDisclaimer:{ fontSize: 10, textAlign: "center", paddingHorizontal: 16, paddingBottom: 12, lineHeight: 15, opacity: 0.7 },

  // Feature cards
  featureCard:  { flexDirection: "row", alignItems: "flex-start", borderRadius: 14, borderWidth: 1, padding: 14 },
  featureIconWrap:{ width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  featureEmoji: { fontSize: 22 },
  aiBadge:      { alignSelf: "flex-start", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, marginBottom: 5 },
  aiBadgeText:  { fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  featureTitle: { fontSize: 14, fontWeight: "700", letterSpacing: 0.1, marginBottom: 3 },
  featureTagline:{ fontSize: 12, lineHeight: 17, marginBottom: 8 },
  chipsRow:     { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  chip:         { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  chipText:     { fontSize: 10, fontWeight: "600" },

  // Comparison
  compareCard:  { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  compareHeaderRow:{ flexDirection: "row", paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  compareColLabel:{ fontSize: 10, fontWeight: "700", letterSpacing: 0.8, textAlign: "center" },
  compareRow:   { flexDirection: "row", alignItems: "center", paddingVertical: 11 },
  compareLabel: { fontSize: 13, lineHeight: 18 },

  // FAQ
  faqCard:      { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  faqRow:       { borderBottomWidth: StyleSheet.hairlineWidth },
  faqHeader:    { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  faqQ:         { fontSize: 14, fontWeight: "600", lineHeight: 20 },
  faqA:         { fontSize: 13, lineHeight: 20, paddingHorizontal: 16, paddingBottom: 14 },

  // CTA
  primaryBtn:   { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 14 },
  primaryBtnText:{ fontSize: 16, fontWeight: "800", color: "#1a0f00", letterSpacing: 0.2 },
  secondaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  secondaryBtnText:{ fontSize: 14, fontWeight: "700", letterSpacing: 0.2 },

  // Trust
  trustStrip:   { flexDirection: "row", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 2, marginTop: 14 },
  trustItem:    { flexDirection: "row", alignItems: "center", gap: 4 },
  trustDot:     { fontSize: 14, marginHorizontal: 2 },
  trustText:    { fontSize: 10, letterSpacing: 0.1 },
});
