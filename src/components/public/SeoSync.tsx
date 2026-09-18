"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useLocale } from "@/lib/i18n";
import { resolveMedia } from "@/lib/media";
import { useSiteData } from "@/lib/site-data";

/**
 * Keeps <title>, meta description, favicon and Google Analytics in sync with Site Settings
 * (they live in Firestore, so they cannot be static metadata). React 19 hoists the <title>
 * and <meta> rendered here into <head>; they update on every language or settings change.
 */
export function SeoSync() {
  const { settings, profile, blog } = useSiteData();
  const { t, tr } = useLocale();
  const pathname = usePathname();

  const base = tr(settings.seoTitle) || settings.siteName || profile.name || t("meta.defaultTitle");
  let pageTitle = "";
  const blogMatch = /^\/blog\/([^/]+)/.exec(pathname ?? "");
  if (blogMatch) {
    const post = blog.find((p) => p.slug === decodeURIComponent(blogMatch[1]));
    if (post) pageTitle = tr(post.title);
  }
  const title = pageTitle ? `${pageTitle} · ${base}` : base;
  const description = tr(settings.seoDescription) || t("meta.defaultDescription");

  useEffect(() => {
    if (!settings.favicon) return;
    let cancelled = false;
    resolveMedia(settings.favicon).then((url) => {
      if (cancelled || !url) return;
      let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = url;
    });
    return () => {
      cancelled = true;
    };
  }, [settings.favicon]);

  useEffect(() => {
    const id = settings.gaId?.trim();
    if (!id || !/^G-[A-Z0-9]+$/i.test(id) || document.getElementById("ga-script")) return;
    const s = document.createElement("script");
    s.id = "ga-script";
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(s);
    const inline = document.createElement("script");
    inline.id = "ga-inline";
    inline.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');`;
    document.head.appendChild(inline);
  }, [settings.gaId]);

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
    </>
  );
}
