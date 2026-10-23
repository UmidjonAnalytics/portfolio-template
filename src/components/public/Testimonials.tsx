"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useEntrance, useLayout } from "@/lib/design-context";
import { useLocale } from "@/lib/i18n";
import { useSiteData } from "@/lib/site-data";
import type { Testimonial } from "@/lib/types";
import { cn, initials } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SmartImage } from "@/components/ui/SmartImage";

function Stars({ item }: { item: Testimonial }) {
  const { t } = useLocale();
  const rating = Math.max(0, Math.min(5, Math.round(item.rating ?? 5)));
  return (
    <div className="flex items-center gap-1" aria-label={t("testimonials.rating", { rating })}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn("h-4 w-4", i < rating ? "fill-warning text-warning" : "text-line-strong")} aria-hidden="true" />
      ))}
    </div>
  );
}

function Person({ item }: { item: Testimonial }) {
  const { tr } = useLocale();
  return (
    <figcaption className="mt-6 flex items-center gap-4">
      <div className="relative h-12 w-12 rounded-full overflow-hidden bg-accent-soft shrink-0">
        <SmartImage
          src={item.avatar}
          alt=""
          fill
          sizes="48px"
          className="object-cover"
          fallback={<span className="absolute inset-0 flex items-center justify-center font-bold text-accent-strong">{initials(item.name)}</span>}
        />
      </div>
      <div>
        <p className="font-semibold">{item.name}</p>
        <p className="text-sm text-muted">{[tr(item.role), item.company].filter(Boolean).join(" · ")}</p>
      </div>
    </figcaption>
  );
}

/** Grid and wall layouts: every testimonial at once. */
function TestimonialCard({ item, index }: { item: Testimonial; index: number }) {
  const { tr } = useLocale();
  return (
    <Reveal delay={Math.min(index * 0.05, 0.3)} className="card p-6 sm:p-7 relative h-full break-inside-avoid">
      <Quote className="absolute top-5 right-5 h-8 w-8 text-accent-soft" aria-hidden="true" />
      <figure>
        <Stars item={item} />
        <blockquote className="mt-4 leading-relaxed text-fg">“{tr(item.quote)}”</blockquote>
        <Person item={item} />
      </figure>
    </Reveal>
  );
}

export function Testimonials() {
  const layout = useLayout("testimonials");
  const { testimonials } = useSiteData();
  const { t } = useLocale();
  if (testimonials.length === 0) return null;
  if (layout === "carousel") return <TestimonialCarousel />;
  return (
    <Section id="testimonials" eyebrow={t("nav.testimonials")} title={t("testimonials.title")} subtitle={t("testimonials.subtitle")} tone="muted">
      {layout === "wall" ? (
        <ul className="columns-1 md:columns-2 lg:columns-3 gap-5">
          {testimonials.map((item, i) => (
            <li key={item.id} className="mb-5 break-inside-avoid">
              <TestimonialCard item={item} index={i} />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((item, i) => (
            <li key={item.id}>
              <TestimonialCard item={item} index={i} />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function TestimonialCarousel() {
  const { testimonials } = useSiteData();
  const { t, tr } = useLocale();
  const { off: reduce } = useEntrance();
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [paused, setPaused] = useState(false);
  const count = testimonials.length;

  const go = useCallback(
    (delta: number) => {
      if (count === 0) return;
      setDir(delta);
      setIndex((i) => (i + delta + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (count < 2 || paused || reduce) return;
    const id = window.setInterval(() => go(1), 6500);
    return () => window.clearInterval(id);
  }, [count, paused, reduce, go]);

  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  if (count === 0) return null;
  const item = testimonials[Math.min(index, count - 1)];

  return (
    <Section id="testimonials" eyebrow={t("nav.testimonials")} title={t("testimonials.title")} subtitle={t("testimonials.subtitle")} tone="muted">
      <div
        className="relative max-w-3xl mx-auto"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        role="region"
        aria-roledescription="carousel"
        aria-label={t("testimonials.title")}
      >
        <div className="relative overflow-hidden card p-7 sm:p-10 min-h-[18rem]">
          <Quote className="absolute top-6 right-6 h-10 w-10 text-accent-soft" aria-hidden="true" />
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.figure
              key={item.id}
              custom={dir}
              initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              aria-live="polite"
            >
              <Stars item={item} />
              <blockquote className="mt-4 text-lg sm:text-xl leading-relaxed text-fg">“{tr(item.quote)}”</blockquote>
              <Person item={item} />
            </motion.figure>
          </AnimatePresence>
        </div>

        {count > 1 && (
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={t("testimonials.previous")}
              className="h-10 w-10 inline-flex items-center justify-center rounded-full border border-line bg-surface hover:bg-surface-2 transition"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="flex items-center gap-2" role="tablist">
              {testimonials.map((tm, i) => (
                <button
                  key={tm.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={t("testimonials.goTo", { index: i + 1 })}
                  onClick={() => {
                    setDir(i > index ? 1 : -1);
                    setIndex(i);
                  }}
                  className={cn("h-2.5 rounded-full transition-all", i === index ? "w-7 bg-accent" : "w-2.5 bg-line-strong hover:bg-muted")}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={t("testimonials.next")}
              className="h-10 w-10 inline-flex items-center justify-center rounded-full border border-line bg-surface hover:bg-surface-2 transition"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </Section>
  );
}
