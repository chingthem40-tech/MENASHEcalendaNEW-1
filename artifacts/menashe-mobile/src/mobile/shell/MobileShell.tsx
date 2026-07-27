/**
 * MobileShell (MOS)
 * SPR-M004 — Menashe Mobile Shell
 *
 * The permanent operating environment of the Menashe Calendar Mobile app.
 * Every future screen lives inside this shell.
 *
 * Architecture:
 *
 *   App (_layout.tsx)
 *     └─ MobileShell
 *           ├─ ShellProvider          — context / state
 *           ├─ StatusBar              — adaptive theme
 *           ├─ ShellHeader            — animated large→compact title (absolute top)
 *           ├─ [children]             — screen content, full flex, no forced scroll
 *           ├─ ShellNavigation        — floating tab bar (absolute bottom)
 *           └─ ShellHosts             — toasts, dialogs, sheets, overlays (absolute, highest z)
 *
 * Content model:
 *   The shell does NOT wrap children in a ScrollView.
 *   Screens own their own scroll (ScrollView, FlatList, SectionList, etc.).
 *   Use `useShellLayout()` to get header/nav heights so screens can pad correctly.
 *
 * Usage (in app/(tabs)/_layout.tsx or a future shell-aware layout):
 *
 *   import { MobileShell } from "@/src/mobile/shell";
 *
 *   export default function Layout() {
 *     return (
 *       <MobileShell initialTab="home" onTabChange={router.navigate}>
 *         <Slot />
 *       </MobileShell>
 *     );
 *   }
 *
 * Screens configure the header via useShell():
 *
 *   const { setHeaderConfig } = useShell();
 *   useEffect(() => {
 *     setHeaderConfig({ title: "Zmanim", eyebrow: "PRAYER TIMES" });
 *   }, []);
 *
 * Screens get layout insets via useShellLayout():
 *
 *   const { headerHeight, navHeight } = useShellLayout();
 *   // Use as paddingTop/paddingBottom in their own ScrollView
 *
 * Performance:
 *   - Shell mounts once and never re-mounts during navigation
 *   - Only the children slot changes
 *   - ShellProvider uses useCallback/useRef throughout
 *   - No forced parent ScrollView — screens use their own scroll containers
 *
 * Accessibility:
 *   - StatusBar adapts to theme (dark-content / light-content)
 *   - VoiceOver/TalkBack navigation role on header and tab bar
 *   - Reduced motion respected in all transition hooks
 *
 * Responsive:
 *   - Phone / Large Phone: floating pill nav, standard header
 *   - Tablet: wider content with maxContentWidth cap, nav may relocate in future
 *   - Landscape: safe-area insets handled via useSafeAreaInsets()
 *   - Foldable: inherits tablet responsive treatment
 *
 * Future extension:
 *   - Add <NotificationHost /> to ShellHosts when push is wired
 *   - Add gesture-based swipe-back by wrapping children in PanGestureHandler
 *   - Move tab routing into shell (currently delegated to onTabChange callback)
 *
 * @platform ios, android, web
 */

import React, {
  createContext,
  memo,
  useCallback,
  useContext,
  type ReactNode,
} from "react";
import {
  Platform,
  StatusBar,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemeTokens } from "@/src/mobile/design-system";
import { LAYOUT }          from "@/src/mobile/design-system/tokens/layout";

import { ShellProvider, useShell, type TabKey } from "./ShellContext";
import { ShellHeader }                          from "./ShellHeader";
import { ShellNavigation }                      from "./ShellNavigation";
import { ShellHosts }                           from "./ShellHosts";

// ─── ShellLayout context ──────────────────────────────────────────────────────
// Gives screens access to the shell's header and nav dimensions so they can
// set paddingTop/paddingBottom on their own scroll containers.

export interface ShellLayout {
  /** Current header height including safe-area top inset (dp) */
  headerHeight: number;
  /** Bottom nav height including safe-area bottom inset (dp) */
  navHeight: number;
  /** Safe-area top inset in isolation (dp) */
  safeTop: number;
  /** Safe-area bottom inset in isolation (dp) */
  safeBottom: number;
}

const ShellLayoutContext = createContext<ShellLayout>({
  headerHeight: LAYOUT.header.heightLarge,
  navHeight:    LAYOUT.bottomNav.height,
  safeTop:      0,
  safeBottom:   0,
});

/** Read shell layout dimensions from within any screen inside MobileShell. */
export function useShellLayout(): ShellLayout {
  return useContext(ShellLayoutContext);
}

