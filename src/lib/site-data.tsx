"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { accentForeground, applyDesignAttributes, normalizeDesign, resolvedBackground, styleMeta, type SiteDesign } from "./design";
import { DesignProvider } from "./design-context";
import { useCollection, useDocument } from "./hooks";
import { DEFAULTS_STORAGE_KEY, useLocale } from "./i18n";
import { normalizeLangs } from "./utils";
import { useTheme } from "./theme";
import {
  defaultProfile,
  defaultSettings,
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

/** A visitor's own name and photo on the demo site. Kept in their browser, never written to Firestore. */
export interface TryMe {
  name: string;
  photo: string;
}

interface TryApi {
  /** Try a design without saving it. null goes back to the saved one. */
  design: (design: SiteDesign | null) => void;
  me: (me: TryMe | null) => void;
}

const TryContext = createContext<TryApi>({ design: () => {}, me: () => {} });
/** Used only by the demo panel (components/public/DesignDemo.tsx). */
export const useTry = () => useContext(TryContext);

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
    design: normalizeDesign(data.design),
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

  const [me, setMe] = useState<TryMe | null>(null);
  const profile = useMemo(() => {
    const p = mergeProfile(profileDoc.data);
    return me ? { ...p, name: me.name.trim() || p.name, photo: me.photo || p.photo } : p;
  }, [profileDoc.data, me]);
  const saved = useMemo(() => mergeSettings(settingsDoc.data), [settingsDoc.data]);
  const preview = useDesignPreview(mode === "public");
  const [tried, setTried] = useState<SiteDesign | null>(null);
  const settings = useMemo(() => {
    if (preview) return { ...saved, design: preview.design, accentColor: preview.accent || saved.accentColor };
    let s = saved;
    if (tried) s = { ...s, design: tried, accentColor: styleMeta(tried.style).accent };
    // The visitor's own name replaces the demo name in the header, footer and browser tab.
    if (me?.name.trim()) s = { ...s, siteName: me.name.trim(), seoTitle: { en: "", ru: "", uz: "" } };
    return s;
  }, [saved, preview, tried, me]);
  const tryApi = useMemo<TryApi>(() => ({ design: setTried, me: setMe }), []);

  // The design's CSS applies to the public site only; admin pages keep the plain look.
  useEffect(() => {
    applyDesignAttributes(mode === "public" ? settings.design : null);
  }, [mode, settings.design]);

  // Push site defaults (language, theme, accent) into the providers and cache them for the
  // pre-paint script on the next visit.
  useEffect(() => {
    if (settingsDoc.loading) return;
    applyDefaultLang(settings.defaultLang);
    if (!preview?.theme) applyDefaultTheme(settings.defaultTheme);
    applyAccent(settings.accentColor);
    if (preview) return;
    try {
      localStorage.setItem(
        DEFAULTS_STORAGE_KEY,
        JSON.stringify({
          lang: saved.defaultLang,
          theme: saved.defaultTheme,
          accent: saved.accentColor,
          accentFg: accentForeground(saved.accentColor),
          style: saved.design.style,
          bg: resolvedBackground(saved.design),
          density: saved.design.density,
        }),
      );
    } catch {
      /* ignore */
    }
  }, [settingsDoc.loading, settings.defaultLang, settings.defaultTheme, settings.accentColor, saved, preview, applyDefaultLang, applyDefaultTheme, applyAccent]);

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
    const visibleSections = settings.design.order.filter((k) => settings.sections[k] !== false && lists[k].items.length > 0);
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

  return (
    <SiteDataContext.Provider value={value}>
      <TryContext.Provider value={tryApi}>
        <DesignProvider value={settings.design}>{children}</DesignProvider>
      </TryContext.Provider>
    </SiteDataContext.Provider>
  );
}

export const PREVIEW_QUERY = "preview=design";
export const PREVIEW_MESSAGE = "design-preview";

interface DesignPreview {
  design: SiteDesign;
  accent: string;
  theme: "light" | "dark" | null;
}

/**
 * Admin → Design shows the site in an iframe at /?preview=design and posts the unsaved design to
 * it. Only messages from this same origin are accepted, and nothing is saved or cached.
 */
function useDesignPreview(enabled: boolean): DesignPreview | null {
  const [preview, setPreview] = useState<DesignPreview | null>(null);
  useEffect(() => {
    if (!enabled || window.parent === window || !location.search.includes(PREVIEW_QUERY)) return;
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== location.origin || e.source !== window.parent) return;
      const data = e.data as { type?: string; design?: unknown; accent?: unknown; theme?: unknown; focus?: unknown } | null;
      if (data?.type !== PREVIEW_MESSAGE) return;
      const accent = typeof data.accent === "string" && /^#[0-9a-f]{6}$/i.test(data.accent) ? data.accent : "";
      const theme = data.theme === "light" || data.theme === "dark" ? data.theme : null;
      setPreview({ design: normalizeDesign(data.design), accent, theme });
      // The theme is shown without saving it as the visitor's choice (localStorage is shared with admin).
      if (theme) {
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.style.colorScheme = theme;
      }
      // "projects:1712345" scrolls to #projects once the new layout has rendered.
      const id = typeof data.focus === "string" ? data.focus.split(":")[0] : "";
      if (/^[a-z]+$/.test(id)) window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    };
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: `${PREVIEW_MESSAGE}-ready` }, location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, [enabled]);
  return preview;
}

export function useSiteData(): SiteData {
  const ctx = useContext(SiteDataContext);
  if (!ctx) throw new Error("useSiteData must be used inside SiteDataProvider");
  return ctx;
}
