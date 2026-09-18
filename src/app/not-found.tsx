"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";

export default function NotFound() {
  const t = useT();
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-24 text-center">
      <div>
        <p className="font-mono text-sm font-bold text-accent-strong">404</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">{t("errors.notFound")}</h1>
        <p className="mt-2 text-muted">{t("errors.notFoundHint")}</p>
        <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-full bg-accent px-6 font-semibold text-accent-fg hover:bg-accent-strong transition">
          {t("errors.goHome")}
        </Link>
      </div>
    </main>
  );
}
