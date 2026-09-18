// ---------------------------------------------------------------------------
// Shared data model. Mirrors DATA-MODEL.md — keep both in sync.
// ---------------------------------------------------------------------------

export type Lang = "en" | "ru" | "uz";
export const LANGS: Lang[] = ["en", "ru", "uz"];

/** A string stored in three languages. English is required, others fall back to it. */
export type Localized = { en: string; ru?: string; uz?: string };
/** A list of strings (bullets, titles…) stored in three languages. */
export type LocalizedList = { en: string[]; ru?: string[]; uz?: string[] };

export const emptyLocalized = (): Localized => ({ en: "", ru: "", uz: "" });
export const emptyLocalizedList = (): LocalizedList => ({ en: [], ru: [], uz: [] });

export type Theme = "light" | "dark" | "system";
export type Availability = "open" | "freelance" | "unavailable";

export type SectionKey =
  | "skills"
  | "projects"
  | "experience"
  | "certificates"
  | "education"
  | "testimonials"
  | "blog";

export const SECTION_KEYS: SectionKey[] = [
  "skills",
  "projects",
  "experience",
  "certificates",
  "education",
  "testimonials",
  "blog",
];

/** Fields every list item shares. */
export interface BaseItem {
  id: string;
  published: boolean;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface ProfileStats {
  projects?: number | null;
  yearsExperience?: number | null;
  tools?: number | null;
  studentsTaught?: number | null;
}

export interface Profile {
  name: string;
  /** Rotating titles used by the typing effect, e.g. ["Data Analyst", "Power BI Developer"]. */
  titles: LocalizedList;
  tagline: Localized;
  /** Sanitised HTML produced by the rich-text editor. */
  bio: Localized;
  location: Localized;
  spokenLanguages: LocalizedList;
  availability: Availability;
  /** Media reference (https URL, data: URL or "media:<id>"). */
  photo: string;
  /** Media reference of the CV (PDF). */
  cv: string;
  email: string;
  phone: string;
  telegram: string;
  linkedin: string;
  github: string;
  stats: ProfileStats;
  updatedAt?: number;
}

export interface SiteSettings {
  siteName: string;
  accentColor: string;
  defaultLang: Lang;
  defaultTheme: Theme;
  sections: Record<SectionKey, boolean>;
  seoTitle: Localized;
  seoDescription: Localized;
  favicon: string;
  gaId: string;
  /** Hostnames allowed inside the project iframe embed (e.g. app.powerbi.com). */
  embedAllowlist: string[];
  updatedAt?: number;
}

export type SkillCategory = "bi" | "programming" | "databases" | "soft";
export const SKILL_CATEGORIES: SkillCategory[] = ["bi", "programming", "databases", "soft"];

export interface Skill extends BaseItem {
  name: Localized;
  icon: string;
  category: SkillCategory;
  /** 0 – 100 */
  level: number;
}

export const PROJECT_TOOLS = ["Excel", "Power BI", "SQL", "Python", "Tableau", "Google Sheets"] as const;
export const PROJECT_DOMAINS = ["Finance", "Banking", "Retail", "HR", "Education", "Marketing"] as const;

export type ChartType = "bar" | "line" | "area";

export interface ProjectChart {
  type: ChartType;
  xKey: string;
  series: { key: string; name: Localized; color?: string }[];
  data: Record<string, string | number>[];
}

export interface ProjectMetric {
  label: Localized;
  value: string;
  hint?: Localized;
}

export interface Project extends BaseItem {
  title: Localized;
  summary: Localized;
  problem: Localized;
  approach: Localized;
  result: Localized;
  tools: string[];
  domain: string;
  cover: string;
  gallery: string[];
  metrics: ProjectMetric[];
  embedUrl: string;
  github: string;
  demo: string;
  file: string;
  featured: boolean;
  /** 1 – 10, used by the "most impactful" sort. */
  impact: number;
  /** YYYY-MM */
  date: string;
  chart?: ProjectChart | null;
}

export interface Experience extends BaseItem {
  company: string;
  role: Localized;
  location: Localized;
  /** YYYY-MM */
  startDate: string;
  /** YYYY-MM or empty for "present" */
  endDate: string;
  bullets: LocalizedList;
}

export interface Certificate extends BaseItem {
  title: Localized;
  issuer: string;
  /** YYYY-MM */
  date: string;
  credentialId: string;
  verifyUrl: string;
  image: string;
}

export interface Education extends BaseItem {
  school: Localized;
  degree: Localized;
  field: Localized;
  startDate: string;
  endDate: string;
  description: Localized;
}

export interface Testimonial extends BaseItem {
  name: string;
  role: Localized;
  company: string;
  quote: Localized;
  avatar: string;
  rating: number;
}

export interface BlogPost extends BaseItem {
  title: Localized;
  slug: string;
  excerpt: Localized;
  content: Localized;
  cover: string;
  tags: string[];
  /** YYYY-MM-DD */
  date: string;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: number;
  read: boolean;
  locale?: string;
}

export interface MediaDoc {
  dataUrl: string;
  type: string;
  size: number;
  name: string;
  createdAt: number;
}

export type CollectionName =
  | "skills"
  | "projects"
  | "experience"
  | "certificates"
  | "education"
  | "testimonials"
  | "blog";

export const COLLECTIONS: CollectionName[] = [
  "skills",
  "projects",
  "experience",
  "certificates",
  "education",
  "testimonials",
  "blog",
];

export const DEFAULT_ACCENT = "#0f8b8d";

export const defaultProfile = (): Profile => ({
  name: "",
  titles: emptyLocalizedList(),
  tagline: emptyLocalized(),
  bio: emptyLocalized(),
  location: emptyLocalized(),
  spokenLanguages: emptyLocalizedList(),
  availability: "open",
  photo: "",
  cv: "",
  email: "",
  phone: "",
  telegram: "",
  linkedin: "",
  github: "",
  stats: {},
});

export const defaultSettings = (): SiteSettings => ({
  siteName: "",
  accentColor: DEFAULT_ACCENT,
  defaultLang: "en",
  defaultTheme: "system",
  sections: {
    skills: true,
    projects: true,
    experience: true,
    certificates: true,
    education: true,
    testimonials: true,
    blog: true,
  },
  seoTitle: emptyLocalized(),
  seoDescription: emptyLocalized(),
  favicon: "",
  gaId: "",
  embedAllowlist: [
    "app.powerbi.com",
    "public.tableau.com",
    "lookerstudio.google.com",
    "datastudio.google.com",
    "docs.google.com",
  ],
});
