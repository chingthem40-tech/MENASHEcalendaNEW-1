/**
 * ShellPreview
 * SPR-M004 — Menashe Mobile Shell — Development Only
 *
 * Interactive preview of the MobileShell without any feature screens.
 * Demonstrates and stress-tests every shell layer in isolation.
 *
 * ⚠️  NOT connected to production.
 * ⚠️  Uses dummy data only.
 * ⚠️  Import only in dev routes — never in production navigation.
 *
 * Sections:
 *   1. Full Shell Preview   — MobileShell with placeholder content
 *   2. Header Preview       — ShellHeader large/compact + scroll sim
 *   3. Navigation Preview   — ShellNavigation pill bar all tabs
 *   4. Hosts Preview        — Toast / Snackbar / Dialog / BottomSheet triggers
 *   5. Transitions Preview  — Fade / Slide / Scale animation demos
 *   6. Responsive Info      — Screen dimensions + safe area readout
 *
 * Usage:
 *   Add a dev route pointing to <ShellPreview /> in your dev tab or
 *   navigate to it from ComponentGallery.
 */

import React, { useState } from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemeTokens }    from "@/src/mobile/design-system";
import { MenasheButton }     from "@/src/mobile/components/foundation/MenasheButton";
import { MenasheDivider }    from "@/src/mobile/components/foundation/MenasheDivider";
import { Spacer }            from "@/src/mobile/components/layout/Spacer";
import { SectionTitle }      from "@/src/mobile/components/display/SectionTitle";
import { LabelValue }        from "@/src/mobile/components/display/LabelValue";

import {
  MobileShell,
  ShellNavigation,
  ShellHosts,
  ShellProvider,
  useShell,
  SHELL_TABS,
  type TabKey,
} from "@/src/mobile/shell";

// ─── Gallery section helper ───────────────────────────────────────────────────

