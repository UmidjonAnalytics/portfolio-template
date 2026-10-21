import type { IntakeData } from "./types";

/** Field path → message. Paths look like "fullName" or "projects.2.title". */
export type IntakeErrors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOMAIN_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const URL_RE = /^https?:\/\/\S+\.\S+/i;

export function isValidDomain(name: string): boolean {
  return DOMAIN_RE.test(name) && !name.includes("--");
}

export function isGmail(email: string): boolean {
  return /@(gmail|googlemail)\.com$/i.test(email.trim());
}

function digits(s: string): number {
  return s.replace(/\D/g, "").length;
}

function url(errors: IntakeErrors, key: string, value: string) {
  if (value.trim() && !URL_RE.test(value.trim())) errors[key] = "Havola https:// bilan boshlanishi kerak";
}

export function validateStep(step: number, d: IntakeData): IntakeErrors {
  const e: IntakeErrors = {};
  switch (step) {
    case 1:
      if (d.fullName.trim().length < 3) e.fullName = "Ism-familiyangizni yozing";
      if (!EMAIL_RE.test(d.gmail.trim())) e.gmail = "To‘g‘ri Gmail manzilini yozing";
      if (digits(d.phone) < 9) e.phone = "Telefon raqamingizni to‘liq yozing";
      break;
    case 2: {
      const domains = d.domains.map((x) => x.trim()).filter(Boolean);
      if (domains.length === 0) e["domains.0"] = "Kamida bitta domen nomini yozing";
      d.domains.forEach((x, i) => {
        if (x.trim() && !isValidDomain(x.trim())) e[`domains.${i}`] = "Faqat kichik lotin harflari, raqamlar va chiziqcha (-)";
      });
      if (d.siteLanguages.length === 0) e.siteLanguages = "Kamida bitta tilni tanlang";
      if (!d.siteLanguages.includes(d.contentLang)) e.contentLang = "Bu til saytda yoqilgan bo‘lishi kerak";
      break;
    }
    case 3:
      if (!d.titles.some((t) => t.trim())) e["titles.0"] = "Kamida bitta lavozim yozing";
      if (d.tagline.trim().length < 10) e.tagline = "Kamida 10 ta belgi yozing";
      if (d.tagline.trim().length > 160) e.tagline = "160 ta belgidan oshmasin";
      if (d.bio.trim().length < 100) e.bio = `Kamida 100 ta belgi yozing (hozir ${d.bio.trim().length})`;
      if (!d.city.trim()) e.city = "Shahringizni yozing";
      break;
    case 4:
      if (!d.photo) e.photo = "Rasmingizni yuklang";
      break;
    case 5:
      if (d.skills.length < 3) e.skills = `Kamida 3 ta ko‘nikma tanlang (hozir ${d.skills.length})`;
      break;
    case 6:
      if (d.projects.length === 0) e.projects = "Kamida bitta loyiha qo‘shing";
      d.projects.forEach((p, i) => {
        const k = (f: string) => `projects.${i}.${f}`;
        if (!p.title.trim()) e[k("title")] = "Loyiha nomini yozing";
        if (p.summary.trim().length < 10) e[k("summary")] = "Bir gap bilan loyihani tasvirlang";
        if (!p.domain) e[k("domain")] = "Sohani tanlang";
        if (p.tools.length === 0) e[k("tools")] = "Kamida bitta vositani tanlang";
        if (p.problem.trim().length < 30) e[k("problem")] = "Muammoni batafsilroq yozing (kamida 30 ta belgi)";
        if (p.approach.trim().length < 30) e[k("approach")] = "Nima qilganingizni batafsilroq yozing (kamida 30 ta belgi)";
        if (p.result.trim().length < 20) e[k("result")] = "Natijani yozing (kamida 20 ta belgi)";
        if (p.images.length === 0) e[k("images")] = "Kamida bitta skrinshot yuklang";
        url(e, k("github"), p.github);
        url(e, k("link"), p.link);
      });
      break;
    case 7:
      d.experience.forEach((x, i) => {
        if (!x.company.trim()) e[`experience.${i}.company`] = "Kompaniya nomini yozing";
        if (!x.role.trim()) e[`experience.${i}.role`] = "Lavozimni yozing";
        if (!x.start) e[`experience.${i}.start`] = "Boshlangan oyni tanlang";
        if (!x.current && !x.end) e[`experience.${i}.end`] = "Tugagan oyni tanlang yoki «Hozir shu yerda ishlayman»ni belgilang";
      });
      d.certificates.forEach((x, i) => {
        if (!x.title.trim()) e[`certificates.${i}.title`] = "Sertifikat nomini yozing";
        if (!x.issuer.trim()) e[`certificates.${i}.issuer`] = "Kim berganini yozing";
        url(e, `certificates.${i}.verifyUrl`, x.verifyUrl);
      });
      d.education.forEach((x, i) => {
        if (!x.school.trim()) e[`education.${i}.school`] = "O‘quv muassasasini yozing";
      });
      d.testimonials.forEach((x, i) => {
        if (!x.name.trim()) e[`testimonials.${i}.name`] = "Ismini yozing";
        if (x.quote.trim().length < 15) e[`testimonials.${i}.quote`] = "Fikrni yozing";
      });
      break;
    case 8:
      if (d.siteEmail.trim() && !EMAIL_RE.test(d.siteEmail.trim())) e.siteEmail = "To‘g‘ri email yozing";
      url(e, "linkedin", d.linkedin);
      url(e, "github", d.github);
      url(e, "exampleSite", d.exampleSite);
      if (!/^#[0-9a-f]{6}$/i.test(d.accentColor)) e.accentColor = "Rangni tanlang";
      break;
    case 9:
      if (!d.confirmTruth) e.confirmTruth = "Iltimos, tasdiqlang";
      if (!d.confirmNoGuarantee) e.confirmNoGuarantee = "Iltimos, tasdiqlang";
      break;
  }
  return e;
}

/** Validate every step; returns the first step with errors, or 0 when all pass. */
export function firstInvalidStep(d: IntakeData, upTo = 9): number {
  for (let s = 1; s <= upTo; s++) if (Object.keys(validateStep(s, d)).length) return s;
  return 0;
}
