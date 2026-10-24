"use client";

import { Globe, MapPin, Sparkles } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { useSiteData } from "@/lib/site-data";
import { Reveal } from "@/components/ui/Reveal";
import { RichText } from "@/components/ui/RichText";
import { Section } from "@/components/ui/Section";
import { Skeleton } from "@/components/ui/Skeleton";

export function About() {
  const { profile, loading } = useSiteData();
  const { t, tr, trl } = useLocale();
  const bio = tr(profile.bio);
  const location = tr(profile.location);
  const languages = trl(profile.spokenLanguages);

  return (
    <Section id="about" eyebrow={t("nav.about")} title={t("about.title")} subtitle={t("about.subtitle")}>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <Reveal>
          {loading.profile ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : bio ? (
            <RichText html={bio} className="text-lg" />
          ) : (
            <p className="text-muted italic">{t("about.empty")}</p>
          )}
        </Reveal>

        <Reveal delay={0.1}>
          <dl className="card p-6 space-y-5">
            {location && (
              <div className="flex gap-3">
                <MapPin className="h-5 w-5 mt-0.5 text-accent-strong shrink-0" aria-hidden="true" />
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-muted">{t("about.location")}</dt>
                  <dd className="mt-0.5 font-semibold">{location}</dd>
                </div>
              </div>
            )}
            {languages.length > 0 && (
              <div className="flex gap-3">
                <Globe className="h-5 w-5 mt-0.5 text-accent-strong shrink-0" aria-hidden="true" />
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-muted">{t("about.languages")}</dt>
                  <dd className="mt-1.5 flex flex-wrap gap-1.5">
                    {languages.map((l) => (
                      <span key={l} className="rounded-full bg-surface-2 border border-line px-2.5 py-0.5 text-sm font-medium">
                        {l}
                      </span>
                    ))}
                  </dd>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <Sparkles className="h-5 w-5 mt-0.5 text-accent-strong shrink-0" aria-hidden="true" />
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-muted">{t("about.availability")}</dt>
                <dd className="mt-0.5 font-semibold">{t(`hero.availability.${profile.availability ?? "open"}`)}</dd>
              </div>
            </div>
          </dl>
        </Reveal>
      </div>
    </Section>
  );
}
