# MEP-400 — Experience Architecture
**Menashe Platform · Web + Mobile · July 2026**

---

## 1. DESTINATION IDENTITY MAP

Every destination must answer exactly one question. The question defines what belongs there and what does not.

---

### D-01 · Sacred Day (Home)
**Identity Question: "What does this sacred day ask of me?"**

The Home screen is not a dashboard of features. It is a daily briefing — a single answer to the most important question of the day. It surfaces time-sensitive obligations: the prayer window, the learning assignment, today's community pulse, and any memorials to observe. When today has nothing specific to surface in a category, that category is silent.

**Correct identity:** A living prayer-time-aware "today" surface that changes meaningfully across the day and week. Morning Home looks different from Shabbat Home. A day with a yahrzeit looks different from a plain Tuesday.

**Current identity (actual):** A navigation hub displaying every feature of the platform simultaneously: Zmanim, Parasha, Daf Yomi, Daily Wisdom, Community preview, Memorial entry, Announcements, Quick Actions grid, Premium upsell, Library shortcut, AI shortcut, Jerusalem Compass, location badge, and more. Home currently has no identity of its own — it is the app's navigation system displayed as a screen.

---

### D-02 · Sacred Time (Zmanim)
**Identity Question: "When do I pray, and what is happening right now in sacred time?"**

Sacred Time owns every halachic clock: prayer windows, sunrise/sunset, fast times, Shabbat entry and exit, Omer counting, and the candle-lighting countdown. It is the platform's relationship with time — not just a list of hours, but the living rhythm of the day.

**Correct identity:** The precision instrument for halachic observance. Includes today's prayer windows, notification management, weekly outlook, and moment-to-moment countdown.

**Current identity (actual):** A clean, focused page (ZmanimPage) — but its content leaks extensively: the Home screen duplicates the Zmanim timeline, the Candle Lighting bar, and the "next prayer" countdown. Journey also shows a Zmanim countdown card. The Omer counter lives on Home instead of here.

---

### D-03 · Sacred Calendar
**Identity Question: "What is coming, and when?"**

Sacred Calendar owns the long view: the full monthly grid, holidays, fast days, Rosh Chodesh, parashiyot by week, and personal lifecycle dates (birthdays, aliyah anniversaries). It answers temporal questions beyond today.

**Correct identity:** The Hebrew calendar as planning tool — month view, holiday preview, personal date overlay, Hebrew date lookup. The complement to Sacred Time (which owns the present moment).

**Current identity (actual):** Relatively focused (CalendarPage), but: Holidays live in a separate HolidaysModal reached only via Home Quick Actions. The Hebrew date converter is a separate modal (HebrewDateModal). The Luach (full calendar view) is a separate modal. Personal lifecycle dates (birthdays, yahrzeits) are managed in Settings, not Calendar.

---

### D-04 · Sacred Learning (Torah)
**Identity Question: "What should I study today?"**

Sacred Learning is the doorway into all study paths. It presents today's learning obligations (Parasha, Daf Yomi, Omer) as starting points, provides access to all learning tracks (Mussar, Torah Tracker, Sefaria search), and connects to the text library. It does not track personal progress — that belongs to My Journey.

**Correct identity:** A study session launcher. It answers "what" and "where" of learning, not "how am I doing."

**Current identity (actual):** The Torah tab is three things at once — a library browser (Siddur, Tehillim, Tanakh, Mishnah, Halacha, Kuki = 8 filtered entries to the same screen), a learning launcher (Parasha, Daf Yomi, Mussar), and a progress overview (Study History, Bookmarks). Daily Wisdom quotes also appear here, duplicating Home. Torah is simultaneously Sacred Learning, Sacred Texts, and My Journey.

---

### D-05 · Sacred Texts (Siddur / Library)
**Identity Question: "Where is the text I need right now?"**

