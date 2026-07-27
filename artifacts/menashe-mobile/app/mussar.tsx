import React, { useState, useEffect, useMemo } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Platform, Modal,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useThemeTokens } from "@/src/mobile/design-system";

import { storageGet, storageSet } from "@/lib/storageUtils";

const NOTES_KEY = "menashe-mussar-notes-v1";
const PRACTICED_KEY = "menashe-mussar-practiced-v1";

const CAT_COLOR: Record<string, string> = {
  Torah:         "#d4a843",
  Wisdom:        "#a78bfa",
  Character:     "#4ade80",
  Spirit:        "#6382FF",
  Relationships: "#f472b6",
  Balance:       "#fb923c",
  Speech:        "#34d399",
};

const KINYANIM = [
  { he: "לִמּוּד",             en: "Study",               category: "Torah",
    description: "Acquiring Torah through dedicated, consistent learning. Every moment of study adds to the treasury of wisdom.",
    prompt: "What Torah subject will I dedicate extra focus to today?" },
  { he: "שְׁמִיעַת הָאֹזֶן",  en: "Attentive Listening",  category: "Wisdom",
    description: "Hearing with full presence — absorbing another's words completely before forming a response.",
    prompt: "When did I last truly listen without planning my reply?" },
  { he: "עֲרִיכַת שְׂפָתַיִם", en: "Verbal Repetition",    category: "Torah",
    description: "Reviewing learned material aloud to embed it in memory.",
    prompt: "What teaching from the past week can I repeat aloud today?" },
  { he: "בִּינַת הַלֵּב",      en: "Heart Understanding",  category: "Wisdom",
    description: "Not just intellectual knowledge, but wisdom that settles into the heart.",
    prompt: "Is there a teaching I know mentally but haven't felt in my heart?" },
  { he: "אֵימַת חֲכָמִים",     en: "Awe of Sages",         category: "Character",
    description: "Reverence for those who carry Torah wisdom, approaching them with humility.",
    prompt: "Whose Torah wisdom do I undervalue?" },
  { he: "יִרְאַת שָׁמַיִם",    en: "Awe of Heaven",        category: "Spirit",
    description: "Living with awareness that every action is seen — a constant sense of divine presence.",
    prompt: "In what area do I act differently when I think no one is watching?" },
  { he: "עֲנָוָה",             en: "Humility",             category: "Character",
    description: "True humility is accurate self-knowledge — neither inflated nor diminished.",
    prompt: "Where has pride blocked me from learning or connecting?" },
  { he: "שִׂמְחָה",            en: "Joy",                  category: "Spirit",
    description: "Serving God with gladness. Joy is a chosen orientation toward gratitude.",
    prompt: "What am I genuinely grateful for today?" },
  { he: "שִׁמּוּשׁ חֲכָמִים",  en: "Serving Sages",         category: "Relationships",
    description: "Learning not only from a teacher's formal lessons but from how they live.",
    prompt: "Who is a person of wisdom in my life? What can I observe?" },
  { he: "דִּקְדּוּק חֲבֵרִים", en: "Careful Friendship",   category: "Relationships",
    description: "Choosing friends who elevate you and being precise about those relationships.",
    prompt: "Do my closest friendships draw me toward growth or away?" },
  { he: "פִּלְפּוּל הַתַּלְמִידִים", en: "Sharp Dialogue",  category: "Torah",
    description: "Engaging in lively Torah discussion that sharpens understanding for both sides.",
    prompt: "Who can I learn with today through debate and question?" },
  { he: "יִשּׁוּב",             en: "Settledness",          category: "Character",
    description: "A calm, unhurried quality of mind — present and deliberate rather than reactive.",
    prompt: "When do I feel most scattered? What one practice brings settledness?" },
  { he: "מִקְרָא",             en: "Scripture",            category: "Torah",
    description: "Engaging with the written Torah — the source of all Jewish wisdom.",
    prompt: "Which book of the Torah am I least familiar with?" },
  { he: "מִשְׁנָה",            en: "Mishnah",              category: "Torah",
    description: "Learning the Oral Torah in its concise, structured form.",
    prompt: "What tractate of Mishnah speaks to an issue in my current life?" },
  { he: "מִיעוּט סְחוֹרָה",    en: "Less Commerce",        category: "Balance",
    description: "Limiting business so it does not consume time meant for Torah and spirit.",
    prompt: "Is my work life in proportion to my spiritual life?" },
  { he: "מִיעוּט דֶּרֶךְ אֶרֶץ", en: "Less Worldliness",  category: "Balance",
    description: "Reducing immersion in mundane pleasures so the extraordinary can be felt.",
    prompt: "What worldly habit takes most of my attention? What would I gain by reducing it?" },
  { he: "מִיעוּט שֵׁנָה",      en: "Less Sleep",           category: "Balance",
    description: "Using time wisely — not sleeping beyond what is needed, awakening with purpose.",
    prompt: "How do I begin my mornings? Can I reclaim the first moments?" },
  { he: "מִיעוּט שִׂיחָה",     en: "Less Idle Talk",       category: "Speech",
    description: "Guarding against purposeless conversation that dissipates energy.",
    prompt: "How much of my daily speech has real purpose?" },
  { he: "מִיעוּט שְׂחוֹק",     en: "Less Levity",          category: "Speech",
    description: "Ensuring humor and lightness serve connection, not avoidance.",
    prompt: "Do I use humor to deflect from seriousness or discomfort?" },
  { he: "אֶרֶךְ אַפַּיִם",     en: "Patience",             category: "Character",
    description: "The quality of being slow to anger — giving space for others to unfold.",
    prompt: "Who or what most tests my patience today?" },
  { he: "לֵב טוֹב",           en: "Good Heart",           category: "Character",
    description: "Generosity of spirit — a heart that wishes well and acts from warmth.",
    prompt: "What would I do differently if I led with genuine goodwill?" },
  { he: "אֱמוּנַת חֲכָמִים",   en: "Trust in Sages",       category: "Spirit",
    description: "Faith in the wisdom of the Torah tradition, even when personal reasoning disagrees.",
    prompt: "Is there a teaching I've been resisting? Can I sit with it openly?" },
  { he: "קַבָּלַת הַיִּסּוּרִין", en: "Accepting Hardship", category: "Spirit",
    description: "Willingness to receive difficulty as a refining process, not a punishment.",
    prompt: "What current difficulty can I reframe as something shaping me?" },
  { he: "מַכִּיר אֶת מְקוֹמוֹ", en: "Knowing One's Place", category: "Character",
    description: "Understanding one's role — neither overreaching nor undervaluing oneself.",
    prompt: "Where am I trying to be something I'm not, or underplaying what I am?" },
  { he: "שָׂמֵחַ בְּחֶלְקוֹ",  en: "Contentment",          category: "Character",
    description: "Finding satisfaction in one's lot — not complacency but genuine appreciation.",
    prompt: "What do I already have that I haven't fully appreciated?" },
  { he: "עוֹשֶׂה סְיָג לִדְבָרָיו", en: "Making Boundaries", category: "Speech",
    description: "Setting protective fences around speech and behavior.",
    prompt: "What boundary would protect my Torah values in this situation?" },
  { he: "אֵינוֹ מַחֲזִיק טוֹבָה לְעַצְמוֹ", en: "Not Taking Credit", category: "Character",
    description: "Recognizing that our gifts are from God and returning credit to its source.",
    prompt: "Where am I taking credit for something that truly came from elsewhere?" },
  { he: "אָהוּב",             en: "Beloved",              category: "Relationships",
    description: "Being someone others love — through genuine care, reliability, and warmth.",
    prompt: "How can I be more genuinely loveable to those around me?" },
  { he: "אוֹהֵב אֶת הַמָּקוֹם", en: "Loving God",          category: "Spirit",
    description: "Cultivating authentic love for the Divine — not just duty but delight.",
    prompt: "When did I last feel genuine delight in my relationship with Hashem?" },
  { he: "אוֹהֵב אֶת הַבְּרִיּוֹת", en: "Loving People",    category: "Relationships",
    description: "Extending genuine love even to strangers — seeing the divine image in each person.",
    prompt: "Who in my life do I find it hardest to love? What's one step toward that?" },
  { he: "אוֹהֵב אֶת הַצְּדָקוֹת", en: "Loving Righteousness", category: "Spirit",
    description: "Genuinely loving what is right, just, and true — not performing virtue.",
    prompt: "Where am I performing righteousness rather than genuinely loving it?" },
  { he: "אוֹהֵב אֶת הַמֵּישָׁרִים", en: "Loving Uprightness", category: "Character",
    description: "Cherishing honesty and integrity as values, not just obligations.",
    prompt: "Is there a place in my life where I'm not fully honest with myself?" },
  { he: "מְרַחֵק מִן הַכָּבוֹד", en: "Avoiding Honor",     category: "Character",
    description: "Not pursuing recognition or status — acting from intrinsic motivation.",
    prompt: "When did I last do something good with no thought of being seen?" },
  { he: "לֹא מֵגִיס לִבּוֹ בְּלִמּוּדוֹ", en: "Not Arrogant in Learning", category: "Torah",
    description: "Remaining humble even as one's Torah knowledge grows.",
    prompt: "Has my learning ever made me feel superior to others?" },
  { he: "אֵינוֹ שָׂמֵחַ בְּהוֹרָאָה", en: "Not Delighting in Rulings", category: "Torah",
    description: "Approaching halachic decisions with gravity, not self-aggrandizement.",
    prompt: "Do I ever enjoy being right more than reaching the truth?" },
  { he: "נוֹשֵׂא בְעֹל עִם חֲבֵרוֹ", en: "Sharing the Burden", category: "Relationships",
    description: "Taking on another's suffering as if it were your own.",
    prompt: "Who in my community is carrying a heavy burden I could lighten?" },
  { he: "מַכְרִיעוֹ לְכַף זְכוּת", en: "Judging Favorably", category: "Character",
    description: "Assuming the best about others' intentions.",
    prompt: "Who have I recently judged harshly? What favorable interpretation might be true?" },
  { he: "מַעֲמִידוֹ עַל הָאֱמֶת", en: "Standing for Truth",  category: "Spirit",
    description: "Gently guiding others toward truth rather than flattering them.",
    prompt: "Is there someone I need to be more honest with — lovingly?" },
  { he: "מַעֲמִידוֹ עַל הַשָּׁלוֹם", en: "Establishing Peace", category: "Relationships",
    description: "Actively working to create harmony between people.",
    prompt: "Is there a conflict in my life or community I could help resolve?" },
  { he: "מִתְיַשֵּׁב לִבּוֹ בְּתַלְמוּדוֹ", en: "Settling Mind in Learning", category: "Torah",
    description: "Bringing full concentration and stillness to Torah study.",
    prompt: "What distracts me most when I try to learn? What would full presence feel like?" },
  { he: "שׁוֹאֵל וּמֵשִׁיב",   en: "Asking and Answering",  category: "Torah",
    description: "Engaging actively — both asking good questions and offering thoughtful answers.",
    prompt: "What question have I been sitting with that I should bring to a teacher?" },
  { he: "שׁוֹמֵעַ וּמוֹסִיף",  en: "Listening and Adding",  category: "Wisdom",
    description: "Adding insights to what one hears rather than just receiving passively.",
    prompt: "When I listen to a Torah teaching, do I engage or just receive?" },
  { he: "לָמֵד עַל מְנַת לְלַמֵּד", en: "Learning to Teach", category: "Torah",
    description: "Studying with the intention of transmitting to others.",
    prompt: "What have I learned recently that I could teach someone this week?" },
  { he: "לָמֵד עַל מְנַת לַעֲשׂוֹת", en: "Learning to Practice", category: "Torah",
    description: "Ensuring that learning translates into action and character change.",
    prompt: "What am I learning but not yet practicing?" },
  { he: "מַחְכִּים אֶת רַבּוֹ",  en: "Sharpening One's Teacher", category: "Relationships",
    description: "Through good questions and engagement, helping one's teacher grow.",
    prompt: "What question could I bring to my teacher that would challenge both of us?" },
  { he: "מְדַיֵּק בְּשֵׁמוּעָה",  en: "Precise Transmission", category: "Torah",
    description: "Reporting teachings accurately — exactly as received, in the name of the one who said it.",
    prompt: "Do I quote teachings accurately, or embellish to make them more impressive?" },
  { he: "אוֹמֵר דָּבָר בְּשֵׁם אוֹמְרוֹ", en: "Citing Sources", category: "Torah",
    description: "Always attributing what you've learned to its source — honoring the chain of tradition.",
    prompt: "When sharing wisdom, do I attribute it to those I learned it from?" },
];

