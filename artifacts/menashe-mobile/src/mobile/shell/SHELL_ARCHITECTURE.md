# Menashe Mobile Shell (MOS) — Architecture

**SPR-M004 · Version 1.0**

---

## Overview

The Mobile Shell is the permanent operating environment of the Menashe Calendar Mobile app. Every future screen lives inside this Shell. The Shell is NOT a feature — it is the framework.

```
App (_layout.tsx)
  └─ MobileShell
        ├─ ShellProvider          Context + state store
        ├─ StatusBar              Adaptive dark/light-content
        ├─ ShellHeader (abs top)  Animated large → compact title + blur
        ├─ [children]             Screen content — full flex, no forced scroll
        ├─ ShellNavigation (abs)  Floating glass pill tab bar
        └─ ShellHosts (abs top)   Toast · Dialog · Sheet · Overlay · Loading · Search
```

---

## Shell Folder Tree

```
src/mobile/shell/
├── index.ts              Public API barrel export
├── MobileShell.tsx       Main compositor — wraps all shell layers
├── ShellContext.tsx       Context + state (tabs, header, toast, dialog, sheet queues)
├── ShellHeader.tsx        Animated header: large title → compact on scroll
├── ShellNavigation.tsx    Floating glass pill bottom tab bar
├── ShellHosts.tsx         Global overlay hosts (Toast, Dialog, Sheet, Loading, Search)
├── ShellTransitions.tsx   Animation hooks using MMDL motion tokens
└── SHELL_ARCHITECTURE.md  This document

src/mobile/dev/
└── ShellPreview.tsx       Dev-only interactive preview of all shell layers
```

---

## Navigation Diagram

```
MobileShell
├─ ShellProvider (ShellContext)
│     ├─ activeTab: TabKey  ──────────────────────► ShellNavigation
│     ├─ headerConfig        ──────────────────────► ShellHeader
│     ├─ toastQueue          ──────────────────────► ToastHost
│     ├─ dialogs             ──────────────────────► DialogHost
│     ├─ sheets              ──────────────────────► BottomSheetHost
│     ├─ overlays            ──────────────────────► OverlayHost
│     ├─ isLoading           ──────────────────────► LoadingHost
│     └─ searchVisible       ──────────────────────► SearchHost
│
├─ Tabs (5)
│     ├─ home      🏠 Home
│     ├─ calendar  📅 Calendar
│     ├─ sanctuary 🕯 Sanctuary
│     ├─ study     📖 Study
│     └─ more      ☰ More
│
└─ onTabChange callback → drives Expo Router navigation
```

---

## Host Diagram

```
ShellHosts (zIndex 500)
├─ BannerHost      zIndex 500  Persistent info banners (scaffold)
├─ SnackbarHost    zIndex 500  Action snackbars (scaffold)
├─ ToastHost       zIndex 510  Ephemeral toasts — top of screen
├─ BottomSheetHost zIndex 500  Draggable sheets — uses BottomSheet component
├─ DialogHost      zIndex 500  Blocking dialogs — uses Dialog component
├─ OverlayHost     zIndex 500  Generic full-screen Modal slot
├─ LoadingHost     zIndex 520  Full-screen spinner with exit animation
└─ SearchHost      zIndex 530  Full-screen search with exit animation
```

All hosts use a **keep-mounted-until-exit** lifecycle pattern:
- When visibility → true: fade in immediately
- When visibility → false: fade out animation, unmount ONLY after completion
- Prevents common RN pitfall of unmounting before exit animation can render

---

## Lifecycle Diagram

