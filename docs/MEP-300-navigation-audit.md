# MEP-300 — Navigation Architecture Audit
**Menashe Platform · Web + Mobile · July 2026**

---

## 1. NAVIGATION MAP

### 1.1 Web App — Complete Tap Inventory

#### Global Chrome

| # | Element | Location | Destination | Type |
|---|---------|----------|-------------|------|
| W-001 | Home | BottomNav | Home page | Page nav |
| W-002 | Calendar | BottomNav | Calendar page | Page nav |
| W-003 | Prayer Times | BottomNav | Zmanim page | Page nav |
| W-004 | Siddur Library | BottomNav | Siddur page | Page nav |
| W-005 | Settings | BottomNav | Settings page | Page nav |
| W-006 | Collapse/Expand | BottomNav | UI state toggle | UI only |
| W-007 | Chat FAB | AppShell (global) | ChatModal (Rav Menashe AI) | Modal |

#### Home Page

| # | Element | Location | Destination | Type |
|---|---------|----------|-------------|------|
| W-008 | Avatar / Profile | Home header | Settings page | Page nav |
| W-009 | Location Badge | Home header | LocationModal | Modal |
| W-010 | Premium Crown | Home header | PremiumPage | Page nav |
| W-011 | Notification Bell | Home header | NotificationDrawer | Drawer |
| W-012 | Theme Toggle | Home header | Dark/Light/Sapphire state | UI only |
| W-013 | Announcement Strip | Home header | AnnouncementsModal | Modal |
| W-014 | Dismiss Announcement | Home header | localStorage dismiss | Action |
| W-015 | Today Date Card (toggle) | Home hero | Expand/collapse inline | UI only |
| W-016 | "View All" Zmanim link | Home hero card | Zmanim page | Page nav |
| W-017 | Candle/Havdalah bar | Home hero | Zmanim page | Page nav |
| W-018 | Candle bar collapse toggle | Home hero | UI state toggle | UI only |
| W-019 | Shabbat Banner dismiss | Home hero | Dismiss banner | Action |
| W-020 | "Share" button | Holiday card | navigator.share / clipboard | Action |
| W-021 | Parasha Card | Learning section | ParashahModal | Modal |
| W-022 | Omer Card | Learning section | OmerModal | Modal |
| W-023 | Daily Wisdom Card | Learning section | Expand inline | UI only |
| W-024 | Omer button (in Daily Briefing) | Learning section | OmerModal | Modal |
| W-025 | Upcoming Celebrations — Member Directory | Community section | MemberDirectoryModal | Modal |
| W-026 | Upcoming Celebrations — WhatsApp | Community section | External WhatsApp | External |
| W-027 | Upcoming Celebrations — Email | Community section | External mail client | External |
| W-028 | Community Card expand | Community section | Expand inline | UI only |
| W-029 | Community Card — Member Directory | Community section | MemberDirectoryModal | Modal |
| W-030 | Community Card — Census | Community section | CensusModal | Modal |
| W-031 | Siddur Card | Prayer section | Siddur page | Page nav |
| W-032 | Memorial Sanctuary "Enter" | Memorial section | CommunityYahrzeitModal | Modal |
| W-033 | Holidays Quick Action | Quick Actions Grid | HolidaysModal | Modal |
| W-034 | Daf Yomi Quick Action | Quick Actions Grid | DafYomiModal (or PremiumModal) | Modal |
| W-035 | More Tools Quick Action | Quick Actions Grid | (context menu / undefined) | Unclear |
| W-036 | FAB toggle | Home FAB | Reveal/hide FAB menu | UI only |
| W-037 | FAB — Announcements | FAB menu | AnnouncementsModal | Modal |
| W-038 | FAB — Community Events | FAB menu | EventsModal | Modal |
| W-039 | FAB — Torah Wisdom | FAB menu | MussarModal | Modal |
| W-040 | FAB — Prayer Board | FAB menu | PrayerBoardModal | Modal |
| W-041 | FAB — Torah Tracker | FAB menu | TorahTrackerModal | Modal |
| W-042 | FAB — Location Map | FAB menu | Map view toggle | UI only |
| W-043 | FAB — Compass | FAB menu | Jerusalem compass toggle | UI only |

#### Calendar Page

| # | Element | Location | Destination | Type |
|---|---------|----------|-------------|------|
| W-044 | Location Header | Calendar page | LocationModal | Modal |
| W-045 | Previous Month | Calendar page | Calendar state | UI only |
| W-046 | Next Month | Calendar page | Calendar state | UI only |
| W-047 | Today | Calendar page | Reset calendar state | Action |
| W-048 | Day Cell | Calendar page | Set selected day | UI only |
| W-049 | View Details | Calendar page | DayModal | Modal |

#### Zmanim Page

| # | Element | Location | Destination | Type |
|---|---------|----------|-------------|------|
| W-050 | Location Header | Zmanim page | LocationModal | Modal |
| W-051 | Set Reminder (per row) | Zmanim page | Schedule notification | Action |
| W-052 | Premium Upsell | Zmanim page | PremiumPage | Page nav |
| W-053 | Info Icon | Zmanim page | ZmanimInfoModal | Modal |

