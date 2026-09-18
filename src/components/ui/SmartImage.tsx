"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";
import { resolveMedia } from "@/lib/media";
import { cn } from "@/lib/utils";

const OPTIMIZABLE_HOSTS = ["firebasestorage.googleapis.com"];

function canOptimize(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && OPTIMIZABLE_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith("." + h));
  } catch {
    return false;
  }
}

/** Resolve a media reference (https / data: / media:<id>) to a URL. */
export function useMediaUrl(ref: string | undefined | null): { url: string; loading: boolean } {
  const direct = ref && !ref.startsWith("media:") ? ref : "";
  const [url, setUrl] = useState(direct);
  const [loading, setLoading] = useState(!!ref && !direct);

  useEffect(() => {
    let cancelled = false;
    if (!ref) {
      setUrl("");
      setLoading(false);
      return;
    }
    if (!ref.startsWith("media:")) {
      setUrl(ref);
      setLoading(false);
      return;
    }
    setLoading(true);
    resolveMedia(ref).then((u) => {
      if (cancelled) return;
      setUrl(u);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [ref]);

  return { url, loading };
}

type SmartImageProps = Omit<ImageProps, "src" | "alt"> & {
  src: string | undefined | null;
  alt: string;
  /** Rendered when there is no image */
  fallback?: React.ReactNode;
  wrapperClassName?: string;
};

/**
 * next/image that understands media references and only optimises hosts we control.
 * Data URIs and unknown hosts are served unoptimised, so students can paste any image URL.
 */
export function SmartImage({ src, alt, fallback = null, className, wrapperClassName, fill, ...rest }: SmartImageProps) {
  const { url, loading } = useMediaUrl(src);
  if (!src) return <>{fallback}</>;
  if (loading || !url) {
    return <div className={cn("skeleton", fill ? "absolute inset-0" : "w-full h-full", wrapperClassName)} aria-hidden="true" />;
  }
  return <Image src={url} alt={alt} fill={fill} unoptimized={!canOptimize(url)} className={className} {...rest} />;
}
