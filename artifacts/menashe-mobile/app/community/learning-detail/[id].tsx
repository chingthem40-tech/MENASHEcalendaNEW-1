/**
 * Community · Learning Detail — SPR-L001
 * Deep screen navigated to from a Learning Group card on the
 * Learning Groups list (§ community/learning-groups.tsx).
 *
 * Turns a single Learning Group into a full learning experience:
 * hero, about, skills gained (interactive), learning path, schedule,
 * resources, and a join CTA. Static/curated content only — no backend,
 * no progress tracking, no certificates, no AI.
 *
 * Built with the MMDL design system (useThemeTokens + MenasheButton) so
 * new learning surfaces stay on the semantic token system.
 */

import React, { memo, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Modal, Pressable,
  StyleSheet, Platform, Alert, Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useThemeTokens, useReducedMotion } from "@/src/mobile/design-system";
import { MenasheButton } from "@/src/mobile/components/foundation/MenasheButton";
import { useLanguage } from "@/context/LanguageContext";

// ── Data ──────────────────────────────────────────────────────────────────────

type Difficulty = "Beginner" | "Intermediate" | "Advanced";
type FeatherName = React.ComponentProps<typeof Feather>["name"];

interface Bi { en: string; tk: string }

interface SkillDef {
  id:          string;
  icon:        FeatherName;
  title:       Bi;
  why:         Bi;
  outcomes:    Bi;
  estMinutes:  string;
  difficulty:  Difficulty;
}

const SKILLS: SkillDef[] = [
  {
    id: "hebrew-reading",
    icon: "book-open",
    title: { en: "Hebrew Reading", tk: "Hebrew Sim Zawng" },
    why: {
      en: "Hebrew is the language of Torah, prayer, and Jewish life. Reading it fluently opens every text and service directly, without relying on translation.",
      tk: "Hebrew hi Torah, thupui leh Yudah nun ṭawng a ni. A ṭha taka sim theih chuan lehlin ngai lo va Torah leh thupui hi mahni ngeiin i hriat thei ang.",
    },
    outcomes: {
      en: "Sound out unfamiliar words, follow along in the siddur, and recognize common Torah vocabulary.",
      tk: "Ṭawng hriat lo pawh sim thei ang, siddur zawm thei ang, Torah ṭawngkam ṭangkai tak hriat ang.",
    },
    estMinutes: "20–30 min / session",
    difficulty: "Beginner",
  },
  {
    id: "torah-knowledge",
    icon: "book",
    title: { en: "Torah Knowledge", tk: "Torah Hriatna" },
    why: {
      en: "The Torah is the foundation of Jewish identity and practice. Understanding its stories, laws, and commentary grounds every other area of learning.",
      tk: "Torah hi Yudah tihna leh nun dan bul a ni. A thu, dan leh tichhiar hriat chuan zirna dang zawng zawng a tan bul a siam ang.",
    },
    outcomes: {
      en: "Explain key parashah themes, connect weekly portions to daily life, and recognize major commentators (Rashi, Ramban).",
      tk: "Parasha thu pawimawh sawi thei ang, sunthal parasha leh nitina nun zawm thei ang, Rashi leh Ramban hriat thei ang.",
    },
    estMinutes: "30–45 min / session",
    difficulty: "Beginner",
  },
  {
    id: "jewish-history",
    icon: "clock",
    title: { en: "Jewish History", tk: "Yudah Chanchin Hlui" },
    why: {
      en: "Knowing where our people have come from — including the Bnei Menashe journey — gives context and depth to everything we study and practice today.",
      tk: "Kan mipui haw lam hriat — Bnei Menashe kawng zawh telin — chuan tuni kan zir leh kan nun a thu leh hla thupthu a pe ang.",
    },
    outcomes: {
      en: "Trace major eras of Jewish history and place the Bnei Menashe story within the wider Jewish story.",
      tk: "Yudah chanchin hun pawimawh hriat ang, Bnei Menashe chanchin hi Yudah chanchin zau zawk chhung ah dah thei ang.",
    },
    estMinutes: "25–35 min / session",
    difficulty: "Beginner",
  },
  {
    id: "talmud-analysis",
    icon: "git-branch",
    title: { en: "Talmud Analysis", tk: "Talmud Chhut Chian Na" },
    why: {
      en: "The Talmud trains a distinctive way of reasoning — weighing arguments, precedent, and logic. It's a skill as much as a body of knowledge.",
      tk: "Talmud chuan ngaihtuahna dan hmasang berah a zirtir — argument, precedent leh logic khaikhin dan. Hei hi hriatna bik leh thiamna pahnih vek a ni.",
    },
    outcomes: {
      en: "Follow a daf's structure, identify the machloket (dispute) at its core, and articulate both sides of an argument.",
      tk: "Daf sang dan hriat thei ang, a machloket (inṭanna) hriat thei ang, lam pahnih chiang taka sawi thei ang.",
    },
    estMinutes: "40–60 min / session",
    difficulty: "Advanced",
  },
  {
    id: "community-leadership",
    icon: "users",
    title: { en: "Community Leadership", tk: "Mipui Kaihhruaina" },
    why: {
      en: "Learning is meant to be shared. This track builds the confidence to teach, host, and guide others in Bnei Menashe community life.",
      tk: "Zirna hi share tur a ni. Hei chuan Bnei Menashe mipui nun ah zirtir, hmun pe leh kaihhruai theihna insuih chhoh ang.",
    },
    outcomes: {
      en: "Lead a short shiur or discussion, host a study session, and mentor a newer learner.",
      tk: "Shiur tawi te emaw inbiakna te emaw kaihhruai thei ang, kihilna hmun pe thei ang, zirtu thar te enkawl thei ang.",
    },
    estMinutes: "Ongoing",
    difficulty: "Intermediate",
  },
];

