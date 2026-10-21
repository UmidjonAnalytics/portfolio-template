import { LANGS, type Lang, type Localized, type LocalizedList } from "./types";

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Pick the translation for `lang`, falling back to English, then to any non-empty value. */
export function pick(value: Localized | string | undefined | null, lang: Lang): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  const v = value[lang];
  if (v && v.trim()) return v;
  if (value.en && value.en.trim()) return value.en;
  return value.ru?.trim() || value.uz?.trim() || "";
}

/** True when at least one language of a localized value has text. */
export function filled(value: Localized | undefined | null): boolean {
  if (!value) return false;
  return LANGS.some((l) => !!value[l]?.trim());
}

/** Normalise a language list from settings: known languages only, never empty. */
export function normalizeLangs(value: unknown): Lang[] {
  const list = Array.isArray(value) ? LANGS.filter((l) => value.includes(l)) : [];
  return list.length ? list : [...LANGS];
}

export function pickList(value: LocalizedList | undefined | null, lang: Lang): string[] {
  if (!value) return [];
  const v = value[lang];
  if (v && v.length) return v;
  if (value.en && value.en.length) return value.en;
  return value.ru?.length ? value.ru : (value.uz ?? []);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function localeOf(lang: Lang): string {
  return lang === "ru" ? "ru-RU" : "en-US";
}

/**
 * Browsers ship no Uzbek month names (Chrome renders "2024 M03"), so Uzbek dates are
 * formatted by hand in the usual style: "Mar 2024", "15-mart 2024".
 */
const UZ_MONTHS_SHORT = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];
const UZ_MONTHS_LONG = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];

function uzDate(d: Date): string {
  return `${d.getDate()}-${UZ_MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

/** "2024-03" -> "Mar 2024" in the given language. Empty -> present label. */
export function formatMonth(ym: string | undefined, lang: Lang, presentLabel = ""): string {
  if (!ym) return presentLabel;
  const [y, m] = ym.split("-").map(Number);
  if (!y) return ym;
  const d = new Date(y, (m || 1) - 1, 1);
  if (lang === "uz") return `${UZ_MONTHS_SHORT[d.getMonth()]} ${y}`;
  try {
    return new Intl.DateTimeFormat(localeOf(lang), { month: "short", year: "numeric" }).format(d);
  } catch {
    return ym;
  }
}

export function formatDate(iso: string | number | undefined, lang: Lang): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  if (lang === "uz") return uzDate(d);
  try {
    return new Intl.DateTimeFormat(localeOf(lang), { day: "numeric", month: "short", year: "numeric" }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

export function formatDateTime(ts: number | undefined, lang: Lang): string {
  if (!ts) return "";
  const d = new Date(ts);
  if (lang === "uz") return `${uzDate(d)}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  try {
    return new Intl.DateTimeFormat(localeOf(lang), { dateStyle: "medium", timeStyle: "short" }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function isSafeHttpUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function hostAllowed(url: string, allowlist: string[]): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return allowlist.some((h) => {
      const a = h.trim().toLowerCase();
      return a && (host === a || host.endsWith("." + a));
    });
  } catch {
    return false;
  }
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function isValidHex(hex: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(hex.trim());
}

/** Relative luminance of a hex colour (0 = black, 1 = white). */
export function luminance(hex: string): number {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return 0.3;
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => {
    const c = parseInt(h, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function telegramUrl(handle: string): string {
  const h = handle.trim();
  if (!h) return "";
  if (/^https?:\/\//i.test(h)) return h;
  return `https://t.me/${h.replace(/^@/, "")}`;
}

export function externalUrl(value: string, base: string): string {
  const v = value.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  return `${base}${v.replace(/^@|^\//, "")}`;
}
