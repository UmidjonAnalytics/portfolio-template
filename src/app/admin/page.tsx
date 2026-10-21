"use client";

import { Award, CheckCircle2, Circle, FolderKanban, Inbox, PieChart, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { intakeOnly } from "@/lib/intake/types";
import { PageHeader } from "@/components/admin/AdminShell";
import { useAuth } from "@/lib/auth";
import { useLocale } from "@/lib/i18n";
import { useSiteData } from "@/lib/site-data";
import { cn, filled, pick, stripHtml } from "@/lib/utils";

interface Check {
  key: string;
  done: boolean;
  href: string;
  optional?: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  useEffect(() => {
    if (intakeOnly()) router.replace("/admin/buyurtmalar");
  }, [router]);
  if (intakeOnly()) return null;
  return <Dashboard />;
}

function Dashboard() {
  const { t } = useLocale();
  const { user } = useAuth();
  const { profile, settings, skills, projects, experience, certificates, education, messages, ready } = useSiteData();

  const checks = useMemo<Check[]>(() => {
    const hasContact = !!(profile.email || profile.phone || profile.telegram || profile.linkedin || profile.github);
    const bioText = (l: "en" | "ru" | "uz") => stripHtml(profile.bio?.[l] ?? "").length > 20;
    const hasBio = stripHtml(pick(profile.bio, "en")).length > 20;
    // Translation check only matters when the site offers more than one language.
    const translated = settings.languages.length <= 1 || settings.languages.every(bioText);
    return [
      { key: "name", done: !!profile.name.trim(), href: "/admin/profile" },
      { key: "titles", done: [profile.titles?.en, profile.titles?.ru, profile.titles?.uz].some((l) => (l?.length ?? 0) > 0), href: "/admin/profile" },
      { key: "tagline", done: filled(profile.tagline), href: "/admin/profile" },
      { key: "bio", done: hasBio, href: "/admin/profile" },
      { key: "photo", done: !!profile.photo, href: "/admin/profile" },
      { key: "cv", done: !!profile.cv, href: "/admin/profile" },
      { key: "contact", done: hasContact, href: "/admin/profile" },
      { key: "skills", done: skills.filter((s) => s.published).length >= 5, href: "/admin/skills" },
      { key: "projects", done: projects.filter((p) => p.published).length >= 3, href: "/admin/projects" },
      { key: "education", done: education.some((e) => e.published), href: "/admin/education" },
      { key: "seo", done: filled(settings.seoTitle) && filled(settings.seoDescription), href: "/admin/settings" },
      { key: "translations", done: translated, href: "/admin/profile" },
      { key: "experience", done: experience.some((e) => e.published), href: "/admin/experience", optional: true },
      { key: "certificates", done: certificates.some((c) => c.published), href: "/admin/certificates", optional: true },
    ];
  }, [profile, settings, skills, projects, education, experience, certificates]);

  const required = checks.filter((c) => !c.optional);
  const completeness = Math.round((required.filter((c) => c.done).length / required.length) * 100);
  const missing = checks.filter((c) => !c.done);
  const unread = messages.filter((m) => !m.read).length;

  const stats = [
    { key: "projects", value: projects.filter((p) => p.published).length, Icon: FolderKanban, href: "/admin/projects" },
    { key: "certificates", value: certificates.filter((c) => c.published).length, Icon: Award, href: "/admin/certificates" },
    { key: "unread", value: unread, Icon: Inbox, href: "/admin/messages" },
    { key: "completeness", value: `${completeness}%`, Icon: PieChart, href: "/admin/profile" },
  ];

  return (
    <>
      <PageHeader title={t("admin.dashboard.title")} subtitle={profile.name ? t("admin.dashboard.welcome", { name: profile.name }) : t("admin.dashboard.welcomeAnon")} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ key, value, Icon, href }) => (
          <Link key={key} href={href} className="card p-5 flex items-center gap-4 hover:border-accent transition">
            <span className="h-11 w-11 rounded-2xl bg-accent-soft text-accent-strong flex items-center justify-center shrink-0" aria-hidden="true">
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-2xl font-semibold tabular-nums">{ready ? value : "…"}</p>
              <p className="text-xs text-muted font-medium truncate">{t(`admin.dashboard.stats.${key}`)}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="card p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">{t("admin.dashboard.checklistTitle")}</h2>
            <span className="font-mono text-sm font-bold text-accent-strong">{completeness}%</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-surface-2 overflow-hidden" role="progressbar" aria-valuenow={completeness} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-accent transition-all duration-700" style={{ width: `${completeness}%` }} />
          </div>
          {missing.length === 0 ? (
            <p className="mt-5 flex items-center gap-2 text-success font-semibold">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              {t("admin.dashboard.checklistDone")}
            </p>
          ) : (
            <>
              <p className="mt-4 text-sm text-muted">{t("admin.dashboard.checklistHint")}</p>
              <ul className="mt-3 divide-y divide-line">
                {checks.map((c) => (
                  <li key={c.key} className="flex items-center gap-3 py-2.5">
                    {c.done ? <CheckCircle2 className="h-5 w-5 text-success shrink-0" aria-hidden="true" /> : <Circle className="h-5 w-5 text-line-strong shrink-0" aria-hidden="true" />}
                    <span className={cn("flex-1 text-sm", c.done ? "text-muted line-through" : "font-semibold")}>{t(`admin.dashboard.checks.${c.key}`)}</span>
                    {!c.done && (
                      <Link href={c.href} className="text-xs font-bold text-accent-strong hover:underline">
                        {t("admin.dashboard.fix")}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="card p-6 bg-accent-soft/40">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent-strong" aria-hidden="true" />
            {t("admin.dashboard.liveHint")}
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              ["/admin/projects", t("admin.crud.add", { item: t("admin.crud.items.project") })],
              ["/admin/certificates", t("admin.crud.add", { item: t("admin.crud.items.certificate") })],
              ["/admin/profile", t("admin.profile.title")],
              ["/admin/settings", t("admin.settings.title")],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="block rounded-xl bg-surface border border-line px-4 py-2.5 font-semibold hover:border-accent transition">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          {user?.email && <p className="mt-4 text-xs text-muted truncate">{user.email}</p>}
        </section>
      </div>
    </>
  );
}
