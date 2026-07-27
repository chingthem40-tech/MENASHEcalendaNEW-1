# interactionGuide.md
### Menashe Experience Language — Phase 9: Interaction Language

---

Interaction in Menashe Calendar is deliberate and respectful.
The app never surprises the user. It never demands attention it has not earned.
Every interaction has a defined result, and that result is communicated clearly.

---

## 1. Tap

**Definition:** A brief touch (< 500ms) on an interactive element.

**Applies to:** Cards, buttons, tab bar items, list rows, links.

**Required feedback:**
- **Visual:** Scale press 0.97 (via `Pressable` / `activeOpacity: 0.88` on `TouchableOpacity`)
- **Haptic:** Light impact — `Haptics.impactAsync(ImpactFeedbackStyle.Light)` — for navigation taps
- **No haptic** for purely visual toggles (theme switch, filter chip) — use medium haptic for those

**Response time:** The result of a tap (navigation, state change) must begin within 100ms.
If the result takes longer, show a loading indicator immediately — do not leave the user wondering.

**Minimum touch target:** 44×44dp. See accessibilityGuide.md.

**Rules:**
- A tap on a card navigates to the detail of that card's content. Never opens a menu.
- A tap on a PillButton triggers its primary action immediately.
- A tap on a destructive action (delete, remove) opens a confirmation bottom sheet — it does not execute.

---

## 2. Long Press

**Definition:** A sustained touch (≥ 500ms) on an interactive element.

**Applies to:** Cards that have secondary actions (edit, share, delete yahrzeit record).

**Required feedback:**
- **Haptic:** Medium impact — `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` — at the moment of recognition
- **Visual:** Card lifts slightly (scale to 1.02, shadow increases to `level3`)
- **Result:** Bottom sheet opens with secondary actions list

**Rules:**
- Long press is only defined for elements that have secondary actions. Never add long press
  behaviour to an element just to "feel native."
- Long press never executes a destructive action directly. It always opens a context menu.
- Long press options: Edit, Share, Delete (always last, always in red).

---

## 3. Swipe

**Definition:** A horizontal gesture on a list row or card.

**Applies to:**
- Yahrzeit list rows → swipe left to reveal Delete action
- Notification list rows → swipe left to dismiss

**Required feedback:**
- **Haptic:** Selection feedback at the threshold point where the action "locks in"
- **Visual:** Action icon reveals from behind the row at the swipe distance

**Rules:**
- Swipe is right-to-left only (standard iOS / Android delete gesture).
- Swipe never navigates. Only destructive or dismissal actions.
- Swipe requires confirmation for destructive actions when the item has historical significance
  (yahrzeit records, community posts).

---

## 4. Pull (Pull-to-Refresh)

**Definition:** A downward pull gesture on a ScrollView to trigger a data refresh.

**Applies to:** Home screen, Calendar screen, Community screen, any screen with live data.

**Required feedback:**
- **Visual:** Native `RefreshControl` with `tintColor={gold}` and `title="Updating..."` on iOS
- **Haptic:** None — the pull gesture has inherent physical feedback

**Rules:**
- Pull-to-refresh is available on every screen with data that can become stale.
- The refresh does not navigate or reset scroll position.
- If the refresh fails, show a Toast (not a dialog) — "Could not refresh. Try again."
- After a successful refresh, if new content appeared, show "Updated" in the Toast for 1.5s.

---

## 5. Scroll

**Definition:** A vertical scroll gesture within a ScrollView or FlatList.

**Rules:**
- Scroll is never blocked or intercepted during normal use.
- The tab bar is always visible (sticky bottom). Content scrolls under it with bottom padding.
- Header collapse (using `CollapsibleHeader`) is the only scroll-driven animation permitted.
- Scroll position is restored when the user navigates back to a screen (via `ScrollView` `ref` + position persistence).
- `scrollsToTop` is `true` — tapping the status bar scrolls to the top (iOS default).

**Infinite scroll (where used):**
- Loading more content is triggered when the user is within 300dp of the end of the list.
- A small spinner (`ActivityIndicator`) appears at the bottom — no "Load more" button.