const SKILL_MAP: Record<string, SkillDef> = Object.fromEntries(SKILLS.map((s) => [s.id, s]));

const PATH_STEPS: Bi[] = [
  { en: "Hebrew Basics", tk: "Hebrew Bul" },
  { en: "Prayer",        tk: "Thupui" },
  { en: "Torah",         tk: "Torah" },
  { en: "Parashah",      tk: "Parasha" },
  { en: "Talmud",        tk: "Talmud" },
];

interface Resource { title: string; note?: Bi }
interface Resources {
  books:  Resource[];
  pdfs:   Resource[];
  audio:  Resource[];
  videos: Resource[];
}

interface LearningDetailContent {
  category:   Bi;
  frequency:  Bi;
  difficulty: Difficulty;
  about:      Bi;
  skillIds:   string[];
  pathLevel:  number; // index into PATH_STEPS
  teacher:    string;
  platform:   Bi;
  language:   string;
  resources:  Resources;
}

const DETAIL: Record<string, LearningDetailContent> = {
  "daf-yomi": {
    category:   { en: "Talmud Bavli", tk: "Talmud Bavli" },
    frequency:  { en: "Daily", tk: "Nitin" },
    difficulty: "Advanced",
    about: {
      en: "A single page of Talmud, every day, alongside Jewish learners worldwide. This circle walks through the daily daf together — reading the text, unpacking the sugya (topic), and discussing the halachic conclusions with fellow Bnei Menashe learners.",
      tk: "Talmud sang khat, nitin, khawvel puma Yudah zirtu te nen. Hei kihilna hian nitin daf hi an zawm ṭheuh — thu chhinchhiah, sugya (thu awm) hriat chiang tur leh Bnei Menashe zirtu dangte nen halacha thu tak tak sawi.",
    },
    skillIds:  ["talmud-analysis", "hebrew-reading", "jewish-history"],
    pathLevel: 4,
    teacher:   "Rabbi Eliyahu Chenrai",
    platform:  { en: "WhatsApp Group", tk: "WhatsApp Group" },
    language:  "English / Hebrew",
    resources: {
      books:  [{ title: "Steinsaltz Talmud Bavli — Tractate Berakhot", note: { en: "Recommended primary text", tk: "Ṭanchhan bul thupui" } }],
      pdfs:   [{ title: "Daily Daf Schedule (this cycle)", note: { en: "Updated monthly", tk: "Ṭha tinah siam thar" } }],
      audio:  [{ title: "Daf Yomi shiur recordings", note: { en: "20–30 min per daf", tk: "Daf khatah min 20–30" } }],
      videos: [{ title: "How to Read a Daf — orientation video" }],
    },
  },
  "parasha": {
    category:   { en: "Torah · Weekly Portion", tk: "Torah · Sunthal Parasha" },
    frequency:  { en: "Weekly", tk: "Sunthal" },
    difficulty: "Intermediate",
    about: {
      en: "Every Shabbat, we open the week's Torah portion together — reading the text, weighing classical commentary from Rashi and Ramban, and finding what it asks of us today.",
      tk: "Shabbat tinah, sunthal Torah parasha hi kan hawng ṭheuh — thu chhiar, Rashi leh Ramban tichhiar ngaihtuah, tuni atana a phuban zawng hriat.",
    },
    skillIds:  ["torah-knowledge", "hebrew-reading"],
    pathLevel: 3,
    teacher:   "Rabbi Yosef Hangshing",
    platform:  { en: "In-Person · Beit Knesset", tk: "Mahni Ngeiin · Beit Knesset" },
    language:  "Thadou-Kukish / Hebrew",
    resources: {
      books:  [{ title: "The Chumash with Rashi's Commentary" }],
      pdfs:   [{ title: "Weekly Parasha Summary Sheet" }],
      audio:  [{ title: "Parasha overview — audio shiur" }],
      videos: [{ title: "Rashi 101 — intro to classical commentary" }],
    },
  },
  "womens-torah": {
    category:   { en: "Halacha · Jewish Home", tk: "Halacha · Yudah Inn" },
    frequency:  { en: "Weekly", tk: "Sunthal" },
    difficulty: "Beginner",
    about: {
      en: "A warm circle for women covering Shabbat preparation, family purity, the Jewish calendar, and the practical Halacha that shapes daily Jewish life at home.",
      tk: "Nu-te tan kihilna a lungawi zual — Shabbat buatsaihna, chhungkua thianghlimna, Yudah kalendar leh in-a nitina Yudah nun a phuahtu halacha ngaihdan.",
    },
    skillIds:  ["torah-knowledge", "community-leadership"],
    pathLevel: 2,
    teacher:   "Rebbetzin Miriam Haokip",
    platform:  { en: "In-Person · Community Hall", tk: "Mahni Ngeiin · Mipil Hall" },
    language:  "Thadou-Kukish",
    resources: {
      books:  [{ title: "The Jewish Home — a practical Halacha guide" }],
      pdfs:   [{ title: "Shabbat Prep Checklist" }],
      audio:  [{ title: "Family purity — an introductory shiur" }],
      videos: [],
    },
  },
  "halacha-class": {
    category:   { en: "Practical Halacha", tk: "Halacha Ngaihdan" },
    frequency:  { en: "Weekly", tk: "Sunthal" },
    difficulty: "Intermediate",
    about: {
      en: "Real questions Bnei Menashe families face — kashrut in daily life, Shabbat observance, and the halachic side of the aliyah journey — answered with sources, not just conclusions.",
      tk: "Bnei Menashe chhungkua ni tin an tawh zawhna dik takte — kashrut nitin nun ah, Shabbat vengna, aliyah kawng zawh halacha lam — a bul hun apiangin sawi, thu tak chauh ni lovin.",
    },
    skillIds:  ["torah-knowledge", "community-leadership"],
    pathLevel: 2,
    teacher:   "Rabbi Dovid Thangboi",
    platform:  { en: "Virtual · Zoom", tk: "Virtual · Zoom" },
    language:  "English",
    resources: {
      books:  [{ title: "Kitzur Shulchan Aruch — abridged code of Jewish law" }],
      pdfs:   [{ title: "Kashrut Quick-Reference Sheet" }],
      audio:  [{ title: "Aliyah & Halacha — Q&A recording" }],
      videos: [{ title: "Shabbat observance — practical walkthrough" }],
    },
  },
  "youth-mishnah": {
    category:   { en: "Mishnah · Ages 10–18", tk: "Mishnah · 10–18 kumte tan" },
    frequency:  { en: "Weekly", tk: "Sunthal" },
    difficulty: "Beginner",
    about: {
      en: "Structured Mishnah study built for Bnei Menashe youth — short passages, guided discussion, and a foundation in Hebrew reading and Torah reasoning that grows with them.",
      tk: "Bnei Menashe sipai-te tana siam Mishnah kihilna — thu tawi te, kaihhruaina biakna, leh Hebrew sim leh Torah ngaihtuahna bul an neih theihna tur.",
    },
    skillIds:  ["hebrew-reading", "torah-knowledge", "jewish-history"],
    pathLevel: 2,
    teacher:   "Moreh Binyamin Kipgen",
    platform:  { en: "Multiple Locations", tk: "Hmun Tampi" },
    language:  "Thadou-Kukish / English",
    resources: {
      books:  [{ title: "Mishnah for Young Learners — illustrated edition" }],
      pdfs:   [{ title: "Weekly Mishnah Worksheet" }],
      audio:  [{ title: "Mishnah read-along recordings" }],
      videos: [{ title: "Mishnah Made Simple — video series" }],
    },
  },
  "hebrew": {
    category:   { en: "Hebrew · Beginner to Advanced", tk: "Hebrew · Birte pan kipakhat tan" },
    frequency:  { en: "Weekly", tk: "Sunthal" },
    difficulty: "Beginner",
    about: {
      en: "Modern and liturgical Hebrew, built from the alphabet up — the essential skill for aliyah, prayer, and independent Torah study. Beginner and intermediate tracks meet in parallel.",
      tk: "Hebrew tuna hman leh thupui Hebrew, alphabet aṭanga insang zel — aliyah, thupui leh Torah zirna mahni ngeiin theihna tan a ngaih ber. Birte leh kipak trak inkarah an zawm.",
    },
    skillIds:  ["hebrew-reading"],
    pathLevel: 0,
    teacher:   "Morah Sarah Guite",
    platform:  { en: "Virtual · Zoom + Local Groups", tk: "Virtual · Zoom + Mipil Kihilna" },
    language:  "English / Thadou-Kukish",
    resources: {
      books:  [{ title: "Aleph-Bet to Fluency — beginner Hebrew workbook" }],
      pdfs:   [{ title: "Hebrew Alphabet Practice Sheet" }],
      audio:  [{ title: "Hebrew pronunciation drills" }],
      videos: [{ title: "Reading Hebrew in 30 Days — video course" }],
    },
  },
};

