"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, ExternalLink, Star } from "lucide-react";
import { GithubIcon } from "@/components/ui/BrandIcons";
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n";
import { mediaToDownloadUrl } from "@/lib/media";
import { useSiteData } from "@/lib/site-data";
import type { Project } from "@/lib/types";
import { cn, formatMonth, hostAllowed, isSafeHttpUrl } from "@/lib/utils";
import { ToolBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SmartImage } from "@/components/ui/SmartImage";
import { InteractiveChart } from "./InteractiveChart";

interface Props {
  projects: Project[];
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

function Kpi({ value, label, hint, i }: { value: string; label: string; hint?: string; i: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.12 + i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-line bg-surface-2/60 p-4"
    >
      <p className="font-mono text-2xl sm:text-3xl font-bold text-accent-strong tabular-nums">{value}</p>
      <p className="mt-1 text-sm font-semibold">{label}</p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </motion.div>
  );
}

function Gallery({ images, title }: { images: string[]; title: string }) {
  const { t } = useLocale();
  const [i, setI] = useState(0);
  useEffect(() => setI(0), [images]);
  if (images.length === 0) return null;
  return (
    <div>
      <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-surface-2 border border-line">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={images[i]} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <SmartImage src={images[i]} alt={`${title} — ${t("projects.modal.imageOf", { index: i + 1, total: images.length })}`} fill sizes="(max-width: 1024px) 100vw, 900px" className="object-cover" />
          </motion.div>
        </AnimatePresence>
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, idx) => (
            <button
              key={img + idx}
              type="button"
              onClick={() => setI(idx)}
              aria-label={t("projects.modal.imageOf", { index: idx + 1, total: images.length })}
              aria-pressed={idx === i}
              className={cn("relative h-16 w-24 shrink-0 rounded-lg overflow-hidden border-2 transition", idx === i ? "border-accent" : "border-transparent opacity-70 hover:opacity-100")}
            >
              <SmartImage src={img} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProjectModal({ projects, index, onClose, onNavigate }: Props) {
  const { t, tr, lang } = useLocale();
  const { settings } = useSiteData();
  const project = index === null ? null : projects[index];
  const hasPrev = index !== null && index > 0;
  const hasNext = index !== null && index < projects.length - 1;

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (index === null) return;
      if (e.key === "ArrowRight" && hasNext) onNavigate(index + 1);
      if (e.key === "ArrowLeft" && hasPrev) onNavigate(index - 1);
    },
    [index, hasNext, hasPrev, onNavigate],
  );

  const [fileBusy, setFileBusy] = useState(false);
  const downloadFile = async (ref: string, name: string) => {
    setFileBusy(true);
    try {
      const url = await mediaToDownloadUrl(ref);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      if (!url.startsWith("blob:")) a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setFileBusy(false);
    }
  };

  const embedOk = project?.embedUrl && isSafeHttpUrl(project.embedUrl) && hostAllowed(project.embedUrl, settings.embedAllowlist ?? []);

  return (
    <Modal open={project !== null} onClose={onClose} size="xl" labelledBy="project-title" onKeyDown={onKey}>
      {project && (
        <article key={project.id}>
          <div className="relative aspect-[21/9] bg-surface-2">
            <SmartImage src={project.cover} alt="" fill sizes="(max-width: 1024px) 100vw, 1100px" className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" aria-hidden="true" />
          </div>

          <div className="px-5 sm:px-8 pb-8 -mt-10 relative">
            <div className="flex flex-wrap items-center gap-2">
              {project.featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent text-accent-fg px-2.5 py-1 text-[11px] font-bold">
                  <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                  {t("projects.featured")}
                </span>
              )}
              <span className="rounded-full bg-surface border border-line px-2.5 py-1 text-[11px] font-bold text-fg-2">{project.domain}</span>
              {project.date && <span className="text-xs text-muted font-medium">{formatMonth(project.date, lang)}</span>}
            </div>
            <h2 id="project-title" className="mt-3 font-display text-2xl sm:text-3xl font-semibold leading-tight text-balance pr-10">
              {tr(project.title)}
            </h2>
            <p className="mt-2 text-muted text-lg">{tr(project.summary)}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {project.tools.map((tool) => (
                <ToolBadge key={tool} tool={tool} size="md" />
              ))}
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="space-y-7">
                {[
                  ["problem", tr(project.problem)],
                  ["approach", tr(project.approach)],
                  ["result", tr(project.result)],
                ]
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <section key={k}>
                      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-accent-strong">{t(`projects.modal.${k === "result" ? "results" : k}`)}</h3>
                      <p className="mt-2 leading-relaxed text-fg-2 whitespace-pre-line">{v}</p>
                    </section>
                  ))}

                {project.chart && <InteractiveChart chart={project.chart} />}

                {project.gallery?.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-accent-strong mb-3">{t("projects.modal.gallery")}</h3>
                    <Gallery images={project.gallery} title={tr(project.title)} />
                  </section>
                )}

