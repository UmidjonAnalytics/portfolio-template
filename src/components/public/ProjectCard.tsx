"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, BarChart3, Star } from "lucide-react";
import { useEntrance } from "@/lib/design-context";
import { useLocale } from "@/lib/i18n";
import type { Project } from "@/lib/types";
import { cn, formatMonth } from "@/lib/utils";
import { ToolBadge } from "@/components/ui/Badge";
import { SmartImage } from "@/components/ui/SmartImage";

export type ProjectCardView = "grid" | "list" | "compact" | "feature";

interface Props {
  project: Project;
  view: ProjectCardView;
  onOpen: () => void;
  /** "div" when the card sits inside a carousel or swipe row that supplies its own list item. */
  as?: "li" | "div";
  /** Feature view: image on the right on wide screens. */
  reverse?: boolean;
}

function Cover({ project, sizes, className }: { project: Project; sizes: string; className?: string }) {
  const { t, tr } = useLocale();
  return (
    <div className={cn("relative bg-surface-2 overflow-hidden shrink-0", className)}>
      <SmartImage
        src={project.cover}
        alt={tr(project.title)}
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
        fallback={
          <div className="absolute inset-0 flex items-center justify-center text-accent-strong/50">
            <BarChart3 className="h-14 w-14" aria-hidden="true" />
          </div>
        }
      />
      {project.featured && (
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-accent text-accent-fg px-2.5 py-1 text-[11px] font-bold shadow-card">
          <Star className="h-3 w-3 fill-current" aria-hidden="true" />
          {t("projects.featured")}
        </span>
      )}
    </div>
  );
}

function Tools({ project }: { project: Project }) {
  const { t } = useLocale();
  return (
    <div className="flex flex-wrap gap-1.5">
      {project.tools.map((tool) => (
        <ToolBadge key={tool} tool={tool} />
      ))}
      {project.chart && (
        <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft text-accent-strong px-2.5 py-0.5 text-[11px] font-semibold">
          <BarChart3 className="h-3 w-3" aria-hidden="true" />
          {t("projects.chart.title")}
        </span>
      )}
    </div>
  );
}

function Meta({ project }: { project: Project }) {
  const { lang } = useLocale();
  return (
    <p className="text-xs text-muted font-medium">
      {project.domain}
      {project.date && ` · ${formatMonth(project.date, lang)}`}
    </p>
  );
}

export function ProjectCard({ project, view, onOpen, as = "li", reverse = false }: Props) {
  const { t, tr } = useLocale();
  const { from, to, time } = useEntrance();
  const title = tr(project.title);
  const metrics = (project.metrics ?? []).slice(0, 3);
  const Item = as === "div" ? motion.div : motion.li;

  const shell = cn(
    "w-full h-full text-left card overflow-hidden transition-[transform,box-shadow,border-color] duration-300",
    "hover:-translate-y-1 hover:shadow-card focus-visible:-translate-y-1",
    project.featured && "glow-accent border-transparent",
  );

  let body: React.ReactNode;
  if (view === "compact") {
    body = (
      <button type="button" onClick={onOpen} aria-label={t("projects.openCase", { title })} className={cn(shell, "flex flex-col")}>
        <Cover project={project} sizes="(max-width: 640px) 50vw, 25vw" className="aspect-[16/9]" />
        <div className="p-3.5 flex-1 flex flex-col">
          <Meta project={project} />
          <h3 className="mt-1 font-semibold text-sm leading-snug line-clamp-2">{title}</h3>
          {project.tools.length > 0 && <p className="mt-auto pt-2 text-[11px] font-semibold text-muted truncate">{project.tools.join(" · ")}</p>}
        </div>
      </button>
    );
  } else if (view === "feature") {
    body = (
      <button type="button" onClick={onOpen} aria-label={t("projects.openCase", { title })} className={cn(shell, "grid lg:grid-cols-2")}>
        <Cover project={project} sizes="(max-width: 1024px) 100vw, 50vw" className={cn("aspect-[16/10] lg:aspect-auto lg:min-h-[22rem]", reverse && "lg:order-2")} />
        <div className="p-6 sm:p-8 flex flex-col">
          <Meta project={project} />
          <h3 className="mt-2 font-display text-2xl sm:text-3xl font-semibold leading-tight">{title}</h3>
          <p className="mt-3 text-fg-2 leading-relaxed line-clamp-4">{tr(project.summary)}</p>
          {metrics.length > 0 && (
            <dl className="mt-6 grid grid-cols-3 gap-3">
              {metrics.map((m, i) => (
                <div key={i} className="rounded-xl bg-surface-2 border border-line px-3 py-2.5 min-w-0">
                  <dd className="font-mono text-lg font-bold text-accent-strong truncate">{m.value}</dd>
                  <dt className="text-[11px] text-muted leading-tight line-clamp-2">{tr(m.label)}</dt>
                </div>
              ))}
            </dl>
          )}
          <div className="mt-auto pt-6 flex flex-wrap items-end justify-between gap-4">
            <Tools project={project} />
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-strong">
              {t("projects.viewCase")}
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
            </span>
          </div>
        </div>
      </button>
    );
  } else {
    const list = view === "list";
    body = (
      <button type="button" onClick={onOpen} aria-label={t("projects.openCase", { title })} className={cn(shell, list ? "flex flex-col sm:flex-row" : "flex flex-col")}>
        <div className={cn("relative shrink-0 overflow-hidden", list ? "sm:w-64 md:w-80" : "")}>
          <Cover
            project={project}
            sizes={list ? "(max-width: 640px) 100vw, 320px" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
            className={list ? "aspect-[16/10] sm:aspect-auto sm:absolute sm:inset-0" : "aspect-[16/10]"}
          />
          {/* Quick peek of key metrics on hover */}
          {metrics.length > 0 && (
            <div
              className={cn(
                "absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/85 via-black/60 to-transparent overflow-hidden",
                "translate-y-full group-hover:translate-y-0 group-focus-visible:translate-y-0 transition-transform duration-300",
              )}
              aria-hidden="true"
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1.5">{t("projects.quickPeek")}</p>
              <div className="flex gap-2">
                {metrics.map((m, i) => (
                  <div key={i} className="flex-1 min-w-0 rounded-lg bg-white/10 backdrop-blur px-2 py-1.5">
                    <p className="font-mono text-sm font-bold text-white truncate">{m.value}</p>
                    <p className="text-[10px] text-white/75 truncate">{tr(m.label)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-5 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Meta project={project} />
              <h3 className="mt-1 font-display text-lg font-semibold leading-snug line-clamp-2">{title}</h3>
            </div>
            <span className="h-9 w-9 shrink-0 rounded-full border border-line flex items-center justify-center text-muted group-hover:bg-accent group-hover:text-accent-fg group-hover:border-accent transition" aria-hidden="true">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-sm text-muted leading-relaxed line-clamp-2">{tr(project.summary)}</p>
          <div className="mt-auto pt-4">
            <Tools project={project} />
          </div>
        </div>
      </button>
    );
  }

  return (
    <Item
      layout={as === "li"}
      initial={from(16)}
      animate={to}
      exit={from(16) || undefined}
      transition={{ duration: time(0.35), ease: [0.22, 1, 0.36, 1] }}
      className="group relative h-full"
    >
      {body}
    </Item>
  );
}
