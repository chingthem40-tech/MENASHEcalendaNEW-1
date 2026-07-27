/**
 * Hub — Personal spiritual home
 * Complete redesign: Product Spec v2.0
 * Apple Books × Notion × Airbnb × Spotify · Sacred premium dark
 */

import React, { useRef, useEffect, useCallback } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth, useUser } from "@clerk/expo";
import Constants from "expo-constants";
import { useApp } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import * as Haptics from "expo-haptics";

// ─── Design tokens (plain consts — safe in StyleSheet) ────────────────────────

const C = {
  bg:         "#060B18",
  card:       "#0C1628",
  primary:    "#5E7DFF",
  gold:       "#E6B93D",
  secondary:  "#9AA6C6",
  green:      "#22C55E",
  red:        "#EF4444",
  purple:     "#A78BFA",
  cyan:       "#06B6D4",
  pink:       "#EC4899",
  teal:       "#10B981",
  border:     "rgba(255,255,255,0.08)",
  white:      "#FFFFFF",
  muted:      "rgba(154,166,198,0.72)",
  dim:        "rgba(255,255,255,0.28)",
} as const;

const { width: SW } = Dimensions.get("window");
const CARD_W        = Math.floor((SW - 44) / 2); // 2-col, 16px margins, 12px gap

// ─── Utilities ─────────────────────────────────────────────────────────────────

function haptic() {
  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

// ─── Animated press wrapper ────────────────────────────────────────────────────

function PressCard({
  onPress,
  style,
  children,
  accessibilityLabel,
}: {
  onPress: () => void;
  style?: any;
  children: React.ReactNode;
  accessibilityLabel?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = useCallback(() => {
    Animated.spring(scale, { toValue: 0.967, useNativeDriver: true, speed: 55, bounciness: 3 }).start();
  }, []);
  const pressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 28, bounciness: 10 }).start();
  }, []);

  return (
    <Pressable
      onPress={() => { haptic(); onPress(); }}
      onPressIn={pressIn}
      onPressOut={pressOut}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ─── Live pulse badge ──────────────────────────────────────────────────────────

function LiveBadge() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.45, duration: 860, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 860, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <View style={s.liveBadge}>
      <Animated.View style={[s.liveDot, { opacity: pulse }]} />
      <Text style={s.liveText}>LIVE</Text>
    </View>
  );
}

// ─── Section header ────────────────────────────────────────────────────────────

