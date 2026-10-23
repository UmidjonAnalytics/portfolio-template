"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Palette, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { LAYOUTS, LAYOUT_BLOCKS, MOTION_KEYS, STYLES, type LayoutBlock, type SiteDesign } from "@/lib/design";
import { useDesign } from "@/lib/design-context";
import { useLocale } from "@/lib/i18n";
import { useSiteData, useTryDesign } from "@/lib/site-data";
import { cn } from "@/lib/utils";

/** The demo site only (NEXT_PUBLIC_DESIGN_DEMO=true): lets visitors try styles and layouts. Nothing is saved. */
export function designDemoEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DESIGN_DEMO === "true";
}

function Options<T extends string>({ value, options, onPick, label }: { value: T; options: readonly T[]; onPick: (v: T) => void; label: (v: T) => string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onPick(o)}
          className={cn(
            "min-h-8 px-3 rounded-full border text-xs font-semibold transition",
            value === o ? "bg-accent text-accent-fg border-accent" : "border-line bg-surface text-fg-2 hover:border-line-strong",
          )}
        >
          {label(o)}
        </button>
      ))}
    </div>
  );
}

export function DesignDemo() {
  const { t } = useLocale();
  const design = useDesign();
  const { settings } = useSiteData();
  const tryDesign = useTryDesign();
  const [open, setOpen] = useState(false);
  const [changed, setChanged] = useState(false);

  const change = (patch: Partial<SiteDesign>, focus?: string) => {
    tryDesign({ ...design, ...patch });
    setChanged(true);
    if (focus) window.setTimeout(() => document.getElementById(focus)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };
  const reset = () => {
    tryDesign(null);
    setChanged(false);
  };
  const blocks = LAYOUT_BLOCKS.filter((b) => b === "hero" || settings.design.order.includes(b));

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.2 }}
            aria-label={t("demo.title")}
            className="fixed z-[80] inset-x-3 bottom-20 sm:inset-x-auto sm:right-5 sm:w-[24rem] max-h-[70vh] overflow-y-auto card shadow-float p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display font-semibold">{t("demo.title")}</p>
                <p className="mt-0.5 text-xs text-muted">{t("demo.hint")}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label={t("common.close")} className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-full hover:bg-surface-2">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <p className="mt-4 mb-1.5 text-xs font-bold uppercase tracking-wider text-muted">{t("admin.design.style")}</p>
            <div className="grid grid-cols-3 gap-1.5">
              {STYLES.map((s) => {
                const [bg, , fg, line, accent] = s.swatch.light;
                return (
                  <button
                    key={s.key}
                    type="button"
                    aria-pressed={design.style === s.key}
                    onClick={() => change({ style: s.key })}
                    className={cn("rounded-xl border-2 p-1 text-left transition", design.style === s.key ? "border-accent" : "border-line hover:border-line-strong")}
                  >
                    <span className="flex items-center gap-1.5 h-8 rounded-lg px-2 border" style={{ background: bg, borderColor: line }}>
                      <span className="text-xs font-bold" style={{ color: fg }}>
                        Aa
                      </span>
                      <span className="h-2 w-5 rounded-sm" style={{ background: accent }} />
                    </span>
                    <span className="mt-1 block px-0.5 text-[11px] font-semibold leading-tight">{t(`admin.design.styles.${s.key}.name`)}</span>
                  </button>
                );
              })}
            </div>

            {blocks.map((b: LayoutBlock) => (
              <div key={b} className="mt-4">
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted">{b === "hero" ? t("admin.design.hero") : t(`nav.${b}`)}</p>
                <Options
                  value={design.layouts[b] as string}
                  options={LAYOUTS[b] as readonly string[]}
                  onPick={(l) => change({ layouts: { ...design.layouts, [b]: l } }, b === "hero" ? "top" : b)}
                  label={(l) => t(`admin.design.layouts.${b}.${l}`)}
                />
              </div>
            ))}

            <p className="mt-4 mb-1.5 text-xs font-bold uppercase tracking-wider text-muted">{t("admin.design.motion")}</p>
            <Options value={design.motion} options={MOTION_KEYS} onPick={(motion) => change({ motion })} label={(m) => t(`admin.design.motions.${m}`)} />

            {changed && (
              <button type="button" onClick={reset} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-strong hover:underline">
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                {t("demo.reset")}
              </button>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="fixed z-[80] right-3 bottom-4 sm:right-5 sm:bottom-5 inline-flex items-center gap-2 h-12 px-5 rounded-full bg-accent text-accent-fg font-semibold shadow-float hover:brightness-110 transition"
      >
        <Palette className="h-5 w-5" aria-hidden="true" />
        {t("demo.open")}
      </button>
    </>
  );
}
