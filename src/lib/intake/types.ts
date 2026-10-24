// ---------------------------------------------------------------------------
// Intake form ("anketa") data model.
//
// A customer pays, gets a personal link /forma?kod=XXXXXXXX, and fills the form.
// Answers are saved as they type into `intake/{code}`; uploaded files go to
// `intakeFiles/{id}` (split into chunks). The owner reviews submissions in
// /admin/buyurtmalar and exports them as a site package that the customer's own
// site imports in one click (Settings → Danger zone).
// ---------------------------------------------------------------------------

import type { Availability, Lang, SkillCategory, Theme } from "../types";
import type { StyleKey } from "@/lib/design";

/** Order code issued by the owner after payment. Document id = the code itself. */
export interface OrderCode {
  code: string;
  /** Customer name or note, for the owner. */
  label: string;
  /** The owner's own students get the 1:1 video call bonus. */
  isStudent: boolean;
  /** Owner's workflow stage, independent from the form status. */
  stage: "new" | "building" | "done";
  createdAt: number;
}

/** A file the customer uploaded. The bytes live in `intakeFiles/{id}`. */
export interface IntakeFileRef {
  id: string;
  name: string;
  type: string;
  size: number;
  /** Tiny preview (data URL) for images, so the form can show it without reading the file back. */
  thumb?: string;
}

export interface IntakeSkill {
  /** Catalogue id, or "custom-…" for skills the customer typed. */
  key: string;
  name: string;
  icon: string;
  category: SkillCategory;
  level: number;
}

export interface IntakeMetric {
  value: string;
  label: string;
}

export interface IntakeProject {
  id: string;
  title: string;
  summary: string;
  domain: string;
  date: string;
  tools: string[];
  problem: string;
  approach: string;
  result: string;
  metrics: IntakeMetric[];
  images: IntakeFileRef[];
  github: string;
  link: string;
}

export interface IntakeExperience {
  id: string;
  company: string;
  role: string;
  city: string;
  start: string;
  end: string;
  current: boolean;
  achievements: string;
}

export interface IntakeCertificate {
  id: string;
  title: string;
  issuer: string;
  date: string;
  credentialId: string;
  verifyUrl: string;
  image: IntakeFileRef | null;
}

export interface IntakeEducation {
  id: string;
  school: string;
  degree: string;
  field: string;
  start: string;
  end: string;
}

export interface IntakeTestimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  quote: string;
}

export interface IntakeData {
  code: string;
  status: "draft" | "submitted";
  /** Furthest step reached, so the owner can see progress. */
  step: number;
  updatedAt: number;
  submittedAt?: number;

  // 1. About you (for the owner)
  fullName: string;
  gmail: string;
  phone: string;
  telegram: string;

  // 2. Domain and languages
  domains: string[];
  siteLanguages: Lang[];
  defaultLang: Lang;
  contentLang: Lang;

  // 3. Profile
  titles: string[];
  tagline: string;
  bio: string;
  city: string;
  spokenLanguages: string;
  availability: Availability;

  // 4. Photo and CV
  photo: IntakeFileRef | null;
  cv: IntakeFileRef | null;

  // 5. Skills
  skills: IntakeSkill[];

  // 6. Projects
  projects: IntakeProject[];
  featuredProjectId: string;

  // 7. Optional sections
  experience: IntakeExperience[];
  certificates: IntakeCertificate[];
  education: IntakeEducation[];
  testimonials: IntakeTestimonial[];

  // 8. Contacts on the site, design
  siteEmail: string;
  showPhone: boolean;
  linkedin: string;
  github: string;
  /** Site style (lib/design.ts). */
  siteStyle: StyleKey;
  accentColor: string;
  defaultTheme: Exclude<Theme, "system">;
  exampleSite: string;
  notes: string;

  // 9. Confirmation
  confirmNoGuarantee: boolean;
}

export const INTAKE_STEPS = 9;

/**
 * Code of the sample form at /forma?namuna=1: the real form for people to look at before buying.
 * Six characters, so it can never match a real eight-character order code. Nothing is saved.
 */
export const SAMPLE_CODE = "NAMUNA";

export function emptyIntake(code: string): IntakeData {
  return {
    code,
    status: "draft",
    step: 1,
    updatedAt: Date.now(),
    fullName: "",
    gmail: "",
    phone: "",
    telegram: "",
    domains: ["", "", ""],
    siteLanguages: ["uz", "ru", "en"],
    defaultLang: "uz",
    contentLang: "uz",
    titles: ["", "", ""],
    tagline: "",
    bio: "",
    city: "",
    spokenLanguages: "",
    availability: "open",
    photo: null,
    cv: null,
    skills: [],
    projects: [],
    featuredProjectId: "",
    experience: [],
    certificates: [],
    education: [],
    testimonials: [],
    siteEmail: "",
    showPhone: true,
    linkedin: "",
    github: "",
    siteStyle: "classic",
    accentColor: "#0f8b8d",
    defaultTheme: "dark",
    exampleSite: "",
    notes: "",
    confirmNoGuarantee: false,
  };
}

/** Fill any fields missing from an older saved draft. */
export function mergeIntake(code: string, data: Partial<IntakeData> | undefined | null): IntakeData {
  return { ...emptyIntake(code), ...(data ?? {}), code };
}

export function intakeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_INTAKE_ENABLED === "true" || intakeOnly();
}

/** A deployment that exists only for orders: no public portfolio, admin shows only Buyurtmalar. */
export function intakeOnly(): boolean {
  return process.env.NEXT_PUBLIC_INTAKE_ONLY === "true";
}

/** Unambiguous alphabet: no 0/O, 1/I/L. 31^8 ≈ 8.5e11 possible codes. */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateCode(length = 8): string {
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

export function normalizeCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
}

export function localId(): string {
  return Math.random().toString(36).slice(2, 10);
}