#### Siddur Page

| # | Element | Location | Destination | Type |
|---|---------|----------|-------------|------|
| W-054 | Admin Crown | Siddur page | AdminModal | Modal |
| W-055 | Category Tab (×3) | Siddur page | Filter books | UI only |
| W-056 | Book Card | Siddur page | BookReaderModal | Modal |
| W-057 | Premium Lock | Siddur page | PremiumPage | Page nav |

#### Settings Page

| # | Element | Location | Destination | Type |
|---|---------|----------|-------------|------|
| W-058 | Profile / Avatar | Settings | ProfileModal | Modal |
| W-059 | Location Row | Settings | LocationModal | Modal |
| W-060 | Theme — Dark | Settings | Theme state | UI only |
| W-061 | Theme — Light | Settings | Theme state | UI only |
| W-062 | Theme — Sapphire | Settings | Theme state | UI only |
| W-063 | Translation Editor | Settings | TranslationEditorModal | Modal |
| W-064 | Push Notification Toggle | Settings | Grant/revoke push permission | Action |
| W-065 | Lead Time Buttons | Settings | Notification offset state | UI only |
| W-066 | Birthdays Row | Settings | BirthdayModal | Modal |
| W-067 | Yartzeits Row | Settings | YartzeitModal | Modal |
| W-068 | Community Row | Settings | CommunityModal | Modal |
| W-069 | Census Row | Settings | CensusModal | Modal |
| W-070 | Premium Row | Settings | PremiumPage | Page nav |
| W-071 | Sign Out | Settings | Clerk signOut() | Action |
| W-072 | Admin Panel (hidden) | Settings | AdminModal | Modal |

#### Premium Page

| # | Element | Location | Destination | Type |
|---|---------|----------|-------------|------|
| W-073 | Back Button | PremiumPage | Home page | Page nav |
| W-074 | Feature Cards (expand) | PremiumPage | Expand inline | UI only |
| W-075 | Unlock Premium (in cards) | PremiumPage | PremiumModal | Modal |
| W-076 | See All Features toggle | PremiumPage | Expand table | UI only |
| W-077 | Monthly/Annual toggle | PremiumPage | Price state | UI only |
| W-078 | Start Free Trial | PremiumPage | PremiumModal / payment sim | Modal |
| W-079 | Pay / Cancel / Confirm | PremiumPage | Payment simulation | Action |

**Web Total: 79 tap targets**

---

### 1.2 Mobile App — Complete Tap Inventory

#### Tab Bar + Side Drawer

| # | Element | Location | Destination | Type |
|---|---------|----------|-------------|------|
| M-001 | Home tab | Tab bar | /(tabs)/index | Tab |
| M-002 | Calendar tab | Tab bar | /(tabs)/calendar | Tab |
| M-003 | Rav Menashe (center) | Tab bar | /sacred-wisdom | Screen |
| M-004 | Study tab | Tab bar | /(tabs)/torah | Tab |
| M-005 | More tab | Tab bar | /(tabs)/community | Tab |
| M-006 | Hamburger | Home header | Open side drawer | Drawer |
| M-007 | Settings button | Home header | /(tabs)/settings | Screen |
| M-008 | Profile Picture | Home header | (no action — visual only) | Dead |
| M-009 | Location Picker | Home header | Location selection modal | Modal |
| M-010 | Language — EN | Home header | Language state | UI only |
| M-011 | Language — TK | Home header | Language state | UI only |
| M-012 | Drawer — Close | Side drawer | Close drawer | Action |
| M-013 | Drawer — Journey | Side drawer | /(tabs)/journey | Screen |
| M-014 | Drawer — Calendar | Side drawer | /(tabs)/calendar | Tab |
| M-015 | Drawer — Zmanim | Side drawer | /(tabs)/zmanim | Screen |
| M-016 | Drawer — Community | Side drawer | /(tabs)/community | Tab |
| M-017 | Drawer — Torah | Side drawer | /(tabs)/torah | Tab |
| M-018 | Drawer — Settings | Side drawer | /(tabs)/settings | Screen |

#### Home Screen Sections

