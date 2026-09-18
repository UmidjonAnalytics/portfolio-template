"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";
import en from "../../locales/en.json";
import ru from "../../locales/ru.json";
import uz from "../../locales/uz.json";
import { LANGS, type Lang, type Localized, type LocalizedList } from "./types";
import { pick, pickList } from "./utils";

type Dict = Record<string, unknown>;
const dicts: Record<Lang, Dict> = { en, ru, uz };

export const LANG_STORAGE_KEY = "lang";
export const DEFAULTS_STORAGE_KEY = "site-defaults";

function lookup(dict: Dict, path: string): string | undefined {
  const parts = path.split(".");
  let cur: unknown = dict;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Dict)) cur = (cur as Dict)[p];
    else return undefined;
  }
  return typeof cur === "string" ? cur : undefined;
}

export type TVars = Record<string, string | number>;

export function translate(lang: Lang, key: string, vars?: TVars): string {
  let value = lookup(dicts[lang], key) ?? lookup(dicts.en, key) ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) value = value.split(`{${k}}`).join(String(v));
  }
  return value;
}

export function isLang(v: unknown): v is Lang {
  return typeof v === "string" && (LANGS as string[]).includes(v);
}

interface LocaleContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Static UI string from /locales. */
  t: (key: string, vars?: TVars) => string;
  /** Dynamic Firestore string with English fallback. */
  tr: (value: Localized | string | undefined | null) => string;
  /** Dynamic Firestore list with English fallback. */
  trl: (value: LocalizedList | undefined | null) => string[];
  /** Apply the site-wide default language if the visitor has not chosen one. */
  applyDefault: (lang: Lang) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function readStoredLang(): Lang | null {
  try {
    const v = localStorage.getItem(LANG_STORAGE_KEY);
    return isLang(v) ? v : null;
  } catch {
    return null;
  }
}

function readDefaultLang(): Lang | null {
  try {
    const d = JSON.parse(localStorage.getItem(DEFAULTS_STORAGE_KEY) || "{}");
    return isLang(d.lang) ? d.lang : null;
  } catch {
    return null;
  }
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [chosen, setChosen] = useState(false);

  // Runs before first paint on the client, so the stored language is applied without a visible flash.
  useIsoLayoutEffect(() => {
    const stored = readStoredLang();
    if (stored) {
      setLangState(stored);
      setChosen(true);
    } else {
      const def = readDefaultLang();
      if (def) setLangState(def);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    setChosen(true);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const applyDefault = useCallback(
    (l: Lang) => {
      if (!chosen && !readStoredLang()) setLangState(l);
    },
    [chosen],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      lang,
      setLang,
      t: (key, vars) => translate(lang, key, vars),
      tr: (v) => pick(v, lang),
      trl: (v) => pickList(v, lang),
      applyDefault,
    }),
    [lang, setLang, applyDefault],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside LocaleProvider");
  return ctx;
}

/** Shorthand: `const t = useT();` */
export function useT() {
  return useLocale().t;
}