Sacred Texts is a reference library — the place to find and read a specific prayer, book, or portion. It is not a learning journey or a study tracker. It answers a lookup question: "I need Tehillim 23" or "I need the Maariv service."

**Correct identity:** A searchable, browsable library of sacred texts. Category browsing, search, and a reading experience. Pure reference utility.

**Current identity (actual):** The Siddur page is focused on web. On mobile, Sacred Texts is fragmented — the same /siddur screen is reached via 8 different entry points on the Torah tab, each pre-filtered to a different category (Siddur, Prayer, Library, Halacha, Kuki, Tehillim, Tanakh, Mishnah, Prayer Books). Users cannot tell these lead to the same destination.

---

### D-06 · Community Hall (Community)
**Identity Question: "What is happening in my community right now?"**

Community Hall owns all collective social experience: what's been announced, what events are coming, who needs prayers, who is in the community directory, where communities gather (synagogues), and which institutions serve the community. It is the public square.

**Correct identity:** The platform's social layer — news, events, people, places, and institutions. Real-time community presence.

**Current identity (actual):** Community Hall on mobile (community tab) hosts 7 distinct sections: Announcements, Prayer Board, Memorials, Events, Quick Access Grid (6 items), Organizations, Directory. The Memorials section is a Community Hall interloper — memorial belongs to Sacred Memory (D-07). The Quick Access Grid inside Community Hall is itself another navigation hub, further diluting identity.

---

### D-07 · Sacred Memory
**Identity Question: "Whom in our community do we remember, and how do we honor them?"**

Sacred Memory is the platform's dedicated space for grief, legacy, and remembrance. It holds the community memorial records, yahrzeit observances, the 3D Sanctuary, virtual candle lighting, and the names of those who have passed. It is a destination of quiet and honor.

**Correct identity:** A sacred, contemplative space. Entry when there is a yahrzeit to observe; browsing to learn about community history; the 3D Sanctuary for immersive remembrance.

**Current identity (actual):** Sacred Memory exists on three different surfaces without connecting: (1) Home has a "Memorial Sanctuary" entry card, (2) Community Hall has a Memorials section with candle statistics and recent deceased, (3) /sacred-memory and /community/memorials are separate disconnected screens on mobile. Yahrzeit personal management lives in Settings (YartzeitModal) on web. There is no single authoritative address for remembrance.

---

### D-08 · Prayer Board
**Identity Question: "Who in my community needs my prayers right now?"**

Prayer Board is a dedicated communal prayer space — a living feed of prayer requests, each with category, name, request, and "Amen" support count. It is both a place to submit needs and to actively support others.

**Correct identity:** A focused, ongoing community ritual — submit, browse, and support prayer requests. The act of praying for one another made visible.

**Current identity (actual):** Prayer Board exists as a full screen on mobile (/prayer-board) and a modal on web (PrayerBoardModal via FAB). It is also previewed inside Community Hall (Community tab). It has the pieces of a clear identity but is currently a sub-feature of Community rather than its own destination.

---

### D-09 · Rav Menashe (AI Wisdom)
**Identity Question: "What wisdom do I need for what I am facing?"**

Rav Menashe is the platform's AI guide — a conversational space for asking questions about Jewish practice, Bnei Menashe traditions, halacha, Torah insights, and spiritual guidance. It is personal, contextual, and session-based.

**Correct identity:** A one-on-one consultation with a knowledgeable guide. Conversation history, context-aware responses (current Hebrew date, upcoming holidays, Zmanim), and a distinct voice.

**Current identity (actual):** On mobile, Sacred Wisdom is a well-positioned center-tab screen — clear and prominent. On web, Rav Menashe is an unlabeled floating chat icon (ChatModal) with no name, no entry point in the BottomNav, and no presence on any other screen except as a FAB button. Its identity is effectively hidden on web.

---

### D-10 · My Journey
**Identity Question: "How am I growing as a member of this community?"**

