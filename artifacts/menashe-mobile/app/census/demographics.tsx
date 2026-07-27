/**
 * Census & Demographics — Mobile
 *
 * Full Census & Demographics dashboard matching the web modal.
 * Three tabs: Dashboard · Admin · Local Admin
 *
 * Design system: useColors() + SPACE/TEXT/RADIUS constants (matches all
 * census form screens). colors.primary = brand gold in dark, warm brown
 * in light — never hard-code #d4a843 here.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  RefreshControl,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "@clerk/expo";

import { useColors } from "@/hooks/useColors";
import { SPACE, TEXT, RADIUS } from "@/constants/colors";
import {
  fetchCensusSubmissions,
  fetchCensusMemberSubmissions,
  fetchMyBranch,
  saveCensusBranch,
  reviewSubmission,
  submitBranchForReview,
  fetchMySubmissionStatus,
} from "@/lib/censusApi";
import type { CensusSubmission, MemberSubmission, BranchData } from "@/lib/censusApi";
import * as ImagePicker from "expo-image-picker";

const GOLD = "#d4a843";
const GREEN = "#4ade80";
const BLUE  = "#4f8ef7";

function haptic() {
  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

/* ── Static data ─────────────────────────────────────────────────────────── */
type Tab = "dashboard" | "admin" | "localadmin";

interface StatEntry {
  id: string; label: string; value: string; icon: string;
  trend?: string; trendUp?: boolean;
}
interface CityEntry {
  id: string; name: string; pop: number; country: "israel" | "india"; region: string;
}

const STATS: StatEntry[] = [
  { id: "total",     label: "Total Community Members",       value: "9,700+",            icon: "👥",  trend: "+3.2%", trendUp: true  },
  { id: "aliyah",   label: "Returned to Israel (Aliyah)",   value: "4,800+",            icon: "✈️",  trend: "+5.1%", trendUp: true  },
  { id: "india",    label: "Awaiting Aliyah in India",      value: "4,900+",            icon: "🇮🇳",  trend: "−1.4%", trendUp: false },
  { id: "cities",   label: "Main Cities in Israel",         value: "12",                icon: "🏙️"                                   },
  { id: "states",   label: "Indian States Represented",     value: "Manipur &\nMizoram", icon: "📍"                                  },
  { id: "rabbinate",label: "Recognized by Chief Rabbinate", value: "2005",              icon: "📜"                                   },
];

const CITIES: CityEntry[] = [
  { id: "c1", name: "Kiryat Arba",   pop: 450,  country: "israel", region: "Judea & Samaria"   },
  { id: "c2", name: "Be'er Sheva",   pop: 380,  country: "israel", region: "Negev"              },
  { id: "c3", name: "Natzrat Illit", pop: 320,  country: "israel", region: "Galilee"            },
  { id: "c4", name: "Jerusalem",     pop: 280,  country: "israel", region: "Jerusalem District" },
  { id: "c5", name: "Rehovot",       pop: 220,  country: "israel", region: "Central District"   },
  { id: "c6", name: "Haifa",         pop: 180,  country: "israel", region: "Northern District"  },
  { id: "c7", name: "Imphal",        pop: 2100, country: "india",  region: "Manipur"            },
  { id: "c8", name: "Aizawl",        pop: 1800, country: "india",  region: "Mizoram"            },
  { id: "c9", name: "Churachandpur", pop: 650,  country: "india",  region: "Manipur"            },
];

/* ── Shared primitives ───────────────────────────────────────────────────── */

function SectionHeader({
  label, right, colors,
}: {
  label: string;
  right?: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.secHeader}>
      <View style={[styles.secBar, { backgroundColor: GOLD }]} />
      <Text style={[styles.secLabel, { color: colors.mutedForeground }]}>{label}</Text>
      {right && (
        <Text style={[styles.secRight, { color: colors.mutedForeground }]}>{right}</Text>
      )}
    </View>
  );
}

/* ── STAT CARD ───────────────────────────────────────────────────────────── */
function StatCard({ stat, colors }: { stat: StatEntry; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={styles.statIcon}>{stat.icon}</Text>
      <Text style={[styles.statValue, { color: colors.primary }]} numberOfLines={2}>
        {stat.value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]} numberOfLines={2}>
        {stat.label}
      </Text>
      {stat.trend !== undefined && (
        <Text style={[styles.statTrend, { color: stat.trendUp ? GREEN : "#f87171" }]}>
          {stat.trendUp ? "▲" : "▼"} {stat.trend}
        </Text>
      )}
    </View>
  );
}

