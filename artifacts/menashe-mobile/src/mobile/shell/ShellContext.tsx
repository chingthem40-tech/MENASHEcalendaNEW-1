/**
 * ShellContext
 * SPR-M004 — Menashe Mobile Shell
 *
 * Central state store for the MobileShell.
 * All shell layers read from this context — screens use the API
 * to configure headers, push toasts, open dialogs, etc.
 *
 * Architecture:
 *   App → MobileShell → ShellContext.Provider
 *                    ↓  ShellHeader (reads headerConfig)
 *                    ↓  ShellNavigation (reads activeTab)
 *                    ↓  ShellHosts (reads toast/dialog/sheet queues)
 *
 * Usage (from a screen):
 *   const { setHeaderConfig, showToast, setActiveTab } = useShell();
 *
 * Future extension:
 *   - Add notification badge counts to tab config
 *   - Add search query state for SearchHost
 *   - Add global loading progress (determinate)
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

// ─── Tab definitions ──────────────────────────────────────────────────────────

export type TabKey = "home" | "calendar" | "ai" | "study" | "more";

export interface TabConfig {
  key:   TabKey;
  label: string;
  icon:  string; // Feather icon name
  badge?: number;
  badgeDot?: boolean;
}

export const SHELL_TABS: TabConfig[] = [
  { key: "home",     label: "Home",         icon: "home" },
  { key: "calendar", label: "Calendar",     icon: "calendar" },
  { key: "ai",       label: "Rav Menashe",  icon: "message-circle" },
  { key: "study",    label: "Study",        icon: "book-open" },
  { key: "more",     label: "More",         icon: "menu" },
];

// ─── Header config ────────────────────────────────────────────────────────────

export interface ShellHeaderConfig {
  /** Large title shown when scrolled to top */
  title:        string;
  /** Eyebrow line above the large title */
  eyebrow?:     string;
  /** Compact subtitle shown in collapsed state */
  subtitle?:    string;
  /** Whether to show back button */
  showBack?:    boolean;
  /** Back button callback */
  onBack?:      () => void;
  /** Whether the header should be transparent (for hero screens) */
  transparent?: boolean;
  /** Right-side action icons */
  actions?:     Array<{ icon: string; label: string; onPress: () => void }>;
}

// ─── Toast ────────────────────────────────────────────────────────────────────

export type ToastVariant = "default" | "success" | "error" | "warning" | "info";

export interface ToastConfig {
  id:       string;
  message:  string;
  variant?: ToastVariant;
  duration?: number;
}

// ─── Dialog ───────────────────────────────────────────────────────────────────

export interface DialogAction {
  label:    string;
  onPress:  () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

export interface DialogConfig {
  id:       string;
  title:    string;
  message?: string;
  actions:  DialogAction[];
  children?: ReactNode;
}

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────

export interface BottomSheetConfig {
  id:          string;
  title?:      string;
  snapHeight?: number;
  children:    ReactNode;
}

// ─── Overlay ──────────────────────────────────────────────────────────────────

export interface OverlayConfig {
  id:         string;
  children:   ReactNode;
  onDismiss?: () => void;
}

// ─── Context shape ────────────────────────────────────────────────────────────

export interface ShellContextValue {
  // Navigation
  activeTab:    TabKey;
  setActiveTab: (tab: TabKey) => void;
  tabs:         TabConfig[];
  setTabBadge:  (tab: TabKey, count: number, dot?: boolean) => void;

  // Header
  headerConfig:    ShellHeaderConfig;
  setHeaderConfig: (config: Partial<ShellHeaderConfig>) => void;
  resetHeader:     () => void;

  // Scroll offset (screens feed this in, header reads it)
  scrollY:         React.MutableRefObject<number>;

  // Toast
  toastQueue:  ToastConfig[];
  showToast:   (message: string, variant?: ToastVariant, duration?: number) => void;
  dismissToast:(id: string) => void;

  // Dialog
  dialogs:       DialogConfig[];
  showDialog:    (config: Omit<DialogConfig, "id">) => string;
  dismissDialog: (id: string) => void;

  // Bottom Sheet
  sheets:         BottomSheetConfig[];
  showSheet:      (config: Omit<BottomSheetConfig, "id">) => string;
  dismissSheet:   (id: string) => void;

  // Loading overlay
  isLoading:    boolean;
  loadingMessage?: string;
  showLoading:  (message?: string) => void;
  hideLoading:  () => void;

  // Overlay
  overlays:       OverlayConfig[];
  showOverlay:    (config: Omit<OverlayConfig, "id">) => string;
  dismissOverlay: (id: string) => void;

