import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useThemeTokens } from "@/src/mobile/design-system";
import { usePressScale } from "@/src/mobile/lib/usePressScale";
import { useEntrance, useReducedMotion } from "@/src/mobile/lib/useEntrance";
import { hapticLight } from "@/src/mobile/lib/haptics";
import { fetchBooks, type Book } from "@/lib/siddurApi";
import { useLanguage } from "@/context/LanguageContext";

type CategoryValue =
  | "All"
  | "Siddur"
  | "Tehillim"
  | "Torah Portions"
  | "Daily Study"
  | "Prayer Books"
  | "Hebrew Learning"
  | "Community"
  | "Premium";

type FilterValue = "all" | "free" | "premium";

const CATEGORY_VALUES: CategoryValue[] = [
  "All",
  "Siddur",
  "Tehillim",
  "Torah Portions",
  "Daily Study",
  "Prayer Books",
  "Hebrew Learning",
  "Community",
  "Premium",
];

const CATEGORY_KEYS: Record<CategoryValue, keyof ReturnType<typeof useLanguage>["t"]> = {
  All: "libraryCategoryAll",
  Siddur: "libraryCategorySiddur",
  Tehillim: "libraryCategoryTehillim",
  "Torah Portions": "libraryCategoryTorahPortions",
  "Daily Study": "libraryCategoryDailyStudy",
  "Prayer Books": "libraryCategoryPrayerBooks",
  "Hebrew Learning": "libraryCategoryHebrewLearning",
  Community: "libraryCategoryCommunity",
  Premium: "libraryCategoryPremium",
};

function matchesCategory(book: Book, category: CategoryValue): boolean {
  if (category === "All") return true;
  if (category === "Premium") return book.isPremium;
  if (category === "Community") {
    return book.category === "Kuki Christian Books" || book.category === "Custom Community Books";
  }
  return book.category === category;
}

function getColumns(width: number): number {
  if (width >= 1024) return 4;
  if (width >= 700) return 3;
  return 2;
}

function formatCount(count: number, label: string): string {
  return `${count} ${label}`;
}

function usePremiumPulse(enabled: boolean, reducedMotion: boolean) {
  const opacity = useRef(new Animated.Value(0.72)).current;

  useEffect(() => {
    if (!enabled || reducedMotion) {
      opacity.stopAnimation();
      opacity.setValue(0.72);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.72, duration: 4000, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [enabled, opacity, reducedMotion]);

  return opacity;
}

function categoryLabel(category: CategoryValue, t: ReturnType<typeof useLanguage>["t"]): string {
  return t[CATEGORY_KEYS[category]];
}

const StatCard = memo(function StatCard({
  icon,
  value,
  label,
  sub,
  tint,
  colors,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  value: number;
  label: string;
  sub: string;
  tint: string;
  colors: ReturnType<typeof useThemeTokens>["colors"];
}) {
  return (
    <View
      style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      accessibilityRole="text"
      accessibilityLabel={`${value} ${label}. ${sub}`}
    >
      <View style={[styles.statIcon, { backgroundColor: tint + "18", borderColor: tint + "42" }]}>
        <Feather name={icon} size={19} color={tint} />
      </View>
      <View style={styles.statCopy}>
        <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: colors.textPrimary }]}>{label}</Text>
        <Text style={[styles.statSub, { color: colors.textMuted }]}>{sub}</Text>
      </View>
    </View>
  );
});

