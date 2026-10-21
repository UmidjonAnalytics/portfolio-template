"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { useCollection, useDocument } from "./hooks";
import { DEFAULTS_STORAGE_KEY, useLocale } from "./i18n";
import { normalizeLangs } from "./utils";
import { useTheme } from "./theme";
import {
  defaultProfile,
  defaultSettings,
  SECTION_KEYS,
  type BlogPost,
  type Certificate,
  type Education,
  type Experience,
  type Message,
  type Profile,
  type Project,
  type SectionKey,
  type SiteSettings,
  type Skill,
  type Testimonial,
} from "./types";

export interface SiteData {
  profile: Profile;
  settings: SiteSettings;
  profileExists: boolean;
  skills: Skill[];
  projects: Project[];
  experience: Experience[];
  certificates: Certificate[];
  education: Education[];
  testimonials: Testimonial[];
  blog: BlogPost[];
  /** Only populated in admin mode. */
  messages: Message[];
  /** Sections that should be rendered: enabled in settings AND have at least one item. */
  visibleSections: SectionKey[];
  loading: Record<"profile" | "settings" | SectionKey, boolean>;
  /** true once every subscription delivered its first snapshot */
  ready: boolean;
  mode: "public" | "admin";
}

const SiteDataContext = createContext<SiteData | null>(null);

export function mergeProfile(data: Partial<Profile> | null | undefined): Profile {
  const base = defaultProfile();
  if (!data) return base;
  return {
    ...base,
    ...data,
    titles: { ...base.titles, ...(data.titles ?? {}) },
    tagline: { ...base.tagline, ...(data.tagline ?? {}) },
    bio: { ...base.bio, ...(data.bio ?? {}) },
    location: { ...base.location, ...(data.location ?? {}) },
    spokenLanguages: { ...base.spokenLanguages, ...(data.spokenLanguages ?? {}) },
    stats: { ...base.stats, ...(data.stats ?? {}) },
  };
}

export function mergeSettings(data: Partial<SiteSettings> | null | undefined): SiteSettings {
  const base = defaultSettings();
  if (!data) return base;
  return {
    ...base,
    ...data,
    sections: { ...base.sections, ...(data.sections ?? {}) },
    seoTitle: { ...base.seoTitle, ...(data.seoTitle ?? {}) },
    seoDescription: { ...base.seoDescription, ...(data.seoDescription ?? {}) },
    embedAllowlist: data.embedAllowlist ?? base.embedAllowlist,
    ...langDefaults(data),
  };
}

function langDefaults(data: Partial<SiteSettings>): Pick<SiteSettings, "languages" | "defaultLang"> {
  const languages = normalizeLangs(data.languages);
  const defaultLang = data.defaultLang && languages.includes(data.defaultLang) ? data.defaultLang : languages[0];
  return { languages, defaultLang };
}

export function SiteDataProvider({ children, mode = "public" }: { children: React.ReactNode; mode?: "public" | "admin" }) {
  const publishedOnly = mode === "public";
  const profileDoc = useDocument<Profile>("site/profile");
  const settingsDoc = useDocument<SiteSettings>("site/settings");
  const skills = useCollection<Skill>("skills", { publishedOnly });
  const projects = useCollection<Project>("projects", { publishedOnly });
  const experience = useCollection<Experience>("experience", { publishedOnly });
  const certificates = useCollection<Certificate>("certificates", { publishedOnly });
  const education = useCollection<Education>("education", { publishedOnly });
  const testimonials = useCollection<Testimonial>("testimonials", { publishedOnly });
  const blog = useCollection<BlogPost>("blog", { publishedOnly });
  const messages = useCollection<Message>("messages", {
    enabled: mode === "admin",
    sort: (items) => [...items].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
  });

  const { applyDefault: applyDefaultLang, lang, setLang } = useLocale();
  const { applyDefault: applyDefaultTheme, applyAccent } = useTheme();

  const profile = useMemo(() => mergeProfile(profileDoc.data), [profileDoc.data]);
  const settings = useMemo(() => mergeSettings(settingsDoc.data), [settingsDoc.data]);

  // Push site defaults (language, theme, accent) into the providers and cache them for the
  // pre-paint script on the next visit.
  useEffect(() => {
    if (settingsDoc.loading) return;
    applyDefaultLang(settings.defaultLang);
    applyDefaultTheme(settings.defaultTheme);
    applyAccent(settings.accentColor);
    try {
      localStorage.setItem(
        DEFAULTS_STORAGE_KEY,
        JSON.stringify({ lang: settings.defaultLang, theme: settings.defaultTheme, accent: settings.accentColor }),
      );
    } catch {
      /* ignore */
    }
  }, [settingsDoc.loading, settings.defaultLang, settings.defaultTheme, settings.accentColor, applyDefaultLang, applyDefaultTheme, applyAccent]);

  // On the public site, never show a language the owner switched off.
  useEffect(() => {
    if (mode !== "public" || settingsDoc.loading) return;
    if (!settings.languages.includes(lang)) setLang(settings.defaultLang);
  }, [mode, settingsDoc.loading, settings.languages, settings.defaultLang, lang, setLang]);

  const value = useMemo<SiteData>(() => {
    const lists: Record<SectionKey, { items: unknown[]; loading: boolean }> = {
      skills,
      projects,
      experience,
      certificates,
      education,
      testimonials,
      blog,
    };
    const visibleSections = SECTION_KEYS.filter((k) => settings.sections[k] !== false && lists[k].items.length > 0);
    const loading = {
      profile: profileDoc.loading,
      settings: settingsDoc.loading,
      skills: skills.loading,
      projects: projects.loading,
      experience: experience.loading,
      certificates: certificates.loading,
      education: education.loading,
      testimonials: testimonials.loading,
      blog: blog.loading,
    };
    return {
      profile,
      settings,
      profileExists: profileDoc.exists,
      skills: skills.items,
      projects: projects.items,
      experience: experience.items,
      certificates: certificates.items,
      education: education.items,
      testimonials: testimonials.items,
      blog: blog.items,
      messages: messages.items,
      visibleSections,
      loading,
      ready: !Object.values(loading).some(Boolean),
      mode,
    };
  }, [profile, settings, profileDoc.loading, profileDoc.exists, settingsDoc.loading, skills, projects, experience, certificates, education, testimonials, blog, messages, mode]);

  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>;
}

export function useSiteData(): SiteData {
  const ctx = useContext(SiteDataContext);
  if (!ctx) throw new Error("useSiteData must be used inside SiteDataProvider");
  return ctx;
}
