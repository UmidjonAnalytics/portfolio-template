"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { LayoutGrid, List, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDesign, useEntrance } from "@/lib/design-context";
import { useLocale } from "@/lib/i18n";
import { useSiteData } from "@/lib/site-data";
import { PROJECT_DOMAINS, PROJECT_TOOLS, type Project } from "@/lib/types";
import { cn, stripHtml } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SlideControls, SwipeRow, slideVariants } from "@/components/ui/SwipeRow";
import { ProjectCard } from "./ProjectCard";
import { ProjectModal } from "./ProjectModal";

type Sort = "newest" | "impact" | "az";

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-9 px-3.5 rounded-full text-sm font-semibold border transition",
        active ? "bg-fg text-bg border-fg" : "bg-surface border-line text-fg-2 hover:text-fg hover:border-line-strong",
      )}
    >
      {children}
    </button>
  );
}

/** One project at a time, large, with arrows and dots. */
function ProjectCarousel({ items, onOpen }: { items: Project[]; onOpen: (i: number) => void }) {
  const { motion: motionKey } = useDesign();
  const { off, time } = useEntrance();
  const [[index, dir], setState] = useState<[number, number]>([0, 1]);
  // A swipe ends with a click on the card underneath; ignore that one.
  const dragged = useRef(false);
  const safe = Math.min(index, items.length - 1);
  useEffect(() => setState([0, 1]), [items]);
  const step = (delta: 1 | -1) => setState(([i]) => [(i + delta + items.length) % items.length, delta]);
  const variants = slideVariants(off, motionKey);
  const p = items[safe];
  return (
    <div>
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={p.id}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: time(0.4), ease: [0.22, 1, 0.36, 1] }}
            drag={off || items.length < 2 ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragStart={() => {
              dragged.current = true;
            }}
            onDragEnd={(_, info) => {
              window.setTimeout(() => (dragged.current = false), 0);
              if (info.offset.x < -70) step(1);
              else if (info.offset.x > 70) step(-1);
            }}
          >
            <ProjectCard project={p} view="feature" as="div" onOpen={() => !dragged.current && onOpen(safe)} />
          </motion.div>
        </AnimatePresence>
      </div>
      <SlideControls count={items.length} index={safe} onGo={(i) => setState([i, i > safe ? 1 : -1])} onStep={step} />
    </div>
  );
}

