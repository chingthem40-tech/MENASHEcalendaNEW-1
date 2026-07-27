import { useState, useMemo } from "react";

/* ─── 48 Kinyanim of Torah (Pirkei Avot 6:6) ─── */
const KINYANIM: {
  he: string; en: string; category: string;
  description: string; prompt: string;
}[] = [
  { he: "לִמּוּד", en: "Study", category: "Torah",
    description: "Acquiring Torah through dedicated, consistent learning. Every moment of study adds to the treasury of wisdom and shapes the soul.",
    prompt: "What Torah subject will I dedicate extra focus to today, and how will I make that time undistracted?" },
  { he: "שְׁמִיעַת הָאֹזֶן", en: "Attentive Listening", category: "Wisdom",
    description: "Hearing with full presence — absorbing another's words completely before forming a response.",
    prompt: "When did I last truly listen without planning my reply? Who needs me to listen to them today?" },
  { he: "עֲרִיכַת שְׂפָתַיִם", en: "Verbal Repetition", category: "Torah",
    description: "Reviewing learned material aloud to embed it in memory and give it life through speech.",
    prompt: "What teaching from the past week can I repeat aloud today to make it truly mine?" },
  { he: "בִּינַת הַלֵּב", en: "Heart Understanding", category: "Wisdom",
    description: "Not just intellectual knowledge, but wisdom that settles into the heart and guides real behavior.",
    prompt: "Is there a teaching I know mentally but haven't yet felt in my heart? What would it look like to live it?" },
  { he: "אֵימַת חֲכָמִים", en: "Awe of Sages", category: "Character",
    description: "Reverence for those who carry Torah wisdom — approaching them with humility and openness rather than critique.",
    prompt: "Whose Torah wisdom do I undervalue? How can I approach their teachings with more reverence today?" },
  { he: "יִרְאַת שָׁמַיִם", en: "Awe of Heaven", category: "Spirit",
    description: "Living with awareness that every action is seen — a constant sense of divine presence that elevates all conduct.",
    prompt: "In what area of my life do I act differently when I think no one is watching? What shift would awe of Heaven bring?" },
  { he: "עֲנָוָה", en: "Humility", category: "Character",
    description: "True humility is not self-deprecation, but accurate self-knowledge — neither inflated nor diminished.",
    prompt: "Where has pride blocked me from learning or connecting this week? What would humility look like in that situation?" },
  { he: "שִׂמְחָה", en: "Joy", category: "Spirit",
    description: "Serving God with gladness. Joy is not the absence of difficulty but a chosen orientation toward gratitude.",
    prompt: "What am I genuinely grateful for today? Can I carry that gratitude as a foundation for all my actions?" },
  { he: "שִׁמּוּשׁ חֲכָמִים", en: "Serving Sages", category: "Relationships",
    description: "Learning not only from a teacher's formal lessons but from how they live — their habits, responses, and daily choices.",
    prompt: "Who is a person of wisdom in my life? What can I observe about how they handle a difficulty I'm facing?" },
  { he: "דִּקְדּוּק חֲבֵרִים", en: "Careful Friendship", category: "Relationships",
    description: "Choosing friends who elevate you and being precise about the quality of those relationships.",
    prompt: "Do my closest friendships draw me toward growth or away from it? What friendship needs more intentional investment?" },
  { he: "פִּלְפּוּל הַתַּלְמִידִים", en: "Sharp Dialogue", category: "Torah",
    description: "Engaging students or peers in lively, challenging Torah discussion that sharpens understanding for both sides.",
    prompt: "Who can I learn with today — not just from, but together with — through debate and question?" },
  { he: "יִשּׁוּב", en: "Settledness", category: "Character",
    description: "A calm, unhurried quality of mind. The ability to be present and deliberate rather than reactive.",
    prompt: "When do I feel most scattered? What one practice could bring more settledness to that time of day?" },
  { he: "מִקְרָא", en: "Scripture", category: "Torah",
    description: "Engaging with the written Torah — the source of all Jewish wisdom and the foundation of all other learning.",
    prompt: "Which book of the Torah am I least familiar with? What verse from it can I study deeply today?" },
  { he: "מִשְׁנָה", en: "Mishnah", category: "Torah",
    description: "Learning the Oral Torah in its concise, structured form — the backbone of halachic practice and reasoning.",
    prompt: "What tractate of Mishnah speaks to an issue in my current life? Can I study one Mishnah today with that lens?" },
  { he: "מִיעוּט סְחוֹרָה", en: "Less Commerce", category: "Balance",
    description: "Limiting business and material pursuits so they do not consume the time and mental space meant for Torah and spirit.",
    prompt: "Is my work life in proportion to my spiritual life? What boundary could I set to protect sacred time?" },
  { he: "מִיעוּט דֶּרֶךְ אֶרֶץ", en: "Less Worldliness", category: "Balance",
    description: "Reducing immersion in mundane pleasures so that the extraordinary can be felt and appreciated.",
    prompt: "What worldly habit takes the most of my attention? What would I gain by reducing it even slightly?" },
  { he: "מִיעוּט שֵׁנָה", en: "Less Sleep", category: "Balance",
    description: "Using time wisely — not sleeping beyond what is needed, and awakening with purpose and intention.",
    prompt: "How do I begin my mornings? Is there a way to reclaim the first moments of the day for something meaningful?" },
  { he: "מִיעוּט שִׂיחָה", en: "Less Idle Talk", category: "Speech",
    description: "Guarding against purposeless conversation that dissipates energy and often leads to harm.",
    prompt: "How much of my daily speech has real purpose? What conversations can I replace with silence or Torah?" },
  { he: "מִיעוּט שְׂחוֹק", en: "Less Levity", category: "Speech",
    description: "Not a call to joylessness, but to depth — ensuring that humor and lightness serve connection, not avoidance.",
    prompt: "Do I use humor to deflect from seriousness or discomfort? How can levity serve depth rather than replace it?" },
  { he: "אֶרֶךְ אַפַּיִם", en: "Patience", category: "Character",
    description: "The long-suffering quality of being slow to anger — giving space for others and for circumstances to unfold.",
    prompt: "Who or what most tests my patience? What would it feel like to meet that situation with complete calm today?" },
  { he: "לֵב טוֹב", en: "Good Heart", category: "Character",
    description: "Generosity of spirit — a heart that wishes well for others and acts from warmth rather than self-interest.",
    prompt: "What would I do differently today if I led with genuine goodwill toward every person I encounter?" },
  { he: "אֱמוּנַת חֲכָמִים", en: "Trust in Sages", category: "Spirit",
    description: "Faith in the wisdom of the Torah tradition, even when personal reasoning might disagree.",
    prompt: "Is there a teaching of our tradition I've been resisting? Can I sit with it today with openness rather than debate?" },
  { he: "קַבָּלַת הַיִּסּוּרִין", en: "Accepting Hardship", category: "Spirit",
    description: "Not passivity, but the willingness to receive difficulty as a refining process rather than a punishment.",
    prompt: "What current difficulty in my life can I reframe as something that is shaping me for the better?" },
  { he: "מַכִּיר אֶת מְקוֹמוֹ", en: "Knowing One's Place", category: "Character",
    description: "Understanding one's role and station — neither overreaching nor undervaluing one's actual position.",
    prompt: "Where am I trying to be something I'm not, or underplaying something I truly am? What is my rightful place today?" },
  { he: "שָׂמֵחַ בְּחֶלְקוֹ", en: "Contentment", category: "Character",
    description: "True wealth is satisfaction with what one has. Contentment is not resignation — it is grateful sufficiency.",
    prompt: "What do I have that I am not fully appreciating? How can I cultivate genuine satisfaction with my portion today?" },
  { he: "עוֹשֶׂה סְיָג לִדְבָרָיו", en: "Guarding One's Words", category: "Speech",
    description: "Building protective fences around speech — thinking carefully before speaking and creating habits of restraint.",
    prompt: "What type of speech do I most need to guard against — gossip, boasting, criticism? What practice will I set today?" },
  { he: "אֵינוֹ מַחֲזִיק טוֹבָה לְעַצְמוֹ", en: "Not Claiming Credit", category: "Character",
    description: "Deflecting praise and recognizing that one's abilities and accomplishments come from beyond the self.",
    prompt: "When someone praises me today, how can I respond in a way that reflects genuine humility?" },
  { he: "אָהוּב", en: "Being Beloved", category: "Relationships",
    description: "Cultivating the qualities — kindness, reliability, warmth — that make one genuinely loved by others.",
    prompt: "What quality do I most want people to experience when they are with me? How will I embody it today?" },
  { he: "אוֹהֵב אֶת הַמָּקוֹם", en: "Loving God", category: "Spirit",
    description: "A deep, personal love for the divine — not just fear or duty, but genuine longing and devotion.",
    prompt: "What is one practice — prayer, study, gratitude — that brings me closest to feeling God's presence? Can I deepen it today?" },
  { he: "אוֹהֵב אֶת הַבְּרִיּוֹת", en: "Loving People", category: "Relationships",
    description: "Seeing the divine image in every human being and extending love broadly, not only to those who are easy to love.",
    prompt: "Is there someone in my life I find difficult to love? What would it mean to genuinely wish them well today?" },
  { he: "אוֹהֵב אֶת הַצְּדָקוֹת", en: "Loving Righteousness", category: "Spirit",
    description: "A love for justice and giving — not as obligation but as an expression of one's values and identity.",
    prompt: "How am I currently expressing righteousness in the world? What more can I do, in big or small ways?" },
  { he: "אוֹהֵב אֶת הַמֵּישָׁרִים", en: "Loving Integrity", category: "Character",
    description: "Devotion to uprightness — choosing the honest and fair path even when it is more difficult.",
    prompt: "Where in my life am I taking a shortcut from full integrity? What would complete uprightness look like there?" },
  { he: "אוֹהֵב אֶת הַתּוֹכָחוֹת", en: "Loving Rebuke", category: "Wisdom",
    description: "Welcoming honest correction as a gift — the mark of a person committed to growth over ego protection.",
    prompt: "When was the last time someone offered me feedback I resisted? Can I revisit it today with genuine openness?" },
  { he: "מִתְרַחֵק מִן הַכָּבוֹד", en: "Fleeing Honor", category: "Character",
    description: "Not seeking recognition or status — allowing good deeds to be their own reward, without the need for applause.",
    prompt: "In what area do I most seek recognition? What would it feel like to act purely for the right reason, unseen?" },
  { he: "לֹא מֵגִיס לִבּוֹ בְּתַלְמוּדוֹ", en: "Unpretentious in Learning", category: "Character",
    description: "Keeping one's Torah knowledge from becoming a source of arrogance — learning makes one more humble, not less.",
    prompt: "Does my learning make me more open or more certain? Where might it have produced pride rather than humility?" },
  { he: "אֵינוֹ שָׂמֵחַ בְּהוֹרָאָה", en: "Reluctance to Rule", category: "Wisdom",
    description: "Hesitation before issuing judgments or decisions — recognizing the weight of leadership and halachic ruling.",
    prompt: "Where am I quick to judge or decide? What would greater deliberateness and humility in those moments look like?" },
  { he: "נוֹשֵׂא בְּעֹל עִם חֲבֵרוֹ", en: "Sharing Burdens", category: "Relationships",
    description: "Not just empathizing from the outside, but actively bearing the weight of another's difficulty alongside them.",
    prompt: "Who in my life is carrying something heavy right now? What concrete act of support can I offer them today?" },
  { he: "מַכְרִיעוֹ לְכַף זְכוּת", en: "Judging Favorably", category: "Relationships",
    description: "Giving others the benefit of the doubt — assuming the most charitable interpretation of their actions.",
    prompt: "Who have I judged negatively recently? What is the most generous possible explanation for their behavior?" },
  { he: "מְכַוְּנוֹ עַל הָאֱמֶת", en: "Directing to Truth", category: "Relationships",
    description: "Guiding others toward honest self-assessment and truthful living — with gentleness and care.",
    prompt: "Is there someone I know who needs gentle truth today? How can I offer it with love rather than judgment?" },
  { he: "מְכַוְּנוֹ עַל הַשָּׁלוֹם", en: "Directing to Peace", category: "Relationships",
    description: "Actively working to restore harmony — between people, within communities, and within oneself.",
    prompt: "What relationship or situation in my life needs peace restored? What one step can I take toward that today?" },
  { he: "מִשְׁתַּתֵּף בְּצַעַר חֲבֵרוֹ", en: "Sharing Friend's Pain", category: "Relationships",
    description: "True empathy — entering into another's sorrow rather than offering quick comfort from a safe distance.",
    prompt: "Am I present with others in their pain, or do I rush to fix or minimize? Who needs me to simply sit with them?" },
  { he: "מֵישִׁיב", en: "Composure in Study", category: "Torah",
    description: "A reflective quality — pausing to truly consider a question before responding, rather than reacting quickly.",
    prompt: "How quickly do I respond when challenged in learning or in life? What would deliberate composure look like today?" },
  { he: "שׁוֹאֵל וּמֵשִׁיב", en: "Asking and Answering", category: "Torah",
    description: "The art of good dialogue — asking genuine questions and offering thoughtful responses in the pursuit of truth.",
    prompt: "What question am I carrying that I haven't voiced? Who could I bring it to today in honest dialogue?" },
  { he: "שׁוֹמֵעַ וּמוֹסִיף", en: "Listening and Adding", category: "Wisdom",
    description: "Building on what one hears — absorbing others' wisdom and enriching it with one's own, in a spirit of growth.",
    prompt: "Where do I tend to repeat rather than build? What teaching or conversation can I deepen with my own contribution?" },
  { he: "לוֹמֵד עַל מְנָת לְלַמֵּד", en: "Learning to Teach", category: "Torah",
    description: "Studying with the intention of sharing — which sharpens attention, deepens retention, and creates communal blessing.",
    prompt: "What am I learning now that I could share with someone else? Who would most benefit from it?" },
  { he: "לוֹמֵד עַל מְנָת לַעֲשׂוֹת", en: "Learning to Practice", category: "Torah",
    description: "Torah is not an academic exercise — its purpose is transformation of action. Study must lead to living differently.",
    prompt: "What teaching am I studying right now? What specific behavior will I change because of it this week?" },
  { he: "מַחְכִּים אֶת רַבּוֹ", en: "Enriching One's Teacher", category: "Relationships",
    description: "The highest student brings fresh questions and insights that even benefit the teacher — a gift of genuine engagement.",
    prompt: "When did I last bring something meaningful to a teacher or mentor? What question can I bring to enrich that relationship?" },
  { he: "מְכַוֵּן לִבּוֹ לִשְׁמוּעַת רַבּוֹ", en: "Attending to One's Teacher", category: "Wisdom",
    description: "Focusing one's whole heart on the teacher's words — not just the content, but the spirit and intention behind it.",
    prompt: "How fully am I present when learning from others? What distraction do I need to set aside to truly listen today?" },
  { he: "הָאוֹמֵר דָּבָר בְּשֵׁם אוֹמְרוֹ", en: "Citing Sources", category: "Character",
    description: "Properly attributing teachings to their original sources — an act of honesty, gratitude, and bringing redemption to the world.",
    prompt: "Whose wisdom have I shared without attribution? How can I practice honest credit-giving in speech and in life?" },
];