My Journey is the platform's personal growth record. It owns study streaks, Mussar practice progress, Torah Tracker logs, badges earned, and personal goals. It is the only destination where the user is the subject — not the calendar, not the community, not the texts.

**Correct identity:** A private growth dashboard: where have I been studying, what character traits am I working on, what are my commitments, how have I progressed.

**Current identity (actual):** Journey on mobile is a second Home screen — it shows Zmanim countdowns, Parasha recommendations, Community events preview, Announcements, Prayer Requests, Census status, and Memorial highlights. Almost none of this content is exclusive to Journey. The one content area Journey should own exclusively — personal growth metrics from Torah Tracker and Mussar — is not visible on Journey at all; it lives on the Torah tab.

---

### D-11 · My Account (Settings)
**Identity Question: "How do I make this platform mine?"**

My Account handles everything that makes the experience personal to this specific user: their identity in the community (profile, role), their environment (location, language, theme), their notification preferences, and their account actions (sign in/out, premium, admin access). It is configuration, not content.

**Correct identity:** A pure settings surface. Predictable, complete, and rarely visited except to change something specific.

**Current identity (actual):** Mostly focused, but hosts two features that belong elsewhere: the Premium upsell row (belongs in a dedicated Premium destination or inline where features are locked) and the hidden Admin Panel (an admin tool that should be invisible to non-admins at the routing level, not just hidden on a settings page).

---

### D-12 · Census
**Identity Question: "Is my family officially counted in the Bnei Menashe community?"**

The Census is a structured, one-time civic flow: family head registration, family member listing, review, and submission. It is not a community browsing experience — it is a form with a purpose and a clear completion state.

**Correct identity:** A dedicated, sequential registration flow with a clear entry ("Start Census"), progress indicators, and a meaningful success state. Entry belongs in Community Hall (as a CTA for unregistered users).

**Current identity (actual):** Census is entered from four different places (Community tab CTA, Journey "Complete Census," Settings row on web, Home community card on mobile). Its success screen is a dead end with no forward path.

---

### D-13 · Premium
**Identity Question: "What can I unlock, and how?"**

Premium is the platform's subscription surface: a clear listing of locked features, pricing, and the upgrade path. It should be reachable from exactly one place (My Account) plus contextual inline upsells where features are locked.

**Correct identity:** A conversion surface — honest about what's free, clear about what's paid, with a return path to the feature that triggered the upgrade.

**Current identity (actual):** Premium is reached from 4 places on web (Home Crown, Zmanim upsell, Siddur lock, Settings row). On mobile, the Go Premium CTA on Home is broken (empty action). PremiumPage itself is a dead end — no return to the feature that triggered the visit.

---

## 2. FEATURE OWNERSHIP MATRIX

Every feature has exactly one owner. Appearances on other destinations are read-only "headlines" only — they do not replicate the feature, they point toward it.