| # | Element | Location | Destination | Type |
|---|---------|----------|-------------|------|
| M-019 | Daily Focus Card | Home hero | /(tabs)/torah | Screen |
| M-020 | Zmanim — See All | Home zmanim section | /(tabs)/zmanim | Screen |
| M-021 | Zmanim Card | Home zmanim section | /(tabs)/zmanim | Screen |
| M-022 | Zmanim list items (each) | Home zmanim section | /(tabs)/zmanim | Screen |
| M-023 | Calendar Card | Home calendar section | /(tabs)/calendar | Tab |
| M-024 | Parasha — See All | Home torah section | /(tabs)/torah | Tab |
| M-025 | Parasha Card | Home torah section | /(tabs)/torah | Tab |
| M-026 | Daf Yomi Card | Home torah section | /daf-yomi | Screen |
| M-027 | Community — See All | Home community section | /(tabs)/community | Tab |
| M-028 | Community items | Home community section | /(tabs)/community | Tab |
| M-029 | Memorial Sanctuary Card | Home memorial section | /sacred-memory | Screen |
| M-030 | Quick Action — Calendar | Quick actions grid | /(tabs)/calendar | Tab |
| M-031 | Quick Action — Zmanim | Quick actions grid | /(tabs)/zmanim | Screen |
| M-032 | Quick Action — Torah | Quick actions grid | /(tabs)/torah | Tab |
| M-033 | Quick Action — Community | Quick actions grid | /(tabs)/community | Tab |
| M-034 | Quick Action — Journey | Quick actions grid | /(tabs)/journey | Screen |
| M-035 | Quick Action — Settings | Quick actions grid | /(tabs)/settings | Screen |
| M-036 | Go Premium CTA | Home footer | **EMPTY ACTION — dead end** | Dead |

#### Community Tab

| # | Element | Location | Destination | Type |
|---|---------|----------|-------------|------|
| M-037 | SmartAnnouncement Card | Community tab | /community/announcements | Screen |
| M-038 | Latest Announcement (HubHero) | Community tab | /community/announcements | Screen |
| M-039 | View All Announcements | Community tab | /community/announcements | Screen |
| M-040 | Prayer Request Card | Community tab | /prayer-board | Screen |
| M-041 | View All Prayer Requests | Community tab | /prayer-board | Screen |
| M-042 | Memorials Card | Community tab | /community/memorials | Screen |
| M-043 | Sacred Memory / Candle | Community tab | /sacred-memory | Screen |
| M-044 | Events Card | Community tab | /community/events | Screen |
| M-045 | View All Events | Community tab | /community/events | Screen |
| M-046 | Organizations | Community tab | /community/organizations | Screen |
| M-047 | Directory | Community tab | /community/directory | Screen |
| M-048 | Learning Groups | Community tab | /community/learning-groups | Screen |
| M-049 | Synagogues | Community tab | /community/synagogues | Screen |
| M-050 | Participate in Census CTA | Community tab | /census/demographics | Screen |

#### Torah Tab

| # | Element | Location | Destination | Type |
|---|---------|----------|-------------|------|
| M-051 | Parashah tile | Torah tab | ParashahModal (inline) | Modal |
| M-052 | Torah Tracker tile | Torah tab | /torah-tracker | Screen |
| M-053 | Daf Yomi tile | Torah tab | /daf-yomi | Screen |
| M-054 | Siddur tile | Torah tab | /siddur (category: Siddur) | Screen |
| M-055 | Prayer tile | Torah tab | /siddur (category: Prayer Books) | Screen |
| M-056 | Calendar tile | Torah tab | /(tabs)/calendar | Tab |
| M-057 | Learning Library tile | Torah tab | /siddur (category: All) | Screen |
| M-058 | Bookmarks tile | Torah tab | Scroll to bookmarks | UI only |
| M-059 | Library — Siddur | Torah list | /siddur (category: Siddur) | Screen |
| M-060 | Library — Tehillim | Torah list | /siddur (category: Tehillim) | Screen |
| M-061 | Library — Tanakh | Torah list | /siddur (category: Tanakh) | Screen |
| M-062 | Library — Mishnah | Torah list | /siddur (category: Mishnah) | Screen |
| M-063 | Library — Talmud | Torah list | /daf-yomi | Screen |
| M-064 | Library — Mussar | Torah list | /mussar | Screen |
| M-065 | Library — Kuki Resources | Torah list | /siddur (category: Kuki) | Screen |
| M-066 | Library — Prayer Books | Torah list | /siddur (category: Prayer Books) | Screen |
| M-067 | Continue Last Study | Torah tab | Resume last route | Action |
| M-068 | Daf Yomi button | Torah tab | /daf-yomi | Screen |
| M-069 | Mussar button | Torah tab | /mussar | Screen |
| M-070 | Halacha button | Torah tab | /siddur (category: Halacha) | Screen |

#### Journey Tab

| # | Element | Location | Destination | Type |
|---|---------|----------|-------------|------|
| M-071 | Settings button | Journey header | /(tabs)/settings | Screen |
| M-072 | Today's Learning card | Journey | /community/learning-detail/[id] | Screen |
| M-073 | Daily Zmanim card | Journey | /(tabs)/zmanim | Screen |
| M-074 | Upcoming Events card | Journey | /community/events | Screen |
| M-075 | Community Announcements card | Journey | /community/announcements | Screen |
| M-076 | Join Community Hub | Journey | /(tabs)/community | Tab |
| M-077 | Complete Census | Journey | /census | Screen |
| M-078 | Sacred Memory | Journey | /sacred-memory | Screen |

#### Zmanim Tab

