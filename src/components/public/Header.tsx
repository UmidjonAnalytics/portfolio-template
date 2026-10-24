"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useBodyScrollLock } from "@/lib/hooks";
import { useLocale } from "@/lib/i18n";
import { useSiteData } from "@/lib/site-data";
import { cn } from "@/lib/utils";
import { LangSwitcher, ThemeToggle } from "@/components/ui/Switchers";
import { HOME, homeHref } from "@/lib/home";

export function useNavItems() {
  const { visibleSections } = useSiteData();
  const { t } = useLocale();
  const items: { id: string; label: string }[] = [{ id: "about", label: t("nav.about") }];
  for (const s of visibleSections) items.push({ id: s, label: t(`nav.${s}`) });
  items.push({ id: "contact", label: t("nav.contact") });
  return items;
}

export function Header() {
  const { profile, settings } = useSiteData();
  const { t } = useLocale();
  const items = useNavItems();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  useBodyScrollLock(open);

  const brand = settings.siteName || profile.name || t("meta.defaultTitle");
  const isHome = pathname === HOME;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Highlight the section currently in view.
  useEffect(() => {
    if (!isHome) return;
    const ids = items.map((i) => i.id);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.2, 0.5] },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items, isHome]);

  useEffect(() => {
    if (open) setTimeout(() => closeBtnRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:px-4 focus:py-2 focus:rounded-full focus:bg-accent focus:text-accent-fg"
      >
        {t("nav.skipToContent")}
      </a>
      <header
        className={cn(
          "sticky top-0 z-50 transition-[background-color,box-shadow,border-color] duration-300 border-b",
          scrolled ? "bg-bg/80 backdrop-blur-xl border-line shadow-sm" : "bg-transparent border-transparent",
        )}
      >
        <div className="container-x h-16 sm:h-[72px] flex items-center justify-between gap-4">
          <Link href={HOME} className="font-display font-semibold text-base sm:text-lg tracking-tight truncate max-w-[55vw] lg:max-w-[16rem] 2xl:max-w-[22rem] shrink-0" aria-label={t("nav.home")}>
            <span className="text-accent-strong">/</span> {brand}
          </Link>

          <nav className="hidden xl:flex items-center gap-1 min-w-0" aria-label="Primary">
            {items.map((item) => (
              <Link
                key={item.id}
                href={homeHref(item.id)}
                aria-current={active === item.id ? "location" : undefined}
                className={cn(
                  "px-2.5 2xl:px-3.5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition",
                  active === item.id && isHome ? "bg-accent-soft text-accent-strong" : "text-fg-2 hover:text-fg hover:bg-surface-2",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <LangSwitcher compact langs={settings.languages} />
            </div>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label={t("nav.openMenu")}
              aria-expanded={open}
              aria-controls="mobile-nav"
              className="xl:hidden h-9 w-9 inline-flex items-center justify-center rounded-full border border-line bg-surface text-fg-2 hover:text-fg hover:bg-surface-2 transition"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[90] xl:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} aria-hidden="true" />
            <motion.nav
              id="mobile-nav"
              aria-label={t("nav.menu")}
              role="dialog"
              aria-modal="true"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="absolute top-0 right-0 h-full w-[min(86vw,360px)] bg-surface border-l border-line shadow-float flex flex-col"
            >
              <div className="h-16 px-5 flex items-center justify-between border-b border-line">
                <span className="font-display font-semibold">{brand}</span>
                <button
                  ref={closeBtnRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t("nav.closeMenu")}
                  className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-line text-fg-2 hover:bg-surface-2"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <ul className="flex-1 overflow-y-auto p-3">
                {items.map((item, i) => (
                  <motion.li key={item.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}>
                    <Link
                      href={homeHref(item.id)}
                      onClick={() => setOpen(false)}
                      className="block px-4 py-3 rounded-2xl text-base font-semibold text-fg hover:bg-surface-2"
                    >
                      {item.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
              <div className="p-5 border-t border-line flex items-center justify-between gap-3">
                <LangSwitcher langs={settings.languages} />
                <ThemeToggle />
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
