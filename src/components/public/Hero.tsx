"use client";

import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowDown, Download, FolderKanban, Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/lib/i18n";
import { mediaToDownloadUrl } from "@/lib/media";
import { useSiteData } from "@/lib/site-data";
import type { Availability } from "@/lib/types";
import { cn, initials } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { SmartImage } from "@/components/ui/SmartImage";

function useTyping(words: string[], enabled: boolean) {
  const [text, setText] = useState(words[0] ?? "");
  const [index, setIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!enabled || words.length === 0) {
      setText(words[0] ?? "");
      return;
    }
    const full = words[index % words.length];
    let delay = deleting ? 40 : 75;
    if (!deleting && text === full) delay = 2200;
    if (deleting && text === "") delay = 300;

    const timer = window.setTimeout(() => {
      if (!deleting) {
        if (text === full) {
          if (words.length > 1) setDeleting(true);
        } else setText(full.slice(0, text.length + 1));
      } else if (text === "") {
        setDeleting(false);
        setIndex((i) => (i + 1) % words.length);
      } else setText(full.slice(0, text.length - 1));
    }, delay);
    return () => window.clearTimeout(timer);
  }, [text, deleting, index, words, enabled]);

  // Reset when the words change (language switch).
  useEffect(() => {
    setText("");
    setDeleting(false);
    setIndex(0);
  }, [words]);

  return text;
}

function Counter({ value, label }: { value: number; label: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value, reduce]);

  return (
    <div className="flex flex-col">
      <span ref={ref} className="font-display text-3xl sm:text-4xl font-semibold tabular-nums text-fg">
        {display}
        <span className="text-accent-strong">+</span>
      </span>
      <span className="mt-1 text-xs sm:text-sm text-muted font-medium">{label}</span>
    </div>
  );
}

const AVAILABILITY_TONE: Record<Availability, "success" | "accent" | "neutral"> = {
  open: "success",
  freelance: "accent",
  unavailable: "neutral",
};

