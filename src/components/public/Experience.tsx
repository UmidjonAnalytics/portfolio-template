"use client";

import { Briefcase } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { useSiteData } from "@/lib/site-data";
import { formatMonth } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";

export function Experience() {
  const { experience } = useSiteData();
  const { t, tr, trl, lang } = useLocale();
  if (experience.length === 0) return null;

  return (
    <Section id="experience" eyebrow={t("nav.experience")} title={t("experience.title")} subtitle={t("experience.subtitle")}>
      <ol className="relative border-l-2 border-line ml-3 sm:ml-5 space-y-10">
        {experience.map((item, i) => {
          const bullets = trl(item.bullets);
          const current = !item.endDate;
          return (
            <li key={item.id} className="relative pl-8 sm:pl-10">
              <span
                className="absolute -left-[11px] top-1.5 h-5 w-5 rounded-full border-4 border-bg bg-accent shadow-[0_0_0_4px_var(--accent-soft)]"
                aria-hidden="true"
              />
              <Reveal delay={i * 0.05}>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted font-medium">
                  <time dateTime={item.startDate}>{formatMonth(item.startDate, lang)}</time>
                  <span aria-hidden="true">—</span>
                  <time dateTime={item.endDate || undefined} className={current ? "text-accent-strong font-bold" : undefined}>
                    {formatMonth(item.endDate, lang, t("experience.present"))}
                  </time>
                  {tr(item.location) && <span className="before:content-['·'] before:mr-3">{tr(item.location)}</span>}
                </div>
                <h3 className="mt-2 font-display text-xl font-semibold">{tr(item.role)}</h3>
                <p className="mt-1 flex items-center gap-2 font-semibold text-fg-2">
                  <Briefcase className="h-4 w-4 text-accent-strong" aria-hidden="true" />
                  {item.company}
                </p>
                {bullets.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {bullets.map((b, j) => (
                      <li key={j} className="flex gap-3 text-fg-2 leading-relaxed">
                        <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Reveal>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
