# futureExperience.md
### Menashe Experience Language — Phase 14: Future Experience Rules

---

This document reserves MEL guidance for platforms and form factors that do not yet exist
in the Menashe Calendar product. These rules are written now so that when development
begins, the experience constitution is already in place.

Do not implement any of these until the platform is officially scheduled.

---

## Guiding Principle for All Future Platforms

> The Menashe Calendar experience transcends the surface it runs on.
> A user who checks their yahrzeit on a Watch, glances at their Shabbat countdown on a
> Widget, and opens the full app on their iPhone must feel they are in the same world.

Every future platform adapts MEL — it does not invent its own experience.

---

## 1. Widgets (iOS WidgetKit / Android App Widgets)

**Purpose:** Glanceable, always-visible summary of the highest-priority Hebrew calendar information.

**MEL Adaptation:**
- Widget is Level 1 information only: Hebrew date, next zman, days until Shabbat.
- No interactivity except a deep link tap into the app.
- Background: Hero gradient (same `heroGradientColors` as the app hero).
- Typography: System font only (WidgetKit limitation). Sizes: title 17dp, body 13dp, caption 11dp.
- Gold accent (`#d4a843`) for the primary date display only.
- No animation (WidgetKit is static).
- Dark mode / Light mode: Both supported via WidgetKit environment.

**Sizes to support (in priority order):**
1. Small (2×2): Hebrew date + next zman only
2. Medium (4×2): Hebrew date + zmanim bar (3 times) + days to Shabbat
3. Large (4×4): Full hero layout with parasha name

**Contribution rule:** Widget design must be approved alongside any change to the Hero Card layout, since they must remain visually consistent.

---

## 2. Apple Watch

**Purpose:** Wrist-glance for time-critical zmanim and Shabbat countdown.

**MEL Adaptation:**
- Information hierarchy reduces to Level 1 only. No Level 2 or 3 content on Watch.
- Display: Hebrew date (compact), current zman, time to next zman.
- Complications: circular (next zman time), rectangular (Hebrew date + countdown).
- Color: Black background (#000000), gold accent (#d4a843). No gradients (OLED power).
- Typography: System font at Watch-appropriate sizes (system default — no custom sizes).
- Motion: None beyond system transitions.
- Haptic: System haptic for zman alerts (Sunset, Shabbat candles) — managed by Watch OS, not custom.

**Interaction model:** Tap complication → open Watch app → show full daily zmanim list.
No AI, no community, no settings on Watch.

---

## 3. iPad

**Purpose:** The same app with a larger canvas — more content visible simultaneously.

**MEL Adaptation:**
- Two-column layout at iPad width (768dp+):
  - Left column (360dp): Sidebar navigation (replaces tab bar)
  - Right column (remaining): Primary content
- Hero Card: Full-width of the right column only.
- Quick Actions: May expand to 6 icons instead of 5.
- Card grids: 3-column at 1024dp+.
- Typography: Same scale — do not increase for iPad. The extra space is used for layout, not larger text.
- Safe area: Respect multitasking split-view safe areas.
- Keyboard: Full keyboard navigation support (see accessibilityGuide.md).

**Rule:** iPad does not get a "special" design. It gets the same MEL applied to a wider canvas.

---

## 4. Desktop (macOS via Catalyst or Mac Electron)

**Purpose:** Full desktop access for community administrators and power users.

**MEL Adaptation:**
- Three-column layout: Nav sidebar (200dp) | Content (min 400dp) | Detail panel (300dp).
- Window minimum size: 960×620dp.
- Typography: Body scales to 16dp (one step up from mobile 15dp). All other scales remain.
- Mouse hover states: Cards gain a subtle shadow increase (`level3`) on hover.
- Right-click: Context menu with the same options as long-press (edit, share, delete).
- Keyboard: Full keyboard navigation. Command+K for quick search. Command+R for refresh.
- Toolbar: Replaces the mobile header. Native macOS toolbar style.
- No tab bar on desktop — replaced by sidebar.

---

## 5. CarPlay

**Purpose:** Zmanim while driving. Nothing else.

**MEL Adaptation:**
- One screen only: Current time, next zman, zman name.
- No navigation, no AI, no community, no content that requires reading.
- Large type: 32dp minimum for all text (glanceable while driving).
- High contrast only: Dark theme enforced regardless of user preference (visibility in sunlight).
- No tappable cards — CarPlay interaction model only (wheel controls, Siri).
- Audio: Zman arrival can trigger a voice announcement via AVSpeechSynthesizer.

**Safety rule:** No feature that causes the user to read more than a 3-word label while in CarPlay mode.

---

## 6. Android Auto

**Purpose:** Same as CarPlay — zmanim only while driving.

**MEL Adaptation:** Identical to CarPlay with Android-specific implementation (Android Automotive OS template).

**Rule:** CarPlay and Android Auto features must be specified and launched together. No split releases.

---

## 7. Vision Pro (visionOS)

**Purpose:** Immersive Jewish heritage experience — the Memorial Sanctuary in spatial 3D.

**MEL Adaptation:**
- The Memorial Sanctuary 3D scene (Three.js/R3F) is the primary spatial surface.
- Panels float in space — no physical window constraints.
- Depth is used for hierarchy: Level 1 content (date, zmanim) at z=0, Level 2 at z=-0.5m.
- Eye tracking for navigation within the Sanctuary.
- Pinch gesture (equivalent to tap) for interaction.
- Sound: Soft ambient audio (wind, distant call to prayer, candlelight crackle) at very low volume.
- Typography: Same font scale — not increased for spatial. Eye tracking compensates for distance.
- Gold accent: Rendered as a physically-based material with subtle metallic sheen.

**Cultural note:** The Sanctuary in spatial computing must go through an additional cultural
review with a rabbi and community representative before any Vision Pro release. The sacred
nature of the memorial space requires careful consideration for an immersive medium.

---

## Platform Contribution Rules

1. Any feature built for a future platform must reference its MEL Adaptation section in its design spec.
2. A future platform's MEL Adaptation section may only be updated by a Chief Architect decision.
3. The MEL Adaptation for any platform is written before any development begins — never after.
4. Experience decisions on future platforms must be traceable back to one or more of the 10 Experience Principles in EXPERIENCE_PRINCIPLES.md.