export function Hero() {
  const { profile, projects, loading } = useSiteData();
  const { t, trl, tr } = useLocale();
  const reduce = useReducedMotion();
  const [cvBusy, setCvBusy] = useState(false);

  const titles = trl(profile.titles);
  const words = titles.length ? titles : [t("hero.defaultTitle")];
  const typed = useTyping(words, !reduce);
  const name = profile.name || t("hero.defaultName");
  const tagline = tr(profile.tagline) || t("hero.defaultTagline");

  const stats = [
    { key: "projects", value: profile.stats.projects ?? (projects.length || 0) },
    { key: "yearsExperience", value: profile.stats.yearsExperience ?? 0 },
    { key: "tools", value: profile.stats.tools ?? 0 },
    { key: "studentsTaught", value: profile.stats.studentsTaught ?? 0 },
  ].filter((s) => typeof s.value === "number" && s.value > 0);

  const downloadCv = async () => {
    if (!profile.cv) return;
    setCvBusy(true);
    try {
      const url = await mediaToDownloadUrl(profile.cv);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(profile.name || "cv").replace(/\s+/g, "_")}_CV.pdf`;
      a.rel = "noopener";
      if (!url.startsWith("blob:")) a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      a.remove();
      if (url.startsWith("blob:")) setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } finally {
      setCvBusy(false);
    }
  };

  return (
    <section id="top" className="relative overflow-hidden mesh grain" aria-labelledby="hero-title">
      <div className="container-x relative z-[1] pt-14 pb-20 sm:pt-20 sm:pb-28 lg:pt-24 lg:pb-32 grid gap-12 lg:grid-cols-[1.15fr_0.85fr] items-center">
        <div>
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-sm font-bold uppercase tracking-[0.22em] text-accent-strong"
          >
            {t("hero.greeting")}
          </motion.p>

          {loading.profile ? (
            <div className="mt-4 space-y-4">
              <Skeleton className="h-14 w-4/5" />
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-5 w-full" />
            </div>
          ) : (
            <>
              <motion.h1
                id="hero-title"
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.05 }}
                className="mt-4 font-display text-[2.4rem] leading-[1.05] sm:text-6xl lg:text-[4.2rem] font-semibold tracking-tight text-balance"
              >
                {name}
              </motion.h1>
              <motion.p
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.12 }}
                className="mt-4 text-xl sm:text-2xl lg:text-3xl font-semibold text-fg-2 min-h-[1.5em]"
                aria-live="polite"
              >
                <span className="text-accent-strong">{typed}</span>
                {!reduce && <span className="caret" aria-hidden="true" />}
              </motion.p>
              <motion.p
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-5 max-w-xl text-base sm:text-lg text-muted leading-relaxed"
              >
                {tagline}
              </motion.p>
            </>
          )}

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            {projects.length > 0 && (
              <Button href="/#projects" size="lg">
                <FolderKanban className="h-4 w-4" aria-hidden="true" />
                {t("hero.viewProjects")}
              </Button>
            )}
            {profile.cv && (
              <Button variant="secondary" size="lg" onClick={downloadCv} loading={cvBusy}>
                {!cvBusy && <Download className="h-4 w-4" aria-hidden="true" />}
                {t("hero.downloadCV")}
              </Button>
            )}
            <Button href="/#contact" variant={projects.length > 0 ? "ghost" : "primary"} size="lg">
              <Mail className="h-4 w-4" aria-hidden="true" />
              {t("hero.contact")}
            </Button>
          </motion.div>

          {stats.length > 0 && (
            <motion.dl
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.36 }}
              className="mt-12 grid grid-cols-2 sm:flex sm:flex-wrap gap-x-10 gap-y-6"
            >
              {stats.map((s) => (
                <div key={s.key} className="min-w-[7rem]">
                  <Counter value={s.value as number} label={t(`hero.stats.${s.key}`)} />
                </div>
              ))}
            </motion.dl>
          )}
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.94, rotate: -2 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-[22rem] sm:max-w-[26rem] lg:max-w-none lg:justify-self-end"
        >
          <div className="absolute -inset-6 rounded-[2.5rem] bg-accent-soft blur-2xl" aria-hidden="true" />
          <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden border border-line bg-surface-2 shadow-float">
            {loading.profile ? (
              <Skeleton className="absolute inset-0 rounded-none" />
            ) : (
              <SmartImage
                src={profile.photo}
                alt={t("hero.photoAlt", { name })}
                fill
                priority
                sizes="(max-width: 1024px) 26rem, 40vw"
                className="object-cover"
                fallback={
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-accent-soft to-surface-2">
                    <span className="font-display text-7xl font-semibold text-accent-strong/70">{initials(name) || "DA"}</span>
                  </div>
                }
              />
            )}
          </div>
          {!loading.profile && (
            <div className="absolute -bottom-4 left-4 sm:left-6">
              <Badge tone={AVAILABILITY_TONE[profile.availability] ?? "neutral"} className="px-3.5 py-1.5 text-sm shadow-card bg-surface backdrop-blur">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    profile.availability === "open" && "bg-success animate-pulse",
                    profile.availability === "freelance" && "bg-accent",
                    profile.availability === "unavailable" && "bg-muted",
                  )}
                  aria-hidden="true"
                />
                {t(`hero.availability.${profile.availability ?? "open"}`)}
              </Badge>
            </div>
          )}
        </motion.div>
      </div>

      <a
        href="#about"
        className="absolute left-1/2 -translate-x-1/2 bottom-5 hidden lg:flex flex-col items-center gap-1 text-xs font-semibold text-muted hover:text-fg transition"
        aria-label={t("hero.scroll")}
      >
        <span>{t("hero.scroll")}</span>
        <ArrowDown className="h-4 w-4 animate-bounce" aria-hidden="true" />
      </a>
    </section>
  );
}
