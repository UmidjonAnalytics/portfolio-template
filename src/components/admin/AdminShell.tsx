"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  BookOpen,
  Briefcase,
  ClipboardList,
  ExternalLink,
  FolderKanban,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareQuote,
  Settings,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { intakeEnabled } from "@/lib/intake/types";
import { useBodyScrollLock } from "@/lib/hooks";
import { useLocale } from "@/lib/i18n";
import { SiteDataProvider, useSiteData } from "@/lib/site-data";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/Button";
import { LangSwitcher, ThemeToggle } from "@/components/ui/Switchers";

const BASE_NAV = [
  { href: "/admin", key: "dashboard", Icon: LayoutDashboard },
  { href: "/admin/profile", key: "profile", Icon: UserRound },
  { href: "/admin/skills", key: "skills", Icon: Sparkles },
  { href: "/admin/projects", key: "projects", Icon: FolderKanban },
  { href: "/admin/experience", key: "experience", Icon: Briefcase },
  { href: "/admin/certificates", key: "certificates", Icon: Award },
  { href: "/admin/education", key: "education", Icon: GraduationCap },
  { href: "/admin/testimonials", key: "testimonials", Icon: MessageSquareQuote },
  { href: "/admin/blog", key: "blog", Icon: BookOpen },
  { href: "/admin/messages", key: "messages", Icon: Inbox },
  { href: "/admin/settings", key: "settings", Icon: Settings },
];

// The intake form and its order list exist only on the owner's own deployment.
const NAV = intakeEnabled() ? [BASE_NAV[0], { href: "/admin/buyurtmalar", key: "orders", Icon: ClipboardList }, ...BASE_NAV.slice(1)] : BASE_NAV;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t } = useLocale();
  const { messages } = useSiteData();
  const unread = messages.filter((m) => !m.read).length;
  return (
    <ul className="space-y-0.5">
      {NAV.map(({ href, key, Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                active ? "bg-accent-soft text-accent-strong" : "text-fg-2 hover:bg-surface-2 hover:text-fg",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="flex-1">{t(`admin.nav.${key}`)}</span>
              {key === "messages" && unread > 0 && (
                <span className="rounded-full bg-accent text-accent-fg px-2 py-0.5 text-[11px] font-bold tabular-nums" aria-label={`${unread} ${t("admin.messages.unread")}`}>
                  {unread}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();
  const { user, signOut } = useAuth();
  const { settings, profile } = useSiteData();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useBodyScrollLock(open);
  useEffect(() => setOpen(false), [pathname]);

  const brand = settings.siteName || profile.name || t("admin.brand");

  const sidebar = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col">
      <div className="px-4 py-5 border-b border-line">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">{t("admin.brand")}</p>
        <p className="mt-1 font-display font-semibold truncate">{brand}</p>
      </div>
      <nav className="flex-1 overflow-y-auto p-3" aria-label={t("admin.brand")}>
        <NavLinks onNavigate={onNavigate} />
      </nav>
      <div className="p-3 border-t border-line space-y-1">
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-fg-2 hover:bg-surface-2 hover:text-fg transition">
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          {t("admin.nav.viewSite")}
        </Link>
        <button type="button" onClick={() => signOut()} className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-fg-2 hover:bg-danger-soft hover:text-danger transition">
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {t("admin.nav.signOut")}
        </button>
        {user?.email && <p className="px-3 pt-1 text-[11px] text-muted truncate">{user.email}</p>}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-bg">
      <title>{`${t("admin.brand")} · ${brand}`}</title>
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-line bg-surface sticky top-0 h-screen">{sidebar()}</aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-40 h-14 border-b border-line bg-bg/80 backdrop-blur flex items-center gap-3 px-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={t("admin.nav.openSidebar")}
            aria-expanded={open}
            className="lg:hidden h-9 w-9 inline-flex items-center justify-center rounded-full border border-line bg-surface"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <span className="lg:hidden font-display font-semibold truncate">{brand}</span>
          <span className="flex-1" />
          <LangSwitcher compact />
          <ThemeToggle />
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">{children}</main>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[90] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-hidden="true" />
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="absolute inset-y-0 left-0 w-72 bg-surface border-r border-line shadow-float"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("admin.nav.closeSidebar")}
                className="absolute top-4 right-3 h-9 w-9 inline-flex items-center justify-center rounded-full border border-line bg-surface"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
              {sidebar(() => setOpen(false))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NotAdmin() {
  const { user, signOut } = useAuth();
  const { t } = useLocale();
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="card max-w-md w-full p-8 text-center">
        <h1 className="font-display text-xl font-semibold">{t("admin.login.notAdminTitle")}</h1>
        <p className="mt-3 text-sm text-muted break-words">{t("admin.login.notAdminHint", { email: user?.email ?? "" })}</p>
        <button type="button" onClick={() => signOut()} className="mt-6 h-10 px-5 rounded-full bg-accent text-accent-fg text-sm font-semibold hover:bg-accent-strong transition">
          {t("admin.login.signOut")}
        </button>
      </div>
    </main>
  );
}

/** Wraps every /admin page (except /admin/login): redirects anonymous visitors, blocks non-admins. */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/admin/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center" aria-busy="true">
        <Spinner className="h-6 w-6 text-accent" />
      </main>
    );
  }
  if (!isAdmin) return <NotAdmin />;

  return (
    <SiteDataProvider mode="admin">
      <Shell>{children}</Shell>
    </SiteDataProvider>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