| # | Element | Location | Destination | Type |
|---|---------|----------|-------------|------|
| M-079 | Previous Day | Zmanim tab | Decrement date state | UI only |
| M-080 | Next Day | Zmanim tab | Increment date state | UI only |
| M-081 | Return to Today | Zmanim tab | Reset date state | Action |
| M-082 | Bell (per zman row) | Zmanim tab | Schedule notification | Action |
| M-083 | Week Ahead upsell | Zmanim tab | **PLACEHOLDER — no destination** | Dead |

#### Calendar Tab

| # | Element | Location | Destination | Type |
|---|---------|----------|-------------|------|
| M-084 | Previous Month | Calendar tab | Calendar state | UI only |
| M-085 | Next Month | Calendar tab | Calendar state | UI only |
| M-086 | Day Cell | Calendar tab | Show day details modal | Modal |
| M-087 | Go Today | Calendar tab | Reset to current month | Action |
| M-088 | View Zmanim (in day modal) | Calendar tab | /(tabs)/zmanim | Screen |

#### Settings Tab

| # | Element | Location | Destination | Type |
|---|---------|----------|-------------|------|
| M-089 | Edit Profile | Settings | /profile/edit | Screen |
| M-090 | Translation Editor | Settings | /translation-editor | Screen |
| M-091 | Journey link | Settings | /(tabs)/journey | Screen |
| M-092 | Community link | Settings | /(tabs)/community | Tab |
| M-093 | Sign Out | Settings | Clerk signOut() | Action |
| M-094 | Version (5-tap secret) | Settings | Reveal User ID | Hidden |

**Mobile Total: 94 documented tap targets + ~30 within sub-screens**
**Mobile Approximate Total: ~145 tap targets**

---

## 2. DUPLICATE DESTINATIONS

### Web Platform — Duplicates

| Destination | Entry Points | Count |
|-------------|-------------|-------|
| **LocationModal** | Home Badge · Calendar Header · Zmanim Header · Settings Row | **4×** |
| **PremiumPage** | Home Crown · Zmanim Upsell · Siddur Lock · Settings Row | **4×** |
| **Zmanim Page** | BottomNav · Home Date Card "View All" · Home Candle bar · Home Zmanim Timeline | **4×** |
| **AnnouncementsModal** | Home Announcement Strip · Home FAB item | **2×** |
| **YartzeitModal** | Home Yahrzeit Card · Settings Yartzeits Row | **2×** |
| **CensusModal** | Home Community Card · Settings Census Row | **2×** |
| **MemberDirectoryModal** | Home Celebrations section · Home Community Card | **2×** |
| **AdminModal** | Siddur Crown button · Settings hidden Admin Panel | **2×** |
| **Settings Page** | BottomNav · Home Avatar/Profile button | **2×** |
| **Siddur Page** | BottomNav · Home Prayer Card | **2×** |
| **OmerModal** | Home Omer Card · Daily Briefing Omer button | **2×** |

### Mobile Platform — Duplicates

| Destination | Entry Points | Count |
|-------------|-------------|-------|
| **Zmanim** | More tab · Home See All · Home Zmanim Card · Home individual items · Home Quick Actions · Side Drawer · Calendar "View Zmanim" · Journey Daily Zmanim | **8×** |
| **Torah Tab** | Tab bar · Home Daily Focus · Home Parasha See All · Home Parasha Card · Home Quick Actions · Side Drawer | **6×** |
| **Calendar Tab** | Tab bar · Home Quick Actions · Home Calendar Card · Side Drawer · Torah tile | **5×** |
| **Community Tab** | More tab · Home See All · Home Quick Actions · Side Drawer · Journey "Join Hub" · Settings link | **6×** |
| **Settings** | More tab · Home Header button · Home Quick Actions · Side Drawer · Journey header | **5×** |
| **Journey** | Home Quick Actions · Side Drawer · Settings link | **3×** |
| **/sacred-memory** | Home Memorial Card · Community Candle Card · Journey "Sacred Memory" | **3×** |
| **/daf-yomi** | Home Daf Yomi Card · Torah Talmud list · Torah Daf Yomi tile · Torah Daf Yomi button | **4×** |
| **/mussar** | Torah Mussar list · Torah Mussar tile · Torah Mussar button | **3×** |
| **/siddur** | Torah tiles (Siddur, Prayer, Library, Halacha, Kuki, Tehillim, Tanakh, Mishnah, Prayer Books = **8 entries** with different category params — indistinguishable to the user) | **8×** |
| **/community/announcements** | Community SmartCard · Community HubHero · Community View All (same screen, 3 taps) | **3×** |
| **/community/events** | Community Events Card · Community View All Events (same screen, 2 taps) | **2×** |
| **/prayer-board** | Community Prayer Card · Community View All Prayer | **2×** |

---

## 3. NAVIGATION FATIGUE REPORT

### F-001 — The Home Screen Is a Mirror of the Entire App
**Severity: Critical**

The Home screen contains redundant entry points to every major destination. The Quick Actions Grid (6 buttons) is a complete second Tab Bar embedded inside a tab. The Side Drawer (7 buttons) is a third Tab Bar. The result: users can reach Zmanim 8 different ways on mobile, Torah 6 ways, Calendar 5 ways. The Home tab no longer has a clear identity — it is just the app's navigation system, displayed again.