/* ── DISTRIBUTION BAR ────────────────────────────────────────────────────── */
function DistributionSection({
  label, list, barColor, colors,
}: {
  label: string; list: CityEntry[]; barColor: string; colors: ReturnType<typeof useColors>;
}) {
  const max   = list[0]?.pop || 1;
  const total = list.reduce((s, c) => s + c.pop, 0);
  return (
    <View style={{ marginBottom: SPACE[4] }}>
      <SectionHeader label={label} right={`${total.toLocaleString()} documented`} colors={colors} />
      <View style={[styles.distCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {list.map((c, i) => (
          <View
            key={c.id}
            style={[
              styles.distRow,
              i < list.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
            ]}
          >
            <View style={styles.distRowTop}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.distCity, { color: colors.foreground }]}>{c.name}</Text>
                <Text style={[styles.distRegion, { color: colors.mutedForeground }]}>{c.region}</Text>
              </View>
              <Text style={[styles.distPop, { color: barColor }]}>~{c.pop}</Text>
            </View>
            <View style={[styles.distTrack, { backgroundColor: colors.border }]}>
              <View style={[styles.distBar, { width: `${Math.round((c.pop / max) * 100)}%` as any, backgroundColor: barColor }]} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ── APPROVED BRANCH CARD ───────────────────────────────────────────────── */
function ApprovedBranchCard({ branch, colors }: { branch: BranchData; colors: ReturnType<typeof useColors> }) {
  const total    = branch.families.reduce((s, f) => s + 1 + f.members.length, 0);
  const inIsrael = branch.families.reduce(
    (s, f) => s + (f.headAliyah === "in_israel" ? 1 : 0) + f.members.filter(m => m.aliyahStatus === "in_israel").length,
    0,
  );

  return (
    <View style={[styles.branchCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {branch.synagogueImageUrl ? (
        /* ── Synagogue photo banner ── */
        <View style={styles.synagogueBanner}>
          <Image source={{ uri: branch.synagogueImageUrl }} style={styles.synagogueImg} resizeMode="cover" />
          <View style={styles.synagogueOverlay} />
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✅ VERIFIED</Text>
          </View>
          {branch.logoUrl && (
            <Image source={{ uri: branch.logoUrl }} style={styles.bannerLogo} resizeMode="cover" />
          )}
          <View style={[styles.bannerTextBlock, { left: branch.logoUrl ? 64 : 12 }]}>
            <Text style={styles.bannerName} numberOfLines={1}>{branch.name}</Text>
            <Text style={styles.bannerSub} numberOfLines={1}>
              🇮🇳 {branch.cityName}{branch.adminName ? ` · ${branch.adminName}` : ""}
            </Text>
          </View>
          <View style={styles.bannerTotal}>
            <Text style={styles.bannerTotalNum}>{total}</Text>
            <Text style={styles.bannerTotalLabel}>members</Text>
          </View>
        </View>
      ) : (
        /* ── Plain header with optional logo ── */
        <View style={[styles.branchHeader, { borderBottomColor: colors.border }]}>
          {branch.logoUrl
            ? <Image source={{ uri: branch.logoUrl }} style={styles.branchLogo} resizeMode="cover" />
            : <Text style={{ fontSize: 28 }}>🏛️</Text>
          }
          <View style={{ flex: 1 }}>
            <Text style={[styles.branchName, { color: colors.foreground }]}>{branch.name}</Text>
            <Text style={[styles.branchSub, { color: colors.mutedForeground }]}>
              🇮🇳 {branch.cityName}{branch.adminName ? ` · ${branch.adminName}` : ""}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[{ fontSize: TEXT.lg, fontWeight: "800", color: GREEN }]}>{total}</Text>
            <Text style={[{ fontSize: TEXT.xs, color: colors.mutedForeground }]}>members</Text>
          </View>
        </View>
      )}
      {/* Stats row */}
      <View style={styles.branchStatsRow}>
        {[
          { v: branch.families.length, l: "Families", color: BLUE,  bg: BLUE  + "14" },
          { v: inIsrael,               l: "In Israel", color: GREEN, bg: GREEN + "14" },
          { v: total - inIsrael,       l: "Awaiting",  color: "#facc15", bg: "#facc1514" },
        ].map(s => (
          <View key={s.l} style={[styles.branchStat, { backgroundColor: s.bg }]}>
            <Text style={[styles.branchStatNum, { color: s.color }]}>{s.v}</Text>
            <Text style={[styles.branchStatLabel, { color: colors.mutedForeground }]}>{s.l}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   DASHBOARD TAB
══════════════════════════════════════════════════════════════════════════ */
function DashboardTab({
  submissions, loading, refreshing, onRefresh, colors,
}: {
  submissions: CensusSubmission[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const approved   = submissions.filter(s => s.status === "approved").map(s => s.branch);
  const israelCities = CITIES.filter(c => c.country === "israel").sort((a, b) => b.pop - a.pop);
  const indiaCities  = CITIES.filter(c => c.country === "india").sort((a, b) => b.pop - a.pop);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.tabContent, { paddingBottom: 48 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />}
    >
      {/* Community Overview */}
      <View style={[styles.overviewCard, { backgroundColor: GOLD + "0D", borderColor: GOLD + "33" }]}>
        <Text style={[styles.overviewLabel, { color: GOLD }]}>COMMUNITY OVERVIEW</Text>
        <Text style={[styles.overviewBody, { color: colors.foreground }]}>
          The Bnei Menashe are one of the Lost Tribes of Israel, indigenous to Manipur and Mizoram
          in Northeast India, now returning to their ancestral homeland through Aliyah.
        </Text>
      </View>

      {/* Stat grid */}
      <View style={styles.statGrid}>
        {STATS.map(s => <StatCard key={s.id} stat={s} colors={colors} />)}
      </View>

      {/* Distribution bars */}
      <DistributionSection label="DISTRIBUTION IN ISRAEL" list={israelCities} barColor={GOLD}  colors={colors} />
      <DistributionSection label="DISTRIBUTION IN INDIA"  list={indiaCities}  barColor={BLUE}  colors={colors} />

      {/* Approved branches */}
      {loading ? (
        <ActivityIndicator color={GOLD} style={{ marginTop: 20 }} />
      ) : approved.length > 0 ? (
        <View>
          <SectionHeader
            label="REGISTERED BRANCHES"
            right={`✅ ${approved.length} verified`}
            colors={colors}
          />
          {approved.map(b => <ApprovedBranchCard key={b.id} branch={b} colors={colors} />)}
        </View>
      ) : null}

      {/* ── Community Census CTA ── */}
      <View style={[styles.censusCta, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.censusCtaHeader}>
          <View style={[styles.censusCtaIcon, { backgroundColor: GOLD + "18", borderColor: GOLD + "44" }]}>
            <Text style={{ fontSize: 22 }}>📋</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.censusCtaTitle, { color: colors.foreground }]}>Community Census</Text>
            <Text style={[styles.censusCtaSub, { color: colors.mutedForeground }]}>
              Submit your family details or check whether your previous submission was reviewed.
            </Text>
          </View>
        </View>
        <View style={styles.censusCtaBtns}>
          <TouchableOpacity
            style={[styles.censusSubmitBtn, { backgroundColor: BLUE }]}
            onPress={() => { haptic(); router.push("/census"); }}
            activeOpacity={0.82}
          >
            <Text style={{ fontSize: 13 }}>📋</Text>
            <Text style={styles.censusSubmitText}>Submit My Details</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.censusStatusBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
            onPress={() => { haptic(); router.push("/census"); }}
            activeOpacity={0.82}
          >
            <Text style={{ fontSize: 11 }}>🔍</Text>
            <Text style={[styles.censusStatusText, { color: colors.mutedForeground }]}>Check{"\n"}Status</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Source note */}
      <View style={[styles.sourceNote, { borderColor: colors.border }]}>
        <Feather name="info" size={11} color={colors.mutedForeground} />
        <Text style={[styles.sourceNoteText, { color: colors.mutedForeground }]}>
          Data compiled from Shavei Israel, community registers, and field surveys. Last updated: Sivan 5785
        </Text>
      </View>
    </ScrollView>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ADMIN TAB
══════════════════════════════════════════════════════════════════════════ */
function AdminTab({
  submissions, memberSubmissions, loading, refreshing, onRefresh, onReview, colors,
}: {
  submissions: CensusSubmission[];
  memberSubmissions: MemberSubmission[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onReview: (id: string, type: "branch" | "member", status: "approved" | "rejected", note?: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});
  const [acting, setActing] = useState<string | null>(null);

  /* ── Global stats editing state ── */
  const [globalStats, setGlobalStats] = useState(STATS.map(s => ({ ...s })));
  const [statsSaved, setStatsSaved] = useState(false);

  function updateStat(id: string, field: "value" | "trend", text: string) {
    setGlobalStats(prev => prev.map(s => s.id === id ? { ...s, [field]: text } : s));
    setStatsSaved(false);
  }

  function handleSaveStats() {
    haptic();
    setStatsSaved(true);
    setTimeout(() => setStatsSaved(false), 2500);
  }

  async function act(id: string, type: "branch" | "member", status: "approved" | "rejected") {
    setActing(id);
    await onReview(id, type, status, noteMap[id]);
    setActing(null);
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.tabContent, { paddingBottom: 48 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GOLD} />}
    >
      {loading ? (
        <ActivityIndicator color={GOLD} style={{ marginTop: 40 }} />
      ) : (
        <>
          {/* Branch submissions */}
          <SectionHeader
            label="BRANCH SUBMISSIONS"
            right={`${submissions.length}`}
            colors={colors}
          />
          {submissions.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="inbox" size={24} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No branch submissions yet</Text>
            </View>
          ) : submissions.map(sub => {
            const isPending   = sub.status === "pending";
            const statusColor = sub.status === "approved" ? GREEN : sub.status === "rejected" ? "#ef4444" : "#f59e0b";
            const isActing    = acting === sub.id;
            return (
              <View key={sub.id} style={[styles.subCard, {
                backgroundColor: colors.card,
                borderColor: isPending ? "#f59e0b44" : colors.border,
              }]}>
                {/* Header row */}
                <View style={styles.subRow}>
                  {sub.branch.logoUrl
                    ? <Image source={{ uri: sub.branch.logoUrl }} style={styles.subLogo} />
                    : <Text style={{ fontSize: 22 }}>🏛️</Text>
                  }
                  <View style={{ flex: 1, marginLeft: SPACE[3] }}>
                    <Text style={[styles.subName, { color: colors.foreground }]}>{sub.branch.name}</Text>
                    <Text style={[styles.subMeta, { color: colors.mutedForeground }]}>
                      {sub.branch.cityName}
                      {sub.branch.adminName ? ` · Admin: ${sub.branch.adminName}` : ""}
                      {" · "}{sub.branch.families.length} families
                    </Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: statusColor + "22" }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {sub.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
                {/* Synagogue thumbnail */}
                {sub.branch.synagogueImageUrl && (
                  <Image
                    source={{ uri: sub.branch.synagogueImageUrl }}
                    style={styles.subSynagogue}
                    resizeMode="cover"
                  />
                )}
                {/* Date */}
                <Text style={[styles.subDate, { color: colors.mutedForeground }]}>
                  Submitted {new Date(sub.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  {sub.reviewNote ? `  ·  "${sub.reviewNote}"` : ""}
                </Text>
                {isPending && (
                  <>
                    <TextInput
                      value={noteMap[sub.id] ?? ""}
                      onChangeText={t => setNoteMap(n => ({ ...n, [sub.id]: t }))}
                      placeholder="Review note (optional)"
                      placeholderTextColor={colors.mutedForeground + "88"}
                      style={[styles.noteInput, {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.foreground,
                      }]}
                    />
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.rejectBtn}
                        disabled={isActing}
                        onPress={() => { haptic(); act(sub.id, "branch", "rejected"); }}
                      >
                        {isActing ? <ActivityIndicator size="small" color="#ef4444" /> : <Text style={styles.rejectText}>✗ Reject</Text>}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.approveBtn}
                        disabled={isActing}
                        onPress={() => { haptic(); act(sub.id, "branch", "approved"); }}
                      >
                        {isActing ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.approveText}>✓ Approve</Text>}
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            );
          })}

          {/* ── Global Administrative Access ── */}
          <View style={[styles.globalAdminCard, { backgroundColor: GOLD + "0D", borderColor: GOLD + "33" }]}>
            <Text style={{ fontSize: 18 }}>🏛️</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.globalAdminTitle, { color: GOLD }]}>Global Administrative Access</Text>
              <Text style={[styles.globalAdminSub, { color: colors.mutedForeground }]}>
                Edit all statistics and city records across all regions.
              </Text>
            </View>
          </View>

          {/* ── Edit Global Statistics ── */}
          <SectionHeader label="EDIT GLOBAL STATISTICS" colors={colors} />
          {globalStats.map(s => (
            <View key={s.id} style={[styles.statEditCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statEditLabel, { color: colors.mutedForeground }]}>{s.icon} {s.label}</Text>
              <View style={styles.statEditRow}>
                <TextInput
                  style={[styles.statEditInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, flex: 2 }]}
                  value={s.value}
                  placeholder="Value"
                  placeholderTextColor={colors.mutedForeground + "88"}
                  onChangeText={t => updateStat(s.id, "value", t)}
                />
                <TextInput
                  style={[styles.statEditInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, flex: 1 }]}
                  value={s.trend ?? ""}
                  placeholder="Trend"
                  placeholderTextColor={colors.mutedForeground + "88"}
                  onChangeText={t => updateStat(s.id, "trend", t)}
                />
              </View>
            </View>
          ))}
          <TouchableOpacity
            style={[styles.saveStatsBtn, { backgroundColor: statsSaved ? "#166534" : GOLD }]}
            onPress={handleSaveStats}
            activeOpacity={0.82}
          >
            <Text style={[styles.saveStatsBtnText, { color: statsSaved ? "#fff" : "#1a0f00" }]}>
              {statsSaved ? "✓ Changes Saved" : "Save All Changes"}
            </Text>
          </TouchableOpacity>

          {/* Family submissions */}
          <SectionHeader
            label="FAMILY CENSUS SUBMISSIONS"
            right={`${memberSubmissions.length}`}
            colors={colors}
          />
          {memberSubmissions.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="users" size={24} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No family submissions yet</Text>
            </View>
          ) : memberSubmissions.map(sub => {
            const isPending   = sub.status === "pending";
            const statusColor = sub.status === "approved" ? GREEN : sub.status === "rejected" ? "#ef4444" : "#f59e0b";
            const isActing    = acting === sub.id;
            const head        = sub.headCensus;
            return (
              <View key={sub.id} style={[styles.subCard, {
                backgroundColor: colors.card,
                borderColor: isPending ? "#f59e0b44" : colors.border,
              }]}>
                <View style={styles.subRow}>
                  <Text style={{ fontSize: 22 }}>👨‍👩‍👧‍👦</Text>
                  <View style={{ flex: 1, marginLeft: SPACE[3] }}>
                    <Text style={[styles.subName, { color: colors.foreground }]}>
                      {head.namePerPassport || sub.submitterName}
                    </Text>
                    <Text style={[styles.subMeta, { color: colors.mutedForeground }]}>
                      {sub.branchName} · {sub.members.length} members
                    </Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: statusColor + "22" }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>{sub.status.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={[styles.subDate, { color: colors.mutedForeground }]}>
                  Submitted {new Date(sub.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </Text>
                {isPending && (
                  <>
                    <TextInput
                      value={noteMap[sub.id] ?? ""}
                      onChangeText={t => setNoteMap(n => ({ ...n, [sub.id]: t }))}
                      placeholder="Review note (optional)"
                      placeholderTextColor={colors.mutedForeground + "88"}
                      style={[styles.noteInput, {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.foreground,
                      }]}
                    />
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.rejectBtn}
                        disabled={isActing}
                        onPress={() => { haptic(); act(sub.id, "member", "rejected"); }}
                      >
                        {isActing ? <ActivityIndicator size="small" color="#ef4444" /> : <Text style={styles.rejectText}>✗ Reject</Text>}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.approveBtn}
                        disabled={isActing}
                        onPress={() => { haptic(); act(sub.id, "member", "approved"); }}
                      >
                        {isActing ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.approveText}>✓ Approve</Text>}
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   LOCAL ADMIN TAB
══════════════════════════════════════════════════════════════════════════ */
function LocalAdminTab({
  myBranch, mySubmission, loading, colors, getToken, onBranchSaved, onSubmitted,
}: {
  myBranch: BranchData | null;
  mySubmission: CensusSubmission | null;
  loading: boolean;
  colors: ReturnType<typeof useColors>;
  getToken: () => Promise<string | null>;
  onBranchSaved: (b: BranchData) => void;
  onSubmitted: (s: CensusSubmission) => void;
}) {
  /* ── Image states ── */
  const [logoUri,      setLogoUri]      = useState("");
  const [synagogueUri, setSynagogueUri] = useState("");
  const [pickingImg,   setPickingImg]   = useState<"logo" | "synagogue" | null>(null);

  /* ── Form states ── */
  const [setupName,  setSetupName]  = useState("");
  const [setupCity,  setSetupCity]  = useState(CITIES[0].id);
  const [setupAdmin, setSetupAdmin] = useState("");
  const [setupDate,  setSetupDate]  = useState("");
  const [cityPickerOpen, setCityPickerOpen] = useState(false);

  /* ── Action states ── */
  const [registering, setRegistering] = useState(false);
  const [showForm,    setShowForm]    = useState(false);

  const selectedCity = CITIES.find(c => c.id === setupCity) ?? CITIES[0];

  /* ── Pre-fill form once loading is done ─────────────────────────────────── */
  const prefilledRef = useRef(false);
  useEffect(() => {
    if (loading || prefilledRef.current) return;
    prefilledRef.current = true;
    if (myBranch) {
      setSetupName(myBranch.name ?? "");
      setSetupCity(myBranch.cityId ?? CITIES[0].id);
      setSetupAdmin(myBranch.adminName ?? "");
      setSetupDate(myBranch.established ?? "");
      setLogoUri(myBranch.logoUrl ?? "");
      setSynagogueUri(myBranch.synagogueImageUrl ?? "");
    }
    // Show form when: no branch, submission rejected, or no submission yet
    setShowForm(!myBranch || !mySubmission || mySubmission.status === "rejected");
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Image picker ───────────────────────────────────────────────────────── */
  async function pickImage(type: "logo" | "synagogue") {
    haptic();
    setPickingImg(type);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: type === "logo" ? [1, 1] : [16, 9],
        quality: type === "logo" ? 0.4 : 0.5,
        base64: true,
      });
      if (!result.canceled && result.assets[0]?.base64) {
        const uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
        if (type === "logo") setLogoUri(uri);
        else setSynagogueUri(uri);
      }
    } catch { /* ignore */ }
    finally { setPickingImg(null); }
  }

  /* ── Register + auto-submit for Global Admin review ─────────────────────── */
  async function handleRegisterAndSubmit() {
    if (!setupName.trim()) {
      Alert.alert("Required", "Branch / congregation name is required.");
      return;
    }
    haptic();
    setRegistering(true);
    try {
      const saved = await saveCensusBranch(
        {
          id:                myBranch?.id,
          name:              setupName.trim(),
          cityId:            setupCity,
          cityName:          selectedCity.name,
          adminName:         setupAdmin.trim() || undefined,
          established:       setupDate || undefined,
          logoUrl:           logoUri || undefined,
          synagogueImageUrl: synagogueUri || undefined,
        },
        getToken,
      );
      if (!saved) throw new Error("save failed");
      onBranchSaved(saved);
      const sub = await submitBranchForReview(saved, getToken);
      if (sub) { onSubmitted(sub); setShowForm(false); }
    } catch {
      Alert.alert("Error", "Could not register branch. Please try again.");
    } finally {
      setRegistering(false);
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={GOLD} /></View>;
  }

  /* ══ APPROVED ═══════════════════════════════════════════════════════════ */
  if (mySubmission?.status === "approved" && !showForm) {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.tabContent, { paddingBottom: 48 }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.statusBanner, { backgroundColor: "#14532d20", borderColor: "#22c55e44" }]}>
          <View style={styles.statusIconRow}>
            <View style={[styles.statusIcon, { backgroundColor: "#22c55e22" }]}>
              <Feather name="check-circle" size={24} color="#22c55e" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusTitle, { color: "#22c55e" }]}>Branch Approved!</Text>
              <Text style={[styles.statusBody, { color: colors.mutedForeground }]}>
                Your branch is verified. Community members can now submit their family census to your branch.
              </Text>
            </View>
          </View>
          {mySubmission.reviewNote ? (
            <View style={[styles.reviewNoteBox, { backgroundColor: "#22c55e12", borderColor: "#22c55e33" }]}>
              <Feather name="message-circle" size={12} color="#22c55e" />
              <Text style={[styles.reviewNoteText, { color: "#22c55e" }]}>"{mySubmission.reviewNote}"</Text>
            </View>
          ) : null}
        </View>

        {myBranch ? (
          <>
          <View style={[styles.overviewCard, { backgroundColor: BLUE + "0D", borderColor: BLUE + "33" }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE[3] }}>
              {myBranch.logoUrl ? (
                <Image source={{ uri: myBranch.logoUrl }} style={{ width: 52, height: 52, borderRadius: 12 }} resizeMode="cover" />
              ) : (
                <View style={{ width: 52, height: 52, borderRadius: 12, backgroundColor: BLUE + "22", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 24 }}>🏛️</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: TEXT.md, fontWeight: "800", color: colors.foreground }}>{myBranch.name}</Text>
                <Text style={{ fontSize: TEXT.sm, color: colors.mutedForeground, marginTop: 2 }}>
                  🇮🇳 {myBranch.cityName}{myBranch.adminName ? ` · ${myBranch.adminName}` : ""}
                </Text>
                {myBranch.adminName && (
                  <Text style={{ fontSize: TEXT.sm, color: BLUE, marginTop: 2 }}>Admin: {myBranch.adminName}</Text>
                )}
              </View>
            </View>
            <View style={[styles.branchStatsRow, { marginTop: SPACE[4] }]}>
              {[
                { v: myBranch.families.length, l: "Families", color: BLUE,  bg: BLUE  + "14" },
                { v: myBranch.families.reduce((s: number, f: any) => s + 1 + (f.members?.length ?? 0), 0), l: "Members", color: GREEN, bg: GREEN + "14" },
              ].map(s => (
                <View key={s.l} style={[styles.branchStat, { backgroundColor: s.bg }]}>
                  <Text style={[styles.branchStatNum, { color: s.color }]}>{s.v}</Text>
                  <Text style={[styles.branchStatLabel, { color: colors.mutedForeground }]}>{s.l}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Synagogue photo */}
          {myBranch.synagogueImageUrl && (
            <>
              <SectionHeader label="SYNAGOGUE PHOTO" colors={colors} />
              <Image
                source={{ uri: myBranch.synagogueImageUrl }}
                style={[styles.synagogueFull, { borderColor: colors.border }]}
                resizeMode="cover"
              />
            </>
          )}

          {/* Upload note */}
          <View style={[styles.overviewCard, { backgroundColor: GOLD + "0A", borderColor: GOLD + "2A" }]}>
            <Text style={[styles.overviewLabel, { color: GOLD }]}>🖼️  COMMUNITY IDENTITY</Text>
            <Text style={[styles.overviewBody, { color: colors.mutedForeground }]}>
              To upload or replace your Community Logo and Synagogue Photo, use the web version of
              Census & Demographics (Local Admin tab). Photos appear here and on the public Dashboard
              once your branch is approved.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => { haptic(); router.push("/census"); }}
          >
            <Feather name="edit-3" size={15} color={colors.primaryForeground ?? "#1a0f00"} />
            <Text style={[styles.primaryBtnText, { color: colors.primaryForeground ?? "#1a0f00" }]}>
              Manage Census Form
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          {/* ── Create Your Branch form ── */}
          <View style={[styles.overviewCard, { backgroundColor: BLUE + "0D", borderColor: BLUE + "33" }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: SPACE[3] }}>
              <Text style={{ fontSize: 18 }}>📍</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.overviewLabel, { color: BLUE }]}>Create Your Branch</Text>
                <Text style={[styles.overviewBody, { color: colors.mutedForeground, marginTop: 2, fontSize: 12 }]}>
                  Register your congregation and begin the official BMC family census.
                </Text>
              </View>
            </View>
          </View>

          {/* Branch / Congregation Name */}
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>BRANCH / CONGREGATION NAME</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              placeholder="e.g. Beithshalom K.Patlen"
              placeholderTextColor={colors.mutedForeground + "88"}
              value={setupName}
              onChangeText={setSetupName}
              returnKeyType="next"
            />
            <Text style={[styles.formHint, { color: colors.mutedForeground }]}>
              Official congregation name as it will appear on the census form.
            </Text>
          </View>

          {/* City / Location */}
          <View style={styles.formGroup}>
            <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>CITY / LOCATION</Text>
            <TouchableOpacity
              style={[styles.formInput, styles.formSelect, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => { haptic(); setCityPickerOpen(true); }}
              activeOpacity={0.8}
            >
              <Text style={[styles.formSelectText, { color: colors.foreground }]}>
                {selectedCity.country === "israel" ? "🇮🇱" : "🇮🇳"} {selectedCity.name} · {selectedCity.region}
              </Text>
              <Feather name="chevron-down" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Local Admin Name + Established Date */}
          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>LOCAL ADMIN NAME</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="Your full name"
                placeholderTextColor={colors.mutedForeground + "88"}
                value={setupAdmin}
                onChangeText={setSetupAdmin}
              />
            </View>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>ESTABLISHED DATE</Text>
              <TextInput
                style={[styles.formInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.mutedForeground + "88"}
                value={setupDate}
                onChangeText={setSetupDate}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>

          {/* Register Branch button */}
          <TouchableOpacity
            style={[styles.registerBtn, {
              backgroundColor: setupName.trim() ? BLUE : colors.card,
              borderColor: setupName.trim() ? "transparent" : colors.border,
            }]}
            onPress={handleRegisterAndSubmit}
            disabled={!setupName.trim() || registering}
            activeOpacity={0.82}
          >
            {registering
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={[styles.registerBtnText, { color: setupName.trim() ? "#fff" : colors.mutedForeground }]}>
                  Register Branch
                </Text>
            }
          </TouchableOpacity>

          {/* City picker modal */}
          {cityPickerOpen && (
            <View style={StyleSheet.absoluteFillObject}>
              <TouchableOpacity
                style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.5)" }]}
                onPress={() => setCityPickerOpen(false)}
                activeOpacity={1}
              />
              <View style={[styles.cityModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.cityModalHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.cityModalTitle, { color: colors.foreground }]}>Select City / Location</Text>
                  <TouchableOpacity onPress={() => setCityPickerOpen(false)}>
                    <Feather name="x" size={20} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={{ maxHeight: 320 }}>
                  {CITIES.map(c => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.cityOption, {
                        backgroundColor: c.id === setupCity ? BLUE + "18" : "transparent",
                        borderBottomColor: colors.border,
                      }]}
                      onPress={() => { haptic(); setSetupCity(c.id); setCityPickerOpen(false); }}
                    >
                      <Text style={[styles.cityOptionText, { color: c.id === setupCity ? BLUE : colors.foreground }]}>
                        {c.country === "israel" ? "🇮🇱" : "🇮🇳"} {c.name}
                        <Text style={{ fontSize: 11, color: colors.mutedForeground }}> · {c.region}</Text>
                      </Text>
                      {c.id === setupCity && <Feather name="check" size={16} color={BLUE} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

/* ── LocalAdminTab: fallthrough for non-approved / unauthenticated state ── */
  return null;
}

/* ══════════════════════════════════════════════════════════════════════════
   ROOT SCREEN
══════════════════════════════════════════════════════════════════════════ */
export default function CensusDemographicsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getToken, isSignedIn } = useAuth();

  const [activeTab, setActiveTab]     = useState<Tab>("dashboard");
  const [submissions, setSubmissions]           = useState<CensusSubmission[]>([]);
  const [memberSubmissions, setMemberSubs]      = useState<MemberSubmission[]>([]);
  const [myBranch, setMyBranch]                 = useState<BranchData | null>(null);
  const [mySubmission, setMySubmission]         = useState<CensusSubmission | null>(null);
  const [loading, setLoading]                   = useState(true);
  const [refreshing, setRefreshing]             = useState(false);

  // Clerk's getToken and isSignedIn are NOT referentially stable — they produce
  // a new function/value reference on every render. Storing them in refs lets
  // `load` read the latest values without listing them as deps, which would
  // rebuild `load` every render and trigger an infinite effect → re-render loop.
  const getTokenRef  = useRef(getToken);
  const isSignedInRef = useRef(isSignedIn);
  useEffect(() => { getTokenRef.current  = getToken;  }, [getToken]);
  useEffect(() => { isSignedInRef.current = isSignedIn; }, [isSignedIn]);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const gt = () => getTokenRef.current();
      const [subs, msubs, branch, mySub] = await Promise.all([
        fetchCensusSubmissions(gt),
        fetchCensusMemberSubmissions(gt),
        isSignedInRef.current ? fetchMyBranch(gt) : Promise.resolve(null),
        isSignedInRef.current ? fetchMySubmissionStatus(gt) : Promise.resolve(null),
      ]);
      setSubmissions(subs);
      setMemberSubs(msubs);
      setMyBranch(branch);
      setMySubmission(mySub);
    } catch { /* show whatever loaded */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []); // stable — reads Clerk values via refs, never rebuilds

  // Run once on mount only; `load` is stable so this will never re-fire.
  useEffect(() => { load(); }, []);

  async function handleReview(id: string, type: "branch" | "member", status: "approved" | "rejected", note?: string) {
    try {
      await reviewSubmission(id, type, status, note, () => getToken());
      await load();
    } catch {
      Alert.alert("Error", "Could not update submission. Please try again.");
    }
  }

  const TABS: { id: Tab; label: string; icon: React.ComponentProps<typeof Feather>["name"] }[] = [
    { id: "dashboard",  label: "Dashboard",   icon: "bar-chart-2" },
    { id: "admin",      label: "Admin",        icon: "shield"      },
    { id: "localadmin", label: "Local Admin",  icon: "map-pin"     },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>

      {/* ── Nav bar ── */}
      <View style={[styles.nav, {
        paddingTop: insets.top + SPACE[2],
        borderBottomColor: colors.border,
      }]}>
        <TouchableOpacity
          onPress={() => { haptic(); router.back(); }}
          style={styles.navBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={[styles.navTitle, { color: colors.foreground }]}>Census & Demographics</Text>
          <Text style={[styles.navSub, { color: colors.mutedForeground }]}>BMC India · Census 2026–2027</Text>
        </View>

        <TouchableOpacity
          onPress={() => { haptic(); router.back(); }}
          style={[styles.navBtn, { alignItems: "flex-end" }]}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Feather name="x" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* ── Tab bar ── */}
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {TABS.map(t => {
          const active = activeTab === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={[styles.tabBtn, active && styles.tabBtnActive]}
              onPress={() => { haptic(); setActiveTab(t.id); }}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              {/* Active underline */}
              <View style={[styles.tabUnderline, active && { backgroundColor: GOLD }]} />
              <Feather
                name={t.icon}
                size={13}
                color={active ? GOLD : colors.mutedForeground}
              />
              <Text style={[styles.tabLabel, {
                color:      active ? GOLD : colors.mutedForeground,
                fontWeight: active ? "800" : "600",
              }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Content ── */}
      <View style={[styles.content, { paddingHorizontal: 16 }]}>
        {activeTab === "dashboard" && (
          <DashboardTab
            submissions={submissions} loading={loading}
            refreshing={refreshing} onRefresh={() => load(true)} colors={colors}
          />
        )}
        {activeTab === "admin" && (
          isSignedIn ? (
            <AdminTab
              submissions={submissions} memberSubmissions={memberSubmissions}
              loading={loading} refreshing={refreshing}
              onRefresh={() => load(true)} onReview={handleReview} colors={colors}
            />
          ) : (
            <View style={styles.center}>
              <View style={[styles.lockBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="lock" size={32} color={colors.mutedForeground} />
                <Text style={[styles.lockTitle, { color: colors.foreground }]}>Admin Access Required</Text>
                <Text style={[styles.lockBody, { color: colors.mutedForeground }]}>
                  Sign in with an admin account to review branch and family census submissions.
                </Text>
              </View>
            </View>
          )
        )}
        {activeTab === "localadmin" && (
          isSignedIn ? (
            <LocalAdminTab
              myBranch={myBranch}
              mySubmission={mySubmission}
              loading={loading}
              colors={colors}
              getToken={() => getToken()}
              onBranchSaved={(b) => setMyBranch(b)}
              onSubmitted={(s) => setMySubmission(s)}
            />
          ) : (
            <View style={styles.center}>
              <View style={[styles.lockBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="lock" size={32} color={colors.mutedForeground} />
                <Text style={[styles.lockTitle, { color: colors.foreground }]}>Sign In Required</Text>
                <Text style={[styles.lockBody, { color: colors.mutedForeground }]}>
                  Sign in to manage your community branch registration.
                </Text>
              </View>
            </View>
          )
        )}
      </View>
    </View>
  );
}

/* ── Styles ───────────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  root:    { flex: 1 },
  content: { flex: 1 },
  center:  { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },

  /* Nav */
  nav: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navBtn:   { width: 40, height: 40, justifyContent: "center" },
  navTitle: { fontSize: TEXT.md, fontWeight: "800", letterSpacing: -0.3 },
  navSub:   { fontSize: 10, marginTop: 1, letterSpacing: 0.2 },

  /* Tab bar */
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingTop: 10,
    paddingBottom: 8,
    gap: 4,
    position: "relative",
  },
  tabBtnActive: {},
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: 12,
    right: 12,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: "transparent",
  },
  tabLabel: { fontSize: 10, letterSpacing: 0.3 },

  /* Shared tab content padding */
  tabContent: { paddingTop: 16, gap: 0 },

  /* Section header */
  secHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    marginTop: 4,
  },
  secBar:   { width: 3, height: 14, borderRadius: 2 },
  secLabel: { flex: 1, fontSize: 10, fontWeight: "700", letterSpacing: 0.8 },
  secRight: { fontSize: 10, fontWeight: "600" },

  /* Overview card */
  overviewCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  overviewLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1.4, marginBottom: 6 },
  overviewBody:  { fontSize: 13, lineHeight: 20 },

  /* Stat grid */
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: "47.5%",
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  statIcon:  { fontSize: 22 },
  statValue: { fontSize: 20, fontWeight: "800", lineHeight: 24 },
  statLabel: { fontSize: 11, lineHeight: 15 },
  statTrend: { fontSize: 11, fontWeight: "600" },

  /* Distribution */
  distCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 4,
  },
  distRow:    { padding: 12 },
  distRowTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  distCity:   { fontSize: 13, fontWeight: "600" },
  distRegion: { fontSize: 11, marginTop: 1 },
  distPop:    { fontSize: 12, fontWeight: "700" },
  distTrack:  { height: 5, borderRadius: 3, overflow: "hidden" },
  distBar:    { height: "100%" as any, borderRadius: 3 },

  /* Approved branches */
  branchCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
  },
  synagogueBanner: { height: 130, position: "relative" },
  synagogueImg:    { width: "100%", height: "100%" as any },
  synagogueOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.52)",
  },
  verifiedBadge: {
    position: "absolute", top: 8, right: 10,
    backgroundColor: "rgba(74,222,128,0.88)",
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
  },
  verifiedText: { fontSize: 10, fontWeight: "700", color: "#fff" },
  bannerLogo: {
    position: "absolute", bottom: 10, left: 12,
    width: 42, height: 42, borderRadius: 10,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.9)",
  },
  bannerTextBlock: { position: "absolute", bottom: 10, right: 70 },
  bannerName: { fontSize: 13, fontWeight: "800", color: "#fff" },
  bannerSub:  { fontSize: 10, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  bannerTotal: { position: "absolute", bottom: 10, right: 10, alignItems: "flex-end" },
  bannerTotalNum:   { fontSize: 16, fontWeight: "800", color: GREEN },
  bannerTotalLabel: { fontSize: 9, color: "rgba(255,255,255,0.7)" },

  branchHeader: {
    flexDirection: "row", alignItems: "center", padding: 12, gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  branchLogo: { width: 38, height: 38, borderRadius: 9 },
  branchName: { fontSize: 13, fontWeight: "700" },
  branchSub:  { fontSize: 11, marginTop: 2 },

  branchStatsRow: { flexDirection: "row", gap: 8, padding: 10 },
  branchStat:     { flex: 1, borderRadius: 8, padding: 8, alignItems: "center" },
  branchStatNum:  { fontSize: 15, fontWeight: "800" },
  branchStatLabel:{ fontSize: 10, marginTop: 2 },

  /* Admin tab — submission cards */
  subCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  subRow:   { flexDirection: "row", alignItems: "flex-start", marginBottom: 8 },
  subLogo:  { width: 32, height: 32, borderRadius: 8 },
  subName:  { fontSize: 13, fontWeight: "700" },
  subMeta:  { fontSize: 11, marginTop: 2 },
  subDate:  { fontSize: 11, marginBottom: 8 },
  subSynagogue: {
    width: "100%", height: 80, borderRadius: 8, marginBottom: 8,
  },
  statusPill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: "800" },

  noteInput: {
    borderWidth: 1, borderRadius: RADIUS.lg,
    paddingHorizontal: 12, paddingVertical: 8,
    fontSize: 12, marginBottom: 8,
  },
  actionRow:   { flexDirection: "row", gap: 8 },
  rejectBtn: {
    flex: 1, padding: 10, borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: "rgba(239,68,68,0.35)",
    backgroundColor: "rgba(239,68,68,0.08)", alignItems: "center",
  },
  rejectText:  { color: "#ef4444", fontSize: 13, fontWeight: "700" },
  approveBtn: {
    flex: 2, padding: 10, borderRadius: RADIUS.full,
    backgroundColor: "#166534", alignItems: "center",
  },
  approveText: { color: "#fff", fontSize: 13, fontWeight: "800" },

  /* Empty states */
  emptyCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: RADIUS.xl, borderWidth: 1, borderStyle: "dashed",
    padding: 20, marginBottom: 10, justifyContent: "center",
  },
  emptyText: { fontSize: 13 },

  /* Lock / not signed-in */
  lockBox: {
    borderRadius: RADIUS.xl, borderWidth: 1,
    padding: 28, alignItems: "center", gap: 10, maxWidth: 300,
  },
  lockTitle: { fontSize: TEXT.md, fontWeight: "700", textAlign: "center" },
  lockBody:  { fontSize: TEXT.sm, textAlign: "center", lineHeight: 20 },

  /* Local admin */
  synagogueFull: {
    width: "100%", height: 180, borderRadius: RADIUS.xl,
    borderWidth: 1, marginBottom: 14,
  },
  primaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, padding: 14, borderRadius: RADIUS.full, marginTop: 4, marginBottom: 20,
  },
  primaryBtnText: { fontSize: TEXT.md, fontWeight: "800" },

  /* Community Census CTA (Dashboard) */
  censusCta: {
    borderRadius: RADIUS.xl, borderWidth: 1,
    padding: 16, marginBottom: 12, gap: 14,
  },
  censusCtaHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  censusCtaIcon: {
    width: 48, height: 48, borderRadius: 14,
    borderWidth: 1, alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  censusCtaTitle: { fontSize: TEXT.md, fontWeight: "800", marginBottom: 3 },
  censusCtaSub:   { fontSize: 12, lineHeight: 17 },
  censusCtaBtns:  { flexDirection: "row", gap: 10 },
  censusSubmitBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, borderRadius: RADIUS.full, paddingVertical: 12,
  },
  censusSubmitText: { fontSize: 13, fontWeight: "800", color: "#fff" },
  censusStatusBtn: {
    width: 72, alignItems: "center", justifyContent: "center",
    borderRadius: RADIUS.lg, borderWidth: 1, paddingVertical: 10, gap: 3,
  },
  censusStatusText: { fontSize: 10, fontWeight: "700", textAlign: "center", lineHeight: 13 },

  /* Source note */
  sourceNote: {
    flexDirection: "row", alignItems: "flex-start", gap: 6,
    borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12, marginTop: 4, marginBottom: 4,
  },
  sourceNoteText: { flex: 1, fontSize: 10, lineHeight: 15 },

  /* Admin — Global stats editor */
  globalAdminCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: RADIUS.xl, borderWidth: 1,
    padding: 14, marginTop: 8, marginBottom: 14,
  },
  globalAdminTitle: { fontSize: 13, fontWeight: "700" },
  globalAdminSub:   { fontSize: 11, marginTop: 2 },
  statEditCard: {
    borderRadius: RADIUS.xl, borderWidth: 1,
    padding: 12, marginBottom: 8,
  },
  statEditLabel: { fontSize: 11, marginBottom: 8 },
  statEditRow:   { flexDirection: "row", gap: 8 },
  statEditInput: {
    borderWidth: 1, borderRadius: RADIUS.lg,
    paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 13,
  },
  saveStatsBtn: {
    padding: 14, borderRadius: RADIUS.full,
    alignItems: "center", marginTop: 4, marginBottom: 20,
  },
  saveStatsBtnText: { fontSize: TEXT.md, fontWeight: "800" },

  /* Local Admin — Branch registration form */
  formGroup:  { gap: 6, marginBottom: 14 },
  formRow:    { flexDirection: "row", gap: 10, marginBottom: 0 },
  formLabel:  { fontSize: 10, fontWeight: "700", letterSpacing: 0.6 },
  formInput: {
    borderWidth: 1, borderRadius: RADIUS.lg,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 13,
  },
  formSelect: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  formSelectText: { fontSize: 13, flex: 1 },
  formHint: { fontSize: 11, lineHeight: 16 },
  registerBtn: {
    padding: 14, borderRadius: RADIUS.full, borderWidth: 1,
    alignItems: "center", marginTop: 8, marginBottom: 20,
  },
  registerBtnText: { fontSize: TEXT.md, fontWeight: "800" },

  /* City picker modal */
  cityModal: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderWidth: 1, borderBottomWidth: 0,
    overflow: "hidden",
  },
  cityModalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cityModalTitle: { fontSize: TEXT.md, fontWeight: "700" },
  cityOption: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cityOptionText: { fontSize: 13, fontWeight: "600", flex: 1 },

  /* Approved branch status banner */
  statusBanner: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  statusIconRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  statusBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  reviewNoteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginTop: 10,
  },
  reviewNoteText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
    fontStyle: "italic",
  },
});
