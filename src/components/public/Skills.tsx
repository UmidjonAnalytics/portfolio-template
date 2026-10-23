"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useEntrance, useLayout } from "@/lib/design-context";
import { useLocale } from "@/lib/i18n";
import { useSiteData } from "@/lib/site-data";
import { SKILL_CATEGORIES, type Skill, type SkillCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";

const clampLevel = (s: Skill) => Math.max(0, Math.min(100, s.level ?? 0));

/** Shared entrance for every skill item, so filtering animates the same in each layout. */
function useItemMotion(index: number) {
  const { from, to, time } = useEntrance();
  return {
    layout: true,
    initial: from(12),
    animate: to,
    exit: from(12) || undefined,
    transition: { duration: time(0.35), delay: time(Math.min(index * 0.03, 0.3)) },
  } as const;
}

function Meter({ skill, className, bar }: { skill: Skill; className?: string; bar: string }) {
  const { tr, t } = useLocale();
  const { off, time } = useEntrance();
  const level = clampLevel(skill);
  return (
    <div
      className={cn("rounded-full bg-surface-2 overflow-hidden", className)}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={level}
      aria-label={t("skills.levelOf", { name: tr(skill.name), level })}
    >
      <motion.div
        className={cn("h-full rounded-full", bar)}
        initial={off ? { width: `${level}%` } : { width: 0 }}
        whileInView={{ width: `${level}%` }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: time(1.1), ease: [0.22, 1, 0.36, 1], delay: time(0.1) }}
      />
    </div>
  );
}

function SkillBar({ skill, index }: { skill: Skill; index: number }) {
  const { tr } = useLocale();
  const m = useItemMotion(index);
  return (
    <motion.li {...m} className="card p-4 sm:p-5 flex items-center gap-4">
      <span className="h-11 w-11 shrink-0 rounded-2xl bg-accent-soft flex items-center justify-center text-xl" aria-hidden="true">
        {skill.icon || "•"}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-semibold truncate">{tr(skill.name)}</span>
          <span className="font-mono text-xs font-bold text-muted tabular-nums">{clampLevel(skill)}%</span>
        </div>
        <Meter skill={skill} className="mt-2 h-2" bar="bg-gradient-to-r from-accent to-accent-strong" />
      </div>
    </motion.li>
  );
}

function SkillRing({ skill, index }: { skill: Skill; index: number }) {
  const { tr, t } = useLocale();
  const { off, time } = useEntrance();
  const m = useItemMotion(index);
  const level = clampLevel(skill);
  const name = tr(skill.name);
  return (
    <motion.li {...m} className="card p-5 flex flex-col items-center text-center">
      <div className="relative h-24 w-24" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={level} aria-label={t("skills.levelOf", { name, level })}>
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r="42" fill="none" strokeWidth="9" className="stroke-surface-2" />
          <motion.circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            strokeWidth="9"
            strokeLinecap="round"
            className="stroke-accent"
            initial={{ pathLength: off ? level / 100 : 0 }}
            whileInView={{ pathLength: level / 100 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: time(1.2), ease: [0.22, 1, 0.36, 1], delay: time(0.1) }}
          />
        </svg>
        <span className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl leading-none" aria-hidden="true">
            {skill.icon || "•"}
          </span>
          <span className="mt-1 font-mono text-xs font-bold tabular-nums">{level}%</span>
        </span>
      </div>
      <span className="mt-3 font-semibold text-sm leading-snug">{name}</span>
    </motion.li>
  );
}

/** Five steps, filled to the level. */
function Dots({ level }: { level: number }) {
  const filled = Math.max(1, Math.round(level / 20));
  return (
    <span className="inline-flex gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={cn("h-1.5 w-1.5 rounded-full", i < filled ? "bg-accent" : "bg-line-strong")} />
      ))}
    </span>
  );
}