// Basic group info passed via navigation params (kept in sync with
// learning-groups.tsx's LEARNING_GROUPS — duplicated intentionally so this
// screen has no dependency on that file's internal module shape).
interface GroupSummary {
  id: string;
  emoji: string;
  name: string;
  nameTK: string;
  description: string;
  descriptionTK: string;
  contact?: string;
  location: string;
  locationTK?: string;
  day?: string;
  time?: string;
}

const GROUP_SUMMARY: Record<string, GroupSummary> = {
  "daf-yomi": {
    id: "daf-yomi", emoji: "📖",
    name: "Daf Yomi Circle", nameTK: "Daf Yomi Kihilna",
    description: "Daily one-page Talmud study. All are welcome — from first-time learners to advanced scholars. Join the worldwide Jewish learning cycle.",
    descriptionTK: "Talmud kihilna zingkhan — thu dawt zawng zawng tan. Khawvel tangtvi Yudah kihilna cycle-ah join rawh.",
    contact: "dafyomi@bneimenashe.org",
    location: "Virtual · WhatsApp Group", locationTK: "Virtual · WhatsApp Group",
    time: "06:30",
  },
  "parasha": {
    id: "parasha", emoji: "📜",
    name: "Weekly Parasha Study", nameTK: "Parasha Kihilna",
    description: "Explore the weekly Torah portion with commentary from Rashi, Ramban, and contemporary Bnei Menashe teachers.",
    descriptionTK: "Sunthal Torah parasha Rashi, Ramban leh Bnei Menashe zuau-te in kikupna.",
    location: "Beit Knesset Bnei Menashe, Churachandpur", locationTK: "Beit Knesset Bnei Menashe, Churachandpur",
    day: "Shabbat", time: "09:30",
  },
  "womens-torah": {
    id: "womens-torah", emoji: "🌸",
    name: "Women's Torah Study", nameTK: "Nu-te Torah Kihilna",
    description: "A warm, supportive learning circle for women covering Shabbat, family purity, Jewish holidays, and practical Halacha.",
    descriptionTK: "Nu-te tan kihilna — Shabbat, nu-te thupha, lawmman, halacha ngaih.",
    location: "Community Hall, Churachandpur", locationTK: "Mipil Hall, Churachandpur",
    day: "Wednesday", time: "17:00",
  },
  "halacha-class": {
    id: "halacha-class", emoji: "🕍",
    name: "Halacha for Bnei Menashe", nameTK: "Bnei Menashe Halacha",
    description: "Weekly Halacha shiur addressing questions specific to Bnei Menashe families — kashrut, Shabbat observance, aliyah transitions, and more.",
    descriptionTK: "Bnei Menashe chhungkua halacha — kashrut, Shabbat, aliyah leh dangte.",
    contact: "halacha@bneimenashe.org",
    location: "Virtual · Zoom", locationTK: "Virtual · Zoom",
    day: "Thursday", time: "20:00",
  },
  "youth-mishnah": {
    id: "youth-mishnah", emoji: "⭐",
    name: "Youth Mishnah Program", nameTK: "Sipai-te Mishnah",
    description: "Structured Mishnah study for Bnei Menashe youth. Builds Hebrew reading, Talmudic reasoning, and a love for Torah learning.",
    descriptionTK: "Sipai-te Mishnah kihilna — Hebrew zawng, thupha ngaihdan leh Torah ngaina.",
    location: "Multiple Locations: Churachandpur, Imphal, Aizawl", locationTK: "Hmun tampi: Churachandpur, Imphal, Aizawl",
    day: "Sunday", time: "10:00",
  },
  "hebrew": {
    id: "hebrew", emoji: "🔤",
    name: "Hebrew Language Class", nameTK: "Hebrew Thu Kihilna",
    description: "Learn modern and liturgical Hebrew essential for aliyah, prayer, and Torah study. Beginner and intermediate tracks available.",
    descriptionTK: "Hebrew zir — aliyah, thupui leh Torah tan. Birte leh kipak trak um.",
    contact: "hebrew@bneimenashe.org",
    location: "Virtual · Zoom + Local Study Groups", locationTK: "Virtual · Zoom + Mipil Kihilna",
    day: "Tuesday", time: "18:30",
  },
};

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  Beginner:     "#4ade80",
  Intermediate: "#818cf8",
  Advanced:     "#fb923c",
};

