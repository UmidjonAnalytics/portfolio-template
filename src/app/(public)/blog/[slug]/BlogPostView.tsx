"use client";

import { ArrowLeft, Clock } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PLACEHOLDER_SLUG } from "./placeholder";
import { readingMinutes } from "@/components/public/Blog";
import { RichText } from "@/components/ui/RichText";
import { Skeleton } from "@/components/ui/Skeleton";
import { SmartImage } from "@/components/ui/SmartImage";
import { useLocale } from "@/lib/i18n";
import { useSiteData } from "@/lib/site-data";
import { formatDate } from "@/lib/utils";
import { homeHref } from "@/lib/home";

/**
 * In a static export every /blog/<slug> address is served the one prerendered page for the
 * placeholder slug, so the real slug is read from the address bar after load.
 */

function useSlug(): string {
  const params = useParams<{ slug: string }>();
  const [slug, setSlug] = useState(params.slug === PLACEHOLDER_SLUG ? "" : params.slug);
  useEffect(() => {
    if (params.slug !== PLACEHOLDER_SLUG) {
      setSlug(params.slug);
      return;
    }
    const part = window.location.pathname.split("/").filter(Boolean)[1] ?? "";
    setSlug(decodeURIComponent(part.replace(/\.html$/, "")));
  }, [params.slug]);
  return slug;
}

export function BlogPostView() {
  const slug = useSlug();
  const { blog, loading } = useSiteData();
  const { t, tr, lang } = useLocale();
  const post = blog.find((p) => p.slug === slug);

  if (loading.blog || !slug) {
    return (
      <div className="container-x py-16 max-w-3xl">
        <Skeleton className="h-4 w-32 mb-6" />
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="aspect-[16/9] w-full rounded-2xl mb-6" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container-x py-24 text-center">
        <h1 className="font-display text-3xl font-semibold">{t("errors.notFound")}</h1>
        <p className="mt-2 text-muted">{t("blog.notFound")}</p>
        <Link href={homeHref("blog")} className="mt-6 inline-flex items-center gap-2 font-semibold text-accent-strong hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("blog.backToPosts")}
        </Link>
      </div>
    );
  }

  const content = tr(post.content);

  return (
    <article className="container-x py-12 sm:py-16">
      <div className="max-w-3xl mx-auto">
        <Link href={homeHref("blog")} className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-fg">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("blog.backToPosts")}
        </Link>
        <p className="mt-6 text-sm text-muted font-medium flex flex-wrap items-center gap-3">
          {post.date && (
            <span>
              {t("blog.publishedOn")} <time dateTime={post.date}>{formatDate(post.date, lang)}</time>
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {t("blog.readingTime", { minutes: readingMinutes(content) })}
          </span>
        </p>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight text-balance">{tr(post.title)}</h1>
        {tr(post.excerpt) && <p className="mt-4 text-lg text-muted leading-relaxed">{tr(post.excerpt)}</p>}
        {post.tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-surface-2 border border-line px-2.5 py-0.5 text-xs font-semibold text-fg-2">
                {tag}
              </span>
            ))}
          </div>
        )}
        {post.cover && (
          <div className="relative mt-8 aspect-[16/9] rounded-3xl overflow-hidden border border-line bg-surface-2">
            <SmartImage src={post.cover} alt="" fill priority sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
          </div>
        )}
        <RichText html={content} className="mt-10 text-lg" />
      </div>
    </article>
  );
}
