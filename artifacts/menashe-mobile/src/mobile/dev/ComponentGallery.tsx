/**
 * ComponentGallery
 * SPR-M003 — Development-only component showcase.
 *
 * ⚠️  NOT connected to production.
 * ⚠️  Uses dummy/static data only.
 * ⚠️  Import only in dev screens, never in production routes.
 */

import React, { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { useThemeTokens } from "@/src/mobile/design-system";

// Foundation
import { MenasheSurface }   from "../components/foundation/MenasheSurface";
import { MenasheCard }      from "../components/foundation/MenasheCard";
import { MenasheButton }    from "../components/foundation/MenasheButton";
import { MenasheIconButton } from "../components/foundation/MenasheIconButton";
import { MenasheDivider }   from "../components/foundation/MenasheDivider";
import { MenasheChip }      from "../components/foundation/MenasheChip";
import { MenasheBadge }     from "../components/foundation/MenasheBadge";
import { MenasheAvatar }    from "../components/foundation/MenasheAvatar";

// Layout
import { Section }          from "../components/layout/Section";
import { Spacer }           from "../components/layout/Spacer";
import { Container }        from "../components/layout/Container";

// Headers
import { LargeHeader }      from "../components/headers/LargeHeader";
import { MenasheHeader }    from "../components/headers/MenasheHeader";

// Cards
import { DateCard }         from "../components/cards/DateCard";
import { PrayerCard }       from "../components/cards/PrayerCard";
import { ParashaCard }      from "../components/cards/ParashaCard";
import { StatisticCard }    from "../components/cards/StatisticCard";
import { QuickToolCard }    from "../components/cards/QuickToolCard";
import { HolidayCard }      from "../components/cards/HolidayCard";
import { CountdownCard }    from "../components/cards/CountdownCard";
import { InformationCard }  from "../components/cards/InformationCard";
import { HeroCard }         from "../components/cards/HeroCard";

// Display
import { SectionTitle }     from "../components/display/SectionTitle";
import { LabelValue }       from "../components/display/LabelValue";

// Inputs
import { SearchBar }        from "../components/inputs/SearchBar";
import { SearchField }      from "../components/inputs/SearchField";
import { TextField }        from "../components/inputs/TextField";
import { SegmentedControl } from "../components/inputs/SegmentedControl";
import { MenasheSwitch }    from "../components/inputs/MenasheSwitch";
import { Checkbox, Radio }  from "../components/inputs/Checkbox";
import { FilterChipGroup }  from "../components/inputs/FilterChip";

// Headers (primitives)
import { HeaderTitle, HeaderSubtitle, HeaderAction } from "../components/headers/HeaderPrimitives";

// Navigation
import { FloatingActionButton } from "../components/navigation/FloatingActionButton";
import { TabIndicator }         from "../components/navigation/TabIndicator";

// Feedback
import { LoadingState }     from "../components/feedback/LoadingState";
import { SkeletonCard }     from "../components/feedback/LoadingState";
import { EmptyState }       from "../components/feedback/EmptyState";
import { ErrorState }       from "../components/feedback/EmptyState";
import { Toast, Banner, Snackbar } from "../components/feedback/Toast";
import { ProgressIndicator } from "../components/feedback/LoadingState";

// ─── Gallery row helper ───────────────────────────────────────────────────────

function GRow({ label, children }: { label: string; children: React.ReactNode }) {
  const { colors, type, sp } = useThemeTokens();
  return (
    <View style={{ marginBottom: sp[5] }}>
      <Text style={[type.overline, { color: colors.accentGold, marginBottom: sp[2] }]}>
        {label.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

// ─── Gallery ─────────────────────────────────────────────────────────────────

export function ComponentGallery() {
  const { colors, type, sp } = useThemeTokens();

  const [search, setSearch]           = useState("");
  const [searchField, setSearchField] = useState("");
  const [segment, setSegment]         = useState("A");
  const [toggle, setToggle]           = useState(true);
  const [checked, setChecked]         = useState(false);
  const [radio, setRadio]             = useState("a");
  const [chips, setChips]             = useState<string[]>(["alpha"]);
  const [toastVisible, setToast]      = useState(false);
  const [snackVisible, setSnack]      = useState(false);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 80 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <LargeHeader title="Component Gallery" eyebrow="MMDL v1.0" subtitle="SPR-M003 — Dev only" />

      <Container>

        {/* ── Foundation ─────────────────────────────────────── */}
        <GRow label="Buttons">
          <View style={{ gap: sp[2] }}>
            <MenasheButton label="Primary"      variant="primary" size="md" />
            <MenasheButton label="Secondary"    variant="secondary" size="md" />
            <MenasheButton label="Ghost"        variant="ghost" size="md" />
            <MenasheButton label="Danger"       variant="danger" size="md" />
            <MenasheButton label="Gold Outline" variant="gold-outline" size="md" />
            <MenasheButton label="Loading…"     variant="primary" loading size="md" />
            <MenasheButton label="Disabled"     variant="primary" disabled size="md" />
          </View>
        </GRow>

        <GRow label="Icon Buttons">
          <View style={{ flexDirection: "row", gap: sp[2] }}>
            <MenasheIconButton name="heart"    variant="ghost"    accessibilityLabel="Like" />
            <MenasheIconButton name="bell"     variant="filled"   accessibilityLabel="Notify" />
            <MenasheIconButton name="bookmark" variant="outlined" accessibilityLabel="Save" />
            <MenasheIconButton name="star"     variant="gold"     accessibilityLabel="Star" />
          </View>
        </GRow>

        <GRow label="Chips">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: sp[2] }}>
            <MenasheChip label="All" selected onPress={() => {}} />
            <MenasheChip label="Torah" onPress={() => {}} leadingIcon="book-open" />
            <MenasheChip label="Holidays" onPress={() => {}} />
            <MenasheChip label="Remove" onPress={() => {}} onRemove={() => {}} />
          </View>
        </GRow>

        <GRow label="Badges">
          <View style={{ flexDirection: "row", gap: sp[4], alignItems: "center" }}>
            <MenasheBadge variant="count" count={3} />
            <MenasheBadge variant="count" count={99} color="gold" />
            <MenasheBadge variant="dot" />
            <MenasheBadge variant="label" label="NEW" color="success" />
          </View>
        </GRow>

        <GRow label="Avatars">
          <View style={{ flexDirection: "row", gap: sp[3], alignItems: "center" }}>
            <MenasheAvatar size="xs" initials="AB" />
            <MenasheAvatar size="sm" initials="MK" bordered />
            <MenasheAvatar size="md" initials="SL" online />
            <MenasheAvatar size="lg" initials="RJ" />
            <MenasheAvatar size="xl" initials="YY" bordered />
          </View>
        </GRow>

        <GRow label="Dividers">
          <MenasheDivider variant="default" />
          <Spacer size={2} />
          <MenasheDivider variant="gold" />
          <Spacer size={2} />
          <MenasheDivider variant="strong" />
        </GRow>

        {/* ── Cards ──────────────────────────────────────────── */}
        <GRow label="Date Card">
          <DateCard
            hebrewDate="כ״ח בְּסִיוָן"
            hebrewMonth="סִיוָן"
            gregorianDate="July 1, 2026"
            dayOfWeek="Wednesday"
          />
        </GRow>

        <GRow label="Prayer Card">
          <View style={{ gap: sp[1] }}>
            <PrayerCard name="Shacharit" time="6:15 AM" status="passed" />
            <PrayerCard name="Mincha"    time="1:28 PM" status="next"   relative="in 14 min" />
            <PrayerCard name="Maariv"    time="8:45 PM" status="future" />
          </View>
        </GRow>

        <GRow label="Parasha Card">
          <ParashaCard
            name="Korach"
            hebrewName="קֹרַח"
            summary="The rebellion of Korach and his followers against Moses and Aaron."
            onPress={() => {}}
          />
        </GRow>

        <GRow label="Statistic Card">
          <View style={{ flexDirection: "row", gap: sp[3] }}>
            <StatisticCard value="248" label="Mitzvot" trend="up" trendLabel="+12" iconName="award" style={{ flex: 1 }} />
            <StatisticCard value="365" label="Days"    trend="flat"                iconName="calendar" style={{ flex: 1 }} />
          </View>
        </GRow>

        <GRow label="Quick Tool Cards">
          <View style={{ flexDirection: "row", gap: sp[3] }}>
            <QuickToolCard iconName="clock"     label="Zmanim"   style={{ flex: 1 }} />
            <QuickToolCard iconName="book-open" label="Parasha"  style={{ flex: 1 }} />
            <QuickToolCard iconName="users"     label="Community" style={{ flex: 1 }} />
          </View>
        </GRow>

        <GRow label="Holiday Card">
          <HolidayCard name="Rosh Hashana" hebrewName="ראש השנה" date="Sep 22, 2025" daysAway={83} />
        </GRow>

        <GRow label="Countdown Card">
          <CountdownCard
            title="Shabbat begins"
            units={[{ value: 1, label: "day" }, { value: 6, label: "hrs" }, { value: 33, label: "min" }]}
          />
        </GRow>

        <GRow label="Information Card">
          <InformationCard
            variant="gold"
            iconName="star"
            title="Did you know?"
            body="The Bnei Menashe are one of the Lost Tribes of Israel, now returning to their homeland."
          />
        </GRow>

        <GRow label="Hero Card">
          <HeroCard
            eyebrow="Feature"
            title="AI Torah Companion"
            subtitle="Ask questions about Halacha, Parasha, or Jewish history in your language."
            ctaLabel="Try Now"
            onCta={() => {}}
            decorIcon="cpu"
          />
        </GRow>

        {/* ── Display ────────────────────────────────────────── */}
        <GRow label="Section Title">
          <SectionTitle title="Upcoming Holidays" eyebrow="Calendar" actionLabel="See all" onAction={() => {}} />
        </GRow>

        <GRow label="Label Value">
          <View style={{ gap: sp[2] }}>
            <LabelValue label="Location"    value="Manipur, India" />
            <LabelValue label="Coordinates" value="24.8170° N, 93.9368° E" />
            <LabelValue label="Timezone"    value="IST (UTC+5:30)" />
          </View>
        </GRow>

        {/* ── Inputs ─────────────────────────────────────────── */}
        <GRow label="Search Bar">
          <SearchBar value={search} onChange={setSearch} placeholder="Search prayers…" />
        </GRow>

        <GRow label="Search Field (inline)">
          <SearchField value={searchField} onChange={setSearchField} placeholder="Search holidays…" />
        </GRow>

        <GRow label="Text Field">
          <TextField label="Full Name" placeholder="Enter your name" leadingIcon="user" />
        </GRow>

        <GRow label="Segmented Control">
          <SegmentedControl
            segments={[{ label: "English", value: "A" }, { label: "Thadou", value: "B" }, { label: "Hebrew", value: "C" }]}
            value={segment}
            onChange={setSegment}
          />
        </GRow>

        <GRow label="Switch">
          <MenasheSwitch value={toggle} onChange={setToggle} label="Shabbat Notifications" />
        </GRow>

        <GRow label="Checkbox & Radio">
          <View style={{ gap: sp[1] }}>
            <Checkbox value={checked} onChange={setChecked} label="I accept the terms" />
            <Radio selected={radio === "a"} onSelect={() => setRadio("a")} label="Dark Theme" />
            <Radio selected={radio === "b"} onSelect={() => setRadio("b")} label="Light Theme" />
          </View>
        </GRow>

        <GRow label="Filter Chips">
          <FilterChipGroup
            options={[
              { label: "All",      value: "all" },
              { label: "Alpha",    value: "alpha" },
              { label: "Beta",     value: "beta" },
              { label: "Gamma",    value: "gamma" },
            ]}
            selected={chips}
            onToggle={(v) =>
              setChips((prev) =>
                prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
              )
            }
            scrollable={false}
          />
        </GRow>

        {/* ── Header Primitives ──────────────────────────────── */}
        <GRow label="Header Primitives">
          <View style={{ gap: sp[3] }}>
            <View style={{ flexDirection: "row", alignItems: "center", height: 48, backgroundColor: colors.surface, borderRadius: 8, paddingHorizontal: sp[3] }}>
              <HeaderTitle title="Zmanim" />
              <HeaderAction icon="settings" label="Settings" onPress={() => {}} />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", height: 48, backgroundColor: colors.surface, borderRadius: 8, paddingHorizontal: sp[3] }}>
              <View style={{ flex: 1 }}>
                <HeaderTitle title="Community" />
                <HeaderSubtitle subtitle="Bnei Menashe · 1,240 members" />
              </View>
              <HeaderAction icon="bell" label="Notifications" onPress={() => {}} badge={3} />
              <HeaderAction icon="more-vertical" label="More" onPress={() => {}} />
            </View>
          </View>
        </GRow>

        {/* ── Navigation ─────────────────────────────────────── */}
        <GRow label="FAB">
          <View style={{ flexDirection: "row", gap: sp[3], alignItems: "center" }}>
            <FloatingActionButton icon="plus"  accessibilityLabel="Add"    variant="standard" />
            <FloatingActionButton icon="edit-2" accessibilityLabel="Edit"   variant="mini" />
            <FloatingActionButton icon="share-2" label="Share" accessibilityLabel="Share" variant="extended" />
          </View>
        </GRow>

        <GRow label="Tab Indicator">
          <View style={{ flexDirection: "row", gap: sp[6] }}>
            <TabIndicator active />
            <TabIndicator active={false} />
          </View>
        </GRow>

        {/* ── Feedback ───────────────────────────────────────── */}
        <GRow label="Loading State">
          <LoadingState message="Loading prayer times…" />
        </GRow>

        <GRow label="Skeleton Card">
          <SkeletonCard lines={3} />
        </GRow>

        <GRow label="Progress">
          <View style={{ gap: sp[2] }}>
            <ProgressIndicator value={0.65} />
            <ProgressIndicator value={0.25} />
          </View>
        </GRow>

        <GRow label="Empty State">
          <EmptyState
            icon="inbox"
            title="No Results"
            subtitle="Try adjusting your filters or search term."
            ctaLabel="Clear Filters"
            onCta={() => {}}
          />
        </GRow>

        <GRow label="Error State">
          <ErrorState
            title="Could not load"
            message="Check your internet connection and try again."
            onRetry={() => {}}
          />
        </GRow>

        <GRow label="Banner">
          <View style={{ gap: sp[2] }}>
            <Banner message="Shabbat begins at 7:24 PM tonight." variant="info" />
            <Banner message="Location permission needed for accurate Zmanim." variant="warning" ctaLabel="Allow" onCta={() => {}} />
          </View>
        </GRow>

        <GRow label="Toast / Snackbar">
          <View style={{ gap: sp[2] }}>
            <MenasheButton label="Show Toast" onPress={() => setToast(true)} variant="secondary" size="sm" />
            <Toast
              message="Prayer time saved!"
              variant="success"
              visible={toastVisible}
              onHide={() => setToast(false)}
            />
            <MenasheButton label="Show Snackbar" onPress={() => setSnack(true)} variant="secondary" size="sm" />
            <Snackbar
              message="Changes saved successfully."
              visible={snackVisible}
              onDismiss={() => setSnack(false)}
              actionLabel="Undo"
              onAction={() => setSnack(false)}
            />
          </View>
        </GRow>

        <Spacer size={12} />
      </Container>
    </ScrollView>
  );
}
