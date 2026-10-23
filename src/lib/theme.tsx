"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Theme } from "./types";
import { DEFAULTS_STORAGE_KEY } from "./i18n";
import { accentForeground } from "./design";

export const THEME_STORAGE_KEY = "theme";

interface ThemeContextValue {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (t: Theme) => void;
  toggle: () => void;
  /** Apply the site-wide default theme if the visitor has not chosen one. */
  applyDefault: (t: Theme) => void;
  /** Apply the accent colour from site settings. */
  applyAccent: (hex: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isTheme(v: unknown): v is Theme {
  return v === "light" || v === "dark" || v === "system";
}

function readStoredTheme(): Theme | null {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(v) ? v : null;
  } catch {
    return null;
  }
}

function readDefaultTheme(): Theme | null {
  try {
    const d = JSON.parse(localStorage.getItem(DEFAULTS_STORAGE_KEY) || "{}");
    return isTheme(d.theme) ? d.theme : null;
  } catch {
    return null;
  }
}

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyClass(resolved: "light" | "dark") {
  const html = document.documentElement;
  html.classList.toggle("dark", resolved === "dark");
  html.style.colorScheme = resolved;
}

/**
 * Inline script executed before first paint (see app/layout.tsx). Keep in sync with the
 * storage keys above. It reads: theme choice, site defaults cache, language, accent colour and,
 * outside /admin and /forma, the site design (style, background, density).
 */
export const PRE_PAINT_SCRIPT = `(function(){try{var d={};try{d=JSON.parse(localStorage.getItem('${DEFAULTS_STORAGE_KEY}')||'{}')||{}}catch(e){}var t=localStorage.getItem('${THEME_STORAGE_KEY}')||d.theme||'system';var dark=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var h=document.documentElement;if(dark){h.classList.add('dark')}h.style.colorScheme=dark?'dark':'light';var l=localStorage.getItem('lang')||d.lang;if(l){h.lang=l}if(d.accent&&/^#[0-9a-fA-F]{6}$/.test(d.accent)){h.style.setProperty('--accent',d.accent);if(d.accentFg)h.style.setProperty('--accent-fg',d.accentFg)}if(!/^.(admin|forma)/.test(location.pathname)){var w=/^[a-z]{2,12}$/;if(w.test(d.style))h.dataset.style=d.style;if(w.test(d.bg))h.dataset.bg=d.bg;if(w.test(d.density))h.dataset.density=d.density}}catch(e){}})();`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");
  const [chosen, setChosen] = useState(false);

  // Sync React state with what the pre-paint script already applied.
  useEffect(() => {
    const stored = readStoredTheme();
    const initial = stored ?? readDefaultTheme() ?? "system";
    setThemeState(initial);
    if (stored) setChosen(true);
    setResolved(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  useEffect(() => {
    const compute = () => {
      const r = theme === "system" ? (systemPrefersDark() ? "dark" : "light") : theme;
      setResolved(r);
      applyClass(r);
    };
    compute();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => theme === "system" && compute();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    setChosen(true);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setTheme(resolved === "dark" ? "light" : "dark");
  }, [resolved, setTheme]);

  const applyDefault = useCallback(
    (t: Theme) => {
      if (!chosen && !readStoredTheme()) setThemeState(t);
    },
    [chosen],
  );

  const applyAccent = useCallback((hex: string) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
    document.documentElement.style.setProperty("--accent", hex);
    document.documentElement.style.setProperty("--accent-fg", accentForeground(hex));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolved, setTheme, toggle, applyDefault, applyAccent }),
    [theme, resolved, setTheme, toggle, applyDefault, applyAccent],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
