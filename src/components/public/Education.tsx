"use client";

import { GraduationCap } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { useSiteData } from "@/lib/site-data";
import { formatMonth } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";

export function Education() {
  const { education } = useSiteData();
  const { t, tr, lang } = useLocale();
  if (education.length === 0) return null;

  return (
    <Section id="education" eyebrow={t("nav.education")} title={t("education.title")} subtitle={t("education.subtitle")} tone="muted">
      <ol className="grid gap-5 md:grid-cols-2">
        {education.map((item, i) => (
          <li key={item.id}>
            <Reveal delay={i * 0.06} className="card p-6 h-full flex gap-4">
              <span className="h-12 w-12 shrink-0 rounded-2xl bg-accent-soft text-accent-strong flex items-center justify-center" aria-hidden="true">
                <GraduationCap className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <p className="text-sm text-muted font-medium">
                  <time dateTime={item.startDate}>{formatMonth(item.startDate, lang)}</time>
                  {" — "}
                  <time dateTime={item.endDate || undefined}>{formatMonth(item.endDate, lang, t("common.present"))}</time>
                </p>
                <h3 className="mt-1.5 font-display text-lg font-semibold leading-snug">{tr(item.school)}</h3>
                <p className="mt-1 font-semibold text-fg-2">
                  {[tr(item.degree), tr(item.field)].filter(Boolean).join(" · ")}
                </p>
                {tr(item.description) && <p className="mt-3 text-muted leading-relaxed">{tr(item.description)}</p>}
              </div>
            </Reveal>
          </li>
        ))}
      </ol>
    </Section>
  );
}
