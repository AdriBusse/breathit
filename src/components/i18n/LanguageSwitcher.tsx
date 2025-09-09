"use client";

import React from "react";
import { useI18n } from "@/components/i18n/I18nProvider";

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest?.("#lang-switch")) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  return (
    <div id="lang-switch" className="fixed top-2 right-2 z-50 select-none">
      <button
        type="button"
        aria-label="Change language"
        onClick={() => setOpen((o) => !o)}
        className="h-8 w-8 rounded-full bg-white/10 text-white/70 hover:text-white hover:bg-white/15 border border-white/10 backdrop-blur-sm flex items-center justify-center shadow-sm"
        title="Language"
      >
        <GlobeIcon className="size-4" />
      </button>
      {open && (
        <div className="mt-1 min-w-36 rounded-lg border border-white/15 bg-black/70 text-white/90 backdrop-blur-sm text-sm shadow-xl">
          <button
            className={`block w-full text-left px-3 py-1.5 hover:bg-white/10 ${locale === "en" ? "text-white" : "text-white/80"}`}
            onClick={() => {
              setLocale("en");
              setOpen(false);
            }}
          >
            {t("language_english")}
          </button>
          <button
            className={`block w-full text-left px-3 py-1.5 hover:bg-white/10 ${locale === "de" ? "text-white" : "text-white/80"}`}
            onClick={() => {
              setLocale("de");
              setOpen(false);
            }}
          >
            {t("language_german")}
          </button>
          <button
            className={`block w-full text-left px-3 py-1.5 hover:bg-white/10 ${locale === "vi" ? "text-white" : "text-white/80"}`}
            onClick={() => {
              setLocale("vi");
              setOpen(false);
            }}
          >
            {t("language_vietnamese")}
          </button>
        </div>
      )}
    </div>
  );
}

function GlobeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
    </svg>
  );
}