### F-002 — The FAB is a Hidden Second Navigation System (Web)
**Severity: High**

The Home FAB opens a 7-item menu: Announcements, Events, Torah Wisdom, Prayer Board, Torah Tracker, Location Map, Compass. None of these are in the BottomNav. This creates a split navigation model where important features (Prayer Board, Torah Tracker, Mussar) exist only in a hidden menu that users must discover by pressing an unlabeled floating button.

### F-003 — Everything Is a Modal (Web)
**Severity: High**

The web app has 31 modals and only 6 pages. Features like Parashah study, Daf Yomi, Mussar, Prayer Board, Announcements, Member Directory, Census, Omer, Holidays, Yahrzeit, and Community are all dead-end modals. There is no forward navigation between features — dismissing a modal returns to the same page with no memory of context. Users cannot move from Parasha directly to Daf Yomi without going back to Home.

### F-004 — The Torah/Siddur Screen Has 8 Paths to the Same Place
**Severity: High**

On mobile, the /siddur screen is reached from: Siddur tile, Prayer tile, Learning Library tile, Halacha button, Kuki Resources, Tehillim, Tanakh, Mishnah, Prayer Books — all from within the Torah tab alone. Each passes a different category param, but the screen looks identical on entry. Users tapping different tiles believe they are going to different places but land on the same screen.

### F-005 — Premium Is Scattered, Not Presented
**Severity: Medium**

Premium appears as a destination in 4 places on web (Crown, Zmanim upsell, Siddur lock, Settings row) but the PremiumPage is a dead end — no links forward to the locked features once upgraded. The Zmanim "Week Ahead" premium card on mobile is a placeholder with no destination.

### F-006 — The Side Drawer Fully Duplicates the Tab Bar (Mobile)
**Severity: Medium**

The Side Drawer contains exactly the same 6 destinations as the Tab Bar (Home, Calendar, Zmanim, Community, Torah, Settings). It adds zero new destinations and trains users to discover navigation via a hidden gesture rather than the visible tabs.

### F-007 — Dead-End Screens With No Forward Path
**Severity: Medium**

Several screens terminate without guidance:
- **Web PremiumPage**: Shows features, pricing, payment — no links back to the features users just unlocked.
- **Mobile census/success**: Replaces the stack, presents no "what's next" CTA.
- **Mobile community/memorials**: Lists memorials, no path to enter the Sacred Memory sanctuary.
- **Mobile Profile Picture (Home header)**: Tappable area with no action.
- **Mobile Go Premium CTA**: Empty `{}` action — tapping does nothing.
- **Mobile Zmanim "Week Ahead"**: Premium placeholder with no destination.

### F-008 — Journey Tab Is Underutilized and Indirectly Duplicates Other Screens
**Severity: Medium**

The Journey tab contains 8 actions — every one of them links to content that lives on another tab (Zmanim, Community, Torah, Calendar). Journey has no exclusive content. Its cards for "Daily Zmanim," "Community Announcements," and "Upcoming Events" are previews that redirect to those tabs, making Journey feel like a third Home screen.

### F-009 — Modals Cannot Cross-Navigate (Web)
**Severity: Medium**

Opening a modal and closing it resets the user to the same page. A user reading the Parasha (ParashahModal) cannot navigate directly to Daf Yomi, Mussar, or Torah Tracker. Each feature is an isolated island accessed only via Home or the FAB.

### F-010 — The "More" Tab Hides Critical Screens
**Severity: Low–Medium**

On mobile, "More" maps to Community, but also activates for Settings, Zmanim, and Journey. The tab icon says "More" regardless of which sub-destination is active. Users have no visual signal that Zmanim is accessible via "More" — it appears to only live on the same tab as Community.

---

## 4. DESTINATION CATEGORIES

Every destination has been assigned exactly one category.

### Sacred Time
| Platform | Destination | Entry Method |
|----------|-------------|--------------|
| Web | Zmanim page (Prayer Times) | Page |
| Web | ZmanimInfoModal | Modal |
| Web | DayModal (Calendar detail) | Modal |
| Web | HolidaysModal | Modal |
| Web | OmerModal | Modal |
| Web | LuachModal | Modal |
| Mobile | /(tabs)/zmanim | Tab screen |
| Mobile | /(tabs)/calendar | Tab screen |

### Calendar
| Platform | Destination | Entry Method |
|----------|-------------|--------------|
| Web | CalendarPage | Page |
| Web | DayModal | Modal |
| Mobile | /(tabs)/calendar | Tab |

### Prayer
| Platform | Destination | Entry Method |
|----------|-------------|--------------|
| Web | SiddurPage | Page |
| Web | BookReaderModal | Modal |
| Web | PrayerBoardModal | Modal |
| Web | PrayerTimesModal | Modal |
| Web | TaharaModal / MikvehCalendarModal | Modal |
| Mobile | /siddur | Screen |
| Mobile | /prayer-board | Screen |