function getDailyIndex(): number {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return dayOfYear % KINYANIM.length;
}

export default function MussarScreen() {
  const { colors } = useThemeTokens();
  const insets = useSafeAreaInsets();
  const topPad = insets.top > 0 ? insets.top : (Platform.OS === "web" ? 60 : 20);

  const [notes, setNotes] = useState<Record<number, string>>({});
  const [practiced, setPracticed] = useState<Set<number>>(new Set());
  const [activeIdx, setActiveIdx] = useState(getDailyIndex());
  const [showAll, setShowAll] = useState(false);
  const [editNoteIdx, setEditNoteIdx] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    Promise.all([
      storageGet<Record<number, string>>(NOTES_KEY, {}),
      storageGet<number[]>(PRACTICED_KEY, []),
    ]).then(([n, p]) => {
      setNotes(n);
      setPracticed(new Set(p));
    });
  }, []);

  const daily = KINYANIM[getDailyIndex()];
  const active = KINYANIM[activeIdx];
  const color = CAT_COLOR[active.category] ?? colors.primary;

  async function togglePracticed(idx: number) {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = new Set(practiced);
    if (next.has(idx)) next.delete(idx); else next.add(idx);
    setPracticed(next);
    await storageSet(PRACTICED_KEY, [...next]);
  }

  async function saveNote() {
    if (editNoteIdx === null) return;
    const next = { ...notes, [editNoteIdx]: noteText };
    setNotes(next);
    await storageSet(NOTES_KEY, next);
    setEditNoteIdx(null);
    setNoteText("");
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad + 12 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="chevron-left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.foreground }]}>48 Ways of Torah</Text>
            <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 2 }}>
              {practiced.size}/48 practiced · Pirkei Avot 6:6
            </Text>
          </View>
        </View>

        {/* Today's Way */}
        <View style={[styles.dailyCard, { backgroundColor: color + "12", borderColor: color + "40" }]}>
          <View style={styles.dailyHeader}>
            <View style={[styles.dayBadge, { backgroundColor: color + "20", borderColor: color + "44" }]}>
              <Text style={[{ fontSize: 10, fontWeight: "800", color }]}>TODAY</Text>
            </View>
            <Text style={[styles.dailyCat, { color }]}>{daily.category}</Text>
          </View>
          <Text style={[styles.dailyHebrew, { color }]}>{daily.he}</Text>
          <Text style={[styles.dailyEnglish, { color: colors.foreground }]}>{daily.en}</Text>
          <Text style={[styles.dailyDesc, { color: colors.mutedForeground }]}>{daily.description}</Text>
          <View style={[styles.promptBox, { backgroundColor: color + "08", borderColor: color + "30" }]}>
            <Text style={[styles.promptText, { color: colors.foreground }]}>💭 {daily.prompt}</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Overall Progress</Text>
            <Text style={[styles.sectionLabel, { color: colors.primary }]}>{practiced.size}/48</Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.background }]}>
            <View style={[styles.progressFill, { width: `${(practiced.size / 48) * 100}%`, backgroundColor: colors.primary }]} />
          </View>
        </View>

        {/* Toggle list */}
        <TouchableOpacity
          style={[styles.toggleBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={() => setShowAll(v => !v)}
        >
          <Text style={[{ fontSize: 14, fontWeight: "600", color: colors.foreground }]}>
            {showAll ? "Hide" : "View"} All 48 Ways
          </Text>
          <Feather name={showAll ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
        </TouchableOpacity>

        {showAll && KINYANIM.map((k, i) => {
          const c = CAT_COLOR[k.category] ?? colors.primary;
          const isPracticed = practiced.has(i);
          const isActive = i === activeIdx;
          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.kinyanRow,
                {
                  backgroundColor: isActive ? c + "10" : colors.card,
                  borderColor: isActive ? c + "44" : colors.border,
                },
              ]}
              onPress={() => setActiveIdx(i)}
              activeOpacity={0.75}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.kinyanNum, { color: colors.mutedForeground }]}>{i + 1}</Text>
                <Text style={[styles.kinyanEn, { color: isActive ? c : colors.foreground }]}>{k.en}</Text>
                <Text style={[styles.kinyanHe, { color: colors.mutedForeground }]}>{k.he}</Text>
                {notes[i] ? (
                  <Text style={[styles.kinyanNote, { color: colors.mutedForeground }]} numberOfLines={1}>📝 {notes[i]}</Text>
                ) : null}
              </View>
              <View style={styles.kinyanActions}>
                <TouchableOpacity
                  onPress={() => { setEditNoteIdx(i); setNoteText(notes[i] ?? ""); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="edit-2" size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => togglePracticed(i)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather
                    name={isPracticed ? "check-circle" : "circle"}
                    size={20}
                    color={isPracticed ? c : colors.border}
                  />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* ── Continue: return to study hub ─────────────────────────────── */}
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/torah" as any)}
          activeOpacity={0.7}
          style={{
            flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
            marginHorizontal: 16, marginTop: 8, marginBottom: insets.bottom + 24,
            borderRadius: 14, borderWidth: 1, borderColor: colors.border,
            paddingVertical: 14, backgroundColor: colors.card,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.mutedForeground }}>Study Hub</Text>
          <Feather name="arrow-right" size={15} color={colors.mutedForeground} />
        </TouchableOpacity>
      </ScrollView>

      {/* Note Modal */}
      <Modal visible={editNoteIdx !== null} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.background, padding: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20, paddingTop: insets.top }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground }}>
              {editNoteIdx !== null ? KINYANIM[editNoteIdx]?.en : ""}
            </Text>
            <TouchableOpacity onPress={() => setEditNoteIdx(null)}>
              <Feather name="x" size={24} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginBottom: 8 }]}>YOUR REFLECTION</Text>
          <TextInput
            style={[styles.noteInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Write your reflection, commitment, or insight…"
            placeholderTextColor={colors.mutedForeground}
            value={noteText}
            onChangeText={setNoteText}
            multiline
            numberOfLines={6}
            autoFocus
          />
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary, marginTop: 16 }]}
            onPress={saveNote}
          >
            <Text style={[{ fontSize: 16, fontWeight: "700", color: colors.primaryForeground }]}>Save Reflection</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 16, gap: 12 },
  backBtn: { padding: 4 },
  title: { fontSize: 24, fontWeight: "700", letterSpacing: -0.5 },
  dailyCard: { marginHorizontal: 16, marginBottom: 16, borderRadius: 16, borderWidth: 1, padding: 20 },
  dailyHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  dayBadge: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  dailyCat: { fontSize: 12, fontWeight: "600" },
  dailyHebrew: { fontSize: 22, fontWeight: "700", marginBottom: 4, letterSpacing: 1 },
  dailyEnglish: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  dailyDesc: { fontSize: 13, lineHeight: 20, marginBottom: 14 },
  promptBox: { borderRadius: 10, borderWidth: 1, padding: 12 },
  promptText: { fontSize: 13, lineHeight: 19 },
  section: { marginHorizontal: 16, marginBottom: 12, borderRadius: 14, borderWidth: 1, padding: 16 },
  sectionLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  toggleBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 16, marginBottom: 12, borderRadius: 12, borderWidth: 1, padding: 14 },
  kinyanRow: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginBottom: 6, borderRadius: 12, borderWidth: 1, padding: 14, gap: 12 },
  kinyanNum: { fontSize: 10, fontWeight: "700", marginBottom: 2 },
  kinyanEn: { fontSize: 14, fontWeight: "700" },
  kinyanHe: { fontSize: 12, marginTop: 2 },
  kinyanNote: { fontSize: 11, marginTop: 4 },
  kinyanActions: { flexDirection: "row", alignItems: "center", gap: 14 },
  noteInput: { borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 14, minHeight: 140, textAlignVertical: "top" as const },
  saveBtn: { borderRadius: 12, paddingVertical: 14, alignItems: "center" },
});
