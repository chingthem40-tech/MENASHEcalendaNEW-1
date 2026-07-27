import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";
import translations, { Lang, Translations, tk as builtInTk } from "../lib/translations";

const OVERRIDE_KEY = "menashe-tk-overrides";

function loadOverrides(): Partial<Translations> {
  try {
    const raw = localStorage.getItem(OVERRIDE_KEY);
    if (raw) return JSON.parse(raw) as Partial<Translations>;
  } catch {}
  return {};
}

function buildTk(overrides: Partial<Translations>): Translations {
  return { ...builtInTk, ...overrides };
}

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
  tkOverrides: Partial<Translations>;
  setTkOverride: (key: keyof Translations, value: string) => void;
  saveTkOverrides: (overrides: Partial<Translations>) => void;
  resetTkOverrides: () => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  t: translations.en,
  tkOverrides: {},
  setTkOverride: () => {},
  saveTkOverrides: () => {},
  resetTkOverrides: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem("menashe-language") as Lang;
      return saved === "tk" ? "tk" : "en";
    } catch {
      return "en";
    }
  });

  const [tkOverrides, setTkOverridesState] = useState<Partial<Translations>>(loadOverrides);

  // Memoize the merged TK translations so buildTk() only reruns when overrides change,
  // not on every render. buildTk is { ...builtInTk, ...overrides } — cheap but avoids
  // creating a new object reference that would invalidate the memoized context value.
  const activeTk = useMemo(() => buildTk(tkOverrides), [tkOverrides]);
  const t = lang === "tk" ? activeTk : translations.en;

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("menashe-language", l); } catch {}
  }, []);

  const setTkOverride = useCallback((key: keyof Translations, value: string) => {
    setTkOverridesState(prev => {
      const next = { ...prev, [key]: value };
      try { localStorage.setItem(OVERRIDE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const saveTkOverrides = useCallback((overrides: Partial<Translations>) => {
    setTkOverridesState(overrides);
    try { localStorage.setItem(OVERRIDE_KEY, JSON.stringify(overrides)); } catch {}
  }, []);

  const resetTkOverrides = useCallback(() => {
    setTkOverridesState({});
    try { localStorage.removeItem(OVERRIDE_KEY); } catch {}
  }, []);

  // Memoize the context value object so consumers only re-render when lang, t,
  // or overrides actually change — not on any unrelated LanguageProvider render.
  // This matters because useLanguage() is called in 40+ files (80 call sites).
  const contextValue = useMemo<LanguageContextValue>(
    () => ({ lang, setLang, t, tkOverrides, setTkOverride, saveTkOverrides, resetTkOverrides }),
    [lang, setLang, t, tkOverrides, setTkOverride, saveTkOverrides, resetTkOverrides],
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