// ── UI copy (bilingual, screen-local — mirrors the pattern already used by
//    learning-groups.tsx for per-item bilingual content) ─────────────────────

const UI = {
  back:        { en: "Back", tk: "Nghekir" },
  eyebrow:     { en: "LEARNING GROUP", tk: "KIHILNA" },
  about:       { en: "About This Learning", tk: "Hei Zirna Chungchang" },
  skills:      { en: "Skills You'll Gain", tk: "Thiamna I Neih Dawn" },
  skillsHint:  { en: "Tap a skill to see why it matters and what you'll be able to do.", tk: "Thiamna khat tep in a pawimawhna leh i thiam dawn tur en rawh." },
  path:        { en: "Learning Path", tk: "Zirna Kawng" },
  pathHint:    { en: "Where this group sits in the wider Bnei Menashe learning journey.", tk: "Hei kihilna hi Bnei Menashe zirna kawng zau zawk chhungah a awmna hmun." },
  schedule:    { en: "Schedule", tk: "Hun Ruahman" },
  meetingTime: { en: "Meeting Time", tk: "Inhmuh Hun" },
  platform:    { en: "Platform", tk: "Hmun/Platform" },
  language:    { en: "Language", tk: "Ṭawng" },
  teacher:     { en: "Teacher", tk: "Zirtirtu" },
  resources:   { en: "Resources", tk: "Ṭanna Thil" },
  books:       { en: "Books", tk: "Lehkhabu" },
  pdfs:        { en: "PDFs", tk: "PDF" },
  audio:       { en: "Audio", tk: "Audio" },
  videos:      { en: "Videos", tk: "Video" },
  comingSoon:  { en: "Curated list — coming soon", tk: "Ruahman lai — hun rei lo chhungin lo thleng dawn" },
  join:        { en: "Join Learning Group", tk: "Kihilna Zawm Rawh" },
  whyMatters:  { en: "Why It Matters", tk: "A Pawimawhna" },
  outcomes:    { en: "Learning Outcomes", tk: "Zirna Rah" },
  estTime:     { en: "Estimated Time", tk: "Hun Awm Dawn" },
  difficulty:  { en: "Difficulty", tk: "A Harsatna" },
  close:       { en: "Close", tk: "Khar" },
  joinAlertTitle: { en: "How to Join", tk: "Zawm Dan" },
  notFound:    { en: "Learning group not found.", tk: "Kihilna hi hmu lo." },
};