  // Search
  searchVisible:   boolean;
  searchQuery:     string;
  openSearch:      () => void;
  closeSearch:     () => void;
  setSearchQuery:  (q: string) => void;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_HEADER: ShellHeaderConfig = {
  title:       "Menashe Calendar",
  transparent: false,
};

let _idCounter = 0;
function uid(): string {
  return `shell-${++_idCounter}-${Date.now()}`;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ShellContext = createContext<ShellContextValue | null>(null);

export function useShell(): ShellContextValue {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used inside <MobileShell>");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface ShellProviderProps {
  children: ReactNode;
  initialTab?: TabKey;
}

export function ShellProvider({ children, initialTab = "home" }: ShellProviderProps) {
  const [activeTab, setActiveTab]           = useState<TabKey>(initialTab);
  const [tabs, setTabs]                     = useState<TabConfig[]>(SHELL_TABS);
  const [headerConfig, setHeaderConfigState] = useState<ShellHeaderConfig>(DEFAULT_HEADER);
  const [toastQueue, setToastQueue]         = useState<ToastConfig[]>([]);
  const [dialogs, setDialogs]               = useState<DialogConfig[]>([]);
  const [sheets, setSheets]                 = useState<BottomSheetConfig[]>([]);
  const [isLoading, setIsLoading]           = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | undefined>();
  const [overlays, setOverlays]             = useState<OverlayConfig[]>([]);
  const [searchVisible, setSearchVisible]   = useState(false);
  const [searchQuery, setSearchQueryState]  = useState("");
  const scrollY                             = useRef<number>(0);

  // Tab
  const setTabBadge = useCallback((tab: TabKey, count: number, dot?: boolean) => {
    setTabs((prev) =>
      prev.map((t) => t.key === tab ? { ...t, badge: count, badgeDot: dot } : t)
    );
  }, []);

  // Header
  const setHeaderConfig = useCallback((config: Partial<ShellHeaderConfig>) => {
    setHeaderConfigState((prev) => ({ ...prev, ...config }));
  }, []);
  const resetHeader = useCallback(() => setHeaderConfigState(DEFAULT_HEADER), []);

  // Toast
  const showToast = useCallback((
    message: string,
    variant: ToastVariant = "default",
    duration = 3000,
  ) => {
    const id = uid();
    setToastQueue((prev) => [...prev, { id, message, variant, duration }]);
    // Auto-dismiss
    setTimeout(() => {
      setToastQueue((prev) => prev.filter((t) => t.id !== id));
    }, duration + 400); // +400 for exit animation
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToastQueue((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Dialog
  const showDialog = useCallback((config: Omit<DialogConfig, "id">) => {
    const id = uid();
    setDialogs((prev) => [...prev, { ...config, id }]);
    return id;
  }, []);
  const dismissDialog = useCallback((id: string) => {
    setDialogs((prev) => prev.filter((d) => d.id !== id));
  }, []);

  // Sheet
  const showSheet = useCallback((config: Omit<BottomSheetConfig, "id">) => {
    const id = uid();
    setSheets((prev) => [...prev, { ...config, id }]);
    return id;
  }, []);
  const dismissSheet = useCallback((id: string) => {
    setSheets((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Loading
  const showLoading = useCallback((message?: string) => {
    setIsLoading(true);
    setLoadingMessage(message);
  }, []);
  const hideLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingMessage(undefined);
  }, []);

  // Overlay
  const showOverlay = useCallback((config: Omit<OverlayConfig, "id">) => {
    const id = uid();
    setOverlays((prev) => [...prev, { ...config, id }]);
    return id;
  }, []);
  const dismissOverlay = useCallback((id: string) => {
    setOverlays((prev) => prev.filter((o) => o.id !== id));
  }, []);

  // Search
  const openSearch  = useCallback(() => setSearchVisible(true), []);
  const closeSearch = useCallback(() => { setSearchVisible(false); setSearchQueryState(""); }, []);
  const setSearchQuery = useCallback((q: string) => setSearchQueryState(q), []);

  const value: ShellContextValue = {
    activeTab, setActiveTab, tabs, setTabBadge,
    headerConfig, setHeaderConfig, resetHeader,
    scrollY,
    toastQueue, showToast, dismissToast,
    dialogs, showDialog, dismissDialog,
    sheets, showSheet, dismissSheet,
    isLoading, loadingMessage, showLoading, hideLoading,
    overlays, showOverlay, dismissOverlay,
    searchVisible, searchQuery, openSearch, closeSearch, setSearchQuery,
  };

  return (
    <ShellContext.Provider value={value}>
      {children}
    </ShellContext.Provider>
  );
}
