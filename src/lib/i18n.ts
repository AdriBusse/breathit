import en from "@/lib/i18n/en";
import de from "@/lib/i18n/de";
import vi from "@/lib/i18n/vi";

export type Locale = "en" | "de" | "vi";

export const SUPPORTED_LOCALES: Locale[] = ["en", "de", "vi"];

export type Messages = Record<string, string>;

export const messages: Record<Locale, Messages> = { en, de, vi };

export function countryToLocale(country?: string | null): Locale | null {
  if (!country) return null;
  const c = country.toUpperCase();
  // Map common DACH countries to German
  if (["DE", "AT", "CH", "LI", "LU"].includes(c)) return "de";
  // Vietnam -> Vietnamese
  if (c === "VN") return "vi";
  return null;
}

// Picks locale using country first (if provided), then Accept-Language
export function pickLocale(acceptLanguage?: string | null, country?: string | null): Locale {
  const fallback: Locale = "en";
  const fromCountry = countryToLocale(country);
  if (fromCountry) return fromCountry;

  if (!acceptLanguage) return fallback;
  const al = acceptLanguage.toLowerCase();
  for (const loc of SUPPORTED_LOCALES) {
    if (al.includes(loc)) return loc;
  }
  if (al.includes("de")) return "de";
  if (al.includes("vi") || al.includes("vn")) return "vi";
  return fallback;
}

export function formatMessage(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  const dict = messages[locale] ?? messages.en;
  let out = dict[key] ?? messages.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return out;
}
