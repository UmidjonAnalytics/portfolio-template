"use client";

import { ArrowUp, Mail, Send } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/BrandIcons";
import Link from "next/link";
import { useLocale } from "@/lib/i18n";
import { useSiteData } from "@/lib/site-data";
import { externalUrl, telegramUrl } from "@/lib/utils";
import { LangSwitcher, ThemeToggle } from "@/components/ui/Switchers";

export function Footer() {
  const { profile, settings } = useSiteData();
  const { t } = useLocale();
  const year = new Date().getFullYear();
  const brand = settings.siteName || profile.name || t("meta.defaultTitle");

  const socials = [
    profile.telegram && { href: telegramUrl(profile.telegram), label: t("contact.telegram"), Icon: Send },
    profile.linkedin && { href: externalUrl(profile.linkedin, "https://www.linkedin.com/in/"), label: t("contact.linkedin"), Icon: LinkedinIcon },
    profile.github && { href: externalUrl(profile.github, "https://github.com/"), label: t("contact.github"), Icon: GithubIcon },
    profile.email && { href: `mailto:${profile.email}`, label: t("contact.emailBtn"), Icon: Mail },
  ].filter(Boolean) as { href: string; label: string; Icon: React.ComponentType<{ className?: string }> }[];

  return (
    <footer className="border-t border-line bg-surface/50">
      <div className="container-x py-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display font-semibold">{brand}</p>
          <p className="mt-1 text-sm text-muted">
            © {year} {brand}. {t("footer.rights")}
          </p>
          <p className="mt-1 text-xs text-muted/80">{t("footer.builtWith")}</p>
        </div>

        {socials.length > 0 && (
          <ul className="flex items-center gap-2" aria-label={t("footer.socials")}>
            {socials.map(({ href, label, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target={href.startsWith("mailto:") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="h-10 w-10 inline-flex items-center justify-center rounded-full border border-line bg-surface text-fg-2 hover:text-accent-strong hover:border-accent transition"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <LangSwitcher />
          <ThemeToggle />
          <a
            href="#top"
            aria-label={t("footer.backToTop")}
            title={t("footer.backToTop")}
            className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-line bg-surface text-fg-2 hover:text-fg hover:bg-surface-2 transition"
          >
            <ArrowUp className="h-4 w-4" aria-hidden="true" />
          </a>
          <Link href="/admin" className="text-xs text-muted hover:text-fg underline-offset-4 hover:underline">
            {t("footer.adminLink")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
