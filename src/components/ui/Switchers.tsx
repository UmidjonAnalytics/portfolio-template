"use client";

import { Moon, Sun } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { LANGS, type Lang } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMounted } from "@/lib/hooks";

/** `langs` limits the choice to the site's enabled languages; with one or none it renders nothing. */
export function LangSwitcher({ className, compact, langs = LANGS }: { className?: string; compact?: boolean; langs?: Lang[] }) {
  const { lang, setLang, t } = useLocale();
  if (langs.length <= 1) return null;
  return (
    <div className={cn("inline-flex items-center rounded-full border border-line bg-surface p-0.5", className)} role="group" aria-label={t("lang.label")}>
      {langs.map((l: Lang) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          aria-label={t(`lang.${l}`)}
          title={t(`lang.${l}`)}
          className={cn(
            "h-8 rounded-full text-xs font-bold tracking-wide transition",
            compact ? "px-2.5" : "px-3",
            lang === l ? "bg-accent text-accent-fg shadow-sm" : "text-muted hover:text-fg",
          )}
        >
          {t(`lang.short.${l}`)}
        </button>
      ))}
    </div>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, toggle } = useTheme();
  const { t } = useLocale();
  const mounted = useMounted();
  const dark = mounted && resolved === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? t("theme.switchToLight") : t("theme.switchToDark")}
      title={t("theme.toggle")}
      className={cn(
        "relative h-9 w-9 inline-flex items-center justify-center rounded-full border border-line bg-surface text-fg-2 hover:text-fg hover:bg-surface-2 transition",
        className,
      )}
    >
      <Sun className={cn("h-4 w-4 absolute transition-all", dark ? "scale-0 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100")} aria-hidden="true" />
      <Moon className={cn("h-4 w-4 absolute transition-all", dark ? "scale-100 rotate-0 opacity-100" : "scale-0 -rotate-90 opacity-0")} aria-hidden="true" />
    </button>
  );
}
