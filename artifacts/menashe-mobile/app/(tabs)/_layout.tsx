import { BlurView } from "expo-blur";
import { Tabs, useRouter, router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef } from "react";
import { Animated, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeTokens } from "@/src/mobile/design-system";
import { useApp } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@clerk/expo";

// ─── Tab definitions ──────────────────────────────────────────────────────────

type BottomTabItem = {
  key:       string;
  icon:      React.ComponentProps<typeof Feather>["name"];
  route:     string | null;
  isCenter?: boolean;
};

const BOTTOM_TABS: BottomTabItem[] = [
  { key: "home",      icon: "home",           route: "index"     },
  { key: "calendar",  icon: "calendar",       route: "calendar"  },
  { key: "ai",        icon: "message-circle", route: null,       isCenter: true },
  { key: "study",     icon: "book-open",      route: "torah"     },
  { key: "more",      icon: "grid",           route: "more"      },
];

// Maps route name → which BOTTOM_TAB is "active"
const ROUTE_TO_TAB: Record<string, string> = {
  index:     "home",
  calendar:  "calendar",
  torah:     "study",
  more:      "more",
  community: "more",
  settings:  "more",
  zmanim:    "more",
  journey:   "more",
};

// ─── Animated tab item ────────────────────────────────────────────────────────

