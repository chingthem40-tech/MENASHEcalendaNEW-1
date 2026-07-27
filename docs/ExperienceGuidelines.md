# Menashe Calendar — Experience Guidelines

## Guiding Principle

*Every feature should feel like it was designed for this specific community — the Bnei Menashe — not retrofitted from a generic calendar app.*

The app is sacred software. It holds prayer times, remembrances of the departed, and Torah study. Every interaction should feel intentional, calm, and reverent.

---

## The Home Journey

The Home page follows a deliberate user journey from top to bottom:

1. **Greeting** — Personal, time-aware welcome (morning / afternoon / evening)
2. **Hebrew Date & Zmanim** — Today's spiritual anchor: what day is it in the Jewish calendar, and when are the prayer windows?
3. **Today's Learning** — Parasha of the week, Omer count, daily wisdom
4. **Community** — Upcoming birthdays, aliyah anniversaries, community directory
5. **Memorial Sanctuary entry** — A quiet invitation into the community memorial space
6. **Prayer & Quick Actions** — Siddur library, holidays, Daf Yomi — deeper tools for those who want them

**Anti-patterns to avoid**:
- Do not reorder sections without considering the journey above
- Do not place the Memorial Sanctuary above Community — it should feel like a door you approach, not a billboard
- Do not add new sections without removing or condensing something else — maintain the single-focus-per-viewport principle

---

## Memorial Sanctuary

The Memorial Sanctuary is a sacred, separate space. It has its own visual language: near-black backgrounds, warm candlelight amber, slow animations.

### Truth & Trust

**No fabricated data is permitted in the Memorial Sanctuary.**

- Do not generate fake candle counts, visitor counts, flower counts, or engagement notifications
- Do not generate fake user names (e.g. "Sarah from Jerusalem lit a candle")
- If real data is unavailable, display an honest empty state: *"No recent activity yet."*
- Real data includes: actual memorial entries from the database, actual dates of passing, actual messages left by real users

### Navigation & Hierarchy

- **Primary entry**: Home page Memorial Sanctuary Entry card → `onShowCommunityYahrzeit`
- **Secondary entry**: Community FAB → Memorial item
- The Memorial Sanctuary modal (`MemorialSanctuaryModal.tsx`) is the single production path for the 3D/2D sanctuary experience

### Memorial Profile Sheet

- Show only real data from the `CommunityYahrzeitEntry` database record
- The Life Timeline shows only the year of passing (real data). Do not generate fake birth years or life milestones
- Stats shown: real candle count from the database only. No flowers, no visitor counts unless real data pipelines exist

---

## Bilingual UI (EN / TK)

Every visible string must be in both English and Thadou Kuki.

**The rule**: If you hardcode an English string in a component, it is a bug.

**The workflow**:
1. Add the key to the `Translations` interface in `translations.ts`
2. Add the English value to the `en` object
3. Add the Thadou Kuki value to the `tk` object (ask a community member for review if unsure)
4. Reference via `const { t } = useLanguage()` → `t.yourKey`

---

## Motion & Animation

- Use `framer-motion` on web for entrance / exit / presence animations
- Keep animations subtle: `duration: 0.2–0.4s`, `spring` physics preferred over `tween`
- The Memorial Sanctuary is the only context where longer, cinematic animations (1–3s) are appropriate
- Avoid animation on data-heavy lists (can cause janky scroll on low-power devices)

---

## Forms

- **Mobile**: Always use `KeyboardAvoidingView` with `behavior="padding"` (iOS) and `behavior="height"` (Android) + `keyboardVerticalOffset={24}` (Android)
- **Mobile**: Use `keyboardShouldPersistTaps="handled"` on `ScrollView` wrapping forms
- **Web**: Ensure form fields are visible above the keyboard on small viewports (max-height + overflow-y)
- Required fields: mark with `*` and validate before submission — never silent failures

---

## Performance

- The 3D Memorial Sanctuary (`MemorialValley3D.tsx`) is heavy. It must not render on mobile (screens < 768px), where `MobileSanctuaryView` is shown instead
- Virtual flowers are capped at `MAX_VIRTUAL_FLOWERS = 40` to protect FPS
- Per-flower point lights are disabled; emissive material only
- Avoid R3F reconciler-breaking props (no hyphenated custom props on R3F elements)

---

## Empty States

Empty states should be honest and inviting, never alarming:

| Context | Empty state message |
|---|---|
| Memorial Sanctuary — no entries | "Be the first to light a candle in the sanctuary" |
| Memorial Sanctuary — no recent activity | "No recent activity yet." |
| Community birthdays — none upcoming | Community section is hidden |
| Siddur — no books | "No books in the library yet" |
| Search results — no match | "No results for [query]" + Clear search |