---

## 6. Selection

**Definition:** Choosing one or more items from a set.

**Applies to:** Filter chips, theme switcher, tab segments, calendar day selection.

**Required feedback:**
- **Visual:** Selected item gets gold tint background + bold text weight
- **Haptic:** Light selection feedback — `Haptics.selectionAsync()`
- **Immediate:** State change is instant (no animation delay)

**Rules:**
- Single-select: tapping a selected item has no effect (you cannot deselect the only option).
- Multi-select: tapping a selected item deselects it (visual feedback reversed).
- Checkmarks appear for list-based selection. Highlights for chip/segment selection.

---

## 7. Confirmation

**Definition:** A second step required before a destructive or irreversible action is taken.

**Applies to:** Delete yahrzeit, remove community member, clear data, cancel subscription.

**Required UI:** Always a Bottom Sheet — never `Alert.alert()` (system dialog).

**Bottom sheet anatomy:**
```
┌─────────────────────────────────────────┐
│  ──  (drag handle)                      │
│                                         │
│  [Illustration: candle / relevant icon] │
│                                         │
│  Headline (17dp bold)                   │
│  Body (14dp muted) — explain consequence│
│                                         │
│  [Primary Button: destructive action]   │  ← Red bg
│  [Secondary Button: Cancel]             │  ← Muted/ghost
└─────────────────────────────────────────┘
```

**Rules:**
- Destructive button is always at the top of the action list (prominent, but requires deliberate tap).
- Cancel is always available and always the last / most accessible option.
- Never auto-dismiss a confirmation. The user must actively choose.
- Haptic: Heavy impact when the destructive action is confirmed.

---

## 8. Feedback (Toast / Snackbar)

**Definition:** A transient message confirming the result of an action.

**Applies to:** Successful save, copy to clipboard, pull-to-refresh result, share action.

**Required UI:** Toast component from `src/mobile/components/feedback/Toast`

**Anatomy:**
```
┌─────────────────────────────────────────┐
│  ✓ icon  │  "Message text"  │  [Action]│
└─────────────────────────────────────────┘
```

**Display duration:**
- Success: 2.0s
- Info: 2.5s
- Warning: 3.5s
- Error: persists until dismissed or resolved

**Positioning:** Bottom of screen, above the tab bar, below safe area inset.

**Rules:**
- Never stack multiple toasts. Queue them.
- Never use a Toast for an error that requires action — use an Alert Card or Dialog instead.
- Toast messages are written in past tense ("Copied", "Saved", "Shared").

---

## 9. Haptics

All haptic usage is managed through `expo-haptics`.

| Interaction | Haptic Type |
|---|---|
| Navigation tap (card, tab) | `ImpactFeedbackStyle.Light` |
| Destructive confirmation | `ImpactFeedbackStyle.Heavy` |
| Long press recognition | `ImpactFeedbackStyle.Medium` |
| Toggle / selection change | `selectionAsync()` |
| Pull-to-refresh trigger | None |
| Success action | `notificationAsync(NotificationFeedbackType.Success)` |
| Error | `notificationAsync(NotificationFeedbackType.Error)` |
| Warning | `notificationAsync(NotificationFeedbackType.Warning)` |

**Rules:**
- Respect `AccessibilityInfo.isReduceMotionEnabled()` — if true, also suppress haptics.
- Never trigger haptics in response to scroll events.
- Never trigger haptics in the background or while the app is inactive.

---

## 10. Future Gestures

These gestures are reserved for future implementation. Do not implement them now.

| Gesture | Planned Use |
|---|---|
| Pinch-to-zoom | Calendar month → week → day view |
| Two-finger swipe | Navigate calendar months |
| Shake | Trigger "I'm feeling unsure" → open AI chat |
| 3D Touch / Haptic Touch | Quick action on app icon (home screen shortcut) |
| Force touch | Deep press on zman to set as reminder |

When implemented, each must follow the principles in this guide and motionGuide.md.
