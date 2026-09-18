"use client";

import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n";
import { useSiteData } from "@/lib/site-data";
import type { BlogPost } from "@/lib/types";
import { formatDate, stripHtml } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";
import { Section } from "@/components/ui/Section";
import { SmartImage } from "@/components/ui/SmartImage";

export function readingMinutes(html: string): number {
  const words = stripHtml(html || "").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function BlogCard({ post, index }: { post: BlogPost; index: number }) {
  const { t, tr, lang } = useLocale();
  const title = tr(post.title);
  return (
    <Reveal delay={index * 0.05} className="h-full">
      <Link href={`/blog/${post.slug}`} className="group card overflow-hidden flex flex-col h-full hover:-translate-y-1 hover:shadow-card transition-[transform,box-shadow] duration-300">
        <div className="relative aspect-[16/9] bg-surface-2 overflow-hidden">
          <SmartImage
            src={post.cover}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
            fallback={<div className="absolute inset-0 bg-gradient-to-br from-accent-soft to-surface-2" />}
          />
        </div>
        <div className="p-5 flex-1 flex flex-col">
          <p className="text-xs text-muted font-medium flex items-center gap-2">
            {post.date && <time dateTime={post.date}>{formatDate(post.date, lang)}</time>}
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {t("blog.readingTime", { minutes: readingMinutes(tr(post.content)) })}
            </span>
          </p>
          <h3 className="mt-2 font-display text-lg font-semibold leading-snug line-clamp-2">{title}</h3>
          <p className="mt-2 text-sm text-muted line-clamp-3">{tr(post.excerpt)}</p>
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
  if (blog.length === 0) return null;
  const posts = [...blog].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return (
    <Section id="blog" eyebrow={t("nav.blog")} title={t("blog.title")} subtitle={t("blog.subtitle")} tone="muted">
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p, i) => (
          <li key={p.id}>
            <BlogCard post={p} index={i} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
