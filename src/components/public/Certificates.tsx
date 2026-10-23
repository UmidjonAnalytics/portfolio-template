"use client";

import { Award, ExternalLink, ZoomIn } from "lucide-react";
import { useState } from "react";
import { useLayout } from "@/lib/design-context";
import { useLocale } from "@/lib/i18n";
import { useSiteData } from "@/lib/site-data";
import type { Certificate } from "@/lib/types";
import { formatMonth, isSafeHttpUrl } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SmartImage } from "@/components/ui/SmartImage";
import { SwipeRow } from "@/components/ui/SwipeRow";

function CertificateCard({ item, onOpen, index }: { item: Certificate; onOpen: () => void; index: number }) {
  const { t, tr, lang } = useLocale();
  const title = tr(item.title);
  return (
    <Reveal delay={index * 0.05} className="card overflow-hidden flex flex-col group h-full">
      <button
        type="button"
        onClick={onOpen}
        aria-label={t("certificates.viewFull", { title })}
        className="relative aspect-[4/3] bg-surface-2 overflow-hidden text-left"
      >
        <SmartImage
          src={item.image}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          fallback={
            <div className="absolute inset-0 flex items-center justify-center text-accent-strong/60">
              <Award className="h-16 w-16" aria-hidden="true" />
            </div>
          }
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors">
          <span className="h-11 w-11 rounded-full bg-surface/90 text-fg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-card">
            <ZoomIn className="h-5 w-5" aria-hidden="true" />
          </span>
        </span>
      </button>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-semibold leading-snug">{title}</h3>
        <p className="mt-1 text-sm text-muted">
          {item.issuer}
          {item.date && (
            <>
              {" · "}
              <time dateTime={item.date}>{formatMonth(item.date, lang)}</time>
            </>
          )}
        </p>
        {item.credentialId && (
          <p className="mt-3 text-xs text-muted">
            {t("certificates.credentialId")}: <span className="font-mono font-bold text-fg-2">{item.credentialId}</span>
          </p>
        )}
        {item.verifyUrl && isSafeHttpUrl(item.verifyUrl) && (
          <div className="mt-4 pt-4 border-t border-line">
            <Button href={item.verifyUrl} external variant="outline" size="sm">
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              {t("certificates.verify")}
            </Button>
          </div>
        )}
      </div>
    </Reveal>
  );
}

/** Compact row: thumbnail, title, issuer and the verify link. */
function CertificateRow({ item, onOpen }: { item: Certificate; onOpen: () => void }) {
  const { t, tr, lang } = useLocale();
  const title = tr(item.title);
  return (
    <div className="p-4 sm:p-5 flex items-center gap-4">
      <button
        type="button"
        onClick={onOpen}
        aria-label={t("certificates.viewFull", { title })}
        className="relative h-16 w-20 sm:h-20 sm:w-28 shrink-0 rounded-lg overflow-hidden bg-surface-2 border border-line"
      >
        <SmartImage
          src={item.image}
          alt=""
          fill
          sizes="112px"
          className="object-cover"
          fallback={
            <span className="absolute inset-0 flex items-center justify-center text-accent-strong/60">
              <Award className="h-7 w-7" aria-hidden="true" />
            </span>
          }
        />
      </button>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold leading-snug">{title}</h3>
        <p className="mt-0.5 text-sm text-muted">
          {item.issuer}
          {item.date && (
            <>
              {" · "}
              <time dateTime={item.date}>{formatMonth(item.date, lang)}</time>
            </>
          )}
        </p>
        {item.credentialId && <p className="mt-1 text-xs text-muted font-mono truncate">{item.credentialId}</p>}
      </div>
      {item.verifyUrl && isSafeHttpUrl(item.verifyUrl) && (
        <Button href={item.verifyUrl} external variant="outline" size="sm" className="shrink-0">
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">{t("certificates.verify")}</span>
          <span className="sr-only sm:hidden">{t("certificates.verify")}</span>
        </Button>
      )}
    </div>
  );
}

export function Certificates() {
  const { certificates } = useSiteData();
  const { t, tr, lang } = useLocale();
  const layout = useLayout("certificates");
  const [active, setActive] = useState<Certificate | null>(null);
  if (certificates.length === 0) return null;

  return (
    <Section id="certificates" eyebrow={t("nav.certificates")} title={t("certificates.title")} subtitle={t("certificates.subtitle")}>
      {layout === "slider" ? (
        <SwipeRow label={t("certificates.title")} itemClassName="w-[80%] sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.84rem)]">
          {certificates.map((c, i) => (
            <CertificateCard key={c.id} item={c} index={i} onOpen={() => setActive(c)} />
          ))}
        </SwipeRow>
      ) : layout === "list" ? (
        <Reveal>
          <ul className="card divide-y divide-line">
            {certificates.map((c) => (
              <li key={c.id}>
                <CertificateRow item={c} onOpen={() => setActive(c)} />
              </li>
            ))}
          </ul>
        </Reveal>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {certificates.map((c, i) => (
            <li key={c.id}>
              <CertificateCard item={c} index={i} onOpen={() => setActive(c)} />
            </li>
          ))}
        </ul>
      )}

      <Modal open={!!active} onClose={() => setActive(null)} size="xl" labelledBy="cert-title">
        {active && (
          <div className="p-4 sm:p-6">
            <div className="relative aspect-[16/11] bg-surface-2 rounded-2xl overflow-hidden">
              <SmartImage src={active.image} alt={tr(active.title)} fill sizes="90vw" className="object-contain" />
            </div>
            <div className="mt-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h3 id="cert-title" className="font-display text-xl font-semibold">
                  {tr(active.title)}
                </h3>
                <p className="mt-1 text-muted">
                  {t("certificates.issuedBy")} {active.issuer}
                  {active.date && ` · ${formatMonth(active.date, lang)}`}
                </p>
                {active.credentialId && (
                  <p className="mt-1 text-sm text-muted">
                    {t("certificates.credentialId")}: <span className="font-mono font-bold text-fg-2">{active.credentialId}</span>
                  </p>
                )}
              </div>
              {active.verifyUrl && isSafeHttpUrl(active.verifyUrl) && (
                <Button href={active.verifyUrl} external size="md">
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  {t("certificates.verify")}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </Section>
  );
}