| Feature | Rightful Owner | Currently Also Appears In | Status |
|---------|---------------|--------------------------|--------|
| Today's Hebrew/Gregorian date | Sacred Day | Zmanim (header) | ✓ Acceptable duplication (context header) |
| Current prayer window / next zman | Sacred Time | Home, Journey | ⚠ Overlap: Home/Journey show full Zmanim timeline |
| Shabbat / candle-lighting countdown | Sacred Time | Home | ⚠ Full countdown duplicated on Home |
| Omer counter | Sacred Time | Home | ✗ Wrong owner: Omer is a time-based obligation |
| Weekly prayer reminder setup | Sacred Time | — | ✓ Focused |
| Monthly calendar grid | Sacred Calendar | Home (today card / week strip) | ✓ Acceptable: week strip on Home is contextual |
| Holiday list and countdowns | Sacred Calendar | Home (holiday card), Quick Actions (HolidaysModal) | ⚠ HolidaysModal is a duplicate calendar view |
| Rosh Chodesh notification | Sacred Calendar | Home | ✓ Acceptable: today-relevant alert |
| Hebrew date converter | Sacred Calendar | HebrewDateModal (standalone) | ⚠ Tool lives in a modal, not in Calendar |
| Full Luach view | Sacred Calendar | LuachModal (standalone) | ⚠ Tool lives in a modal, not in Calendar |
| Personal lifecycle date display (birthdays, aliyot) | Sacred Day | Home | ✓ Correct — today-relevant |
| Personal lifecycle date management | My Account | Settings (BirthdayModal, YartzeitModal) | ✓ Correct location |
| Today's Parasha (headline) | Sacred Day | Home, Torah tab, Journey | ✗ Parasha card duplicated on 3 surfaces |
| Parasha full reading experience | Sacred Learning | ParashahModal (web), Torah tab (mobile) | ⚠ Full content in a modal (web) |
| Daf Yomi (today's reference) | Sacred Day | Home, Torah tab, Journey | ✗ Daf duplicated on 3 surfaces |
| Daf Yomi full study session | Sacred Learning | /daf-yomi screen | ✓ Focused screen exists |
| Daily Wisdom / Torah quote | Sacred Day | Home, Torah tab ("Daily Insight"), Journey ("Daily Reflection") | ✗ Same quote on 3 surfaces |
| Mussar practice (48 Ways) | Sacred Learning | /mussar screen | ✓ Focused screen exists; wrongly grouped under Torah tab with library |
| Torah Tracker (study log + goals) | My Journey | Torah tab ("Library Collections" grid) | ✗ Progress tracker on the wrong tab |
| Study streaks / badges / history | My Journey | Torah tab | ✗ Personal progress lives in the library tab |
| Sacred Library (browse + read) | Sacred Texts | Torah tab (8 entries), Siddur page (web) | ⚠ Library accessed through too many identical-looking entries |
| Book reader | Sacred Texts | BookReaderModal (web) | ✓ Scoped correctly |
| Sefaria text search | Sacred Texts | SefariaSearchModal (web) | ✓ Scoped correctly |
| Community Announcements (full) | Community Hall | Home (preview), Journey (preview) | ⚠ Full content duplicated in previews |
| Community Events (full) | Community Hall | Home (via FAB, web), Journey (preview) | ⚠ Events behind FAB on web |
| Prayer Board (full) | Prayer Board | Community Hall (preview), Home (via FAB) | ⚠ Full content accessible from FAB; previewed in Community |
| Member Directory | Community Hall | Home (celebrations section, web) | ⚠ Directory shortcut on Home is navigation, not content |
| Organizations directory | Community Hall | — | ✓ Focused |
| Synagogues directory | Community Hall | — | ✓ Focused |
| Learning Groups | Community Hall | Journey ("Today's Learning") | ⚠ Learning group preview on Journey is cross-category |
| Census flow | Census | Community Hall (CTA), Journey, Settings, Home | ✗ 4 entry points; entry belongs in Community Hall only |
| Community memorials list | Sacred Memory | Community Hall (Memorials section) | ✗ Wrong owner: memorial lives inside the community hub |
| 3D Memorial Sanctuary | Sacred Memory | — | ✓ Focused (but disconnected from memorials list) |
| Yahrzeit today (observance alert) | Sacred Day | Home, Sacred Memory | ✓ Correct on Home (today-relevant); should also be in Sacred Memory |
| Yahrzeit personal management | My Account | Settings | ✓ Correct location |
| Virtual candle lighting | Sacred Memory | Community Hall (candles section) | ✗ Wrong owner |
| Jerusalem Compass | Sacred Time | Home (FAB, web) | ⚠ Prayer-direction tool buried in FAB |
| Location Map (find synagogue) | Community Hall | Home (FAB, web) | ✗ Community feature in Home's FAB |
| Rav Menashe AI | Rav Menashe | Home (card + FAB), web only | ✗ Unlabeled on web; hidden behind global FAB |
| Profile (identity in community) | My Account | Settings | ✓ Correct |
| Location setting | My Account | Home, Calendar, Zmanim, Settings (4 places) | ✗ Structural context should be set once, not repeated |
| Theme | My Account | Home (toggle), Settings | ✓ Acceptable: Home toggle is a convenience |
| Language | My Account | Home header, Settings | ✓ Acceptable: Home header switcher is contextual |
| Notifications setup | My Account | Settings | ✓ Correct |
| Premium subscription | Premium (via My Account) | Home (crown), Zmanim, Siddur, Settings | ⚠ Contextual upsells are appropriate; crown on Home is redundant |
| Admin tools | My Account (role-gated) | Siddur (crown), Settings (hidden) | ⚠ Should be a single entry point, role-gated at routing level |
| What's New / changelog | My Account | Auto-shown modal | ✓ Scoped correctly; belongs as a My Account section |
| Translation Editor | My Account | Settings, /translation-editor | ✓ Scoped correctly (admin/advanced feature) |

---

## 3. OVERLAPPING FEATURES

Overlaps are grouped by severity. **Critical** = same full content on multiple surfaces. **Significant** = same data rendered differently in multiple places. **Minor** = a preview or headline that points to another destination.

---

### CRITICAL OVERLAPS (Full content duplicated)

**OV-001 — Home and Journey are both "Today" dashboards**
Both surfaces attempt to answer the same question: "What should I do today?" Both show Zmanim, Parasha, Daf Yomi, Community alerts, Memorial highlights, and a motivational quote. Journey has no exclusive content. Neither screen has a clear identity because they are mirrors of each other.

| Feature | Home (web) | Home (mobile) | Journey (mobile) |
|---------|-----------|---------------|-----------------|
| Zmanim countdown | ✓ Full timeline | ✓ Horizontal scroll | ✓ Next prayer card |
| Parasha | ✓ Card | ✓ Card | ✓ Recommendation card |
| Daf Yomi | ✓ Quick action | ✓ Card | ✓ Today's Learning |
| Daily Wisdom quote | ✓ Card | ✓ Card | ✓ Daily Reflection |
| Community alert | ✓ Announcement strip | ✓ Community preview | ✓ Community Today section |
| Memorial | ✓ Entry card | ✓ Entry card | ✓ Family Journey section |
| Census status | — | ✓ Quick Actions | ✓ Family Journey section |

**OV-002 — Daily Wisdom quote on three surfaces (mobile)**
The same type of content — a daily Torah quote — appears as "Today's Wisdom" (Home), "Daily Insight" (Torah tab), and "Daily Reflection" (Journey). These may or may not be the same quote; regardless, the user experiences the same information three times across three different screens.

**OV-003 — Community Hall preview is inside Home AND Journey (mobile)**
Community Announcements, Prayer Requests, and Events each appear as preview cards on both Home and Journey. The user sees the same community feed excerpt in three places: Home community section, Journey "Community Today," and the Community tab itself.

**OV-004 — Torah tab contains both a library and a progress tracker**
Torah tab hosts: learning launchers (Parasha, Daf Yomi), a text library with 8 category entries, a "Study History" section, Bookmarks, and a "Continue Last Study" card. These are three different purposes — launching learning, finding texts, and tracking personal progress — on one screen. The result is that the screen answers three questions: "What should I study?" "Where is the text?" and "How am I doing?"

**OV-005 — Memorial content is split across three disconnected surfaces**
Community Hall (Memorials section with candles, statistics, recent deceased), /sacred-memory (today's yahrzeits, monthly timeline, candle lighting), and /community/memorials (list screen on mobile) all contain memorial content with no connection to each other. A user who lights a candle in Community Hall has no path to the 3D Sanctuary. A user in Sacred Memory has no path back to the community list.

---

### SIGNIFICANT OVERLAPS

**OV-006 — Parasha on three surfaces (mobile)**
"This Week's Parashah" appears as a hero card on Home, as "This Week's Parashah" in the Torah tab's Daily Learning Paths, and as a recommendation in Journey's "Today's Learning." Same title, same data, three screens.

**OV-007 — Daf Yomi on three surfaces (mobile)**
Current tractate and page appears on Home ("Daf Yomi card"), in the Torah tab's Daily Learning Paths, and in Journey's "Today's Learning." The full study session is at /daf-yomi.

**OV-008 — Zmanim on four surfaces**
Next prayer countdown appears in: Zmanim page/tab (authoritative, with reminders), Home date card ("View All" link), Home horizontal scroll section (mobile), Journey "Sacred Time" card (mobile). Web also shows the full Shabbat/Havdalah countdown on Home.

**OV-009 — Census entry on four surfaces (mobile)**
The Census CTA or status appears in Community Hall (CTA for unregistered users), Journey (Family Journey / Census completion), Quick Actions grid on Home, and Settings on web. The flow itself is at /census/*.

**OV-010 — Location in four places (web)**
LocationModal is triggered from Home header badge, Calendar page header, Zmanim page header, and Settings Location row. Location is structural context — it should be set once.

**OV-011 — Rav Menashe AI card on Home (mobile) when it has its own tab**
Home shows a premium card to "Ask Rav Menashe." Rav Menashe already has the center tab position (the most prominent spot on the tab bar). The Home card duplicates the tab's entry point.

**OV-012 — Yahrzeit appears as observance AND as management in different places**
Web: Home shows today's Yahrzeit Reminder (observance). Settings has a Yartzeits Row for managing personal yahrzeits (YartzeitModal). These are two different purposes using the same data, on unrelated screens.

---

### MINOR OVERLAPS (acceptable if resolved by pointer, not duplication)

**OV-013** — Birthday/celebration today alert on Home is appropriate (today-relevant), but BirthdayModal in Settings for management is correct.

**OV-014** — Rosh Chodesh banner on Home is appropriate (today-relevant alert).

**OV-015** — Holiday card on Home is appropriate when a holiday is today or imminent; becomes problematic if it duplicates the Calendar's holiday list.

**OV-016** — Community announcement strip on Home is appropriate (one pinned alert); becomes problematic when it mirrors the full announcements list.

---

## 4. RECOMMENDED EXPERIENCE ARCHITECTURE

### Principle
Each destination answers one question. When a feature must appear outside its home, it appears as a **headline** (the minimum context needed to understand there is something here) with a clear path to the owning destination. A headline is never a duplicate of the full feature.

---

### The Eleven Destinations and Their Exclusive Ownership

```
┌─────────────────────────────────────────────────────────────────┐
│  D-01  SACRED DAY         "What does today ask of me?"          │
│        Owns: today's obligations only.                          │
│        Receives headlines from: all other destinations.         │
│        Surfaces: today's prayer window (headline → Sacred Time) │
│                  today's Parasha name (headline → Sacred Learn) │
│                  today's yahrzeit, if any (headline → Mem.)     │
│                  one pinned community alert (headline → Comm.)  │
│        Does NOT own: full Zmanim, full Parasha text, full       │
│                      community news, full memorial records.     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  D-02  SACRED TIME        "When do I pray?"                     │
│        Owns: all prayer times, Shabbat entry/exit,             │
│              Omer counter, candle lighting, Jerusalem Compass,  │
│              notification management, weekly zmanim outlook.    │
│        NOT on: Journey, Home (Home gets one "next prayer" line) │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  D-03  SACRED CALENDAR    "What is coming up?"                  │
│        Owns: monthly/yearly Hebrew calendar, holiday list,      │
│              fast days, personal lifecycle date overlay,        │
│              Hebrew date converter, Luach, Rosh Chodesh.        │
│        Absorbs: HolidaysModal, LuachModal, HebrewDateModal.     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  D-04  SACRED LEARNING    "What should I study today?"          │
│        Owns: learning launchers only — Parasha reading,         │
│              Daf Yomi session, Mussar practice, Sefaria search, │
│              learning group sessions.                           │
│        Does NOT own: the library (→ Sacred Texts),              │
│                      personal progress (→ My Journey).          │
│        Absorbs: ParashahModal, DafYomiModal, MussarModal.       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  D-05  SACRED TEXTS       "Where is the text I need?"           │
│        Owns: the complete sacred library — browse, search,      │
│              and read any book, prayer, or portion.             │
│        Single entry point from Sacred Learning.                 │
│        Does NOT own: the learning experience or progress.       │
│        Resolves: the 8-entry /siddur fragmentation.             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  D-06  COMMUNITY HALL     "What is happening in my community?"  │
│        Owns: Announcements, Events, Member Directory,           │
│              Organizations, Synagogues, Learning Groups,        │
│              Census entry CTA.                                  │
│        Does NOT own: Prayer Board (→ D-08),                     │
│                      Memorials (→ D-07).                        │
│        Removes: the Quick Access Grid (a nav hub inside a hub)  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  D-07  SACRED MEMORY      "Whom do we remember today?"          │
│        Owns: community memorial records, yahrzeit calendar,     │
│              virtual candle lighting, 3D Sanctuary.             │
│        Absorbs: /community/memorials list,                      │
│                 CommunityYahrzeitModal, YartzeitModal (viewing). │
│        Removes: Memorial section from Community Hall.           │
│        Connected: list → profile → sanctuary (one path).        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  D-08  PRAYER BOARD       "Who needs my prayers right now?"     │
│        Owns: full prayer request feed, submission, Amen.        │
│        Entry: from Community Hall (one CTA), Sacred Day (if     │
│               there is an urgent request today).                │
│        Removes: Prayer Board section from Community Hall.       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  D-09  RAV MENASHE        "What wisdom do I need?"              │
│        Owns: all AI conversation, session history,              │
│              context-aware responses (date, zmanim, holidays).  │
│        Single entry: center tab (mobile), named BottomNav item  │
│                      or dedicated card on web.                  │
│        Removes: unlabeled FAB on web, Home AI card (mobile).    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  D-10  MY JOURNEY         "How am I growing?"                   │
│        Owns: Torah Tracker (streaks, logs, goals, badges),      │
│              Mussar progress (48 Ways completion),              │
│              personal milestones, upcoming personal dates.      │
│        Removes: Zmanim card, Parasha card, Community preview,   │
│                 all redirects to other tabs.                    │
│        Absorbs: TorahTrackerModal content from Torah tab.       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  D-11  MY ACCOUNT         "How do I make this mine?"            │
│        Owns: profile, location (single canonical setting),      │
│              language, theme, notifications, premium mgmt,      │
│              admin tools (role-gated), changelog/What's New.    │
│        Removes: Premium row from BottomNav/sidebar              │
│                 (Premium lives in My Account or inline upsell). │
│        Census management: link to D-12 status only.            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  D-12  CENSUS             "Is my family counted?"               │
│        Owns: the full registration flow and completion record.  │
│        Single entry: Community Hall CTA (for unregistered).     │
│        Success: routes to Community Hall, not a dead end.       │
│        Removes: census entries from Journey, Home, Settings.    │
└─────────────────────────────────────────────────────────────────┘
```

---

### Home Headline Model

Under this architecture, Home becomes a **daily briefing** composed of headlines — not features. Each headline is the minimum needed to recognize an obligation, with a single tap to go deeper.

```
Sacred Day — headline structure:

[Sacred Time headline]    "Mincha in 42 minutes"           → Sacred Time
[Sacred Learning]         "Parashat Naso · Week 3 of 4"   → Sacred Learning
[Community alert]         "⚡ New announcement from..."    → Community Hall
[Memorial, if any]        "Yahrzeit: Yosef ben David"     → Sacred Memory
[Omer, if active]         "Sefirat HaOmer · Day 34"       → Sacred Time
[Silence]                 No content = no card shown.
```

What Home does NOT show under this model:
- A full Zmanim timeline (→ Sacred Time)
- Parasha text or details (→ Sacred Learning)
- Daf Yomi card (→ Sacred Learning)
- Daily Wisdom card (→ Sacred Learning, or removed entirely)
- Community section preview (→ Community Hall)
- Memorial entry card (→ Sacred Memory headline when relevant)
- Quick Actions navigation grid (→ remove: trust the navigation)
- Rav Menashe promotional card (→ remove: it has its own tab)
- Location badge (→ My Account, shared context)
- Premium crown (→ My Account or inline at point of lock)

---

### Torah Tab Restructure

The Torah tab currently merges three identities. Under this architecture:

```
BEFORE (one tab, three identities):
Torah Tab
├── Sacred Learning: Parasha · Daf Yomi · Mussar
├── Sacred Texts: Siddur · Tehillim · Tanakh · Mishnah · Halacha · Kuki · ...
└── My Journey: Study History · Bookmarks · Continue Last Study

AFTER (three destinations, clearly separated):
Sacred Learning (tab or primary section)
├── Today's Parasha → reading experience
├── Today's Daf Yomi → study session
├── Mussar Practice → 48 Ways
├── Learning Groups → /community/learning-groups
└── Sefaria Search → text lookup
    ↓ "Need a text?" → Sacred Texts

Sacred Texts (reachable from Sacred Learning)
└── Library: one entry point, category selected inside the screen

My Journey (tab)
├── Torah Tracker: streaks, logs, goals, badges
├── Mussar progress: 48 Ways completion
└── Personal milestones
```

---

### Community Hall Restructure

```
BEFORE (one tab, seven identities):
Community Tab
├── Announcements
├── Prayer Board (with preview)
├── Memorials (with candles)   ← belongs to Sacred Memory
├── Events
├── Quick Access Grid (6 items) ← navigation hub inside content hub
├── Organizations
├── Directory
└── Synagogues

AFTER (focused):
Community Hall
├── Announcements
├── Events
├── Member Directory
├── Organizations
├── Synagogues
├── Learning Groups
└── [Census CTA — for unregistered users only]

Removed to their own destinations:
├── Prayer Board → D-08 (linked from Community Hall)
└── Memorials → D-07 Sacred Memory (linked from Community Hall)
```

---

### Destination — Feature Ownership Summary

| Destination | Exclusively Owns | Receives Headlines From |
|-------------|-----------------|------------------------|
| Sacred Day | Today's obligations only | Sacred Time, Sacred Learning, Community Hall, Sacred Memory |
| Sacred Time | All prayer times, Omer, Shabbat, Compass, reminders | — |
| Sacred Calendar | All calendar views, holidays, Hebrew dates, lifecycle dates | — |
| Sacred Learning | Study launchers: Parasha, Daf Yomi, Mussar | Sacred Texts (library link), My Journey (progress link) |
| Sacred Texts | Complete library browse + read | — |
| Community Hall | Announcements, Events, Directory, Organizations, Synagogues, Learning Groups | Prayer Board (link), Sacred Memory (link), Census (CTA) |
| Sacred Memory | All memorial records, yahrzeit calendar, candles, Sanctuary | — |
| Prayer Board | Prayer request feed, submission, Amen | — |
| Rav Menashe | All AI conversation | — |
| My Journey | Torah Tracker, Mussar progress, badges, personal milestones | — |
| My Account | Profile, location, language, theme, notifications, premium, admin | — |
| Census | Registration flow and record | Community Hall (entry only) |

---

*End of MEP-400 Experience Architecture*
