"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, BarChart3, Star } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import type { Project } from "@/lib/types";
import { cn, formatMonth } from "@/lib/utils";
import { ToolBadge } from "@/components/ui/Badge";
import { SmartImage } from "@/components/ui/SmartImage";

interface Props {
  project: Project;
  view: "grid" | "list";
  onOpen: () => void;
}

export function ProjectCard({ project, view, onOpen }: Props) {
  const { t, tr, lang } = useLocale();
  const reduce = useReducedMotion();
  const title = tr(project.title);
  const metrics = (project.metrics ?? []).slice(0, 3);
  const list = view === "list";

  return (
    <motion.li
      layout
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn("group relative", list ? "" : "h-full")}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={t("projects.openCase", { title })}
        className={cn(
          "w-full h-full text-left card overflow-hidden transition-[transform,box-shadow,border-color] duration-300",
          "hover:-translate-y-1 hover:shadow-card focus-visible:-translate-y-1",
          project.featured && "glow-accent border-transparent",
          list ? "flex flex-col sm:flex-row" : "flex flex-col",
        )}
      >
        <div className={cn("relative bg-surface-2 overflow-hidden shrink-0", list ? "sm:w-64 md:w-80 aspect-[16/10] sm:aspect-auto" : "aspect-[16/10]")}>
          <SmartImage
            src={project.cover}
            alt={title}
            fill
            sizes={list ? "(max-width: 640px) 100vw, 320px" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
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

          {/* Quick peek of key metrics on hover */}
          {metrics.length > 0 && (
            <div
              className={cn(
                "absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/85 via-black/60 to-transparent",
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
              <p className="text-xs text-muted font-medium">
                {project.domain}
                {project.date && ` · ${formatMonth(project.date, lang)}`}
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold leading-snug line-clamp-2">{title}</h3>
            </div>
            <span className="h-9 w-9 shrink-0 rounded-full border border-line flex items-center justify-center text-muted group-hover:bg-accent group-hover:text-accent-fg group-hover:border-accent transition" aria-hidden="true">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-sm text-muted leading-relaxed line-clamp-2">{tr(project.summary)}</p>
          <div className="mt-auto pt-4 flex flex-wrap gap-1.5">
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
        </div>
      </button>
    </motion.li>
  );
}
