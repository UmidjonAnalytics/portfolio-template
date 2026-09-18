"use client";

import DOMPurify from "dompurify";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

/** Renders editor-produced HTML safely. */
export function RichText({ html, className }: { html: string; className?: string }) {
  const clean = useMemo(() => {
    if (!html) return "";
    if (typeof window === "undefined") return "";
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ["p", "br", "strong", "b", "em", "i", "u", "s", "a", "ul", "ol", "li", "h2", "h3", "h4", "blockquote", "code", "pre", "span"],
      ALLOWED_ATTR: ["href", "target", "rel", "class"],
    });
  }, [html]);
  return <div className={cn("rich-text", className)} dangerouslySetInnerHTML={{ __html: clean }} />;
}