const STORAGE_KEY = "menashe-mussar-v1";

function loadState(): { startDate: string | null; reflections: Record<number, string>; completedDays: number[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { startDate: null, reflections: {}, completedDays: [] };
}

function saveState(s: ReturnType<typeof loadState>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

function getDayIndex(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diff = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return Math.max(0, Math.min(diff, 47));
}

const CATEGORY_COLORS: Record<string, string> = {
  Torah: "#6366f1",
  Wisdom: "#8b5cf6",
  Character: "#d4a843",
  Spirit: "#ec4899",
  Balance: "#10b981",
  Speech: "#f59e0b",
  Relationships: "#3b82f6",
};

interface Props { onClose: () => void; }

export default function MussarModal({ onClose }: Props) {
  const [state, setState] = useState(loadState);
  const [tab, setTab] = useState<"today" | "browse">("today");
  const [browseIdx, setBrowseIdx] = useState(0);
  const [note, setNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  const currentDay = state.startDate ? getDayIndex(state.startDate) : 0;
  const activeIdx = tab === "today" ? currentDay : browseIdx;
  const kinyan = KINYANIM[activeIdx];
  const catColor = CATEGORY_COLORS[kinyan.category] ?? "#d4a843";
  const completed = state.completedDays.includes(activeIdx);

  const reflectionNote = state.reflections[activeIdx] ?? "";

  function startProgram() {
    const today = new Date().toISOString().split("T")[0];
    const next = { ...state, startDate: today };
    setState(next); saveState(next);
  }

  function resetProgram() {
    const next = { startDate: null, reflections: {}, completedDays: [] };
    setState(next); saveState(next);
  }

  function markComplete() {
    if (completed) return;
    const next = { ...state, completedDays: [...state.completedDays, activeIdx] };
    setState(next); saveState(next);
  }

  function saveNote() {
    const next = { ...state, reflections: { ...state.reflections, [activeIdx]: note } };
    setState(next); saveState(next);
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 1800);
  }

  const progress = state.startDate ? Math.round(((state.completedDays.length) / 48) * 100) : 0;

  const grouped = useMemo(() => {
    const map: Record<string, { idx: number; k: typeof KINYANIM[0] }[]> = {};
    KINYANIM.forEach((k, idx) => {
      if (!map[k.category]) map[k.category] = [];
      map[k.category].push({ idx, k });
    });
    return map;
  }, []);

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div
        className="popup-card"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: "90vh", display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}
      >
        {/* ── Header ── */}
        <div style={{
          background: "linear-gradient(135deg, #1a0a2e 0%, #2d1254 100%)",
          padding: "18px 18px 14px",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", letterSpacing: "-0.3px" }}>
                מוּסָר
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#c4b5fd", marginTop: 1 }}>
                48 Ways to Torah Wisdom
              </div>
              <div style={{ fontSize: 11, color: "rgba(196,181,253,0.7)", marginTop: 2 }}>
                Pirkei Avot 6:6 · Character Refinement Program
              </div>
            </div>
            <button className="modal-close-btn" onClick={onClose} style={{ color: "rgba(255,255,255,0.7)", background: "rgba(255,255,255,0.1)" }}>✕</button>
          </div>

          {/* Progress bar */}
          {state.startDate && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 10, color: "#c4b5fd", fontWeight: 700 }}>
                  Day {currentDay + 1} of 48
                </span>
                <span style={{ fontSize: 10, color: "#c4b5fd", fontWeight: 700 }}>
                  {state.completedDays.length} reflected · {progress}%
                </span>
              </div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 99,
                  background: "linear-gradient(90deg, #7c3aed, #a855f7)",
                  width: `${Math.max(2, (currentDay + 1) / 48 * 100)}%`,
                  transition: "width 0.4s",
                }} />
              </div>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            {(["today", "browse"] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); if (t === "browse") setBrowseIdx(currentDay); setNote(""); }}
                style={{
                  flex: 1, padding: "7px 0", borderRadius: 8, border: "none",
                  cursor: "pointer", fontSize: 12, fontWeight: 700,
                  background: tab === t ? "rgba(167,139,250,0.25)" : "rgba(255,255,255,0.06)",
                  color: tab === t ? "#c4b5fd" : "rgba(255,255,255,0.45)",
                }}
              >
                {t === "today" ? "📖 Today's Middah" : "🗂 Browse All 48"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 24px" }}>

          {/* Not started state */}
          {!state.startDate ? (
            <div style={{ textAlign: "center", padding: "20px 10px" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📿</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8 }}>
                Begin Your Mussar Journey
              </div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 280, margin: "0 auto 20px" }}>
                A 48-day structured program through the 48 Kinyanim of Torah — the qualities that acquire wisdom and refine character. One middah per day.
              </div>
              <button
                onClick={startProgram}
                style={{
                  padding: "12px 28px", borderRadius: 12,
                  background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                  border: "none", cursor: "pointer",
                  color: "#fff", fontSize: 15, fontWeight: 800,
                }}
              >
                Start Today →
              </button>
            </div>
          ) : (
            <>
              {/* Browse day selector */}
              {tab === "browse" && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8, textTransform: "uppercase" }}>
                    Select a Day
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {KINYANIM.map((_, idx) => {
                      const done = state.completedDays.includes(idx);
                      const isToday = idx === currentDay;
                      return (
                        <button
                          key={idx}
                          onClick={() => { setBrowseIdx(idx); setNote(state.reflections[idx] ?? ""); }}
                          style={{
                            width: 32, height: 32, borderRadius: 8, border: "none",
                            cursor: "pointer", fontSize: 10, fontWeight: 800,
                            background: browseIdx === idx
                              ? "linear-gradient(135deg, #7c3aed, #a855f7)"
                              : done ? "rgba(124,58,237,0.2)"
                              : isToday ? "rgba(212,168,67,0.2)"
                              : "rgba(255,255,255,0.06)",
                            color: browseIdx === idx ? "#fff" : done ? "#a78bfa" : isToday ? "#d4a843" : "var(--text-muted)",
                            outline: isToday && browseIdx !== idx ? "1.5px solid rgba(212,168,67,0.5)" : "none",
                          }}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Middah card */}
              <div style={{
                borderRadius: 16, overflow: "hidden", marginBottom: 14,
                border: `1px solid ${catColor}33`,
                background: `linear-gradient(160deg, ${catColor}10 0%, transparent 100%)`,
              }}>
                {/* Day + category badge */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 14px 0",
                }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>
                    {tab === "browse" ? `Day ${activeIdx + 1}` : `Day ${currentDay + 1} · Today`}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 800, letterSpacing: "0.08em",
                    color: catColor, background: `${catColor}20`,
                    border: `1px solid ${catColor}40`,
                    borderRadius: 6, padding: "2px 8px",
                  }}>
                    {kinyan.category.toUpperCase()}
                  </span>
                </div>

                {/* Hebrew + English name */}
                <div style={{ padding: "10px 14px 14px" }}>
                  <div style={{
                    fontFamily: "'Noto Serif Hebrew', serif",
                    fontSize: 30, fontWeight: 900, color: catColor,
                    direction: "rtl", lineHeight: 1.1, marginBottom: 4,
                  }}>
                    {kinyan.he}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.3px", marginBottom: 10 }}>
                    {kinyan.en}
                  </div>
                  <div style={{
                    fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65,
                    borderLeft: `3px solid ${catColor}60`, paddingLeft: 12,
                  }}>
                    {kinyan.description}
                  </div>
                </div>
              </div>

              {/* Reflection prompt */}
              <div style={{
                borderRadius: 14, padding: "13px 14px", marginBottom: 14,
                background: "rgba(212,168,67,0.07)",
                border: "1px solid rgba(212,168,67,0.2)",
              }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#d4a843", letterSpacing: "0.1em", marginBottom: 8, textTransform: "uppercase" }}>
                  ✨ Today's Reflection
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, fontStyle: "italic" }}>
                  "{kinyan.prompt}"
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", marginBottom: 7, textTransform: "uppercase" }}>
                  My Reflection Notes
                </div>
                <textarea
                  value={note || reflectionNote}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Write your thoughts, insights, or intentions for today's middah…"
                  rows={4}
                  style={{
                    width: "100%", borderRadius: 12, padding: "11px 13px",
                    background: "var(--elevated)", border: "1px solid var(--border)",
                    color: "var(--text-primary)", fontSize: 13, lineHeight: 1.6,
                    resize: "none", outline: "none", boxSizing: "border-box",
                  }}
                />
                <button
                  onClick={saveNote}
                  style={{
                    marginTop: 8, padding: "8px 18px", borderRadius: 10,
                    background: noteSaved ? "rgba(34,197,94,0.15)" : "rgba(124,58,237,0.15)",
                    border: `1px solid ${noteSaved ? "rgba(34,197,94,0.3)" : "rgba(124,58,237,0.3)"}`,
                    color: noteSaved ? "#4ade80" : "#a78bfa",
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  {noteSaved ? "✓ Saved" : "Save Note"}
                </button>
              </div>

              {/* Mark complete + Pirkei Avot reference */}
              <div style={{ display: "flex", gap: 10, alignItems: "stretch", marginBottom: 16 }}>
                <button
                  onClick={markComplete}
                  disabled={completed}
                  style={{
                    flex: 1, padding: "12px 16px", borderRadius: 12, border: "none",
                    cursor: completed ? "default" : "pointer", fontSize: 13, fontWeight: 800,
                    background: completed
                      ? "rgba(34,197,94,0.12)"
                      : "linear-gradient(135deg, #7c3aed, #a855f7)",
                    color: completed ? "#4ade80" : "#fff",
                  }}
                >
                  {completed ? "✓ Reflected Today" : "Mark as Reflected"}
                </button>
              </div>

              {/* Source */}
              <div style={{
                borderRadius: 12, padding: "11px 14px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>
                  <span style={{ fontFamily: "'Noto Serif Hebrew', serif", fontSize: 12 }}>פִּרְקֵי אָבוֹת ו:ו</span>
                  {" · "}Pirkei Avot 6:6 · Way {activeIdx + 1} of 48
                </div>
              </div>

              {/* Reset option */}
              {tab === "today" && (
                <div style={{ textAlign: "center", marginTop: 18 }}>
                  <button
                    onClick={() => { if (confirm("Reset the program? All progress will be cleared.")) resetProgram(); }}
                    style={{
                      fontSize: 11, color: "var(--text-muted)", background: "none",
                      border: "none", cursor: "pointer", textDecoration: "underline",
                    }}
                  >
                    Reset program
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