// ─── Inner shell (reads from ShellProvider) ───────────────────────────────────

interface ShellInnerProps {
  children:       ReactNode;
  onTabChange?:   (tab: TabKey) => void;
  showHeader?:    boolean;
  showNav?:       boolean;
}

const ShellInner = memo<ShellInnerProps>(function ShellInner({
  children,
  onTabChange,
  showHeader = true,
  showNav    = true,
}) {
  const { colors, theme, layout } = useThemeTokens();
  const { activeTab, setActiveTab, tabs, headerConfig } = useShell();
  const insets = useSafeAreaInsets();

  const isDark = theme !== "light";

  const handleTabPress = useCallback((tab: TabKey) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  }, [setActiveTab, onTabChange]);

  // Compute layout dimensions for child screens
  const safeTop      = insets.top;
  const safeBottom   = Math.max(insets.bottom, 0);
  const headerHeight = LAYOUT.header.heightLarge + safeTop;
  const navHeight    = layout.bottomNav.height + safeBottom;

  const shellLayout: ShellLayout = { headerHeight, navHeight, safeTop, safeBottom };

  return (
    <ShellLayoutContext.Provider value={shellLayout}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {/* Status bar — adaptive */}
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor="transparent"
          translucent
        />

        {/* Animated header — absolute top, screens scroll under it */}
        {showHeader && (
          <ShellHeader config={headerConfig} />
        )}

        {/* Screen content slot — full flex, no forced scroll */}
        <View style={styles.content}>
          {children}
        </View>

        {/* Floating bottom navigation — absolute bottom */}
        {showNav && (
          <ShellNavigation
            tabs={tabs}
            activeTab={activeTab}
            onTabPress={handleTabPress}
          />
        )}

        {/* Global overlay hosts — always on top of everything */}
        <ShellHosts />
      </View>
    </ShellLayoutContext.Provider>
  );
});

// ─── MobileShell (public API) ─────────────────────────────────────────────────

export interface MobileShellProps {
  /** Screen content — rendered in full-flex content slot */
  children:       ReactNode;
  /** Initial active tab */
  initialTab?:    TabKey;
  /** Called when user taps a tab — use this to drive router.navigate() */
  onTabChange?:   (tab: TabKey) => void;
  /** Show/hide the animated header */
  showHeader?:    boolean;
  /** Show/hide the bottom navigation */
  showNav?:       boolean;
  /** Extra style for the root view */
  style?:         StyleProp<ViewStyle>;
  testID?:        string;
}

/**
 * MobileShell — the permanent operating environment.
 * Wrap your app's route layout with this component.
 */
export const MobileShell = memo<MobileShellProps>(function MobileShell({
  children,
  initialTab   = "home",
  onTabChange,
  showHeader   = true,
  showNav      = true,
  style,
  testID,
}) {
  return (
    <ShellProvider initialTab={initialTab}>
      <View testID={testID} style={[styles.shellRoot, style]}>
        <ShellInner
          onTabChange={onTabChange}
          showHeader={showHeader}
          showNav={showNav}
        >
          {children}
        </ShellInner>
      </View>
    </ShellProvider>
  );
});

// ─── ShellScreen ──────────────────────────────────────────────────────────────

/**
 * ShellScreen — convenience wrapper for screens that need a plain flex
 * container. Also re-exports useShellLayout for quick access in the same file.
 *
 * For screens with their own FlatList or ScrollView:
 *
 *   const { headerHeight, navHeight } = useShellLayout();
 *   return (
 *     <FlatList
 *       contentInset={{ top: headerHeight, bottom: navHeight }}
 *       ...
 *     />
 *   );
 *
 * For simple screens with no scroll:
 *
 *   return (
 *     <ShellScreen>
 *       <Text>Hello</Text>
 *     </ShellScreen>
 *   );
 */
interface ShellScreenProps {
  children:  ReactNode;
  style?:    StyleProp<ViewStyle>;
  testID?:   string;
}

export const ShellScreen = memo<ShellScreenProps>(function ShellScreen({
  children,
  style,
  testID,
}) {
  const { colors }               = useThemeTokens();
  const { headerHeight, navHeight } = useShellLayout();
  return (
    <View
      testID={testID}
      style={[
        {
          flex:            1,
          backgroundColor: colors.background,
          paddingTop:      headerHeight,
          paddingBottom:   navHeight,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  shellRoot: {
    flex: 1,
  },
  root: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