### Torah Learning
| Platform | Destination | Entry Method |
|----------|-------------|--------------|
| Web | ParashahModal | Modal |
| Web | DafYomiModal | Modal |
| Web | MussarModal | Modal |
| Web | TorahTrackerModal | Modal |
| Web | SefariaSearchModal | Modal |
| Web | TorahNoteModal | Modal |
| Mobile | /(tabs)/torah | Tab |
| Mobile | /daf-yomi | Screen |
| Mobile | /mussar | Screen |
| Mobile | /torah-tracker | Screen |
| Mobile | /siddur | Screen |
| Mobile | /community/learning-groups | Screen |
| Mobile | /community/learning-detail/[id] | Screen |

### Community
| Platform | Destination | Entry Method |
|----------|-------------|--------------|
| Web | AnnouncementsModal | Modal |
| Web | EventsModal | Modal |
| Web | PrayerBoardModal | Modal |
| Web | CommunityModal | Modal |
| Web | MemberDirectoryModal | Modal |
| Web | CensusModal | Modal |
| Mobile | /(tabs)/community | Tab |
| Mobile | /community/announcements | Screen |
| Mobile | /community/events | Screen |
| Mobile | /community/organizations | Screen |
| Mobile | /community/synagogues | Screen |
| Mobile | /community/directory | Screen |
| Mobile | /community/directory-register | Screen |
| Mobile | /prayer-board | Screen |
| Mobile | /census/* (5-step flow) | Screen flow |

### Memorial
| Platform | Destination | Entry Method |
|----------|-------------|--------------|
| Web | CommunityYahrzeitModal (Memorial Sanctuary 3D) | Modal |
| Web | YartzeitModal | Modal |
| Mobile | /sacred-memory | Screen |
| Mobile | /community/memorials | Screen |

### AI Wisdom
| Platform | Destination | Entry Method |
|----------|-------------|--------------|
| Web | ChatModal (Rav Menashe) | Global FAB |
| Mobile | /sacred-wisdom | Center tab |

### Profile
| Platform | Destination | Entry Method |
|----------|-------------|--------------|
| Web | ProfileModal | Modal |
| Web | BirthdayModal | Modal |
| Web | YartzeitModal | Modal |
| Mobile | /profile/edit | Screen |
| Mobile | /(tabs)/journey | Tab |

### Settings
| Platform | Destination | Entry Method |
|----------|-------------|--------------|
| Web | SettingsPage | Page |
| Web | LocationModal | Modal |
| Web | TranslationEditorModal | Modal |
| Web | WhatsNewModal | Modal |
| Mobile | /(tabs)/settings | Tab screen |
| Mobile | /translation-editor | Screen |

### Premium
| Platform | Destination | Entry Method |
|----------|-------------|--------------|
| Web | PremiumPage | Page |
| Web | PremiumModal | Modal |
| Mobile | (not yet implemented) | — |

### Admin
| Platform | Destination | Entry Method |
|----------|-------------|--------------|
| Web | AdminModal | Hidden (role-gated) |

---

## 5. NAVIGATION HEALTH METRICS

| Metric | Web | Mobile | Combined |
|--------|-----|--------|---------|
| **Total tap targets** | 79 | ~145 | **~224** |
| **Unique destinations** | 37 (6 pages + 31 modals) | 30 screens | **~55 combined** |
| **Duplicate destinations** | 11 destination groups with 2–4× entries | 13 destination groups with 2–8× entries | **24 duplication groups** |
| **Dead-end screens** | 5 | 6 | **11** |
| **Placeholder / broken tap targets** | 1 (W-035 "More Tools") | 3 (M-008, M-036, M-083) | **4** |
| **Navigation loops** | 3 | 2 | **5** |
| **Hidden/undiscoverable features** | 7 (behind FAB) | 1 (behind hamburger drawer) | **8** |
| **Screens reachable via 4+ paths** | 4 (Location, Premium, Zmanim, Siddur) | 6 (Zmanim, Torah, Calendar, Community, Settings, /siddur) | **10** |

### Navigation Loops Identified

| # | Loop | Platform |
|---|------|----------|
| L-001 | Home → FAB → AnnouncementsModal → Close → Home (no progression) | Web |
| L-002 | Settings → CommunityModal → Close → Settings (no deeper path) | Web |
| L-003 | Home → PremiumPage → Back → Home → Crown → PremiumPage | Web |
| L-004 | Home Quick Actions Grid → any Tab → Tab bar Home → Home Quick Actions | Mobile |
| L-005 | Side Drawer → any Tab → Home → Hamburger → Side Drawer | Mobile |

---

## 6. NAVIGATION SCORE

| Dimension | Score | Reasoning |
|-----------|-------|-----------|
| **Discoverability** | 4 / 10 | 7 features hidden behind FAB on web; Journey, Mussar, Torah Tracker buried on mobile; Sacred Wisdom requires center tab tap |
| **Flow** | 3 / 10 | Modal architecture means every feature is a dead end; no cross-navigation between related content |
| **Clarity** | 6 / 10 | Tab labels are clear; BottomNav is readable; FAB menu and "More" tab undermine clarity |
| **Uniqueness** | 2 / 10 | Zmanim reachable 8 ways; /siddur has 8 entries from the same screen; Quick Actions Grid duplicates Tab Bar entirely |
| **Depth** | 7 / 10 | Rich content exists behind every destination; content depth is the app's strongest quality |
| **Exploration** | 3 / 10 | Features cannot navigate to each other; every journey back-tracks to Home first |
| **Overall Navigation Quality** | **4 / 10** | The platform has exceptional content depth trapped behind a modal-and-hub architecture that fragments the experience into isolated islands |

---

## 7. TOP 20 NAVIGATION IMPROVEMENTS

Ordered by impact. No code changes — architecture recommendations only.

---

### NI-001 — Give Every Sacred Feature Its Own Destination
**Priority: Critical | Category: Torah Learning / Community**

Parashah, Daf Yomi, Mussar, Prayer Board, Torah Tracker, and Omer are currently dead-end modals (web) or scattered sub-screens (mobile) with no consistent address or cross-links. Each deserves a dedicated, named destination.

**Current**: Home → FAB → MussarModal → (dead end)
**Proposed**: Torah Learning → Mussar (Character Builder) → persistent session with related content links

---

### NI-002 — Replace the FAB Community Hub With a Dedicated Community Surface (Web)
**Priority: Critical | Category: Community**

The 7-item FAB menu is the primary (and only) path to Announcements, Events, Prayer Board, Torah Tracker, Mussar, Map, and Compass. This is a hidden second navigation system. These features should be promoted to first-class destinations accessible from the BottomNav or a dedicated Community page.

**Current**: Home FAB → 7 unlabeled modal items
**Proposed**: Add "Community" to the BottomNav; FAB becomes context-sensitive or is removed

---

### NI-003 — Collapse the Home Quick Actions Grid Into the Tab Bar (Mobile)
**Priority: High | Category: All**

The Quick Actions Grid (Calendar, Zmanim, Torah, Community, Journey, Settings) is a second Tab Bar embedded inside Home. It adds no new destinations and trains users to ignore the actual Tab Bar.

**Current**: Quick Actions Grid (6 items) + Tab Bar (5 items) + Side Drawer (7 items) = 18 taps for 6 destinations
**Proposed**: Remove Quick Actions Grid; trust the Tab Bar to do its job

---

### NI-004 — Eliminate the Side Drawer (Mobile)
**Priority: High | Category: All**

The hamburger menu side drawer duplicates the Tab Bar exactly. It adds zero unique destinations and creates a second, hidden navigation system that undermines Tab Bar discoverability.

**Current**: Hamburger → Journey, Calendar, Zmanim, Community, Torah, Settings
**Proposed**: Remove the drawer; surface Journey (currently hidden in "More") as a named tab

---

### NI-005 — Promote "Zmanim" to Its Own Tab (Mobile)
**Priority: High | Category: Sacred Time**

Zmanim is the most-reached destination (8 paths to it) — evidence that users want it immediately. It currently lives under "More" and requires extra navigation to reach.

**Current**: More tab → activates for zmanim route
**Proposed**: Zmanim gets its own tab position; "More" becomes a true overflow or is removed

---

### NI-006 — Give Parashah a Reading Destination, Not a Modal
**Priority: High | Category: Torah Learning**

The Parasha section is a central weekly experience. Opening a modal for it, reading it, and being forced to dismiss back to Home creates no continuity.

**Current**: Home card → ParashahModal → dismiss → Home
**Proposed**: Parashah → dedicated Parasha Reading screen with links to commentaries, related Daf Yomi, and next/prev week

---

### NI-007 — Link community/memorials → /sacred-memory
**Priority: High | Category: Memorial**

On mobile, the Community tab links to `/community/memorials` (a list screen) and separately to `/sacred-memory` (the 3D sanctuary). These are disconnected. Users browsing memorials have no path into the sanctuary; users in the sanctuary cannot return to the list.

**Current**: Two separate, disconnected Memorial surfaces
**Proposed**: `/community/memorials` list has a "Enter Sanctuary" CTA; sanctuary has a "Browse All" back link

---

### NI-008 — Make PremiumPage Lead Somewhere After Upgrade
**Priority: High | Category: Premium**

The PremiumPage is a dead end — after a user upgrades (or simulates it), they are sent back to Home. They have no path to the features they just unlocked.

**Current**: Premium → payment → Back → Home
**Proposed**: After upgrade confirmation, route to the feature they came from (e.g., PremiumPage entered from Zmanim → return to Zmanim with Week Ahead unlocked)

---

### NI-009 — Consolidate the /siddur Entry Points Into a Library Hub (Mobile)
**Priority: High | Category: Prayer / Torah Learning**

The Siddur screen is the destination for 8 different taps on the Torah tab (Siddur, Prayer, Library, Halacha, Kuki, Tehillim, Tanakh, Mishnah). The user sees the same screen regardless of which they chose; the only difference is a pre-selected category filter.

**Current**: 8 separate list items and tiles, all → /siddur with category param
**Proposed**: One "Sacred Library" destination; the category grid is the entry screen itself, not a filter applied after arrival

---

### NI-010 — Convert LocationModal to a Persistent Location Context (Web)
**Priority: Medium | Category: Settings / Sacred Time**

LocationModal is opened from 4 different places (Home, Calendar, Zmanim, Settings). It is structural context — not a feature. Location should be set once (in Settings or on first use) and visible as a persistent header element, not a modal reached by tapping four different things.

**Current**: 4 taps → same LocationModal
**Proposed**: Location set in onboarding / Settings; shown as persistent chip; only one edit path (Settings)

---

### NI-011 — Give Daf Yomi a Dedicated Study Session Screen
**Priority: Medium | Category: Torah Learning**

Daf Yomi is a daily practice. It currently opens as a modal (web) or as a standalone screen (mobile) but has no continuity — no streak tracking visible inline, no navigation to related tractate.

**Current**: Home card → DafYomiModal → dismiss
**Proposed**: Daf Yomi → dedicated Study Session: current daf, next daf, tractate progress, link to Torah Tracker streak

---

### NI-012 — Give the Journey Tab Exclusive Content
**Priority: Medium | Category: Profile**

Every Journey tab item redirects to another tab. Journey has no unique content of its own, making it feel like a redundant home screen.

**Current**: Journey → links only to Zmanim, Community, Events, Announcements
**Proposed**: Journey owns spiritual progress: milestones, study streaks, community standing, upcoming personal dates — content that cannot be found on any other tab

---

### NI-013 — Fix the Broken "Go Premium" CTA on Mobile Home
**Priority: Medium | Category: Premium**

The "Go Premium" button on the Home screen has an empty action `{}`. It is a tap target that does nothing — users tap it, nothing happens, and they are left confused.

**Current**: Go Premium → `{}` (no action)
**Proposed**: Route to a Premium screen or show a Premium sheet

---

### NI-014 — Create a Torah Learning Hub to Replace Modal Sprawl (Web)
**Priority: Medium | Category: Torah Learning**

Parashah, Daf Yomi, Mussar, Torah Tracker, Sefaria Search, and Torah Notes are each separate modals. They share a category but have no hub, no cross-links, and no continuity.

**Current**: 6 separate modals, each a dead end
**Proposed**: "Torah Learning" page in BottomNav (replace or augment Siddur); internal tab bar: Parasha · Daf · Mussar · Tracker · Library

---

### NI-015 — Resolve the "More" Tab Identity Problem (Mobile)
**Priority: Medium | Category: All**

The "More" tab activates for Community, Settings, Zmanim, and Journey. The icon never changes. Users cannot tell which section they are in just by looking at the tab bar.

**Current**: One "More" tab handles 4 unrelated destinations
**Proposed**: Each major destination gets its own tab or clear sub-navigation within "More"

---

### NI-016 — Reduce LocationModal to One Canonical Entry Point (Web)
**Priority: Medium | Category: Settings**

See NI-010. The immediate fix: remove the Location header from Calendar and Zmanim pages (it is not needed there; location is not changing during calendar browsing) and retain it only in Home header and Settings.

---

### NI-017 — Add "What's Next" CTAs to Census Success (Mobile)
**Priority: Medium | Category: Community**

The Census success screen replaces the stack (no back navigation) but presents no forward path. Users complete the census and are stranded.

**Current**: Census success → stack replaced, no CTA
**Proposed**: "Return to Community" and "View Census Summary" CTAs on the success screen

---

### NI-018 — Surface Rav Menashe AI as a Named Destination on Web
**Priority: Medium | Category: AI Wisdom**

The AI chat on web is a global floating button with no label. There is no other way to find it. On mobile it is the center tab (well-positioned); on web it is a discovery problem.

**Current**: Unnamed floating chat icon in AppShell corner
**Proposed**: Named entry in BottomNav ("Wisdom" or "Rav Menashe") OR a named card on Home with a clear CTA

---

### NI-019 — Connect the Two Memorial Systems
**Priority: Low–Medium | Category: Memorial**

Web has `CommunityYahrzeitModal` (community yahrzeit list → 3D Sanctuary). Mobile has `/community/memorials` (list) and `/sacred-memory` (sanctuary). The two systems are disconnected even within each platform.

**Current**: Web: modal stack; Mobile: two disconnected screens
**Proposed**: Unified Memorial destination: list → profile → sanctuary; one clear path across both platforms

---

### NI-020 — Fix the Profile Picture Tap Dead Zone (Mobile)
**Priority: Low | Category: Profile**

The Profile Picture in the Home header has a tap gesture attached but no navigation action. It looks interactive but does nothing — a common pattern associated with broken UX.

**Current**: Profile Pic → no action
**Proposed**: Profile Pic → /profile/edit (same as Edit Profile in Settings)

---

*End of MEP-300 Navigation Architecture Audit*
