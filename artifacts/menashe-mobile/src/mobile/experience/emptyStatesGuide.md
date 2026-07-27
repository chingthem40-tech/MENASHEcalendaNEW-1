# emptyStatesGuide.md
### Menashe Experience Language — Phase 11: Empty States

---

An empty state is not an absence of content. It is content.

When a screen or section has nothing to show, that moment must be as carefully
designed as a screen full of data. Empty states direct the user, not abandon them.

---

## Anatomy (Standard)

Every empty state contains exactly these five elements in order:

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│         [1. Illustration]                           │
│         Emoji or themed SVG, 56–72dp                │
│         Centered horizontally                       │
│                                                     │
│         [2. Headline]                               │
│         Short, warm, 17dp bold                      │
│         Centered                                    │
│                                                     │
│         [3. Description]                            │
│         1–2 sentences, 14dp muted, centered         │
│         Max 180dp wide (reading line length)        │
│                                                     │
│         [4. Primary Action]   ← Optional            │
│         PillButton, gold, full-width CTA            │
│                                                     │
│         [5. Secondary Action]  ← Optional           │
│         Text link, muted, below primary             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Tone

Empty states are written in a warm, encouraging voice.

**The tone is:** Calm. Helpful. Human. Never apologetic. Never technical. Never blank.

The user is not in trouble. They are in a moment of possibility.

| Context | Tone |
|---|---|
| No yahrzeit records yet | "A place of memory, waiting for you" |
| No community members yet | "Your community begins with you" |
| No AI conversation yet | "Ask Rav Menashe anything" |
| No search results | "We couldn't find that — try different words" |
| No upcoming holidays in 60 days | "The calendar is quiet for now" |
| No notifications | "You're all caught up" |

---

## Illustration

The empty state illustration follows illustrationGuide.md standards.

**Approved emoji for empty states:**

| Context | Emoji |
|---|---|
| Yahrzeit / memorial | 🕯 |
| Community / people | 🕍 or ✡️ |
| Torah / AI | 📜 |
| Calendar / no events | 📅 |
| Search / no results | 🔍 |
| Notifications / all clear | ✅ |
| Settings / not configured | ⚙️ |
| Network / offline | 🌙 |

**Size:** 56–72dp. Never larger — the illustration supports the text, not the other way around.

**Color:** Full opacity for the primary emoji. Optional warm glow effect beneath it
(a blurred circular View, 60dp, gold at 15% opacity).

---

## Headline Rules

- **3–6 words** maximum
- **Sentence case** (capitalize first word only)
- **Never starts with "No"** ("No results found" → "Nothing matched that yet")
- **Never starts with "Error"** → use errorGuide.md pattern instead
- **Hebrew context:** If the empty state is in a Hebrew-dominant screen, provide the
  headline in both languages (English primary, Hebrew secondary below, 14dp, muted)

**Approved headline structures:**
- "A place of memory, waiting for you" (poetic, invitational)
- "You're all caught up" (confirming, celebratory)
- "Nothing here yet" (honest, simple)
- "Start your [feature]" (directive, encouraging)

---

## Description Rules

- **1–2 sentences only**
- **14dp, muted color, centered**
- **Max line width: 280dp** — enforce with `maxWidth: 280, alignSelf: "center"`
- Explain **what the user can do** to change the state, not why it is empty
- Never say "Please" — it sounds automated
- Never say "You haven't..." — it implies the user did something wrong

**Good:** "Light a virtual candle to honour someone dear to your community."
**Bad:** "You haven't added any yahrzeit records yet. Please add one to get started."

---

## Primary Action

**Use when:** There is a clear, direct action the user can take to fill the empty state.

- PillButton, gold background, full-width (with 32dp horizontal margin)
- Label: verb + noun, 3 words max ("Add a Yahrzeit", "Start Exploring", "Ask a Question")
- Navigates directly to the creation/action flow — no intermediate steps

---

## Secondary Action

**Use when:** There is a secondary path — learning more, dismissing, or an alternative.

- Text link, muted color, `fontSize: 14, fontWeight: "500"`
- Positioned below the primary action with 12dp gap
- Examples: "Learn more about Yahrzeits", "Maybe later", "Browse the calendar instead"

---

## Empty State Sizing

The empty state occupies the same vertical space as the content it replaces.
This prevents layout shift when content loads.

| Content replaced | Empty state min-height |
|---|---|
| Home section | 120dp |
| Full screen | Fill available height (flex: 1, justifyContent: "center") |
| Card in a list | 100dp |
| Search results area | 240dp |

---

## Per-Feature Empty States

### Yahrzeit / Memorial
```
🕯
"A place of memory, waiting"
"Light a virtual candle for someone dear to your community and Benei Menashe heritage."
[Primary: "Add a Yahrzeit Record"]
[Secondary: "Learn about Yahrzeits"]
```

### Community Feed
```
🕍
"Your community is just beginning"
"Be the first to share something with the Menashe community."
[Primary: "Write a Post"]
```

### AI Chat (first visit)
```
📜
"Ask Rav Menashe anything"
"Questions about Halacha, Parasha, customs, or the Hebrew calendar are all welcome."
[Primary: "Start a Conversation"]
```

### Search Results
```
🔍
"Nothing matched that"
"Try different words, or browse by date."
[Secondary: "Clear search"]
```

### Notifications
```
✅
"You're all caught up"
"We'll let you know about upcoming Yahrzeits, Shabbat times, and community news."
```
*(No primary action — this empty state is a success state, not a call to action.)*
