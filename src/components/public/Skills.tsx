"use client";

import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import { useLocale } from "@/lib/i18n";
import { useSiteData } from "@/lib/site-data";
import { SKILL_CATEGORIES, type Skill, type SkillCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";

function SkillBar({ skill, index }: { skill: Skill; index: number }) {
  const { tr, t } = useLocale();
  const reduce = useReducedMotion();
  const name = tr(skill.name);
  const level = Math.max(0, Math.min(100, skill.level ?? 0));
  return (
    <motion.li
      layout
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.03, 0.3) }}
      className="card p-4 sm:p-5 flex items-center gap-4"
    >
      <span className="h-11 w-11 shrink-0 rounded-2xl bg-accent-soft flex items-center justify-center text-xl" aria-hidden="true">
        {skill.icon || "•"}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-semibold truncate">{name}</span>
          <span className="font-mono text-xs font-bold text-muted tabular-nums">{level}%</span>
        </div>
        <div
          className="mt-2 h-2 rounded-full bg-surface-2 overflow-hidden"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={level}
          aria-label={t("skills.levelOf", { name, level })}
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-strong"
            initial={reduce ? { width: `${level}%` } : { width: 0 }}
            whileInView={{ width: `${level}%` }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          />
        </div>
      </div>
    </motion.li>
  );
}

export function Skills() {
  const { skills } = useSiteData();
  const { t } = useLocale();
  const [category, setCategory] = useState<SkillCategory | "all">("all");

  const present = useMemo(() => SKILL_CATEGORIES.filter((c) => skills.some((s) => s.category === c)), [skills]);
  const filtered = useMemo(() => (category === "all" ? skills : skills.filter((s) => s.category === category)), [skills, category]);

  if (skills.length === 0) return null;

  return (
    <Section id="skills" eyebrow={t("nav.skills")} title={t("skills.title")} subtitle={t("skills.subtitle")} tone="muted">
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

      <LayoutGroup>
        <motion.ul layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((s, i) => (
              <SkillBar key={s.id} skill={s} index={i} />
            ))}
          </AnimatePresence>
        </motion.ul>
      </LayoutGroup>
    </Section>
  );
}
