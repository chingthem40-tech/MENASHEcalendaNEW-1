import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import translations, { Lang, Translations, en as defaultEn } from "@/lib/translations";

const LANG_KEY = "menashe-language";
const OVERRIDES_KEY = "menashe-tk-overrides";

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => Promise<void>;
  t: Translations;
  tkOverrides: Partial<Translations>;
  setTkOverride: (key: keyof Translations, value: string) => void;
  saveTkOverrides: (overrides: Partial<Translations>) => Promise<void>;
  resetTkOverrides: () => Promise<void>;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: async () => {},
  t: translations.en,
  tkOverrides: {},
  setTkOverride: () => {},
  saveTkOverrides: async () => {},
  resetTkOverrides: async () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [tkOverrides, setTkOverridesState] = useState<Partial<Translations>>({});

  useEffect(() => {
    async function load() {
      try {
        const [langVal, overridesVal] = await Promise.all([
          AsyncStorage.getItem(LANG_KEY),
          AsyncStorage.getItem(OVERRIDES_KEY),
        ]);
        if (langVal === "tk") setLangState("tk");
        if (overridesVal) {
          try { setTkOverridesState(JSON.parse(overridesVal)); } catch {}
        }
      } catch {}
    }
    load();
  }, []);

  const setLang = useCallback(async (l: Lang) => {
    setLangState(l);
    await AsyncStorage.setItem(LANG_KEY, l);
  }, []);

  const setTkOverride = useCallback((key: keyof Translations, value: string) => {
    setTkOverridesState((prev: Partial<Translations>) => ({ ...prev, [key]: value }));
  }, []);

  const saveTkOverrides = useCallback(async (overrides: Partial<Translations>) => {
    setTkOverridesState(overrides);
    await AsyncStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
  }, []);

  const resetTkOverrides = useCallback(async () => {
    setTkOverridesState({});
    await AsyncStorage.removeItem(OVERRIDES_KEY);
  }, []);

  const baseTk = translations.tk;
  const mergedTk: Translations = { ...baseTk, ...tkOverrides } as Translations;
  const t = lang === "tk" ? mergedTk : translations.en;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, tkOverrides, setTkOverride, saveTkOverrides, resetTkOverrides }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