function ChipGroups({ skills, present }: { skills: Skill[]; present: SkillCategory[] }) {
  const { t, tr } = useLocale();
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {present.map((c, gi) => (
        <Reveal key={c} delay={gi * 0.06} className="card p-5 sm:p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
            {t(`skills.categories.${c}`)}
            <span className="ml-2 tabular-nums">{skills.filter((s) => s.category === c).length}</span>
          </h3>
          <ul className="mt-4 flex flex-wrap gap-2">
            {skills
              .filter((s) => s.category === c)
              .map((s) => {
                const level = clampLevel(s);
                const name = tr(s.name);
                return (
                  <li
                    key={s.id}
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 pl-2.5 pr-3 py-1.5 text-sm font-semibold"
                    title={t("skills.levelOf", { name, level })}
                  >
                    <span aria-hidden="true">{s.icon || "•"}</span>
                    {name}
                    <Dots level={level} />
                    <span className="sr-only">{t("skills.levelOf", { name, level })}</span>
                  </li>
                );
              })}
          </ul>
        </Reveal>
      ))}
    </div>
  );
}

function SkillTable({ skills }: { skills: Skill[] }) {
  const { t, tr } = useLocale();
  return (
    <Reveal className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-2 text-left text-xs font-bold uppercase tracking-wider text-muted">
              <th scope="col" className="w-10 px-3 py-2.5 text-center font-mono border-r border-line">#</th>
              <th scope="col" className="px-4 py-2.5">{t("skills.table.skill")}</th>
              <th scope="col" className="px-4 py-2.5 hidden sm:table-cell">{t("skills.table.category")}</th>
              <th scope="col" className="px-4 py-2.5 w-[38%]">{t("skills.proficiency")}</th>
            </tr>
          </thead>
          <tbody>
            {skills.map((s, i) => (
              <tr key={s.id} className="border-t border-line">
                <td className="px-3 py-2.5 text-center font-mono text-xs text-muted bg-surface-2 border-r border-line tabular-nums">{i + 1}</td>
                <td className="px-4 py-2.5 font-semibold">
                  <span className="mr-2" aria-hidden="true">
                    {s.icon || "•"}
                  </span>
                  {tr(s.name)}
                </td>
                <td className="px-4 py-2.5 text-muted hidden sm:table-cell">{t(`skills.categories.${s.category}`)}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <Meter skill={s} className="h-2.5 flex-1" bar="bg-accent" />
                    <span className="w-10 text-right font-mono text-xs font-bold tabular-nums">{clampLevel(s)}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Reveal>
  );
}

export function Skills() {
  const { skills } = useSiteData();
  const { t } = useLocale();
  const layout = useLayout("skills");
  const [category, setCategory] = useState<SkillCategory | "all">("all");

  const present = useMemo(() => SKILL_CATEGORIES.filter((c) => skills.some((s) => s.category === c)), [skills]);
  const filtered = useMemo(() => (category === "all" ? skills : skills.filter((s) => s.category === category)), [skills, category]);

  if (skills.length === 0) return null;

  return (
    <Section id="skills" eyebrow={t("nav.skills")} title={t("skills.title")} subtitle={t("skills.subtitle")} tone="muted">
      {layout === "chips" ? (
        <ChipGroups skills={skills} present={present} />
      ) : (
        <>
          <Reveal className="mb-8 flex flex-wrap gap-2" role="tablist" aria-label={t("skills.title")}>
            {(["all", ...present] as const).map((c) => (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={category === c}
                onClick={() => setCategory(c)}
                className={cn(
                  "h-10 px-4 rounded-full text-sm font-semibold border transition",
                  category === c ? "bg-fg text-bg border-fg" : "bg-surface border-line text-fg-2 hover:text-fg hover:border-line-strong",
                )}
              >
                {t(`skills.categories.${c}`)}
                <span className={cn("ml-2 text-xs font-bold tabular-nums", category === c ? "opacity-70" : "text-muted")}>
                  {c === "all" ? skills.length : skills.filter((s) => s.category === c).length}
                </span>
              </button>
            ))}
          </Reveal>

          {layout === "table" ? (
            <SkillTable skills={filtered} />
          ) : (
            <LayoutGroup>
              <motion.ul layout className={layout === "rings" ? "grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5" : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"}>
                <AnimatePresence mode="popLayout">
                  {filtered.map((s, i) => (layout === "rings" ? <SkillRing key={s.id} skill={s} index={i} /> : <SkillBar key={s.id} skill={s} index={i} />))}
                </AnimatePresence>
              </motion.ul>
            </LayoutGroup>
          )}
        </>
      )}
    </Section>
  );
}
