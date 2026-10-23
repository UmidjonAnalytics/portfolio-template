"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * A horizontal row that snaps item by item: swipe on touch, arrows on desktop, shift+wheel or
 * keyboard anywhere. On phones the row bleeds to the screen edges so the next card peeks in.
 */
export function SwipeRow({ children, label, itemClassName }: { children: ReactNode; label: string; itemClassName: string }) {
  const { t } = useLocale();
  const ref = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 8 });
  }, []);

  useEffect(() => {
    measure();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, children]);

  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  const arrow = "h-10 w-10 inline-flex items-center justify-center rounded-full border border-line bg-surface hover:bg-surface-2 transition disabled:opacity-35 disabled:pointer-events-none";

  return (
    <div role="region" aria-roledescription="carousel" aria-label={label}>
      <ul
        ref={ref}
        onScroll={measure}
        tabIndex={0}
        className="swipe-row flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth -mx-5 px-5 scroll-px-5 sm:mx-0 sm:px-0 sm:scroll-px-0 pb-2 outline-none"
      >
        {Children.map(children, (child) => (
          <li className={cn("snap-start shrink-0", itemClassName)}>{child}</li>
        ))}
      </ul>
      {!(edges.start && edges.end) && (
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={() => scroll(-1)} disabled={edges.start} aria-label={t("common.previous")} className={arrow}>
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => scroll(1)} disabled={edges.end} aria-label={t("common.next")} className={arrow}>
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

/** Previous / dots / next under a one-at-a-time carousel. */
export function SlideControls({ count, index, onGo, onStep }: { count: number; index: number; onGo: (i: number) => void; onStep: (delta: 1 | -1) => void }) {
  const { t } = useLocale();
  if (count < 2) return null;
  const arrow = "h-10 w-10 inline-flex items-center justify-center rounded-full border border-line bg-surface hover:bg-surface-2 transition";
  return (
    <div className="mt-6 flex items-center justify-center gap-4">
      <button type="button" onClick={() => onStep(-1)} aria-label={t("common.previous")} className={arrow}>
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <div className="flex items-center gap-2" role="tablist">
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={t("common.goToSlide", { index: i + 1 })}
            onClick={() => onGo(i)}
            className={cn("h-2.5 rounded-full transition-all", i === index ? "w-7 bg-accent" : "w-2.5 bg-line-strong hover:bg-muted")}
          />
        ))}
      </div>
      <button type="button" onClick={() => onStep(1)} aria-label={t("common.next")} className={arrow}>
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}

/** Slide offset for a one-at-a-time carousel, following the site's motion setting. */
export function slideVariants(off: boolean, motion: string) {
  const d = off ? 0 : motion === "fade" ? 0 : 60;
  return {
    enter: (dir: number) => (off ? { opacity: 1 } : motion === "zoom" ? { opacity: 0, scale: 0.94 } : { opacity: 0, x: dir * d }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (dir: number) => (off ? { opacity: 1 } : motion === "zoom" ? { opacity: 0, scale: 1.04 } : { opacity: 0, x: dir * -d }),
  };
}
