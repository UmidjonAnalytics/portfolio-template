"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

interface SectionProps {
  id: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  /** Alternate background band */
  tone?: "default" | "muted";
  headerAside?: ReactNode;
}

export function Section({ id, eyebrow, title, subtitle, children, className, tone = "default", headerAside }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn("scroll-mt-24 py-20 sm:py-28", tone === "muted" && "bg-surface-2/60 border-y border-line", className)}
    >
      <div className="container-x">
        <Reveal className="mb-10 sm:mb-14 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div className="max-w-2xl">
            {eyebrow && <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent-strong mb-3">{eyebrow}</p>}
            <h2 id={`${id}-title`} className="font-display text-3xl sm:text-4xl font-semibold leading-tight text-balance">
              {title}
            </h2>
            {subtitle && <p className="mt-3 text-muted text-base sm:text-lg leading-relaxed text-balance">{subtitle}</p>}
          </div>
          {headerAside && <div className="shrink-0">{headerAside}</div>}
        </Reveal>
        {children}
      </div>
    </section>
  );
}
