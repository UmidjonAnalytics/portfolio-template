"use client";

import { GraduationCap } from "lucide-react";
import { useLayout } from "@/lib/design-context";
import { useLocale } from "@/lib/i18n";
import { useSiteData } from "@/lib/site-data";
import type { Education as EducationItem } from "@/lib/types";
import { formatMonth } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";

function Dates({ item }: { item: EducationItem }) {
  const { t, lang } = useLocale();
  return (
    <>
      <time dateTime={item.startDate}>{formatMonth(item.startDate, lang)}</time>
      {" — "}
      <time dateTime={item.endDate || undefined}>{formatMonth(item.endDate, lang, t("common.present"))}</time>
    </>
  );
}

function Body({ item }: { item: EducationItem }) {
  const { tr } = useLocale();
  return (
    <>
      <h3 className="font-display text-lg font-semibold leading-snug">{tr(item.school)}</h3>
      <p className="mt-1 font-semibold text-fg-2">{[tr(item.degree), tr(item.field)].filter(Boolean).join(" · ")}</p>
      {tr(item.description) && <p className="mt-3 text-muted leading-relaxed">{tr(item.description)}</p>}
    </>
  );
}

export function Education() {
  const { education } = useSiteData();
  const { t } = useLocale();
  const layout = useLayout("education");
  if (education.length === 0) return null;

  return (
    <Section id="education" eyebrow={t("nav.education")} title={t("education.title")} subtitle={t("education.subtitle")} tone="muted">
      {layout === "timeline" ? (
        <ol className="relative border-l-2 border-line ml-3 sm:ml-5 space-y-10">
          {education.map((item, i) => (
            <li key={item.id} className="relative pl-8 sm:pl-10">
              <span className="absolute -left-[17px] top-0 h-8 w-8 rounded-full bg-surface border-2 border-accent text-accent-strong flex items-center justify-center" aria-hidden="true">
                <GraduationCap className="h-4 w-4" />
              </span>
              <Reveal delay={i * 0.05}>
                <p className="text-sm text-muted font-medium mb-1.5">
                  <Dates item={item} />
                </p>
                <Body item={item} />
              </Reveal>
            </li>
          ))}
        </ol>
      ) : layout === "list" ? (
        <Reveal className="card divide-y divide-line">
          {education.map((item) => (
            <div key={item.id} className="p-5 sm:p-6 grid gap-2 sm:grid-cols-[11rem_1fr] sm:gap-6">
              <p className="font-mono text-sm font-bold text-accent-strong tabular-nums">
                <Dates item={item} />
              </p>
              <div className="min-w-0">
                <Body item={item} />
              </div>
            </div>
          ))}
        </Reveal>
      ) : (
        <ol className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {education.map((item, i) => (
            <li key={item.id}>
              <Reveal delay={i * 0.06} className="card p-6 h-full flex gap-4">
                <span className="h-12 w-12 shrink-0 rounded-2xl bg-accent-soft text-accent-strong flex items-center justify-center" aria-hidden="true">
                  <GraduationCap className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-muted font-medium mb-1.5">
                    <Dates item={item} />
                  </p>
                  <Body item={item} />
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}