```
Shell Mount (once, permanent)
  │
  ├─ ShellProvider mounts — initializes all state
  ├─ ShellHeader mounts — absolute top, animates with scrollY
  ├─ ShellNavigation mounts — absolute bottom, persists across screens
  └─ ShellHosts mounts — absolute overlay, persists
        │
        ▼
Screen Transition (only children slot changes)
  │
  ├─ Expo Router swaps children
  ├─ Screen calls setHeaderConfig() to configure header
  ├─ Screen uses useShellLayout() to get headerHeight / navHeight
  └─ Shell layers remain mounted — no re-mount on navigation
        │
        ▼
Host Lifecycle (on demand)
  │
  ├─ showToast() → adds to queue → ToastHost renders → auto-dismisses
  ├─ showDialog() → DialogHost renders → dismissDialog() to close
  ├─ showSheet() → BottomSheetHost renders → dismissSheet() to close
  ├─ showLoading() → LoadingHost fades in → hideLoading() → fades out → unmounts
  └─ openSearch() → SearchHost fades in → closeSearch() → fades out → unmounts
```

---

## Content Model

**The Shell does NOT force a ScrollView on screen content.**

Screens manage their own scroll:

```tsx
// Screen with FlatList
const { headerHeight, navHeight } = useShellLayout();
<FlatList
  contentInset={{ top: headerHeight, bottom: navHeight }}
  ...
/>

// Screen with ScrollView
<ScrollView contentContainerStyle={{ paddingTop: headerHeight, paddingBottom: navHeight }}>
  ...
</ScrollView>

// Screen without scroll (simple layout)
<ShellScreen>
  <Text>Hello</Text>
</ShellScreen>
```

---

## Screen Configuration API

Screens configure the shell via `useShell()`:

```tsx
import { useShell } from "@/src/mobile/shell";

export default function ZmanimScreen() {
  const { setHeaderConfig, showToast, showDialog } = useShell();

  useEffect(() => {
    setHeaderConfig({
      title:   "Prayer Times",
      eyebrow: "ZMANIM",
      actions: [{ icon: "settings", label: "Settings", onPress: openSettings }],
    });
  }, []);

  return (
    <ScrollView>
      ...
    </ScrollView>
  );
}
```

---

## Transition Hooks (MMDL motion tokens)

```tsx
import { useFadeTransition, useSlideTransition, useScaleTransition } from "@/src/mobile/shell";

// Fade in/out
const { style, fadeIn, fadeOut } = useFadeTransition();
useEnterOnMount(fadeIn);

// Slide from right (navigation push)
const { style, enter, exit } = useSlideTransition("right");
useEnterOnMount(enter);

// Scale entrance (modal-like cards)
const { style, enter } = useScaleTransition();
useEnterOnMount(enter);

// Sheet entrance
const { translateY, overlayOpacity, enter } = useSheetTransition(400);
```

All hooks respect `useReducedMotion()` — transitions are instant for users who prefer reduced motion.

---

## Future Extension Guide

| Feature | Where to add |
|---------|-------------|
| Push notification badges | `ShellContext.tabs` → `setTabBadge(tab, count)` |
| In-app notification banner | Add `NotificationHost` to `ShellHosts.tsx` |
| Shared element transitions | `sharedElementTag(ns, id)` ready in `ShellTransitions.tsx` |
| Swipe-back gesture | `useSwipeBack()` scaffold in `ShellTransitions.tsx` |
| Search results | Wire to `SearchHost` children slot in `ShellHosts.tsx` |
| Snackbar actions | Add `snackbarQueue` to `ShellContext`, wire `SnackbarHost` |
| Persistent banners | Add `banners[]` to `ShellContext`, wire `BannerHost` |
| Tab routing | Pass `onTabChange` to `MobileShell`, drive `router.navigate()` |

---

## Token Compliance

All shell layers read exclusively from `useThemeTokens()`:

| Token family | Used for |
|-------------|----------|
| `colors.*`  | All colors — text, backgrounds, borders, glass, overlay |
| `sp[n]`     | All spacing — padding, margin, gap, min touch targets |
| `rd.*`      | All border radii |
| `shadow.*`  | All elevation/shadow |
| `type.*`    | All typography |
| `MOTION_DURATION.*` | All animation durations |
| `MOTION_EASE.*`     | All animation curves |

Zero hardcoded color strings, dp values, or rgba() literals in shell logic.