const BookCard = memo(function BookCard({
  book,
  index,
  cardWidth,
  cardHeight,
  coverHeight,
  colors,
  t,
  onOpen,
  onActions,
}: {
  book: Book;
  index: number;
  cardWidth: number;
  cardHeight: number;
  coverHeight: number;
  colors: ReturnType<typeof useThemeTokens>["colors"];
  t: ReturnType<typeof useLanguage>["t"];
  onOpen: (book: Book) => void;
  onActions: (book: Book) => void;
}) {
  const reducedMotion = useReducedMotion();
  const entrance = useEntrance(Math.min(index, 9) * 40);
  const { scale, onPressIn, onPressOut } = usePressScale(0.98);
  const lift = useRef(new Animated.Value(0)).current;
  const glowOpacity = usePremiumPulse(book.isPremium, reducedMotion);
  const available = !!book.fileUrl;
  const badgeColor = book.isPremium ? "#E6B93D" : "#5E7DFF";

  const handlePressIn = () => {
    onPressIn();
    if (!reducedMotion) {
      Animated.spring(lift, { toValue: -6, useNativeDriver: true, damping: 16, stiffness: 240 }).start();
    }
  };
  const handlePressOut = () => {
    onPressOut();
    Animated.spring(lift, { toValue: 0, useNativeDriver: true, damping: 16, stiffness: 240 }).start();
  };

  return (
    <Animated.View
      style={[
        {
          width: cardWidth,
          opacity: entrance.opacity,
          transform: [{ translateY: Animated.add(entrance.transform[0].translateY, lift) }, { scale }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.bookCard,
          {
            height: cardHeight,
            backgroundColor: book.isPremium ? "#141927" : colors.card,
            borderColor: book.isPremium ? "#E6B93D" : colors.border,
            shadowColor: book.isPremium ? "#E6B93D" : "#000",
            shadowOpacity: book.isPremium ? Animated.multiply(glowOpacity, 0.22) : 0.16,
          },
        ]}
      >
        <Pressable
          onPress={() => onOpen(book)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityRole="button"
          accessibilityLabel={`${book.title}, ${book.category}, ${book.isPremium ? t.libraryProBadge : t.libraryFreeBadge}`}
          accessibilityHint={available ? t.libraryOpen : t.libraryLockedDescription}
          style={styles.bookCardPressable}
        >
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text style={[styles.badgeText, { color: book.isPremium ? "#0B0F1A" : "#FFFFFF" }]}>
              {book.isPremium ? t.libraryProBadge : t.libraryFreeBadge}
            </Text>
          </View>

          <View style={[styles.cover, { height: coverHeight, backgroundColor: book.coverColor + "36" }]}>
            <Text style={[styles.coverEmoji, { fontSize: Math.max(38, coverHeight * 0.5) }, !available && styles.lockedCover]}>
              {book.coverEmoji}
            </Text>
            {!available && (
              <View style={[styles.lockOverlay, { backgroundColor: colors.background + "B8" }]}>
                <Feather name="lock" size={18} color={colors.textPrimary} />
              </View>
            )}
          </View>

          <Text style={[styles.bookTitle, { color: colors.textPrimary }]} numberOfLines={2}>
            {book.title}
          </Text>
          <Text style={[styles.bookCategory, { color: colors.textMuted }]} numberOfLines={1}>
            {book.category}
          </Text>

          <View style={styles.bookFooter}>
            <Feather
              name={available ? "book-open" : "lock"}
              size={16}
              color={available ? colors.textSecondary : colors.textMuted}
            />
            <Pressable
              onPress={() => onActions(book)}
              accessibilityRole="button"
              accessibilityLabel={`${book.title}: ${t.libraryBookActions}`}
              hitSlop={10}
              style={styles.moreButton}
            >
              <Feather name="more-vertical" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
});

export default function LibraryScreen() {
  const { colors, theme } = useThemeTokens();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ category?: string }>();
  const inputRef = useRef<TextInput>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryValue>(() =>
    CATEGORY_VALUES.includes(params.category as CategoryValue) ? params.category as CategoryValue : "All",
  );
  const [filter, setFilter] = useState<FilterValue>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [actionsBook, setActionsBook] = useState<Book | null>(null);

  const loadBooks = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    const result = await fetchBooks();
    setBooks(result.filter((book) => book.published));
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return books.filter((book) => {
      const searchMatch =
        !query ||
        book.title.toLowerCase().includes(query) ||
        book.category.toLowerCase().includes(query) ||
        book.description.toLowerCase().includes(query) ||
        book.language.toLowerCase().includes(query);
      const categoryMatch = matchesCategory(book, category);
      const filterMatch =
        filter === "all" ||
        (filter === "premium" && book.isPremium) ||
        (filter === "free" && !book.isPremium);
      return searchMatch && categoryMatch && filterMatch;
    });
  }, [books, category, filter, search]);

  const columns = getColumns(width);
  const horizontalPadding = width >= 700 ? 24 : 16;
  const gap = width >= 700 ? 14 : 10;
  const cardWidth = (Math.min(width, 1280) - horizontalPadding * 2 - gap * (columns - 1)) / columns;
  const cardHeight = Math.max(238, Math.min(264, cardWidth * 1.58));
  const coverHeight = Math.max(78, Math.min(108, cardWidth * 0.54));
  const premiumCount = books.filter((book) => book.isPremium).length;
  const freeCount = books.length - premiumCount;

  const openBook = useCallback(async (book: Book) => {
    hapticLight();
    if (book.fileUrl) {
      const WebBrowser = await import("expo-web-browser");
      await WebBrowser.openBrowserAsync(book.fileUrl);
    } else {
      setActionsBook(book);
    }
  }, []);

  const closeMenus = () => {
    setFilterOpen(false);
    setActionsBook(null);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, Platform.OS === "web" ? 24 : 12) + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t.libraryBack}
          hitSlop={8}
          style={({ pressed }) => [styles.headerButton, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="chevron-left" size={25} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t.libraryTitle}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {formatCount(books.length, t.libraryBooksAvailable)}
          </Text>
        </View>
        <Pressable
          onPress={() => setFilterOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t.libraryFilter}
          hitSlop={8}
          style={({ pressed }) => [styles.headerButton, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="sliders" size={19} color={colors.textPrimary} />
          {filter !== "all" && <View style={[styles.filterDot, { backgroundColor: colors.primary }]} />}
        </Pressable>
      </View>

      <ScrollView
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 110 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadBooks(true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.stickyControls, { backgroundColor: colors.background, paddingHorizontal: horizontalPadding }]}>
          <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={18} color={colors.textSecondary} />
            <TextInput
              ref={inputRef}
              value={search}
              onChangeText={setSearch}
              placeholder={t.librarySearchPlaceholder}
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.textPrimary }]}
              accessibilityLabel={t.librarySearchPlaceholder}
              returnKeyType="search"
            />
            {search.length > 0 ? (
              <Pressable onPress={() => setSearch("")} accessibilityRole="button" accessibilityLabel={t.libraryClose} hitSlop={8}>
                <Feather name="x" size={18} color={colors.textSecondary} />
              </Pressable>
            ) : (
              <Pressable
                onPress={() => inputRef.current?.focus()}
                accessibilityRole="button"
                accessibilityLabel={t.libraryVoiceSearch}
                hitSlop={8}
                style={[styles.voiceButton, { backgroundColor: "#8B5CF6" + "28" }]}
              >
                <Feather name="mic" size={17} color="#A78BFA" />
              </Pressable>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            accessibilityRole="tablist"
          >
            {CATEGORY_VALUES.map((item) => {
              const active = item === category;
              return (
                <Pressable
                  key={item}
                  onPress={() => {
                    hapticLight();
                    setCategory(item);
                  }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={categoryLabel(item, t)}
                  testID={`library-category-${item.toLowerCase().replace(/\s+/g, "-")}`}
                  style={({ pressed }) => [
                    styles.chip,
                    {
                      backgroundColor: active ? colors.primary : "transparent",
                      borderColor: active ? colors.primary : colors.border,
                      opacity: pressed ? 0.72 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: active ? colors.primaryForeground : colors.textSecondary }]}>
                    {categoryLabel(item, t)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={[styles.statsRow, { paddingHorizontal: horizontalPadding }]}>
          <StatCard icon="book-open" value={books.length} label={t.libraryTotalBooks} sub={t.libraryInLibrary} tint="#7FA1FF" colors={colors} />
          <StatCard icon="star" value={premiumCount} label={t.libraryPremium} sub={t.libraryProContent} tint="#E6B93D" colors={colors} />
          <StatCard icon="check-circle" value={freeCount} label={t.libraryFree} sub={t.libraryAvailableToRead} tint="#22C55E" colors={colors} />
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.centerState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="book-open" size={28} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              {search ? t.libraryNoBooksFound : t.libraryNoBooksInCategory}
            </Text>
            <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
              {search ? t.libraryTrySearch : t.libraryCheckBack}
            </Text>
          </View>
        ) : (
          <View style={[styles.grid, { paddingHorizontal: horizontalPadding, columnGap: gap, rowGap: gap }]}>
            {filtered.map((book, index) => (
              <BookCard
                key={book.id}
                book={book}
                index={index}
                cardWidth={cardWidth}
                cardHeight={cardHeight}
                coverHeight={coverHeight}
                colors={colors}
                t={t}
                onOpen={openBook}
                onActions={setActionsBook}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={filterOpen || !!actionsBook} transparent animationType="fade" onRequestClose={closeMenus}>
        <Pressable style={styles.modalBackdrop} onPress={closeMenus}>
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border, paddingBottom: insets.bottom + 20 }]}
          >
            {actionsBook ? (
              <>
                <View style={styles.sheetHeader}>
                  <Text style={[styles.sheetTitle, { color: colors.textPrimary }]} numberOfLines={2}>{actionsBook.title}</Text>
                  <Pressable onPress={closeMenus} accessibilityRole="button" accessibilityLabel={t.libraryClose} hitSlop={10}>
                    <Feather name="x" size={20} color={colors.textSecondary} />
                  </Pressable>
                </View>
                <Text style={[styles.sheetBody, { color: colors.textMuted }]}>
                  {actionsBook.fileUrl ? t.libraryOpen : t.libraryLockedDescription}
                </Text>
                {actionsBook.fileUrl && (
                  <Pressable style={[styles.sheetPrimary, { backgroundColor: colors.primary }]} onPress={() => { closeMenus(); openBook(actionsBook); }}>
                    <Feather name="book-open" size={17} color={colors.primaryForeground} />
                    <Text style={[styles.sheetPrimaryText, { color: colors.primaryForeground }]}>{t.libraryOpen}</Text>
                  </Pressable>
                )}
              </>
            ) : (
              <>
                <View style={styles.sheetHeader}>
                  <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>{t.libraryFilterTitle}</Text>
                  <Pressable onPress={closeMenus} accessibilityRole="button" accessibilityLabel={t.libraryClose} hitSlop={10}>
                    <Feather name="x" size={20} color={colors.textSecondary} />
                  </Pressable>
                </View>
                {([
                  ["all", t.libraryFilterAll, "layers"],
                  ["free", t.libraryFilterFree, "unlock"],
                  ["premium", t.libraryFilterPremium, "star"],
                ] as const).map(([value, label, icon]) => (
                  <Pressable
                    key={value}
                    onPress={() => { setFilter(value); closeMenus(); }}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: filter === value }}
                    style={[styles.filterOption, { borderColor: filter === value ? colors.primary : colors.border }]}
                  >
                    <Feather name={icon as React.ComponentProps<typeof Feather>["name"]} size={18} color={filter === value ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.filterOptionText, { color: colors.textPrimary }]}>{label}</Text>
                    {filter === value && <Feather name="check" size={18} color={colors.primary} />}
                  </Pressable>
                ))}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filterDot: { position: "absolute", width: 7, height: 7, borderRadius: 4, top: 9, right: 9 },
  headerCopy: { flex: 1 },
  headerTitle: { fontSize: 32, fontWeight: "800", letterSpacing: -1.1 },
  headerSubtitle: { fontSize: 15, marginTop: 2 },
  scrollContent: { flexGrow: 1 },
  stickyControls: { paddingTop: 4, paddingBottom: 12, gap: 14 },
  searchWrap: {
    minHeight: 56,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },
  searchInput: { flex: 1, minWidth: 0, fontSize: 15, paddingVertical: 2 },
  voiceButton: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  chipRow: { gap: 8, paddingRight: 16 },
  chip: { minHeight: 42, borderRadius: 17, borderWidth: 1, paddingHorizontal: 15, alignItems: "center", justifyContent: "center" },
  chipText: { fontSize: 13, fontWeight: "600" },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    minHeight: 96,
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statIcon: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  statCopy: { flex: 1, minWidth: 0 },
  statValue: { fontSize: 20, fontWeight: "800", lineHeight: 23 },
  statLabel: { fontSize: 11, fontWeight: "600", marginTop: 1 },
  statSub: { fontSize: 9, marginTop: 1 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  bookCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 4,
  },
  bookCardPressable: { flex: 1, padding: 10, justifyContent: "space-between" },
  badge: { alignSelf: "flex-start", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  badgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.45 },
  cover: { borderRadius: 14, alignItems: "center", justifyContent: "center", overflow: "hidden", marginVertical: 6 },
  coverEmoji: { lineHeight: 58 },
  lockedCover: { opacity: 0.38 },
  lockOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  bookTitle: { fontSize: 14, fontWeight: "700", lineHeight: 17, minHeight: 34 },
  bookCategory: { fontSize: 11, marginTop: 2 },
  bookFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 24 },
  moreButton: { width: 28, height: 28, alignItems: "flex-end", justifyContent: "center" },
  centerState: { flex: 1, minHeight: 300, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyIcon: { width: 64, height: 64, borderRadius: 22, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  emptyBody: { fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 6, maxWidth: 320 },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(3,7,18,0.68)" },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, padding: 20, gap: 12 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 4 },
  sheetTitle: { flex: 1, fontSize: 20, fontWeight: "800" },
  sheetBody: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  filterOption: { minHeight: 52, borderRadius: 16, borderWidth: 1, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", gap: 12 },
  filterOptionText: { flex: 1, fontSize: 15, fontWeight: "600" },
  sheetPrimary: { minHeight: 52, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 },
  sheetPrimaryText: { fontSize: 15, fontWeight: "700" },
});