const DIFFICULTY_LABEL: Record<Difficulty, Bi> = {
  Beginner:     { en: "Beginner",     tk: "Bul" },
  Intermediate: { en: "Intermediate", tk: "Kipak" },
  Advanced:     { en: "Advanced",     tk: "Sang" },
};

// ── Skill sheet ───────────────────────────────────────────────────────────────

const SkillDetailSheet = memo(function SkillDetailSheet({
  skill, lang, visible, onClose,
}: {
  skill: SkillDef | null;
  lang: string;
  visible: boolean;
  onClose: () => void;
}) {
  const { colors, type, sp, rd } = useThemeTokens();
  const reduceMotion = useReducedMotion();
  if (!skill) return null;
  const accent = DIFFICULTY_COLOR[skill.difficulty];

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduceMotion ? "none" : "slide"}
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: colors.backgroundOverlay }}
        onPress={onClose}
        accessibilityLabel={UI.close[lang === "tk" ? "tk" : "en"]}
      >
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: colors.surfacePrimary, borderColor: colors.borderDefault, borderRadius: rd.xl },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeaderRow}>
            <View style={[styles.sheetIconBox, { backgroundColor: accent + "1A" }]}>
              <Feather name={skill.icon} size={22} color={accent} />
            </View>
            <Text style={[type.title, { color: colors.textHigh, flex: 1 }]}>
              {skill.title[lang === "tk" ? "tk" : "en"]}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={UI.close[lang === "tk" ? "tk" : "en"]}
            >
              <Feather name="x" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
            <Text style={[type.label, { color: accent, marginTop: sp[3] }]}>{UI.whyMatters[lang === "tk" ? "tk" : "en"]}</Text>
            <Text style={[type.body, { color: colors.textPrimary, marginTop: sp[1] }]}>
              {skill.why[lang === "tk" ? "tk" : "en"]}
            </Text>

            <Text style={[type.label, { color: accent, marginTop: sp[4] }]}>{UI.outcomes[lang === "tk" ? "tk" : "en"]}</Text>
            <Text style={[type.body, { color: colors.textPrimary, marginTop: sp[1] }]}>
              {skill.outcomes[lang === "tk" ? "tk" : "en"]}
            </Text>

            <View style={[styles.sheetStatsRow, { borderTopColor: colors.borderSoft }]}>
              <View style={styles.sheetStat}>
                <Feather name="clock" size={13} color={colors.textMuted} />
                <Text style={[type.caption, { color: colors.textMuted }]}>{UI.estTime[lang === "tk" ? "tk" : "en"]}</Text>
                <Text style={[type.bodySm, { color: colors.textSecondary }]}>{skill.estMinutes}</Text>
              </View>
              <View style={styles.sheetStat}>
                <Feather name="bar-chart-2" size={13} color={colors.textMuted} />
                <Text style={[type.caption, { color: colors.textMuted }]}>{UI.difficulty[lang === "tk" ? "tk" : "en"]}</Text>
                <Text style={[type.bodySm, { color: accent, fontWeight: "700" }]}>{DIFFICULTY_LABEL[skill.difficulty][lang === "tk" ? "tk" : "en"]}</Text>
              </View>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function LearningDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, type, sp, rd, shadow } = useThemeTokens();
  const { lang } = useLanguage();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === "web" ? 60 : 20);
  const L = lang === "tk" ? "tk" : "en";

  const [activeSkillId, setActiveSkillId] = useState<string | null>(null);

  const groupId = typeof id === "string" ? id : "";
  const group = GROUP_SUMMARY[groupId];
  const detail = DETAIL[groupId];

  if (!group || !detail) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Feather name="alert-circle" size={28} color={colors.textMuted} />
        <Text style={[type.body, { color: colors.textSecondary, marginTop: sp[2] }]}>
          {UI.notFound[L]}
        </Text>
        <MenasheButton
          variant="outline"
          label={UI.back[L]}
          icon="arrow-left"
          onPress={() => router.back()}
          style={{ marginTop: sp[4] }}
        />
      </View>
    );
  }

  const name = lang === "tk" ? group.nameTK : group.name;
  const desc = lang === "tk" ? group.descriptionTK : group.description;
  const loc  = lang === "tk" && group.locationTK ? group.locationTK : group.location;
  const accent = DIFFICULTY_COLOR[detail.difficulty];
  const activeSkill = activeSkillId ? SKILL_MAP[activeSkillId] : null;

  function openSkill(skillId: string) {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveSkillId(skillId);
  }

  function handleJoin() {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (group.contact) {
      Linking.openURL(`mailto:${group.contact}?subject=${encodeURIComponent(`Join ${group.name}`)}`);
      return;
    }
    Alert.alert(
      UI.joinAlertTitle[L],
      L === "tk"
        ? `${loc} ah lo kal rawh, ${[group.day, group.time].filter(Boolean).join(" ")} hunah.`
        : `Simply show up — ${loc}${group.day || group.time ? `, ${[group.day, group.time].filter(Boolean).join(" ")}` : ""}.`,
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + sp[2] }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={UI.back[L]}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={22} color={colors.textHigh} />
        </TouchableOpacity>
        <Text style={[type.overline, { color: colors.primary, letterSpacing: 1.2 }]}>{UI.eyebrow[L]}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: sp[4], paddingBottom: insets.bottom + 32 }}
      >
        {/* ── 1. Hero ─────────────────────────────────────────────────── */}
        <View style={[styles.hero, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderDefault, ...shadow.level2 }]}>
          <Text style={{ fontSize: 40 }}>{group.emoji}</Text>
          <Text style={[type.heading, { color: colors.textHigh, marginTop: sp[3], textAlign: "center" }]}>{name}</Text>

          <View style={styles.heroChips}>
            <View style={[styles.chip, { backgroundColor: colors.surfaceInteractive, borderColor: colors.borderSoft }]}>
              <Feather name="bookmark" size={11} color={colors.primary} />
              <Text style={[type.caption, { color: colors.textSecondary }]}>{detail.category[L]}</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: colors.surfaceInteractive, borderColor: colors.borderSoft }]}>
              <Feather name="repeat" size={11} color={colors.primary} />
              <Text style={[type.caption, { color: colors.textSecondary }]}>{detail.frequency[L]}</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: accent + "1A", borderColor: accent + "44" }]}>
              <Feather name="bar-chart-2" size={11} color={accent} />
              <Text style={[type.caption, { color: accent, fontWeight: "700" }]}>{DIFFICULTY_LABEL[detail.difficulty][L]}</Text>
            </View>
          </View>
        </View>

        {/* ── 2. About ────────────────────────────────────────────────── */}
        <Section title={UI.about[L]} colors={colors} type={type} sp={sp}>
          <Text style={[type.body, { color: colors.textPrimary, lineHeight: 22 }]}>{detail.about[L]}</Text>
          <Text style={[type.bodySm, { color: colors.textSecondary, marginTop: sp[2], lineHeight: 20 }]}>{desc}</Text>
        </Section>

        {/* ── 3. Skills You'll Gain ──────────────────────────────────── */}
        <Section title={UI.skills[L]} colors={colors} type={type} sp={sp}>
          <Text style={[type.bodySm, { color: colors.textSecondary, marginBottom: sp[3] }]}>{UI.skillsHint[L]}</Text>
          <View style={{ gap: sp[2] }}>
            {detail.skillIds.map((sid) => {
              const skill = SKILL_MAP[sid];
              if (!skill) return null;
              const sAccent = DIFFICULTY_COLOR[skill.difficulty];
              return (
                <TouchableOpacity
                  key={sid}
                  onPress={() => openSkill(sid)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`${skill.title[L]}. ${UI.whyMatters[L]}`}
                  style={[styles.skillCard, { backgroundColor: colors.surfacePrimary, borderColor: colors.borderSoft }]}
                >
                  <View style={[styles.skillIconBox, { backgroundColor: sAccent + "1A" }]}>
                    <Feather name={skill.icon} size={18} color={sAccent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Feather name="check-circle" size={13} color={sAccent} />
                      <Text style={[type.label, { color: colors.textHigh }]}>{skill.title[L]}</Text>
                    </View>
                    <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}>{skill.estMinutes}</Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        {/* ── 4. Learning Path ───────────────────────────────────────── */}
        <Section title={UI.path[L]} colors={colors} type={type} sp={sp}>
          <Text style={[type.bodySm, { color: colors.textSecondary, marginBottom: sp[3] }]}>{UI.pathHint[L]}</Text>
          <View>
            {PATH_STEPS.map((step, i) => {
              const isCurrent = i === detail.pathLevel;
              const isPast = i < detail.pathLevel;
              const dotColor = isCurrent ? colors.primary : isPast ? colors.textSecondary : colors.borderDefault;
              return (
                <View key={step.en} style={styles.pathRow}>
                  <View style={styles.pathDotCol}>
                    <View style={[
                      styles.pathDot,
                      { backgroundColor: isCurrent ? colors.primary : "transparent",
                        borderColor: dotColor, borderWidth: isCurrent ? 0 : 2 },
                    ]}>
                      {isCurrent && <Feather name="star" size={11} color={colors.primaryForeground} />}
                    </View>
                    {i < PATH_STEPS.length - 1 && (
                      <View style={[styles.pathLine, { backgroundColor: isPast ? colors.textSecondary : colors.borderSoft }]} />
                    )}
                  </View>
                  <Text style={[
                    type.body,
                    { color: isCurrent ? colors.textHigh : colors.textMuted, fontWeight: isCurrent ? "700" : "400", paddingBottom: sp[4] },
                  ]}>
                    {step[L]}{isCurrent ? `  ·  ${detail.frequency[L] === detail.frequency.en ? "" : ""}` : ""}
                  </Text>
                </View>
              );
            })}
          </View>
        </Section>

        {/* ── 5. Schedule ─────────────────────────────────────────────── */}
        <Section title={UI.schedule[L]} colors={colors} type={type} sp={sp}>
          <View style={{ gap: sp[3] }}>
            <ScheduleRow icon="clock"    label={UI.meetingTime[L]} value={[group.day, group.time].filter(Boolean).join(" · ") || "—"} colors={colors} type={type} sp={sp} />
            <ScheduleRow icon="map-pin"  label={UI.platform[L]}    value={detail.platform[L]} colors={colors} type={type} sp={sp} />
            <ScheduleRow icon="globe"    label={UI.language[L]}    value={detail.language} colors={colors} type={type} sp={sp} />
            <ScheduleRow icon="user"     label={UI.teacher[L]}     value={detail.teacher} colors={colors} type={type} sp={sp} />
          </View>
        </Section>

        {/* ── 6. Resources ────────────────────────────────────────────── */}
        <Section title={UI.resources[L]} colors={colors} type={type} sp={sp}>
          <ResourceGroup icon="book"      label={UI.books[L]}  items={detail.resources.books}  colors={colors} type={type} sp={sp} L={L} />
          <ResourceGroup icon="file-text" label={UI.pdfs[L]}   items={detail.resources.pdfs}   colors={colors} type={type} sp={sp} L={L} />
          <ResourceGroup icon="headphones" label={UI.audio[L]} items={detail.resources.audio}  colors={colors} type={type} sp={sp} L={L} />
          <ResourceGroup icon="video"     label={UI.videos[L]} items={detail.resources.videos} colors={colors} type={type} sp={sp} L={L} last />
        </Section>

        {/* ── 7. Join CTA ─────────────────────────────────────────────── */}
        <MenasheButton
          variant="primary"
          size="lg"
          label={UI.join[L]}
          icon="arrow-right"
          iconPosition="right"
          fullWidth
          onPress={handleJoin}
          style={{ marginTop: sp[5] }}
        />
      </ScrollView>

      <SkillDetailSheet
        skill={activeSkill}
        lang={lang}
        visible={!!activeSkillId}
        onClose={() => setActiveSkillId(null)}
      />
    </View>
  );
}

// ── Shared sub-components ───────────────────────────────────────────────────

function Section({
  title, children, colors, type, sp,
}: { title: string; children: React.ReactNode; colors: any; type: any; sp: any }) {
  return (
    <View style={{ marginTop: sp[5] }}>
      <Text style={[type.title, { color: colors.textHigh, marginBottom: sp[3] }]}>{title}</Text>
      {children}
    </View>
  );
}

function ScheduleRow({
  icon, label, value, colors, type, sp,
}: { icon: FeatherName; label: string; value: string; colors: any; type: any; sp: any }) {
  return (
    <View style={[styles.scheduleRow, { backgroundColor: colors.surfaceSecondary, borderColor: colors.borderSoft }]}>
      <View style={[styles.scheduleIconBox, { backgroundColor: colors.surfaceInteractive }]}>
        <Feather name={icon} size={15} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[type.caption, { color: colors.textMuted }]}>{label}</Text>
        <Text style={[type.body, { color: colors.textHigh, marginTop: 1 }]}>{value}</Text>
      </View>
    </View>
  );
}

function ResourceGroup({
  icon, label, items, colors, type, sp, L, last,
}: {
  icon: FeatherName; label: string; items: Resource[];
  colors: any; type: any; sp: any; L: "en" | "tk"; last?: boolean;
}) {
  return (
    <View style={{ marginBottom: last ? 0 : sp[3] }}>
      <View style={styles.resourceHeaderRow}>
        <Feather name={icon} size={13} color={colors.primary} />
        <Text style={[type.label, { color: colors.textSecondary }]}>{label}</Text>
      </View>
      {items.length === 0 ? (
        <Text style={[type.caption, { color: colors.textMuted, marginLeft: sp[5] }]}>
          {UI.comingSoon[L]}
        </Text>
      ) : (
        items.map((item) => (
          <View key={item.title} style={[styles.resourceItem, { borderColor: colors.borderSoft }]}>
            <Text style={[type.bodySm, { color: colors.textPrimary }]}>{item.title}</Text>
            {!!item.note && <Text style={[type.caption, { color: colors.textMuted }]}>{item.note[L]}</Text>}
          </View>
        ))
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },

  hero: {
    borderRadius: 20,
    borderWidth: 1,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  heroChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14, justifyContent: "center" },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
  },

  skillCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1, borderRadius: 14, padding: 12,
  },
  skillIconBox: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },

  pathRow: { flexDirection: "row", gap: 12 },
  pathDotCol: { alignItems: "center", width: 22 },
  pathDot: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
  },
  pathLine: { width: 2, flex: 1, minHeight: 24 },

  scheduleRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1, borderRadius: 14, padding: 12,
  },
  scheduleIconBox: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },

  resourceHeaderRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  resourceItem: {
    marginLeft: 19, paddingLeft: 10, borderLeftWidth: 2,
    paddingVertical: 4,
  },

  sheet: {
    marginTop: "auto",
    borderWidth: 1,
    padding: 20,
    paddingBottom: 32,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: "rgba(148,163,184,0.4)",
    alignSelf: "center", marginBottom: 12,
  },
  sheetHeaderRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  sheetIconBox: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  sheetStatsRow: {
    flexDirection: "row", gap: 24, marginTop: 20, paddingTop: 16, borderTopWidth: 1,
  },
  sheetStat: { gap: 2 },
});