export function Projects() {
  const { projects } = useSiteData();
  const { layouts } = useDesign();
  const layout = layouts.projects;
  const { t, tr, lang } = useLocale();
  const [tools, setTools] = useState<Set<string>>(new Set());
  const [domains, setDomains] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem("projects-view");
      if (v === "list" || v === "grid") setView(v);
    } catch {
      /* ignore */
    }
  }, []);
  const changeView = (v: "grid" | "list") => {
    setView(v);
    try {
      localStorage.setItem("projects-view", v);
    } catch {
      /* ignore */
    }
  };

  const availableTools = useMemo(() => {
    const present = new Set(projects.flatMap((p) => p.tools ?? []));
    const ordered = PROJECT_TOOLS.filter((x) => present.has(x)) as string[];
    const extra = [...present].filter((x) => !(PROJECT_TOOLS as readonly string[]).includes(x)).sort();
    return [...ordered, ...extra];
  }, [projects]);

  const availableDomains = useMemo(() => {
    const present = new Set(projects.map((p) => p.domain).filter(Boolean));
    const ordered = PROJECT_DOMAINS.filter((x) => present.has(x)) as string[];
    const extra = [...present].filter((x) => !(PROJECT_DOMAINS as readonly string[]).includes(x)).sort();
    return [...ordered, ...extra];
  }, [projects]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = projects.filter((p) => {
      if (tools.size && !p.tools?.some((x) => tools.has(x))) return false;
      if (domains.size && !domains.has(p.domain)) return false;
      if (q) {
        const hay = [tr(p.title), tr(p.summary), tr(p.problem), tr(p.result), p.domain, ...(p.tools ?? [])].join(" ").toLowerCase();
        if (!stripHtml(hay).includes(q)) return false;
      }
      return true;
    });
    const cmp: Record<Sort, (a: Project, b: Project) => number> = {
      newest: (a, b) => (b.date || "").localeCompare(a.date || "") || (b.createdAt ?? 0) - (a.createdAt ?? 0),
      impact: (a, b) => (b.impact ?? 0) - (a.impact ?? 0),
      az: (a, b) => tr(a.title).localeCompare(tr(b.title), lang),
    };
    return list.sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || cmp[sort](a, b));
  }, [projects, tools, domains, search, sort, tr, lang]);

  const toggle = (set: Set<string>, setter: (s: Set<string>) => void, value: string) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  };
  const hasFilters = tools.size > 0 || domains.size > 0 || search.trim().length > 0;
  const clear = () => {
    setTools(new Set());
    setDomains(new Set());
    setSearch("");
  };

  if (projects.length === 0) return null;

  return (
    <Section id="projects" eyebrow={t("nav.projects")} title={t("projects.title")} subtitle={t("projects.subtitle")}>
      <Reveal className="space-y-4 mb-8">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <label className="relative flex-1">
            <span className="sr-only">{t("projects.searchLabel")}</span>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("projects.search")}
              className="h-11 w-full rounded-full border border-line bg-surface pl-11 pr-4 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 transition"
            />
          </label>
          <div className="flex items-center gap-2">
            <label className="relative">
              <span className="sr-only">{t("projects.sort.label")}</span>
              <SlidersHorizontal className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" aria-hidden="true" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="h-11 appearance-none rounded-full border border-line bg-surface pl-10 pr-9 text-sm font-semibold outline-none focus:border-accent focus:ring-2 focus:ring-accent/25 transition cursor-pointer"
              >
                <option value="newest">{t("projects.sort.newest")}</option>
                <option value="impact">{t("projects.sort.impact")}</option>
                <option value="az">{t("projects.sort.az")}</option>
              </select>
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted text-xs" aria-hidden="true">
                ▾
              </span>
            </label>
            {layout === "grid" && (
            <div className="inline-flex rounded-full border border-line bg-surface p-0.5" role="group">
              <button
                type="button"
                onClick={() => changeView("grid")}
                aria-pressed={view === "grid"}
                aria-label={t("projects.view.grid")}
                title={t("projects.view.grid")}
                className={cn("h-9 w-9 rounded-full inline-flex items-center justify-center transition", view === "grid" ? "bg-fg text-bg" : "text-muted hover:text-fg")}
              >
                <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => changeView("list")}
                aria-pressed={view === "list"}
                aria-label={t("projects.view.list")}
                title={t("projects.view.list")}
                className={cn("h-9 w-9 rounded-full inline-flex items-center justify-center transition", view === "list" ? "bg-fg text-bg" : "text-muted hover:text-fg")}
              >
                <List className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            )}
          </div>
        </div>

        {(availableTools.length > 1 || availableDomains.length > 1) && (
          <div className="flex flex-col gap-3">
            {availableTools.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted mr-1">{t("projects.filters.tools")}</span>
                {availableTools.map((tool) => (
                  <Chip key={tool} active={tools.has(tool)} onClick={() => toggle(tools, setTools, tool)}>
                    {tool}
                  </Chip>
                ))}
              </div>
            )}
            {availableDomains.length > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted mr-1">{t("projects.filters.domains")}</span>
                {availableDomains.map((d) => (
                  <Chip key={d} active={domains.has(d)} onClick={() => toggle(domains, setDomains, d)}>
                    {d}
                  </Chip>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-muted">
          <span aria-live="polite">{filtered.length === 1 ? t("projects.countOne") : t("projects.count", { count: filtered.length })}</span>
          {hasFilters && (
            <button type="button" onClick={clear} className="inline-flex items-center gap-1 font-semibold text-accent-strong hover:underline">
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              {t("projects.filters.clear")}
            </button>
          )}
        </div>
      </Reveal>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-display text-lg font-semibold">{t("projects.noResults")}</p>
          <p className="mt-1 text-muted">{t("projects.noResultsHint")}</p>
        </div>
      ) : layout === "carousel" ? (
        <ProjectCarousel items={filtered} onOpen={setOpenIndex} />
      ) : layout === "swipe" ? (
        <SwipeRow label={t("projects.title")} itemClassName="w-[85%] sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.84rem)]">
          {filtered.map((p, i) => (
            <ProjectCard key={p.id} project={p} view="grid" as="div" onOpen={() => setOpenIndex(i)} />
          ))}
        </SwipeRow>
      ) : (
        <LayoutGroup>
          <motion.ul
            layout
            className={cn(
              layout === "compact" && "grid gap-3 grid-cols-2 lg:grid-cols-4",
              layout === "stacked" && "flex flex-col gap-6",
              layout === "grid" && (view === "grid" ? "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-4"),
            )}
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((p, i) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  view={layout === "compact" ? "compact" : layout === "stacked" ? "feature" : view}
                  reverse={i % 2 === 1}
                  onOpen={() => setOpenIndex(i)}
                />
              ))}
            </AnimatePresence>
          </motion.ul>
        </LayoutGroup>
      )}

      <ProjectModal projects={filtered} index={openIndex} onClose={() => setOpenIndex(null)} onNavigate={setOpenIndex} />
    </Section>
  );
}
