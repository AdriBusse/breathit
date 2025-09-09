"use client";

import React from "react";
import { Locale, SUPPORTED_LOCALES, formatMessage } from "@/lib/i18n";

type I18nContextType = {
  locale: Locale;
  t: (key: string, vars?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
};

const I18nContext = React.createContext<I18nContextType | null>(null);

const LS_KEY = "breathit_locale_v1";

export function I18nProvider({ children, initialLocale }: { children: React.ReactNode; initialLocale: Locale }) {
  const [locale, setLocaleState] = React.useState<Locale>(initialLocale);

  // Load stored preference (if any) and keep it in sync
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY) as Locale | null;
      if (saved && SUPPORTED_LOCALES.includes(saved)) setLocaleState(saved);
    } catch {}
  }, []);

  const setLocale = React.useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(LS_KEY, l);
    } catch {}
    // Also update <html lang> for a11y/readers
    if (typeof document !== "undefined") {
      document.documentElement.lang = l;
    }
  }, []);

  const value = React.useMemo<I18nContextType>(
    () => ({
      locale,
      setLocale,
      t: (key, vars) => formatMessage(locale, key, vars),
    }),
    [locale, setLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

