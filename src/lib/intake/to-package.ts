"use client";

import { PACKAGE_FORMAT, PACKAGE_VERSION, type SitePackage } from "../site-package";
import { defaultProfile, LANGS, type Lang, type Localized, type LocalizedList } from "../types";
import { SKILL_CATALOG } from "./catalog";
import { downloadIntakeFile } from "./files";
import type { IntakeData, IntakeFileRef, OrderCode } from "./types";
import { defaultDesign, normalizeDesign } from "@/lib/design";

const ref = (f: IntakeFileRef | null | undefined) => (f ? `file:${f.id}` : "");

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Plain text with blank lines between paragraphs → the rich-text HTML the site renders. */
function textToHtml(text: string): string {
  return text
    .trim()
    .split(/\n\s*\n/)
    .map((p) => `<p>${escapeHtml(p.trim()).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function lines(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.replace(/^[-•*\s]+/, "").trim())
    .filter(Boolean);
}

function urlOrEmpty(value: string): string {
  const v = value.trim();
  return /^https?:\/\//i.test(v) ? v : "";
}

/** Collect every file the package needs, keyed by intake file id. */
function fileRefs(d: IntakeData): IntakeFileRef[] {
  const all: (IntakeFileRef | null)[] = [d.photo, d.cv, ...d.projects.flatMap((p) => p.images), ...d.certificates.map((c) => c.image)];
  return all.filter((f): f is IntakeFileRef => !!f);
}

/** Admin only: build the site package for a submitted form. Downloads every file. */
export async function buildSitePackage(d: IntakeData, order: OrderCode | null, onProgress?: (done: number, total: number) => void): Promise<SitePackage> {
  const lang: Lang = d.contentLang;
  const L = (text: string): Localized => ({ en: "", ru: "", uz: "", [lang]: text.trim() });
  const LL = (items: string[]): LocalizedList => ({ en: [], ru: [], uz: [], [lang]: items.map((x) => x.trim()).filter(Boolean) });

  const refs = fileRefs(d);
  const files: SitePackage["files"] = {};
  let done = 0;
  for (const f of refs) {
    const file = await downloadIntakeFile(f.id);
    files[f.id] = { name: file.name, type: file.type, dataUrl: file.dataUrl };
    onProgress?.(++done, refs.length);
  }

  const titles = d.titles.map((t) => t.trim()).filter(Boolean);
  const toolSkills = d.skills.filter((s) => s.category !== "soft").length;

  const profile = {
    ...defaultProfile(),
    name: d.fullName.trim(),
    titles: LL(titles),
    tagline: L(d.tagline),
    bio: L(textToHtml(d.bio)),
    location: L(d.city),
    spokenLanguages: LL(d.spokenLanguages.split(/[,\n]/)),
    availability: d.availability,
    photo: ref(d.photo),
    cv: ref(d.cv),
    email: (d.siteEmail || d.gmail).trim(),
    phone: d.showPhone ? d.phone.trim() : "",
    telegram: d.telegram.trim().replace(/^@/, ""),
    linkedin: urlOrEmpty(d.linkedin),
    github: urlOrEmpty(d.github),
    stats: { projects: null, yearsExperience: null, tools: toolSkills >= 3 ? toolSkills : null, studentsTaught: null },
  };

  const siteLanguages = LANGS.filter((l) => d.siteLanguages.includes(l));
  const settings = {
    siteName: d.fullName.trim(),
    languages: siteLanguages,
    defaultLang: siteLanguages.includes(d.defaultLang) ? d.defaultLang : siteLanguages[0],
    defaultTheme: d.defaultTheme,
    accentColor: d.accentColor,
    design: { ...defaultDesign(), style: normalizeDesign({ style: d.siteStyle }).style },
    seoTitle: L(titles[0] ? `${d.fullName.trim()} — ${titles[0]}` : d.fullName.trim()),
    seoDescription: L(d.tagline),
  };

  const skills = d.skills.map((s, i) => {
    const catalog = SKILL_CATALOG.find((c) => c.key === s.key);
    return { name: catalog ? catalog.name : L(s.name), icon: s.icon, category: s.category, level: s.level, published: true, order: i };
  });

  // Featured project first, then the order the customer entered them in.
  const ordered = [...d.projects].sort((a, b) => Number(b.id === d.featuredProjectId) - Number(a.id === d.featuredProjectId));
  const projects = ordered.map((p, i) => ({
    title: L(p.title),
    summary: L(p.summary),
    problem: L(p.problem),
    approach: L(p.approach),
    result: L(p.result),
    tools: p.tools,
    domain: p.domain === "Other" ? "" : p.domain,
    cover: ref(p.images[0]),
    gallery: p.images.slice(1).map(ref),
    metrics: p.metrics.filter((m) => m.value.trim() || m.label.trim()).map((m) => ({ value: m.value.trim(), label: L(m.label), hint: L("") })),
    embedUrl: "",
    github: urlOrEmpty(p.github),
    demo: urlOrEmpty(p.link),
    file: "",
    featured: p.id === d.featuredProjectId,
    impact: Math.max(1, 10 - i),
    date: p.date,
    chart: null,
    published: true,
    order: i,
  }));

  const experience = d.experience.map((x, i) => ({
    company: x.company.trim(),
    role: L(x.role),
    location: L(x.city),
    startDate: x.start,
    endDate: x.current ? "" : x.end,
    bullets: LL(lines(x.achievements)),
    published: true,
    order: i,
  }));

  const certificates = d.certificates.map((x, i) => ({
    title: L(x.title),
    issuer: x.issuer.trim(),
    date: x.date,
    credentialId: x.credentialId.trim(),
    verifyUrl: urlOrEmpty(x.verifyUrl),
    image: ref(x.image),
    published: true,
    order: i,
  }));

  const education = d.education.map((x, i) => ({
    school: L(x.school),
    degree: L(x.degree),
    field: L(x.field),
    startDate: x.start,
    endDate: x.end,
    description: L(""),
    published: true,
    order: i,
  }));

  const testimonials = d.testimonials.map((x, i) => ({
    name: x.name.trim(),
    role: L(x.role),
    company: x.company.trim(),
    quote: L(x.quote),
    avatar: "",
    rating: 5,
    published: true,
    order: i,
  }));

  return {
    format: PACKAGE_FORMAT,
    version: PACKAGE_VERSION,
    createdAt: Date.now(),
    source: {
      code: d.code,
      fullName: d.fullName,
      gmail: d.gmail,
      phone: d.phone,
      telegram: d.telegram,
      domains: d.domains.filter(Boolean),
      isStudent: order?.isStudent ?? false,
      exampleSite: d.exampleSite,
      notes: d.notes,
      submittedAt: d.submittedAt,
    },
    profile,
    settings,
    skills,
    projects,
    experience,
    certificates,
    education,
    testimonials,
    files,
  };
}