function SectionTitle({ label, action, onAction }: {
  label: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={s.sectionRow}>
      <Text style={s.sectionTitle}>{label}</Text>
      {action && (
        <TouchableOpacity onPress={() => { haptic(); onAction?.(); }} activeOpacity={0.7}>
          <Text style={s.sectionAction}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Quick action card (2-col grid) ────────────────────────────────────────────

function QuickCard({
  emoji, label, sub, accent, onPress, isLive,
}: {
  emoji: string;
  label: string;
  sub: string;
  accent: string;
  onPress: () => void;
  isLive?: boolean;
}) {
  return (
    <PressCard onPress={onPress} style={[s.quickCard, { borderColor: accent + "20" }]} accessibilityLabel={label}>
      {/* Subtle gradient wash */}
      <LinearGradient
        colors={[accent + "12", accent + "04"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Icon */}
      <View style={[s.quickIconWrap, { backgroundColor: accent + "1A" }]}>
        <Text style={{ fontSize: 26, lineHeight: 32 }}>{emoji}</Text>
      </View>
      {/* Text */}
      <View style={{ flex: 1, marginTop: 4 }}>
        <Text style={s.quickCardLabel} numberOfLines={1}>{label}</Text>
        <Text style={s.quickCardSub}   numberOfLines={2}>{sub}</Text>
      </View>
      {/* Footer */}
      <View style={s.quickCardFoot}>
        {isLive
          ? <LiveBadge />
          : <Feather name="chevron-right" size={14} color={accent + "99"} />
        }
      </View>
    </PressCard>
  );
}

// ─── Full-width sacred experience row ─────────────────────────────────────────

function ExperienceRow({
  emoji, label, sub, accent, isLive, onPress, last,
}: {
  emoji: string;
  label: string;
  sub: string;
  accent: string;
  isLive?: boolean;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <PressCard
      onPress={onPress}
      style={[s.expRow, last && { borderBottomWidth: 0 }]}
      accessibilityLabel={label}
    >
      <View style={[s.expIcon, { backgroundColor: accent + "1A" }]}>
        <Text style={{ fontSize: 20, lineHeight: 26 }}>{emoji}</Text>
      </View>
      <View style={s.expBody}>
        <Text style={s.expLabel}>{label}</Text>
        <Text style={s.expSub}>{sub}</Text>
      </View>
      {isLive
        ? <LiveBadge />
        : <Feather name="chevron-right" size={15} color={C.dim} />
      }
    </PressCard>
  );
}

// ─── Menu / settings row ───────────────────────────────────────────────────────

function MenuRow({
  icon, iconBg, iconColor, title, sub, trailing, onPress, last,
}: {
  icon:       React.ComponentProps<typeof Feather>["name"];
  iconBg:     string;
  iconColor:  string;
  title:      string;
  sub?:       string;
  trailing?:  React.ReactNode;
  onPress?:   () => void;
  last?:      boolean;
}) {
  return (
    <TouchableOpacity
      onPress={() => { haptic(); onPress?.(); }}
      activeOpacity={0.68}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[s.menuRow, last && { borderBottomWidth: 0 }]}
    >
      <View style={[s.menuIcon, { backgroundColor: iconBg }]}>
        <Feather name={icon} size={17} color={iconColor} />
      </View>
      <View style={s.menuTextBlock}>
        <Text style={s.menuTitle}>{title}</Text>
        {sub ? <Text style={s.menuSub}>{sub}</Text> : null}
      </View>
      {trailing ?? <Feather name="chevron-right" size={15} color={C.dim} />}
    </TouchableOpacity>
  );
}

// ─── Card wrapper ──────────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return <View style={s.card}>{children}</View>;
}

// ─── Value pill ────────────────────────────────────────────────────────────────

function ValuePill({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={() => { haptic(); onPress(); }}
      activeOpacity={0.7}
      style={s.valuePill}
    >
      <Text style={s.valuePillText}>{label}</Text>
      <Feather name="chevron-down" size={11} color={C.muted} />
    </TouchableOpacity>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────

export default function HubScreen() {
  const { theme, setTheme } = useApp();
  const { lang, setLang, t } = useLanguage();
  const { user }             = useUser();
  const { signOut }          = useAuth();
  const insets               = useSafeAreaInsets();
  const appVersion           = Constants.expoConfig?.version ?? "1.0.0";

  const topPad = insets.top > 0 ? insets.top : Platform.OS === "web" ? 60 : 20;

  // ── Staggered section entrances ──────────────────────────────────────────────
  const NUM = 6;
  const fades  = useRef(Array.from({ length: NUM }, () => new Animated.Value(0))).current;
  const slides = useRef(Array.from({ length: NUM }, () => new Animated.Value(24))).current;

  useEffect(() => {
    Animated.parallel(
      fades.map((f, i) =>
        Animated.parallel([
          Animated.timing(f,        { toValue: 1, duration: 380, delay: i * 65, useNativeDriver: true }),
          Animated.timing(slides[i],{ toValue: 0, duration: 360, delay: i * 65, useNativeDriver: true }),
        ])
      )
    ).start();
  }, []);

  // ── Hero shimmer sweep ───────────────────────────────────────────────────────
  const shimmerX = useRef(new Animated.Value(-SW)).current;
  useEffect(() => {
    const delay = setTimeout(() => {
      Animated.loop(
        Animated.timing(shimmerX, { toValue: SW * 2.2, duration: 4200, useNativeDriver: true })
      ).start();
    }, 800);
    return () => clearTimeout(delay);
  }, []);

  // ── Premium badge soft glow (every 8 s) ─────────────────────────────────────
  const glowOpacity = useRef(new Animated.Value(0.8)).current;
  useEffect(() => {
    const loop = () => {
      Animated.sequence([
        Animated.timing(glowOpacity, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.8, duration: 700, useNativeDriver: true }),
      ]).start(() => setTimeout(loop, 8000));
    };
    const id = setTimeout(loop, 2500);
    return () => clearTimeout(id);
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  function cycleTheme() {
    const order: ("dark" | "light" | "sapphire")[] = ["dark", "light", "sapphire"];
    setTheme(order[(order.indexOf(theme as any) + 1) % order.length]);
  }
  function cycleLang() { setLang(lang === "en" ? "tk" : "en"); }

  const themeLabel = theme === "dark" ? "Dark" : theme === "light" ? "Light" : "Sapphire";
  const langLabel  = lang === "en" ? "English" : "Thadou";

  const displayName =
    user?.firstName
      ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
      : user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ?? "Friend";

  // ── Section helper ───────────────────────────────────────────────────────────
  function sec(i: number, node: React.ReactNode) {
    return (
      <Animated.View style={{ opacity: fades[i], transform: [{ translateY: slides[i] }] }}>
        {node}
      </Animated.View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        {/* ───── 0 · Page header ──────────────────────────────────────────── */}
        {sec(0, (
          <View style={[s.pageHeader, { paddingTop: topPad + 8 }]}>
            <View>
              <Text style={s.pageTitle}>Hub</Text>
              <Text style={s.pageSub}>Your sacred space</Text>
            </View>
            <View style={s.headerBtns}>
              <TouchableOpacity
                style={s.headerBtn}
                onPress={() => { haptic(); router.push("/search" as any); }}
                accessibilityRole="button" accessibilityLabel="Search"
              >
                <Feather name="search" size={19} color="rgba(255,255,255,0.76)" />
              </TouchableOpacity>
              <TouchableOpacity
                style={s.headerBtn}
                onPress={() => { haptic(); router.push("/community/announcements" as any); }}
                accessibilityRole="button" accessibilityLabel="Notifications"
              >
                <Feather name="bell" size={19} color="rgba(255,255,255,0.76)" />
                <View style={s.notifDot} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* ───── 1 · Hero card ────────────────────────────────────────────── */}
        {sec(1, (
          <View style={s.heroOuter}>
            {/* Deep navy gradient */}
            <LinearGradient
              colors={["#10204E", "#0B1638", "#070F26"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Slow shimmer sweep */}
            <Animated.View
              pointerEvents="none"
              style={[s.shimmerLayer, { transform: [{ translateX: shimmerX }] }]}
            >
              <LinearGradient
                colors={["transparent", "rgba(255,255,255,0.045)", "transparent"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ width: 180, height: "100%" as any }}
              />
            </Animated.View>

            {/* Gold hairline border */}
            <View style={s.heroBorderRing} />

            {/* Avatar + info */}
            <View style={s.heroTop}>
              <View style={s.heroLeft}>
                {/* Avatar ring */}
                <View style={s.avatarRing}>
                  <LinearGradient
                    colors={[C.gold + "55", C.primary + "35"]}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <Text style={{ fontSize: 30 }}>🕎</Text>
                </View>

                {/* Name & badges */}
                <View style={{ flex: 1 }}>
                  <Text style={s.heroGreet}>Welcome back</Text>
                  <Text style={s.heroName} numberOfLines={1}>{displayName}</Text>
                  <View style={s.heroBadgesRow}>
                    <View style={s.memberBadge}>
                      <Text style={{ fontSize: 9 }}>⭐</Text>
                      <Text style={s.memberBadgeText}>Member</Text>
                    </View>
                    <Animated.View style={[s.premiumBadge, { opacity: glowOpacity }]}>
                      <Text style={s.premiumBadgeText}>✦ Premium</Text>
                    </Animated.View>
                  </View>
                </View>
              </View>

              {/* View Profile button */}
              <TouchableOpacity
                style={s.profileBtn}
                onPress={() => { haptic(); router.push("/journey" as any); }}
                accessibilityRole="button" accessibilityLabel="View Profile"
              >
                <Text style={s.profileBtnText}>Profile</Text>
                <Feather name="arrow-right" size={12} color={C.primary} />
              </TouchableOpacity>
            </View>

            {/* Footer divider + sync */}
            <View style={s.heroFooter}>
              <View style={s.syncDot} />
              <Text style={s.syncText}>Synced · just now</Text>
            </View>
          </View>
        ))}

        {/* ───── 2 · Quick Actions ────────────────────────────────────────── */}
        {sec(2, (
          <View>
            <SectionTitle label="Quick Actions" />
            <View style={s.quickGrid}>
              <QuickCard
                emoji="📚" label="Library"      sub="Books & resources"
                accent={C.purple}    onPress={() => router.push("/torah" as any)}
              />
              <QuickCard
                emoji="📅" label="Calendar"     sub="Events & times"
                accent={C.cyan}      onPress={() => router.push("/calendar" as any)}
              />
              <QuickCard
                emoji="🕍" label="Holy Places"  sub="Live streams"
                accent={C.gold}      onPress={() => {}} isLive
              />
              <QuickCard
                emoji="🤝" label="Community"    sub="Connect & share"
                accent={C.green}     onPress={() => router.push("/community" as any)}
              />
              <QuickCard
                emoji="❤️"  label="Prayer"       sub="Requests & board"
                accent={C.red}       onPress={() => router.push("/prayer-board" as any)}
              />
              <QuickCard
                emoji="⬇️"  label="Downloads"    sub="Offline content"
                accent={C.secondary} onPress={() => {}}
              />
            </View>
          </View>
        ))}

        {/* ───── 3 · Sacred Experience ────────────────────────────────────── */}
        {sec(3, (
          <View>
            <SectionTitle label="Sacred Experience" />
            <Card>
              <ExperienceRow
                emoji="🕍" label="Live Holy Places"
                sub="Jerusalem · Aizawl · Churachandpur"
                accent={C.gold}    isLive  onPress={() => {}}
              />
              <ExperienceRow
                emoji="📖" label="Torah Study"
                sub="Continue your learning journey"
                accent={C.purple}         onPress={() => router.push("/torah" as any)}
              />
              <ExperienceRow
                emoji="🕯"  label="Daily Prayer"
                sub="Shacharit · Mincha · Maariv"
                accent={C.cyan}           onPress={() => router.push("/calendar" as any)}
              />
              <ExperienceRow
                emoji="🎵" label="Jewish Music"
                sub="Nigunim & sacred melodies"
                accent={C.pink}           onPress={() => {}}
              />
              <ExperienceRow
                emoji="🎙️" label="Teachings"
                sub="Shiurim & audio lessons"
                accent={C.green}          onPress={() => {}}
              />
              <ExperienceRow
                emoji="📺" label="Live Lessons"
                sub="Join the class"
                accent={C.primary} isLive onPress={() => {}} last
              />
            </Card>
          </View>
        ))}

        {/* ───── 4 · Learning + Community + Downloads ─────────────────────── */}
        {sec(4, (
          <View>
            <SectionTitle label="Learning" />
            <Card>
              <MenuRow icon="book"       iconBg={C.purple    + "22"} iconColor={C.purple}    title="Library"        sub="Books, Siddur & resources"     onPress={() => router.push("/torah" as any)} />
              <MenuRow icon="type"       iconBg={C.cyan      + "22"} iconColor={C.cyan}      title="Hebrew Learning" sub="Aleph-Bet & vocabulary"        onPress={() => {}} />
              <MenuRow icon="feather"    iconBg={C.gold      + "22"} iconColor={C.gold}      title="Weekly Parasha"  sub="This week's Torah portion"     onPress={() => router.push("/calendar" as any)} />
              <MenuRow icon="sun"        iconBg={C.green     + "22"} iconColor={C.green}     title="Daily Verse"     sub="Inspiration for today"         onPress={() => {}} />
              <MenuRow icon="edit-3"     iconBg={C.secondary + "22"} iconColor={C.secondary} title="Study Notes"     sub="Your personal annotations"     onPress={() => {}} />
              <MenuRow icon="bookmark"   iconBg={C.red       + "22"} iconColor={C.red}       title="Bookmarks"       sub="Saved passages & highlights"   onPress={() => {}} last />
            </Card>

            <SectionTitle label="Community" />
            <Card>
              <MenuRow icon="rss"        iconBg={C.primary   + "22"} iconColor={C.primary}   title="Community Feed"    sub="Latest posts & updates"      onPress={() => router.push("/community" as any)} />
              <MenuRow icon="bell"       iconBg={C.gold      + "22"} iconColor={C.gold}      title="Announcements"     sub="Official community news"      onPress={() => router.push("/community/announcements" as any)} />
              <MenuRow icon="heart"      iconBg={C.red       + "22"} iconColor={C.red}       title="Prayer Requests"   sub="Submit & pray together"       onPress={() => router.push("/prayer-board" as any)} />
              <MenuRow icon="calendar"   iconBg={C.cyan      + "22"} iconColor={C.cyan}      title="Upcoming Events"   sub="Holidays, gatherings & more"  onPress={() => router.push("/calendar" as any)} />
              <MenuRow icon="users"      iconBg={C.green     + "22"} iconColor={C.green}     title="Volunteer"         sub="Serve the community"          onPress={() => {}} />
              <MenuRow icon="gift"       iconBg={C.purple    + "22"} iconColor={C.purple}    title="Donate"            sub="Support our mission"          onPress={() => {}} last />
            </Card>

            <SectionTitle label="Downloads" />
            <Card>
              <MenuRow icon="book-open"  iconBg={C.purple    + "22"} iconColor={C.purple}    title="Downloaded Books" sub="Books available offline"      onPress={() => {}} />
              <MenuRow icon="headphones" iconBg={C.cyan      + "22"} iconColor={C.cyan}      title="Downloaded Audio" sub="Lessons & nigunim"            onPress={() => {}} />
              <MenuRow icon="video"      iconBg={C.gold      + "22"} iconColor={C.gold}      title="Offline Videos"   sub="Teachings saved locally"      onPress={() => {}} />
              <MenuRow icon="hard-drive" iconBg={C.secondary + "22"} iconColor={C.secondary} title="Manage Storage"   sub="Free up space"                onPress={() => {}} last />
            </Card>
          </View>
        ))}

        {/* ───── 5 · Settings + Support ────────────────────────────────────── */}
        {sec(5, (
          <View>
            <SectionTitle label="Settings" />
            <Card>
              <MenuRow
                icon="moon"    iconBg={C.purple + "22"} iconColor={C.purple}
                title="Appearance"
                trailing={<ValuePill label={themeLabel} onPress={cycleTheme} />}
                onPress={cycleTheme}
              />
              <MenuRow
                icon="globe"   iconBg={C.green  + "22"} iconColor={C.green}
                title="Language"
                trailing={<ValuePill label={langLabel} onPress={cycleLang} />}
                onPress={cycleLang}
              />
              <MenuRow icon="bell"    iconBg={C.cyan      + "22"} iconColor={C.cyan}      title="Notifications" sub="Manage reminders"   onPress={() => {}} />
              <MenuRow icon="eye"     iconBg={C.gold      + "22"} iconColor={C.gold}      title="Accessibility"  sub="Display & motion"   onPress={() => {}} />
              <MenuRow icon="lock"    iconBg={C.red       + "22"} iconColor={C.red}       title="Privacy & Security"                       onPress={() => {}} />
              <MenuRow icon="user"    iconBg={C.primary   + "22"} iconColor={C.primary}   title="Account"        sub="Profile & data"     onPress={() => router.push("/settings" as any)} last />
            </Card>

            <SectionTitle label="Support" />
            <Card>
              <MenuRow icon="help-circle"    iconBg={C.primary   + "22"} iconColor={C.primary}   title="Help Center"      sub="FAQs & guides"              onPress={() => {}} />
              <MenuRow icon="message-square" iconBg={C.purple    + "22"} iconColor={C.purple}    title="Send Feedback"    sub="We'd love to hear from you"  onPress={() => {}} />
              <MenuRow icon="phone"          iconBg={C.green     + "22"} iconColor={C.green}     title="Contact Us"       sub="Reach our support team"      onPress={() => {}} />
              <MenuRow icon="info"           iconBg={C.cyan      + "22"} iconColor={C.cyan}      title="About"            sub={`Bnei Menashe App v${appVersion}`} onPress={() => {}} />
              <MenuRow icon="shield"         iconBg={C.gold      + "22"} iconColor={C.gold}      title="Privacy Policy"                                       onPress={() => {}} />
              <MenuRow icon="file-text"      iconBg={C.secondary + "22"} iconColor={C.secondary} title="Terms of Service"                                      onPress={() => {}} />
              <MenuRow icon="code"           iconBg={C.teal      + "22"} iconColor={C.teal}      title="Open Source"                                           onPress={() => {}} last />
            </Card>

            {/* Sign out */}
            <TouchableOpacity
              style={s.signOutBtn}
              onPress={() => { haptic(); signOut(); }}
              activeOpacity={0.74}
              accessibilityRole="button"
              accessibilityLabel="Sign Out"
            >
              <Feather name="log-out" size={16} color={C.red} />
              <Text style={s.signOutText}>Sign Out</Text>
            </TouchableOpacity>

            <Text style={s.versionText}>Bnei Menashe · v{appVersion}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // ── Page header ──
  pageHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 22,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: "800",
    color: C.white,
    letterSpacing: -0.6,
  },
  pageSub: {
    fontSize: 14,
    color: C.muted,
    fontWeight: "400",
    marginTop: 3,
  },
  headerBtns: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  headerBtn: {
    width: 42, height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.065)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  notifDot: {
    position: "absolute",
    top: 9, right: 9,
    width: 7, height: 7,
    borderRadius: 3.5,
    backgroundColor: C.primary,
    borderWidth: 1.5,
    borderColor: C.bg,
  },

  // ── Hero ──
  heroOuter: {
    marginHorizontal: 16,
    marginBottom: 30,
    borderRadius: 28,
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 16,
    minHeight: 148,
  },
  heroBorderRing: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(230,185,61,0.22)",
  },
  shimmerLayer: {
    position: "absolute",
    top: 0, bottom: 0,
    width: 180,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  heroLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatarRing: {
    width: 62, height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(230,185,61,0.32)",
    overflow: "hidden",
    flexShrink: 0,
  },
  heroGreet: {
    fontSize: 12,
    color: C.muted,
    fontWeight: "500",
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  heroName: {
    fontSize: 19,
    fontWeight: "800",
    color: C.white,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  heroBadgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(230,185,61,0.12)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(230,185,61,0.30)",
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  memberBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: C.gold,
    letterSpacing: 0.2,
  },
  premiumBadge: {
    backgroundColor: "rgba(94,125,255,0.14)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(94,125,255,0.34)",
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: C.primary,
    letterSpacing: 0.2,
  },
  profileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(94,125,255,0.13)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(94,125,255,0.28)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexShrink: 0,
  },
  profileBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: C.primary,
  },
  heroFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingTop: 12,
  },
  syncDot: {
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: C.green,
  },
  syncText: {
    fontSize: 11,
    color: C.muted,
    fontWeight: "500",
  },

  // ── Section header ──
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 14,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: C.white,
    letterSpacing: -0.4,
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: "600",
    color: C.primary,
  },

  // ── Quick grid ──
  quickGrid: {
    marginHorizontal: 16,
    marginBottom: 34,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickCard: {
    width: CARD_W,
    borderRadius: 22,
    padding: 16,
    backgroundColor: "#0C1628",
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  quickIconWrap: {
    width: 52, height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  quickCardLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: C.white,
    letterSpacing: -0.15,
  },
  quickCardSub: {
    fontSize: 11,
    color: C.muted,
    fontWeight: "400",
    marginTop: 2,
    lineHeight: 15,
  },
  quickCardFoot: {
    marginTop: 10,
    alignItems: "flex-start",
  },

  // ── Live badge ──
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(239,68,68,0.14)",
    borderRadius: 99,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(239,68,68,0.28)",
  },
  liveDot: {
    width: 5, height: 5,
    borderRadius: 2.5,
    backgroundColor: C.red,
  },
  liveText: {
    fontSize: 10,
    fontWeight: "800",
    color: C.red,
    letterSpacing: 0.9,
  },

  // ── Experience rows ──
  expRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  expIcon: {
    width: 44, height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  expBody: { flex: 1 },
  expLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: C.white,
    letterSpacing: -0.2,
  },
  expSub: {
    fontSize: 12,
    color: C.muted,
    fontWeight: "400",
    marginTop: 2,
  },

  // ── Card ──
  card: {
    marginHorizontal: 16,
    marginBottom: 30,
    borderRadius: 20,
    backgroundColor: "#0C1628",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
    overflow: "hidden",
  },

  // ── Menu rows ──
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },
  menuIcon: {
    width: 38, height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  menuTextBlock: { flex: 1 },
  menuTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: C.white,
    letterSpacing: -0.1,
  },
  menuSub: {
    fontSize: 12,
    color: C.muted,
    fontWeight: "400",
    marginTop: 1,
  },

  // ── Value pill ──
  valuePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.border,
  },
  valuePillText: {
    fontSize: 12,
    fontWeight: "600",
    color: C.muted,
  },

  // ── Sign out + version ──
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 14,
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: "rgba(239,68,68,0.07)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(239,68,68,0.18)",
  },
  signOutText: {
    fontSize: 15,
    fontWeight: "700",
    color: C.red,
    letterSpacing: -0.1,
  },
  versionText: {
    textAlign: "center",
    fontSize: 11,
    color: "rgba(255,255,255,0.18)",
    marginBottom: 8,
    fontWeight: "400",
    letterSpacing: 0.2,
  },
});
