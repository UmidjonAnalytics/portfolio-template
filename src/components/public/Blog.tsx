"use client";

import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { useLayout } from "@/lib/design-context";
import { useLocale } from "@/lib/i18n";
import { useSiteData } from "@/lib/site-data";
import type { BlogPost } from "@/lib/types";
import { cn, formatDate, stripHtml } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SmartImage } from "@/components/ui/SmartImage";

export function readingMinutes(html: string): number {
  const words = stripHtml(html || "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * card: image on top. row: image on the left from sm up. hero: large, image beside the text on
 * wide screens, used for the first post in the "featured" layout.
 */
export function BlogCard({ post, index, variant = "card" }: { post: BlogPost; index: number; variant?: "card" | "row" | "hero" }) {
  const { t, tr, lang } = useLocale();
  const title = tr(post.title);
  const side = variant !== "card";
  return (
    <Reveal delay={index * 0.05} className="h-full">
      <Link
        href={`/blog/${post.slug}`}
        className={cn(
          "group card overflow-hidden flex flex-col h-full hover:-translate-y-1 hover:shadow-card transition-[transform,box-shadow] duration-300",
          variant === "row" && "sm:flex-row",
          variant === "hero" && "lg:grid lg:grid-cols-[1.15fr_1fr]",
        )}
      >
        <div
          className={cn(
            "relative aspect-[16/9] bg-surface-2 overflow-hidden",
            variant === "row" && "sm:aspect-auto sm:w-56 md:w-72 shrink-0",
            variant === "hero" && "lg:aspect-auto lg:min-h-[20rem]",
          )}
        >
          <SmartImage
            src={post.cover}
            alt=""
            fill
            sizes={side ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
            className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
            fallback={<div className="absolute inset-0 bg-gradient-to-br from-accent-soft to-surface-2" />}
          />
        </div>
        <div className={cn("flex-1 flex flex-col", variant === "hero" ? "p-6 sm:p-8" : "p-5")}>
          <p className="text-xs text-muted font-medium flex items-center gap-2">
            {post.date && <time dateTime={post.date}>{formatDate(post.date, lang)}</time>}
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {t("blog.readingTime", { minutes: readingMinutes(tr(post.content)) })}
            </span>
          </p>
          <h3 className={cn("mt-2 font-display font-semibold leading-snug line-clamp-2", variant === "hero" ? "text-2xl sm:text-3xl" : "text-lg")}>{title}</h3>
          <p className={cn("mt-2 text-muted", variant === "hero" ? "line-clamp-5" : "text-sm line-clamp-3")}>{tr(post.excerpt)}</p>
          {post.tags?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-surface-2 border border-line px-2 py-0.5 text-[11px] font-semibold text-fg-2">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <span className="mt-auto pt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent-strong">
            {t("blog.readMore")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </span>
        </div>
      </Link>
    </Reveal>
  );
}

export function Blog() {
  const { blog } = useSiteData();
  const { t } = useLocale();
  const layout = useLayout("blog");
  if (blog.length === 0) return null;
  const posts = [...blog].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const [first, ...rest] = posts;

  return (
    <Section id="blog" eyebrow={t("nav.blog")} title={t("blog.title")} subtitle={t("blog.subtitle")} tone="muted">
      {layout === "list" ? (
        <ul className="flex flex-col gap-4">
          {posts.map((p, i) => (
            <li key={p.id}>
              <BlogCard post={p} index={i} variant="row" />
            </li>
          ))}
        </ul>
      ) : layout === "featured" ? (
        <div className="space-y-5">
          <BlogCard post={first} index={0} variant="hero" />
          {/* Fewer than three left: rows, so a lone card does not sit in an empty grid. */}
          {rest.length > 0 && (
            <ul className={rest.length < 3 ? "flex flex-col gap-4" : "grid gap-5 sm:grid-cols-2 lg:grid-cols-3"}>
              {rest.map((p, i) => (
                <li key={p.id}>
                  <BlogCard post={p} index={i + 1} variant={rest.length < 3 ? "row" : "card"} />
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p, i) => (
            <li key={p.id}>
              <BlogCard post={p} index={i} />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