function TabItem({
  item,
  active,
  label,
  colors,
  onPress,
}: {
  item:    BottomTabItem;
  active:  boolean;
  label:   string;
  colors:  ReturnType<typeof useThemeTokens>["colors"];
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.88,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 28,
      bounciness: 10,
    }).start();
  }, [scaleAnim]);

  const GOLD    = "#d4a843";
  const AI_CLR  = "#a78bfa";
  const INACTIVE = colors.mutedForeground;
  const iconColor = item.isCenter ? AI_CLR : (active ? GOLD : INACTIVE);
  const iconSize  = active && !item.isCenter ? 22 : 20;

  if (item.isCenter) {
    // Elevated center button
    return (
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel="Rav Menashe AI"
        accessibilityHint="Opens the Sacred Wisdom AI guide"
        style={styles.centerOuter}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: "center" }}>
          {/* Circle that floats above the bar */}
          <View style={[
            styles.centerCircle,
            {
              backgroundColor: colors.background === "#ffffff" || colors.background === "#FFFFFF"
                ? "#f0eeff"
                : "#1e1a3a",
              borderColor: "rgba(167,139,250,0.35)",
              shadowColor: "#7C3AED",
            },
          ]}>
            <Feather name="message-circle" size={24} color={AI_CLR} />
          </View>
          <Text allowFontScaling={false} numberOfLines={1} style={[styles.centerLabel, { color: AI_CLR }]}>
            {label}
          </Text>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={styles.tabOuter}
    >
      <Animated.View style={[styles.tabInner, { transform: [{ scale: scaleAnim }] }]}>
        {active && (
          <View style={[styles.activePill, { backgroundColor: GOLD }]} />
        )}
        <Feather name={item.icon} size={iconSize} color={iconColor} />
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          style={[
            styles.tabLabel,
            { color: iconColor, fontWeight: active ? "700" : "500" },
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── Custom bottom tab bar ────────────────────────────────────────────────────

function CustomTabBar({ state, navigation }: { state: any; navigation: any }) {
  const { colors }  = useThemeTokens();
  const { theme }   = useApp();
  const { t }       = useLanguage();
  const insets      = useSafeAreaInsets();
  const isIOS       = Platform.OS === "ios";
  const isDark      = theme !== "light";

  const currentRoute = (state.routes[state.index]?.name ?? "index") as string;
  const activeTabKey = ROUTE_TO_TAB[currentRoute] ?? "home";

  const BG     = isDark ? "#12111e" : "#ffffff";
  const BORDER = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";

  const LABELS: Record<string, string> = {
    home:     t.navHome,
    calendar: t.navCalendar,
    ai:       "Rav Menashe",
    study:    t.navTorah,
    more:     "Hub",
  };

  function handlePress(item: BottomTabItem) {
    if (item.isCenter) {
      router.push("/sacred-wisdom" as any);
    } else if (item.route) {
      navigation.navigate(item.route);
    }
  }

  return (
    <View style={{ paddingBottom: insets.bottom }}>
      {/* Background — covers only the bar (not the raised center area) */}
      <View
        style={[
          styles.barBackground,
          { backgroundColor: BG, borderTopColor: BORDER },
        ]}
      />

      {/* iOS blur layer behind the bar */}
      {isIOS && (
        <BlurView
          intensity={90}
          tint={isDark ? "dark" : "light"}
          style={[StyleSheet.absoluteFill, styles.blurLayer]}
          pointerEvents="none"
        />
      )}

      {/* Tab items row — taller than bar to allow center button to protrude */}
      <View
        accessibilityRole="tablist"
        style={styles.tabRow}
        pointerEvents="box-none"
      >
        {BOTTOM_TABS.map((item) => (
          <TabItem
            key={item.key}
            item={item}
            active={activeTabKey === item.key}
            label={LABELS[item.key] ?? item.key}
            colors={colors}
            onPress={() => handlePress(item)}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Tab layout ───────────────────────────────────────────────────────────────

export default function TabLayout() {
  const { colors } = useThemeTokens();
  const { theme }  = useApp();
  const { t }      = useLanguage();
  const isDark     = theme !== "light";
  const isIOS      = Platform.OS === "ios";
  const isWeb      = Platform.OS === "web";
  const { isSignedIn, isLoaded } = useAuth();
  const expoRouter = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      expoRouter.replace("/sign-in");
    }
  }, [isLoaded, isSignedIn]);

  if (!isLoaded || !isSignedIn) return null;

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: { display: "none" }, // hidden — CustomTabBar takes over
        tabBarLabelStyle: {
          fontSize:      10,
          fontWeight:    "600",
          letterSpacing: 0.3,
          marginTop:     2,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={90}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.navHome,
          tabBarIcon: ({ color, focused }) => (
            <Feather name="home" size={focused ? 22 : 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="journey"
        options={{
          title: t.navJourney,
          tabBarIcon: ({ color, focused }) => (
            <Feather name="compass" size={focused ? 22 : 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t.navCalendar,
          tabBarIcon: ({ color, focused }) => (
            <Feather name="calendar" size={focused ? 22 : 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="zmanim"
        options={{
          title: t.navZmanim,
          tabBarIcon: ({ color, focused }) => (
            <Feather name="clock" size={focused ? 22 : 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "Hub",
          tabBarIcon: ({ color, focused }) => (
            <Feather name="grid" size={focused ? 22 : 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: t.navCommunity,
          tabBarIcon: ({ color, focused }) => (
            <Feather name="users" size={focused ? 22 : 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="torah"
        options={{
          title: t.navTorah,
          tabBarIcon: ({ color, focused }) => (
            <Feather name="book-open" size={focused ? 22 : 20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.navSettings,
          tabBarIcon: ({ color, focused }) => (
            <Feather name="settings" size={focused ? 22 : 20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const BAR_HEIGHT    = 64;
const CENTER_LIFT   = 16; // dp the center circle rises above the bar

const styles = StyleSheet.create({
  // Bar solid background — bottom 64dp only
  barBackground: {
    position:    "absolute",
    bottom:      0,
    left:        0,
    right:       0,
    height:      BAR_HEIGHT,
    borderTopWidth: 0.5,
  },
  blurLayer: {
    bottom: 0,
    height: BAR_HEIGHT,
    top:    "auto" as any,
  },
  // Row taller than bar so center button can protrude
  tabRow: {
    flexDirection:  "row",
    height:         BAR_HEIGHT + CENTER_LIFT,
    alignItems:     "flex-end", // all items bottom-aligned within the tall area
  },
  // Regular tab
  tabOuter: {
    flex:            1,
    alignItems:      "center",
    justifyContent:  "flex-end",
    paddingBottom:   10,
    minHeight:       44,
  },
  tabInner: {
    alignItems: "center",
    gap:        3,
  },
  activePill: {
    width:        24,
    height:       3,
    borderRadius: 2,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize:      10,
    letterSpacing: 0.2,
  },
  // Elevated center AI button
  centerOuter: {
    flex:            1,
    alignItems:      "center",
    justifyContent:  "flex-end",
    paddingBottom:   10,
    minHeight:       44,
  },
  centerCircle: {
    width:         54,
    height:        54,
    borderRadius:  27,
    borderWidth:   1.5,
    alignItems:    "center",
    justifyContent:"center",
    // Shadow (iOS)
    shadowOffset:  { width: 0, height: -3 },
    shadowOpacity: 0.25,
    shadowRadius:  10,
    // Elevation (Android)
    elevation:     10,
    // Rises above the bar: the extra CENTER_LIFT height in tabRow pushes it up
  },
  centerLabel: {
    fontSize:      9,
    fontWeight:    "700",
    letterSpacing: 0.2,
    marginTop:     4,
  },
});
