"use client";

import { Briefcase } from "lucide-react";
import { useLayout } from "@/lib/design-context";
import { useLocale } from "@/lib/i18n";
import { useSiteData } from "@/lib/site-data";
import type { Experience as ExperienceItem } from "@/lib/types";
import { cn, formatMonth } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";

function Entry({ item, align = "left" }: { item: ExperienceItem; align?: "left" | "right" }) {
  const { t, tr, trl, lang } = useLocale();
  const bullets = trl(item.bullets);
  const current = !item.endDate;
  return (
    <>
      <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted font-medium", align === "right" && "lg:justify-end")}>
        <time dateTime={item.startDate}>{formatMonth(item.startDate, lang)}</time>
        <span aria-hidden="true">—</span>
        <time dateTime={item.endDate || undefined} className={current ? "text-accent-strong font-bold" : undefined}>
          {formatMonth(item.endDate, lang, t("experience.present"))}
        </time>
        {tr(item.location) && <span className="before:content-['·'] before:mr-3">{tr(item.location)}</span>}
      </div>
      <h3 className="mt-2 font-display text-xl font-semibold">{tr(item.role)}</h3>
      <p className={cn("mt-1 flex items-center gap-2 font-semibold text-fg-2", align === "right" && "lg:justify-end")}>
        <Briefcase className="h-4 w-4 text-accent-strong" aria-hidden="true" />
        {item.company}
      </p>
      {bullets.length > 0 && (
        <ul className="mt-4 space-y-2 text-left">
          {bullets.map((b, j) => (
            <li key={j} className="flex gap-3 text-fg-2 leading-relaxed">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

const DOT = "h-5 w-5 rounded-full border-4 border-bg bg-accent shadow-[0_0_0_4px_var(--accent-soft)]";

export function Experience() {
  const { experience } = useSiteData();
  const { t } = useLocale();
  const layout = useLayout("experience");
  if (experience.length === 0) return null;

  return (
    <Section id="experience" eyebrow={t("nav.experience")} title={t("experience.title")} subtitle={t("experience.subtitle")}>
      {layout === "cards" ? (
        <ol className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {experience.map((item, i) => (
            <li key={item.id}>
              <Reveal delay={i * 0.05} className={cn("card p-6 h-full", !item.endDate && "border-t-4 border-t-accent")}>
                <Entry item={item} />
              </Reveal>
            </li>
          ))}
        </ol>
      ) : layout === "zigzag" ? (
        // Phones: one line on the left. Wide screens: a centre line with entries on alternating sides.
        <ol className="relative space-y-10 lg:space-y-14 before:absolute before:top-0 before:bottom-0 before:left-[10px] lg:before:left-1/2 before:w-0.5 before:-translate-x-1/2 before:bg-line-strong">
          {experience.map((item, i) => {
            const right = i % 2 === 1;
            return (
              <li key={item.id} className="relative pl-10 lg:pl-0 lg:grid lg:grid-cols-2 lg:gap-16">
                <span className={cn("absolute left-0 lg:left-1/2 lg:-translate-x-1/2 top-1.5", DOT)} aria-hidden="true" />
                <Reveal delay={i * 0.05} className={cn("card p-6", right ? "lg:col-start-2" : "lg:text-right")}>
                  <Entry item={item} align={right ? "left" : "right"} />
                </Reveal>
              </li>
            );
          })}
        </ol>
      ) : (
        <ol className="relative border-l-2 border-line ml-3 sm:ml-5 space-y-10">
          {experience.map((item, i) => (
            <li key={item.id} className="relative pl-8 sm:pl-10">
              <span className={cn("absolute -left-[11px] top-1.5", DOT)} aria-hidden="true" />
              <Reveal delay={i * 0.05}>
                <Entry item={item} />
              </Reveal>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}