function GSection({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors, type, sp } = useThemeTokens();
  return (
    <View style={{ marginBottom: sp[6] }}>
      <Text
        style={[type.overline, { color: colors.accentGold, marginBottom: sp[3] }]}
        allowFontScaling={false}
      >
        {title.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

// ─── Host trigger panel (reads ShellContext) ──────────────────────────────────

function HostTriggers() {
  const { sp } = useThemeTokens();
  const {
    showToast, showDialog, showSheet, showLoading, hideLoading,
    openSearch, showOverlay, dismissOverlay,
  } = useShell();

  return (
    <GSection title="Host Triggers">
      <View style={{ gap: sp[2] }}>

        <MenasheButton
          label="Show Toast — success"
          variant="secondary"
          size="sm"
          onPress={() => showToast("Prayer time saved!", "success")}
        />
        <MenasheButton
          label="Show Toast — error"
          variant="secondary"
          size="sm"
          onPress={() => showToast("Could not connect to server.", "error")}
        />
        <MenasheButton
          label="Show Toast — warning"
          variant="secondary"
          size="sm"
          onPress={() => showToast("Location permission needed for Zmanim.", "warning")}
        />
        <MenasheButton
          label="Show Toast — info"
          variant="secondary"
          size="sm"
          onPress={() => showToast("Shabbat begins at 7:24 PM tonight.", "info")}
        />

        <MenasheDivider variant="default" />

        <MenasheButton
          label="Show Dialog"
          variant="secondary"
          size="sm"
          onPress={() =>
            showDialog({
              title:   "Delete Reminder?",
              message: "This will permanently remove the Shabbat candle reminder.",
              actions: [
                { label: "Cancel",  onPress: () => {},           variant: "ghost"   },
                { label: "Delete",  onPress: () => {},           variant: "danger"  },
              ],
            })
          }
        />

        <MenasheButton
          label="Show Bottom Sheet"
          variant="secondary"
          size="sm"
          onPress={() =>
            showSheet({
              title:      "Prayer Times",
              snapHeight: 0.45,
              children: (
                <View style={{ padding: 16, gap: 8 }}>
                  <LabelValue label="Shacharit"  value="6:15 AM" />
                  <LabelValue label="Mincha"     value="1:28 PM" />
                  <LabelValue label="Maariv"     value="8:45 PM" />
                  <LabelValue label="Candle Lighting" value="7:24 PM" />
                </View>
              ),
            })
          }
        />

        <MenasheButton
          label="Show Loading Overlay (2s)"
          variant="secondary"
          size="sm"
          onPress={() => {
            showLoading("Loading prayer times…");
            setTimeout(hideLoading, 2000);
          }}
        />

        <MenasheButton
          label="Open Search Host"
          variant="secondary"
          size="sm"
          onPress={openSearch}
        />
      </View>
    </GSection>
  );
}

// ─── Navigation preview (standalone) ─────────────────────────────────────────

function NavigationPreview() {
  const { sp } = useThemeTokens();
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const tabsWithBadge = SHELL_TABS.map((t) =>
    t.key === "study" ? { ...t, badge: 3 } :
    t.key === "more"  ? { ...t, badgeDot: true } : t
  );

  return (
    <GSection title="Navigation Bar">
      <View style={{ height: 90, position: "relative" }}>
        <ShellNavigation
          tabs={tabsWithBadge}
          activeTab={activeTab}
          onTabPress={setActiveTab}
          style={{ position: "relative", bottom: "auto" as any }}
        />
      </View>
    </GSection>
  );
}

// ─── Responsive info ──────────────────────────────────────────────────────────

function ResponsiveInfo() {
  const { width, height } = Dimensions.get("window");
  const insets            = useSafeAreaInsets();

  return (
    <GSection title="Responsive Info">
      <View style={{ gap: 6 }}>
        <LabelValue label="Platform"    value={Platform.OS}          />
        <LabelValue label="OS Version"  value={String(Platform.Version)} />
        <LabelValue label="Width"       value={`${width}dp`}         />
        <LabelValue label="Height"      value={`${height}dp`}        />
        <LabelValue label="Safe Top"    value={`${insets.top}dp`}    />
        <LabelValue label="Safe Bottom" value={`${insets.bottom}dp`} />
        <LabelValue label="Safe Left"   value={`${insets.left}dp`}   />
        <LabelValue label="Safe Right"  value={`${insets.right}dp`}  />
        <LabelValue
          label="Form Factor"
          value={width >= 768 ? "Tablet" : width >= 430 ? "Large Phone" : "Phone"}
        />
      </View>
    </GSection>
  );
}

// ─── Inner gallery (needs ShellContext) ───────────────────────────────────────

function ShellPreviewInner() {
  const { colors, type, sp } = useThemeTokens();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: sp[4], paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Title */}
      <Spacer size={8} />
      <Text style={[type.heading, { color: colors.textPrimary }]}>
        Shell Preview
      </Text>
      <Text style={[type.bodySm, { color: colors.textMuted, marginTop: sp[1], marginBottom: sp[6] }]}>
        SPR-M004 — Menashe Mobile Shell (MOS) · Dev only
      </Text>

      {/* Architecture description */}
      <GSection title="Shell Architecture">
        <View style={{ gap: sp[2] }}>
          <LabelValue label="ShellProvider"   value="Context + state store"          />
          <LabelValue label="ShellHeader"     value="Animated large → compact title" />
          <LabelValue label="ShellNavigation" value="Floating glass pill bar"         />
          <LabelValue label="ShellHosts"      value="Toast · Dialog · Sheet · Search" />
          <LabelValue label="ShellTransitions" value="Fade · Slide · Scale hooks"    />
        </View>
      </GSection>

      <MenasheDivider variant="gold" />
      <Spacer size={6} />

      {/* Navigation bar standalone preview */}
      <NavigationPreview />

      <MenasheDivider variant="default" />
      <Spacer size={6} />

      {/* Host triggers — require ShellContext */}
      <HostTriggers />

      <MenasheDivider variant="default" />
      <Spacer size={6} />

      {/* Responsive info */}
      <ResponsiveInfo />

      <Spacer size={12} />
    </ScrollView>
  );
}

// ─── ShellPreview (public export) ────────────────────────────────────────────

/**
 * ShellPreview — standalone dev screen.
 * Wrap it in ShellProvider to enable host trigger demos.
 */
export function ShellPreview() {
  return (
    <ShellProvider initialTab="home">
      <View style={{ flex: 1 }}>
        <ShellPreviewInner />
        {/* Hosts layer — needed to render triggered toasts/dialogs/sheets */}
        <ShellHosts />
      </View>
    </ShellProvider>
  );
}