                {project.embedUrl && (
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-accent-strong mb-3">{t("projects.modal.dashboard")}</h3>
                    {embedOk ? (
                      <div className="aspect-[16/10] rounded-2xl overflow-hidden border border-line bg-surface-2">
                        <iframe
                          src={project.embedUrl}
                          title={tr(project.title)}
                          className="h-full w-full"
                          loading="lazy"
                          allowFullScreen
                          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                          referrerPolicy="strict-origin-when-cross-origin"
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-muted">{t("projects.modal.embedBlocked")}</p>
                    )}
                    {isSafeHttpUrl(project.embedUrl) && (
                      <a href={project.embedUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-accent-strong hover:underline">
                        {t("projects.modal.openExternal")} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    )}
                  </section>
                )}
              </div>

              <aside className="space-y-6 lg:sticky lg:top-4 self-start">
                {project.metrics?.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-accent-strong mb-3">{t("projects.modal.results")}</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                      {project.metrics.map((m, i) => (
                        <Kpi key={i} i={i} value={m.value} label={tr(m.label)} hint={m.hint ? tr(m.hint) : undefined} />
                      ))}
                    </div>
                  </section>
                )}

                {(project.github || project.demo || project.file) && (
                  <section className="flex flex-col gap-2">
                    {project.github && isSafeHttpUrl(project.github) && (
                      <Button href={project.github} external variant="secondary" className="justify-start">
                        <GithubIcon className="h-4 w-4" />
                        {t("projects.modal.github")}
                      </Button>
                    )}
                    {project.demo && isSafeHttpUrl(project.demo) && (
                      <Button href={project.demo} external variant="secondary" className="justify-start">
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        {t("projects.modal.demo")}
                      </Button>
                    )}
                    {project.file && (
                      <Button variant="secondary" className="justify-start" loading={fileBusy} onClick={() => downloadFile(project.file, `${tr(project.title)}`)}>
                        {!fileBusy && <Download className="h-4 w-4" aria-hidden="true" />}
                        {t("projects.modal.download")}
                      </Button>
                    )}
                  </section>
                )}
              </aside>
            </div>

            <div className="mt-10 pt-5 border-t border-line flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => hasPrev && index !== null && onNavigate(index - 1)}
                disabled={!hasPrev}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-line text-sm font-semibold hover:bg-surface-2 disabled:opacity-40 transition"
                aria-label={t("projects.modal.previous")}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{t("projects.modal.previous")}</span>
              </button>
              <p className="hidden md:block text-xs text-muted">{t("projects.modal.keyboardHint")}</p>
              <button
                type="button"
                onClick={() => hasNext && index !== null && onNavigate(index + 1)}
                disabled={!hasNext}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-full border border-line text-sm font-semibold hover:bg-surface-2 disabled:opacity-40 transition"
                aria-label={t("projects.modal.next")}
              >
                <span className="hidden sm:inline">{t("projects.modal.next")}</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </article>
      )}
    </Modal>
  );
}
