/**
 * SPR-M001 Phase 9 — Screen Registry
 *
 * Canonical list of every screen that exists (or will exist) in the mobile app.
 * No implementation lives here — this is a pure type/registry contract.
 * Future screen SPRs will import from here to guarantee naming consistency.
 */

export type ScreenName =
  | "Home"
  | "Calendar"
  | "Zmanim"
  | "Community"
  | "Torah"
  | "Settings"
  | "Sanctuary"
  | "AI"
  | "Library"
  | "Notifications"
  | "SignIn"
  | "SignUp"
  | "ForgotPassword"
  | "DafYomi"
  | "Mussar"
  | "YahrzeitCalc"
  | "PrayerBoard"
  | "Siddur"
  | "TorahTracker"
  | "TranslationEditor";

export interface ScreenMeta {
  name: ScreenName;
  title: string;
  requiresAuth: boolean;
  isTab: boolean;
  deepLinkPath?: string;
}

/**
 * Registry of all screens.
 * Add an entry here before building the screen — keeps architecture honest.
 */
export const SCREEN_REGISTRY: Readonly<Record<ScreenName, ScreenMeta>> = {
  Home:              { name: "Home",              title: "Home",              requiresAuth: true,  isTab: true,  deepLinkPath: "/"                  },
  Calendar:          { name: "Calendar",          title: "Calendar",          requiresAuth: true,  isTab: true,  deepLinkPath: "/calendar"           },
  Zmanim:            { name: "Zmanim",            title: "Zmanim",            requiresAuth: true,  isTab: true,  deepLinkPath: "/zmanim"             },
  Community:         { name: "Community",         title: "Community",         requiresAuth: true,  isTab: true,  deepLinkPath: "/community"          },
  Torah:             { name: "Torah",             title: "Torah",             requiresAuth: true,  isTab: true,  deepLinkPath: "/torah"              },
  Settings:          { name: "Settings",          title: "Settings",          requiresAuth: true,  isTab: true,  deepLinkPath: "/settings"           },
  Sanctuary:         { name: "Sanctuary",         title: "Sanctuary",         requiresAuth: true,  isTab: false, deepLinkPath: "/sanctuary"          },
  AI:                { name: "AI",                title: "Rav Menashe AI",    requiresAuth: true,  isTab: false, deepLinkPath: "/ai"                 },
  Library:           { name: "Library",           title: "Siddur Library",    requiresAuth: true,  isTab: false, deepLinkPath: "/siddur"             },
  Notifications:     { name: "Notifications",     title: "Notifications",     requiresAuth: true,  isTab: false, deepLinkPath: "/notifications"      },
  SignIn:            { name: "SignIn",            title: "Sign In",           requiresAuth: false, isTab: false, deepLinkPath: "/sign-in"            },
  SignUp:            { name: "SignUp",            title: "Sign Up",           requiresAuth: false, isTab: false, deepLinkPath: "/sign-up"            },
  ForgotPassword:    { name: "ForgotPassword",    title: "Forgot Password",   requiresAuth: false, isTab: false, deepLinkPath: "/forgot-password"    },
  DafYomi:           { name: "DafYomi",           title: "Daf Yomi",          requiresAuth: true,  isTab: false, deepLinkPath: "/daf-yomi"           },
  Mussar:            { name: "Mussar",            title: "Mussar",            requiresAuth: true,  isTab: false, deepLinkPath: "/mussar"             },
  YahrzeitCalc:      { name: "YahrzeitCalc",      title: "Yahrzeit Calc",     requiresAuth: true,  isTab: false, deepLinkPath: "/yahrzeit-calc"      },
  PrayerBoard:       { name: "PrayerBoard",       title: "Prayer Board",      requiresAuth: true,  isTab: false, deepLinkPath: "/prayer-board"       },
  Siddur:            { name: "Siddur",            title: "Siddur",            requiresAuth: true,  isTab: false, deepLinkPath: "/siddur"             },
  TorahTracker:      { name: "TorahTracker",      title: "Torah Tracker",     requiresAuth: true,  isTab: false, deepLinkPath: "/torah-tracker"      },
  TranslationEditor: { name: "TranslationEditor", title: "Translation Editor",requiresAuth: true,  isTab: false, deepLinkPath: "/translation-editor" },
} as const;

export type TabScreenName = {
  [K in ScreenName]: (typeof SCREEN_REGISTRY)[K]["isTab"] extends true ? K : never;
}[ScreenName];
