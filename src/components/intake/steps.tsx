"use client";

import { Check, Pencil, Star, X } from "lucide-react";
import { useState } from "react";
import { ACCENT_PRESETS, LANG_LABELS, STYLE_LABELS, PROJECT_DOMAIN_OPTIONS, PROJECT_TOOL_OPTIONS, SKILL_CATALOG, SKILL_CATEGORY_LABELS, SKILL_LEVELS } from "@/lib/intake/catalog";
import type { IntakeCertificate, IntakeData, IntakeEducation, IntakeExperience, IntakeProject, IntakeSkill, IntakeTestimonial } from "@/lib/intake/types";
import { localId } from "@/lib/intake/types";
import { isGmail, type IntakeErrors } from "@/lib/intake/validate";
import { STYLES, styleMeta } from "@/lib/design";
import { LANGS, SKILL_CATEGORIES, type Lang, type SkillCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AddButton, Area, Card, Check2, Chips, Choice, FileSlot, ImageList, inputCls, Q, Text, Tip } from "./ui";

export type Update = (fn: (d: IntakeData) => IntakeData) => void;

export interface StepProps {
  d: IntakeData;
  update: Update;
  errors: IntakeErrors;
  code: string;
}

export const STEP_TITLES = [
  "Siz haqingizda",
  "Domen va tillar",
  "Profil",
  "Rasm va rezyume",
  "Ko‘nikmalar",
  "Loyihalar",
  "Tajriba va sertifikatlar",
  "Aloqa va dizayn",
  "Tekshirish",
];

type ListKey = "projects" | "experience" | "certificates" | "education" | "testimonials";
type ItemOf<K extends ListKey> = IntakeData[K][number];

function useHelpers(update: Update) {
  const set = (patch: Partial<IntakeData>) => update((d) => ({ ...d, ...patch }));
  const setItem = <K extends ListKey>(key: K, id: string, fn: (item: ItemOf<K>) => ItemOf<K>) =>
    update((d) => ({ ...d, [key]: (d[key] as ItemOf<K>[]).map((x) => (x.id === id ? fn(x) : x)) }));
  const addItem = <K extends ListKey>(key: K, item: ItemOf<K>) => update((d) => ({ ...d, [key]: [...(d[key] as ItemOf<K>[]), item] }));
  const removeItem = (key: ListKey, id: string) => update((d) => ({ ...d, [key]: (d[key] as { id: string }[]).filter((x) => x.id !== id) }));
  return { set, setItem, addItem, removeItem };
}

// ---------------------------------------------------------------------------
// 1. About you
// ---------------------------------------------------------------------------

export function StepAbout({ d, update, errors }: StepProps) {
  const { set } = useHelpers(update);
  return (
    <div className="space-y-6">
      <Tip title="Qanday to‘ldiriladi">
        Anketa 9 bosqichdan iborat va taxminan 30–40 daqiqa oladi. Javoblaringiz avtomatik saqlanadi: istalgan vaqtda to‘xtab, shu havola
        orqali boshqa qurilmadan ham davom ettirishingiz mumkin.
      </Tip>
      <Q label="Ism va familiyangiz" htmlFor="fullName" field="fullName" error={errors.fullName} hint="Saytda aynan shunday yoziladi.">
        <Text id="fullName" value={d.fullName} onChange={(fullName) => set({ fullName })} placeholder="Masalan: Jasur Karimov" autoComplete="name" maxLength={80} error={!!errors.fullName} />
      </Q>
      <Q
        label="Gmail manzilingiz"
        htmlFor="gmail"
        field="gmail"
        error={errors.gmail}
        hint={
          d.gmail.trim() && !isGmail(d.gmail) && !errors.gmail
            ? "Bu Gmail manzili emas. Saytni boshqarish uchun Google hisobi kerak — bu manzil Google hisobiga bog‘langanini tekshiring."
            : "Saytni shu Google hisobi orqali boshqarasiz. Parolingizni hech kimga, jumladan menga ham bermang."
        }
      >
        <Text id="gmail" type="email" inputMode="email" value={d.gmail} onChange={(gmail) => set({ gmail: gmail.trim() })} placeholder="ismingiz@gmail.com" autoComplete="email" error={!!errors.gmail} />
      </Q>
      <Q label="Telefon raqamingiz" htmlFor="phone" field="phone" error={errors.phone} hint="Siz bilan bog‘lanishim uchun. Saytda ko‘rsatish-ko‘rsatmaslikni 8-bosqichda tanlaysiz.">
        <Text id="phone" type="tel" inputMode="tel" value={d.phone} onChange={(phone) => set({ phone })} placeholder="+998 90 123 45 67" autoComplete="tel" error={!!errors.phone} />
      </Q>
      <Q label="Telegram" htmlFor="telegram" optional hint="Saytdagi Telegram tugmasi ham shu nomga ochiladi.">
        <Text id="telegram" value={d.telegram} onChange={(telegram) => set({ telegram: telegram.replace(/\s/g, "") })} placeholder="@username" />
      </Q>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Domain and languages
// ---------------------------------------------------------------------------

function translit(s: string): string {
  return s
    .toLowerCase()
    .replace(/[‘’'`ʻʼ]/g, "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim();
}

function domainSuggestions(fullName: string): string[] {
  const parts = translit(fullName).split(/\s+/).filter(Boolean);
  if (parts.length === 0) return [];
  const [first, last] = [parts[0], parts[1] ?? ""];
  const out = new Set<string>();
  if (last) {
    out.add(`${first}${last}`);
    out.add(`${first}-${last}`);
    out.add(`${last}${first}`);
  }
  out.add(`${first}-analyst`);
  out.add(`${first}data`);
  return [...out].filter((x) => x.length >= 3 && x.length <= 63);
}

export function StepDomain({ d, update, errors }: StepProps) {
  const { set } = useHelpers(update);
  const suggestions = domainSuggestions(d.fullName).filter((s) => !d.domains.includes(s));

  const setLangs = (siteLanguages: Lang[]) => {
    const ordered = LANGS.filter((l) => siteLanguages.includes(l));
    update((x) => ({
      ...x,
      siteLanguages: ordered,
      defaultLang: ordered.includes(x.defaultLang) ? x.defaultLang : (ordered[0] ?? "uz"),
      contentLang: ordered.includes(x.contentLang) ? x.contentLang : (ordered[0] ?? "uz"),
    }));
  };
  const langOptions = (["uz", "ru", "en"] as Lang[]).map((l) => ({ value: l, label: LANG_LABELS[l] }));
  const chosen = langOptions.filter((o) => d.siteLanguages.includes(o.value));

  return (
    <div className="space-y-7">
      <Q label="Domen nomi — 3 ta variant" field="domains.0" error={errors["domains.0"]} hint="Birinchisi band bo‘lsa, keyingisi olinadi. Qisqa, oson yoziladigan va ismingizga o‘xshash nom tanlang.">
        <div className="space-y-2">
          {d.domains.map((v, i) => (
            <div key={i} data-field={`domains.${i}`}>
              <Text
                id={`domain-${i}`}
                value={v}
                onChange={(val) => update((x) => ({ ...x, domains: x.domains.map((y, j) => (j === i ? val.toLowerCase().replace(/\s/g, "").replace(/\.uz$/, "") : y)) }))}
                placeholder={["ismfamiliya", "ism-familiya", "ism-analyst"][i]}
                prefix={`${i + 1}.`}
                suffix=".uz"
                maxLength={63}
                error={!!errors[`domains.${i}`]}
              />
              {errors[`domains.${i}`] && i > 0 && <p className="mt-1 text-sm text-danger font-medium">{errors[`domains.${i}`]}</p>}
            </div>
          ))}
        </div>
      </Q>
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted">Takliflar — bosib qo‘shing:</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() =>
                  update((x) => {
                    const slot = x.domains.findIndex((y) => !y.trim());
                    if (slot === -1) return x;
                    return { ...x, domains: x.domains.map((y, j) => (j === slot ? s : y)) };
                  })
                }
                className="min-h-10 px-3.5 rounded-full border border-line bg-surface text-sm font-semibold hover:border-accent hover:text-accent-strong transition"
              >
                {s}.uz
              </button>
            ))}
          </div>
        </div>
      )}

      <Q label="Sayt qaysi tillarda bo‘lsin?" field="siteLanguages" error={errors.siteLanguages} hint="Tanlanmagan til saytda umuman ko‘rinmaydi. Bitta til tanlasangiz, til almashtirish tugmasi ham bo‘lmaydi.">
        <Chips options={langOptions} value={d.siteLanguages} onChange={(v) => setLangs(v as Lang[])} />
      </Q>

      {chosen.length > 1 && (
        <Q label="Sayt qaysi tilda ochilsin?" hint="Tashrif buyuruvchi saytga birinchi kirganda shu til ko‘rinadi.">
          <Choice name="defaultLang" options={chosen} value={d.defaultLang} onChange={(defaultLang) => set({ defaultLang })} />
        </Q>
      )}

      {chosen.length > 0 && (
        <Q label="Matnlarni qaysi tilda yozasiz?" field="contentLang" error={errors.contentLang}>
          <Choice name="contentLang" options={chosen} value={d.contentLang} onChange={(contentLang) => set({ contentLang })} />
        </Q>
      )}

      {chosen.length > 1 && (
        <Tip title="Tillar haqida">
          Saytning tugmalari, menyulari va sarlavhalari tanlangan barcha tillarda tayyor. Sizning matnlaringiz esa qaysi tilda yozsangiz, o‘sha tilda
          joylashtiriladi — tarjima xizmatga kirmaydi. Boshqa tildagi variantini keyin admin panelda o‘zingiz qo‘shishingiz mumkin.
        </Tip>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Profile
// ---------------------------------------------------------------------------

export function StepProfile({ d, update, errors }: StepProps) {
  const { set } = useHelpers(update);
  return (
    <div className="space-y-7">
      <Q label="Lavozim yoki kasbingiz — 1 dan 3 tagacha" field="titles.0" error={errors["titles.0"]} hint="Saytning bosh qismida navbatma-navbat yozilib turadi.">
        <div className="space-y-2">
          {d.titles.map((v, i) => (
            <Text
              key={i}
              id={`title-${i}`}
              value={v}
              onChange={(val) => update((x) => ({ ...x, titles: x.titles.map((y, j) => (j === i ? val : y)) }))}
              placeholder={["Data Analyst", "Power BI Developer", "SQL mutaxassisi"][i]}
              maxLength={60}
              error={i === 0 && !!errors["titles.0"]}
            />
          ))}
        </div>
      </Q>

      <Q label="Bir gap bilan o‘zingiz haqingizda" htmlFor="tagline" field="tagline" error={errors.tagline} hint="Masalan: «Tartibsiz jadvallarni aniq qarorlarga aylantiraman.»">
        <Text id="tagline" value={d.tagline} onChange={(tagline) => set({ tagline })} placeholder="Ma’lumotlarni tushunarli dashbordlarga aylantiraman." maxLength={160} error={!!errors.tagline} />
      </Q>

      <div className="space-y-3">
        <Tip title="Tarjimai holni qanday yozish kerak">
          3 ta qisqa xatboshi yozing, oralarida bo‘sh qator qoldiring:
          <br />1) Kimsiz, qayerda ishlaysiz yoki o‘qiysiz.
          <br />2) Qaysi vositalar bilan, qanday vazifalarni bajarasiz.
          <br />3) Sizga nima yoqadi va qanday ish yoki loyiha qidiryapsiz.
        </Tip>
        <Q label="Tarjimai hol" htmlFor="bio" field="bio" error={errors.bio}>
          <Area
            id="bio"
            value={d.bio}
            onChange={(bio) => set({ bio })}
            rows={8}
            counter={100}
            error={!!errors.bio}
            placeholder={"Men Toshkentda yashovchi ma’lumotlar tahlilchisiman…\n\nExcel, SQL va Power BI bilan hisobotlar tayyorlayman…\n\nHozir chakana savdo yoki bank sohasida ish qidiryapman…"}
          />
        </Q>
      </div>

      <Q label="Shahringiz" htmlFor="city" field="city" error={errors.city}>
        <Text id="city" value={d.city} onChange={(city) => set({ city })} placeholder="Toshkent, O‘zbekiston" maxLength={80} error={!!errors.city} />
      </Q>

      <Q label="Qaysi tillarni bilasiz?" htmlFor="spoken" optional hint="Vergul bilan ajrating va darajasini yozing.">
        <Text id="spoken" value={d.spokenLanguages} onChange={(spokenLanguages) => set({ spokenLanguages })} placeholder="O‘zbek (ona tili), Rus (erkin), Ingliz (B2)" maxLength={200} />
      </Q>

      <Q label="Hozirgi holatingiz">
        <Choice
          name="availability"
          value={d.availability}
          onChange={(availability) => set({ availability })}
          options={[
            { value: "open", label: "Ish qidiryapman", description: "Saytda yashil «Ishga tayyorman» belgisi chiqadi." },
            { value: "freelance", label: "Frilans buyurtmalar olaman", description: "«Frilans uchun ochiq» belgisi chiqadi." },
            { value: "unavailable", label: "Hozircha band", description: "Ish qidirmayotganingizni bildiradi." },
          ]}
        />
      </Q>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. Photo and CV
// ---------------------------------------------------------------------------

export function StepPhoto({ d, update, errors, code }: StepProps) {
  const { set } = useHelpers(update);
  return (
    <div className="space-y-7">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="font-bold text-success">To‘g‘ri rasm</p>
          <ul className="mt-2 space-y-1.5 text-sm text-fg-2">
            {["Yaqinda tushgan", "Vertikal (tik), yelkadan yuqori", "Yuz aniq, kameraga qarab", "Kunduzi, deraza oldida", "Oddiy, bir rangli fon", "Boshqa odam olgan rasm"].map((x) => (
              <li key={x} className="flex gap-2">
                <Check className="h-4 w-4 shrink-0 text-success mt-0.5" aria-hidden="true" />
                {x}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="font-bold text-danger">To‘g‘ri kelmaydi</p>
          <ul className="mt-2 space-y-1.5 text-sm text-fg-2">
            {["Selfi", "Guruh rasmidan kesilgan", "Quyosh ko‘zoynagi, bosh kiyim", "Filtr va stikerlar", "Qorong‘i yoki xira rasm", "Skrinshot yoki 3×4 rasm surati"].map((x) => (
              <li key={x} className="flex gap-2">
                <X className="h-4 w-4 shrink-0 text-danger mt-0.5" aria-hidden="true" />
                {x}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Q label="Rasmingiz" field="photo" error={errors.photo}>
        <FileSlot code={code} kind="image" value={d.photo} onChange={(photo) => set({ photo })} maxDimension={1400} emptyText="Rasmni tanlang yoki shu yerga tashlang" />
      </Q>

      <Q label="Rezyume (CV)" optional hint="Saytdagi «Rezyumeni yuklab olish» tugmasi uchun. Yuklamasangiz, tugma ko‘rinmaydi.">
        <FileSlot code={code} kind="pdf" value={d.cv} onChange={(cv) => set({ cv })} emptyText="PDF faylni tanlang" />
      </Q>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. Skills
// ---------------------------------------------------------------------------

export function StepSkills({ d, update, errors }: StepProps) {
  const [custom, setCustom] = useState("");
  const [customCat, setCustomCat] = useState<SkillCategory>("bi");
  const has = (key: string) => d.skills.some((s) => s.key === key);

  const toggle = (key: string) =>
    update((x) => {
      if (x.skills.some((s) => s.key === key)) return { ...x, skills: x.skills.filter((s) => s.key !== key) };
      const c = SKILL_CATALOG.find((s) => s.key === key);
      if (!c) return x;
      const skill: IntakeSkill = { key, name: c.name.uz ?? c.name.en, icon: c.icon, category: c.category, level: 60 };
      return { ...x, skills: [...x.skills, skill] };
    });
  const setLevel = (key: string, level: number) => update((x) => ({ ...x, skills: x.skills.map((s) => (s.key === key ? { ...s, level } : s)) }));
  const addCustom = () => {
    const name = custom.trim();
    if (!name) return;
    update((x) => ({ ...x, skills: [...x.skills, { key: `custom-${localId()}`, name, icon: "⭐", category: customCat, level: 60 }] }));
    setCustom("");
  };

  return (
    <div className="space-y-7">
      <p className="text-fg-2">Biladigan vositalaringizni belgilang, keyin har biriga daraja qo‘ying. Kamida 3 ta.</p>
      {SKILL_CATEGORIES.map((cat) => (
        <Q key={cat} label={SKILL_CATEGORY_LABELS[cat]}>
          <div className="flex flex-wrap gap-2">
            {SKILL_CATALOG.filter((s) => s.category === cat).map((s) => {
              const on = has(s.key);
              return (
                <button
                  key={s.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(s.key)}
                  className={cn(
                    "min-h-11 px-3.5 rounded-full border text-[15px] font-semibold inline-flex items-center gap-1.5 transition",
                    on ? "bg-accent text-accent-fg border-accent" : "bg-surface border-line text-fg-2 hover:border-line-strong",
                  )}
                >
                  <span aria-hidden="true">{s.icon}</span>
                  {s.name.uz}
                </button>
              );
            })}
          </div>
        </Q>
      ))}

      <Q label="Ro‘yxatda yo‘q ko‘nikma" optional>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder="Masalan: Airflow"
            maxLength={40}
            className={cn(inputCls, "border-line flex-1")}
            aria-label="Ko‘nikma nomi"
          />
          <select value={customCat} onChange={(e) => setCustomCat(e.target.value as SkillCategory)} className={cn(inputCls, "border-line sm:w-56")} aria-label="Toifa">
            {SKILL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {SKILL_CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
          <button type="button" onClick={addCustom} className="h-[50px] px-5 rounded-2xl bg-fg text-bg font-semibold">
            Qo‘shish
          </button>
        </div>
      </Q>

      <div data-field="skills" className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold">Darajani belgilang</h3>
          <span className={cn("text-sm font-bold tabular-nums", d.skills.length >= 3 ? "text-success" : "text-muted")}>{d.skills.length} ta tanlandi</span>
        </div>
        {errors.skills && (
          <p className="text-sm text-danger font-medium" role="alert">
            {errors.skills}
          </p>
        )}
        {d.skills.length === 0 ? (
          <p className="text-sm text-muted">Yuqoridan ko‘nikmalarni tanlang.</p>
        ) : (
          <ul className="space-y-2">
            {d.skills.map((s) => (
              <li key={s.key} className="rounded-2xl border border-line bg-surface p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">
                    <span aria-hidden="true">{s.icon}</span> {s.name}
                  </span>
                  <button type="button" onClick={() => update((x) => ({ ...x, skills: x.skills.filter((y) => y.key !== s.key) }))} aria-label={`${s.name} — olib tashlash`} className="h-8 w-8 inline-flex items-center justify-center rounded-full text-muted hover:text-danger">
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-1.5" role="radiogroup" aria-label={`${s.name} darajasi`}>
                  {SKILL_LEVELS.map((lv) => (
                    <button
                      key={lv.value}
                      type="button"
                      role="radio"
                      aria-checked={s.level === lv.value}
                      onClick={() => setLevel(s.key, lv.value)}
                      className={cn("h-10 rounded-xl text-xs sm:text-sm font-semibold border transition", s.level === lv.value ? "bg-accent text-accent-fg border-accent" : "border-line text-fg-2 hover:bg-surface-2")}
                    >
                      {lv.label}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6. Projects
// ---------------------------------------------------------------------------

const newProject = (): IntakeProject => ({
  id: localId(),
  title: "",
  summary: "",
  domain: "",
  date: "",
  tools: [],
  problem: "",
  approach: "",
  result: "",
  metrics: [
    { value: "", label: "" },
    { value: "", label: "" },
    { value: "", label: "" },
  ],
  images: [],
  github: "",
  link: "",
});

export function StepProjects({ d, update, errors, code }: StepProps) {
  const { setItem, addItem, removeItem, set } = useHelpers(update);
  const e = (i: number, f: string) => errors[`projects.${i}.${f}`];
  const toolOptions = PROJECT_TOOL_OPTIONS.map((t) => ({ value: t, label: t }));

  return (
    <div className="space-y-6">
      <Tip title="Yaxshi loyiha qanday yoziladi">
        Loyiha — siz hal qilgan bitta muammo. O‘quv kursidagi loyiha ham bo‘ladi. Har biriga 10–15 daqiqa ajrating va iloji boricha raqam keltiring: «6 soat → 15
        daqiqa», «xatolar 30% kamaydi». Boshlanishiga 3–4 ta loyiha yetarli.
      </Tip>

      {errors.projects && (
        <p className="text-sm text-danger font-medium" role="alert" data-field="projects">
          {errors.projects}
        </p>
      )}

      {d.projects.map((p, i) => (
        <Card key={p.id} title={`${i + 1}-loyiha`} onRemove={() => removeItem("projects", p.id)}>
          <Q label="Loyiha nomi" htmlFor={`p-${p.id}-title`} field={`projects.${i}.title`} error={e(i, "title")}>
            <Text id={`p-${p.id}-title`} value={p.title} onChange={(title) => setItem("projects", p.id, (x) => ({ ...x, title }))} placeholder="Do‘kon savdosi dashbordi" maxLength={90} error={!!e(i, "title")} />
          </Q>
          <Q label="Bir gap bilan qisqacha" htmlFor={`p-${p.id}-summary`} field={`projects.${i}.summary`} error={e(i, "summary")} hint="Loyiha kartochkasida ko‘rinadi.">
            <Text id={`p-${p.id}-summary`} value={p.summary} onChange={(summary) => setItem("projects", p.id, (x) => ({ ...x, summary }))} placeholder="14 ta Excel faylini bitta Power BI hisobotiga aylantirdim." maxLength={160} error={!!e(i, "summary")} />
          </Q>
          <Q label="Soha" field={`projects.${i}.domain`} error={e(i, "domain")}>
            <Chips options={PROJECT_DOMAIN_OPTIONS} value={p.domain ? [p.domain] : []} onChange={(v) => setItem("projects", p.id, (x) => ({ ...x, domain: v.filter((y) => y !== x.domain)[0] ?? "" }))} />
          </Q>
          <Q label="Qaysi vositalar bilan?" field={`projects.${i}.tools`} error={e(i, "tools")}>
            <Chips options={toolOptions} value={p.tools} onChange={(tools) => setItem("projects", p.id, (x) => ({ ...x, tools }))} />
          </Q>
          <Q label="Qachon qilingan?" htmlFor={`p-${p.id}-date`} optional>
            <input id={`p-${p.id}-date`} type="month" value={p.date} onChange={(ev) => setItem("projects", p.id, (x) => ({ ...x, date: ev.target.value }))} className={cn(inputCls, "border-line sm:max-w-xs")} />
          </Q>

          <Q label="Muammo nima edi?" htmlFor={`p-${p.id}-problem`} field={`projects.${i}.problem`} error={e(i, "problem")} hint="Kimda qanday muammo bor edi va nega u muhim edi?">
            <Area id={`p-${p.id}-problem`} value={p.problem} onChange={(problem) => setItem("projects", p.id, (x) => ({ ...x, problem }))} rows={3} error={!!e(i, "problem")} placeholder="Do‘kon har hafta 14 ta alohida Excel faylda hisobot olardi, raqamlar mos kelmasdi va yig‘ilishda vaqt behuda ketardi." />
          </Q>
          <Q label="Siz nima qildingiz?" htmlFor={`p-${p.id}-approach`} field={`projects.${i}.approach`} error={e(i, "approach")} hint="Qaysi vositalar bilan, qanday qadamlar bilan hal qildingiz?">
            <Area id={`p-${p.id}-approach`} value={p.approach} onChange={(approach) => setItem("projects", p.id, (x) => ({ ...x, approach }))} rows={3} error={!!e(i, "approach")} placeholder="Ma’lumotlarni SQL orqali bitta jadvalga yig‘dim, Power BI’da model qurdim va asosiy ko‘rsatkichlar uchun DAX formulalar yozdim." />
          </Q>
          <Q label="Natija qanday bo‘ldi?" htmlFor={`p-${p.id}-result`} field={`projects.${i}.result`} error={e(i, "result")} hint="Iloji bo‘lsa, raqam bilan. Taxminiy bo‘lsa ham bo‘ladi.">
            <Area id={`p-${p.id}-result`} value={p.result} onChange={(result) => setItem("projects", p.id, (x) => ({ ...x, result }))} rows={3} error={!!e(i, "result")} placeholder="Haftalik hisobot vaqti 6 soatdan 15 daqiqaga tushdi, rahbariyat endi bitta raqamga tayanadi." />
          </Q>

          <Q label="Asosiy raqamlar" optional hint="Loyiha kartochkasida katta qilib ko‘rsatiladi. Masalan: «-96%» — «Hisobot vaqti».">
            <div className="space-y-2">
              {p.metrics.map((m, mi) => (
                <div key={mi} className="grid grid-cols-[7.5rem_1fr] gap-2">
                  <input
                    value={m.value}
                    onChange={(ev) => setItem("projects", p.id, (x) => ({ ...x, metrics: x.metrics.map((y, j) => (j === mi ? { ...y, value: ev.target.value } : y)) }))}
                    placeholder={["-96%", "60", "$4.2M"][mi]}
                    maxLength={16}
                    aria-label={`${mi + 1}-raqam`}
                    className={cn(inputCls, "border-line font-mono")}
                  />
                  <input
                    value={m.label}
                    onChange={(ev) => setItem("projects", p.id, (x) => ({ ...x, metrics: x.metrics.map((y, j) => (j === mi ? { ...y, label: ev.target.value } : y)) }))}
                    placeholder={["Hisobot vaqti", "Do‘konlar soni", "Oylik tushum"][mi]}
                    maxLength={40}
                    aria-label={`${mi + 1}-raqam nomi`}
                    className={cn(inputCls, "border-line")}
                  />
                </div>
              ))}
            </div>
          </Q>

          <Q label="Skrinshotlar — 1 dan 3 tagacha" field={`projects.${i}.images`} hint="Dashbord, diagramma yoki jadval. Birinchisi muqova bo‘ladi." error={e(i, "images")}>
            <ImageList
              code={code}
              value={p.images}
              onAdd={(img) => setItem("projects", p.id, (x) => ({ ...x, images: [...x.images, img] }))}
              onRemove={(id) => setItem("projects", p.id, (x) => ({ ...x, images: x.images.filter((y) => y.id !== id) }))}
            />
          </Q>

          <div className="grid gap-4 sm:grid-cols-2">
            <Q label="GitHub havolasi" htmlFor={`p-${p.id}-gh`} optional field={`projects.${i}.github`} error={e(i, "github")}>
              <Text id={`p-${p.id}-gh`} type="url" value={p.github} onChange={(github) => setItem("projects", p.id, (x) => ({ ...x, github }))} placeholder="https://github.com/…" error={!!e(i, "github")} />
            </Q>
            <Q label="Dashbord yoki demo havolasi" htmlFor={`p-${p.id}-link`} optional field={`projects.${i}.link`} error={e(i, "link")}>
              <Text id={`p-${p.id}-link`} type="url" value={p.link} onChange={(link) => setItem("projects", p.id, (x) => ({ ...x, link }))} placeholder="https://…" error={!!e(i, "link")} />
            </Q>
          </div>

          <button
            type="button"
            aria-pressed={d.featuredProjectId === p.id}
            onClick={() => set({ featuredProjectId: d.featuredProjectId === p.id ? "" : p.id })}
            className={cn(
              "w-full min-h-12 rounded-2xl border px-4 inline-flex items-center gap-2 font-semibold transition",
              d.featuredProjectId === p.id ? "border-warning text-warning bg-[color-mix(in_oklab,var(--warning)_12%,transparent)]" : "border-line text-fg-2 hover:bg-surface-2",
            )}
          >
            <Star className={cn("h-5 w-5", d.featuredProjectId === p.id && "fill-current")} aria-hidden="true" />
            {d.featuredProjectId === p.id ? "Eng yaxshi loyiham — saytda birinchi turadi" : "Buni eng yaxshi loyiham deb belgilash"}
          </button>
        </Card>
      ))}

      <AddButton onClick={() => addItem("projects", newProject())} disabled={d.projects.length >= 8}>
        {d.projects.length === 0 ? "Birinchi loyihani qo‘shish" : "Yana loyiha qo‘shish"}
      </AddButton>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 7. Optional sections
// ---------------------------------------------------------------------------

function MonthInput({ id, value, onChange, error }: { id: string; value: string; onChange: (v: string) => void; error?: boolean }) {
  return <input id={id} type="month" value={value} onChange={(e) => onChange(e.target.value)} className={cn(inputCls, error ? "border-danger" : "border-line")} aria-invalid={error || undefined} />;
}

function SectionTitle({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="pt-2">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted">{hint}</p>
    </div>
  );
}

export function StepExtras({ d, update, errors, code }: StepProps) {
  const { setItem, addItem, removeItem } = useHelpers(update);
  const e = (k: string, i: number, f: string) => errors[`${k}.${i}.${f}`];

  return (
    <div className="space-y-7">
      <Tip title="Bu bosqich ixtiyoriy">
        Bo‘lmasa, shunchaki «Keyingi» tugmasini bosing. Bo‘sh bo‘limlar saytda ko‘rinmaydi, keyinroq ularni admin paneldan o‘zingiz qo‘shasiz.
      </Tip>

      {/* Experience */}
      <section className="space-y-3">
        <SectionTitle title="Ish tajribasi" hint="Ish, amaliyot yoki frilans. Eng oxirgisidan boshlang." />
        {d.experience.map((x: IntakeExperience, i) => (
          <Card key={x.id} title={`${i + 1}-ish joyi`} onRemove={() => removeItem("experience", x.id)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Q label="Kompaniya" htmlFor={`e-${x.id}-c`} field={`experience.${i}.company`} error={e("experience", i, "company")}>
                <Text id={`e-${x.id}-c`} value={x.company} onChange={(company) => setItem("experience", x.id, (y) => ({ ...y, company }))} error={!!e("experience", i, "company")} />
              </Q>
              <Q label="Lavozim" htmlFor={`e-${x.id}-r`} field={`experience.${i}.role`} error={e("experience", i, "role")}>
                <Text id={`e-${x.id}-r`} value={x.role} onChange={(role) => setItem("experience", x.id, (y) => ({ ...y, role }))} placeholder="Kichik ma’lumotlar tahlilchisi" error={!!e("experience", i, "role")} />
              </Q>
              <Q label="Boshlangan" htmlFor={`e-${x.id}-s`} field={`experience.${i}.start`} error={e("experience", i, "start")}>
                <MonthInput id={`e-${x.id}-s`} value={x.start} onChange={(start) => setItem("experience", x.id, (y) => ({ ...y, start }))} error={!!e("experience", i, "start")} />
              </Q>
              <Q label="Tugagan" htmlFor={`e-${x.id}-e`} field={`experience.${i}.end`} error={e("experience", i, "end")}>
                {x.current ? <p className="h-[50px] flex items-center text-muted">Hozirgacha</p> : <MonthInput id={`e-${x.id}-e`} value={x.end} onChange={(end) => setItem("experience", x.id, (y) => ({ ...y, end }))} error={!!e("experience", i, "end")} />}
              </Q>
            </div>
            <Check2 checked={x.current} onChange={(current) => setItem("experience", x.id, (y) => ({ ...y, current, end: current ? "" : y.end }))}>
              Hozir shu yerda ishlayman
            </Check2>
            <Q label="Shahar" htmlFor={`e-${x.id}-city`} optional>
              <Text id={`e-${x.id}-city`} value={x.city} onChange={(city) => setItem("experience", x.id, (y) => ({ ...y, city }))} placeholder="Toshkent" />
            </Q>
            <Q label="Yutuqlaringiz" htmlFor={`e-${x.id}-a`} optional hint="Har birini alohida qatorga yozing. 2–3 ta yetarli.">
              <Area id={`e-${x.id}-a`} value={x.achievements} onChange={(achievements) => setItem("experience", x.id, (y) => ({ ...y, achievements }))} rows={4} placeholder={"Haftalik hisobotni avtomatlashtirdim\n12 ta Power BI hisobotini yuritaman"} />
            </Q>
          </Card>
        ))}
        <AddButton onClick={() => addItem("experience", { id: localId(), company: "", role: "", city: "", start: "", end: "", current: false, achievements: "" })} disabled={d.experience.length >= 6}>
          Ish joyi qo‘shish
        </AddButton>
      </section>

      {/* Certificates */}
      <section className="space-y-3">
        <SectionTitle title="Sertifikatlar" hint="Kurs, imtihon yoki tanlov sertifikatlari." />
        {d.certificates.map((x: IntakeCertificate, i) => (
          <Card key={x.id} title={`${i + 1}-sertifikat`} onRemove={() => removeItem("certificates", x.id)}>
            <Q label="Sertifikat nomi" htmlFor={`c-${x.id}-t`} field={`certificates.${i}.title`} error={e("certificates", i, "title")}>
              <Text id={`c-${x.id}-t`} value={x.title} onChange={(title) => setItem("certificates", x.id, (y) => ({ ...y, title }))} placeholder="Google Data Analytics" error={!!e("certificates", i, "title")} />
            </Q>
            <div className="grid gap-4 sm:grid-cols-2">
              <Q label="Kim bergan" htmlFor={`c-${x.id}-i`} field={`certificates.${i}.issuer`} error={e("certificates", i, "issuer")}>
                <Text id={`c-${x.id}-i`} value={x.issuer} onChange={(issuer) => setItem("certificates", x.id, (y) => ({ ...y, issuer }))} placeholder="Coursera" error={!!e("certificates", i, "issuer")} />
              </Q>
              <Q label="Qachon" htmlFor={`c-${x.id}-d`} optional>
                <MonthInput id={`c-${x.id}-d`} value={x.date} onChange={(date) => setItem("certificates", x.id, (y) => ({ ...y, date }))} />
              </Q>
              <Q label="Sertifikat raqami" htmlFor={`c-${x.id}-n`} optional>
                <Text id={`c-${x.id}-n`} value={x.credentialId} onChange={(credentialId) => setItem("certificates", x.id, (y) => ({ ...y, credentialId }))} />
              </Q>
              <Q label="Tekshirish havolasi" htmlFor={`c-${x.id}-u`} optional field={`certificates.${i}.verifyUrl`} error={e("certificates", i, "verifyUrl")}>
                <Text id={`c-${x.id}-u`} type="url" value={x.verifyUrl} onChange={(verifyUrl) => setItem("certificates", x.id, (y) => ({ ...y, verifyUrl }))} placeholder="https://…" error={!!e("certificates", i, "verifyUrl")} />
              </Q>
            </div>
            <Q label="Sertifikat rasmi" optional hint="PDF bo‘lsa, ekrandan skrinshot olib yuklang.">
              <FileSlot code={code} kind="image" aspect="aspect-[4/3]" value={x.image} onChange={(image) => setItem("certificates", x.id, (y) => ({ ...y, image }))} emptyText="Rasmni tanlang" />
            </Q>
          </Card>
        ))}
        <AddButton onClick={() => addItem("certificates", { id: localId(), title: "", issuer: "", date: "", credentialId: "", verifyUrl: "", image: null })} disabled={d.certificates.length >= 12}>
          Sertifikat qo‘shish
        </AddButton>
      </section>

      {/* Education */}
      <section className="space-y-3">
        <SectionTitle title="Ta’lim" hint="Universitet, kollej yoki uzoq muddatli kurslar." />
        {d.education.map((x: IntakeEducation, i) => (
          <Card key={x.id} title={`${i + 1}-o‘quv joyi`} onRemove={() => removeItem("education", x.id)}>
            <Q label="O‘quv muassasasi" htmlFor={`ed-${x.id}-s`} field={`education.${i}.school`} error={e("education", i, "school")}>
              <Text id={`ed-${x.id}-s`} value={x.school} onChange={(school) => setItem("education", x.id, (y) => ({ ...y, school }))} placeholder="Toshkent axborot texnologiyalari universiteti" error={!!e("education", i, "school")} />
            </Q>
            <div className="grid gap-4 sm:grid-cols-2">
              <Q label="Daraja" htmlFor={`ed-${x.id}-d`} optional>
                <Text id={`ed-${x.id}-d`} value={x.degree} onChange={(degree) => setItem("education", x.id, (y) => ({ ...y, degree }))} placeholder="Bakalavr" />
              </Q>
              <Q label="Yo‘nalish" htmlFor={`ed-${x.id}-f`} optional>
                <Text id={`ed-${x.id}-f`} value={x.field} onChange={(field) => setItem("education", x.id, (y) => ({ ...y, field }))} placeholder="Amaliy matematika" />
              </Q>
              <Q label="Boshlangan" htmlFor={`ed-${x.id}-st`} optional>
                <MonthInput id={`ed-${x.id}-st`} value={x.start} onChange={(start) => setItem("education", x.id, (y) => ({ ...y, start }))} />
              </Q>
              <Q label="Tugagan yoki tugaydi" htmlFor={`ed-${x.id}-en`} optional>
                <MonthInput id={`ed-${x.id}-en`} value={x.end} onChange={(end) => setItem("education", x.id, (y) => ({ ...y, end }))} />
              </Q>
            </div>
          </Card>
        ))}
        <AddButton onClick={() => addItem("education", { id: localId(), school: "", degree: "", field: "", start: "", end: "" })} disabled={d.education.length >= 6}>
          Ta’lim qo‘shish
        </AddButton>
      </section>

      {/* Testimonials */}
      <section className="space-y-3">
        <SectionTitle title="Fikrlar" hint="Ustoz, mijoz yoki hamkasbingiz siz haqingizda 2–3 gap yozsin." />
        {d.testimonials.map((x: IntakeTestimonial, i) => (
          <Card key={x.id} title={`${i + 1}-fikr`} onRemove={() => removeItem("testimonials", x.id)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Q label="Ismi" htmlFor={`t-${x.id}-n`} field={`testimonials.${i}.name`} error={e("testimonials", i, "name")}>
                <Text id={`t-${x.id}-n`} value={x.name} onChange={(name) => setItem("testimonials", x.id, (y) => ({ ...y, name }))} error={!!e("testimonials", i, "name")} />
              </Q>
              <Q label="Lavozimi" htmlFor={`t-${x.id}-r`} optional>
                <Text id={`t-${x.id}-r`} value={x.role} onChange={(role) => setItem("testimonials", x.id, (y) => ({ ...y, role }))} placeholder="Ustoz" />
              </Q>
            </div>
            <Q label="Ish joyi" htmlFor={`t-${x.id}-c`} optional>
              <Text id={`t-${x.id}-c`} value={x.company} onChange={(company) => setItem("testimonials", x.id, (y) => ({ ...y, company }))} />
            </Q>
            <Q label="Fikr" htmlFor={`t-${x.id}-q`} field={`testimonials.${i}.quote`} error={e("testimonials", i, "quote")}>
              <Area id={`t-${x.id}-q`} value={x.quote} onChange={(quote) => setItem("testimonials", x.id, (y) => ({ ...y, quote }))} rows={3} error={!!e("testimonials", i, "quote")} />
            </Q>
          </Card>
        ))}
        <AddButton onClick={() => addItem("testimonials", { id: localId(), name: "", role: "", company: "", quote: "" })} disabled={d.testimonials.length >= 6}>
          Fikr qo‘shish
        </AddButton>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 8. Contacts and design
// ---------------------------------------------------------------------------

export function StepDesign({ d, update, errors }: StepProps) {
  const { set } = useHelpers(update);
  return (
    <div className="space-y-7">
      <section className="space-y-5">
        <h3 className="font-display text-lg font-semibold">Saytdagi aloqa tugmalari</h3>
        <Q label="Saytda ko‘rsatiladigan email" htmlFor="siteEmail" optional field="siteEmail" error={errors.siteEmail} hint="Bo‘sh qoldirsangiz, Gmail manzilingiz ko‘rsatiladi.">
          <Text id="siteEmail" type="email" inputMode="email" value={d.siteEmail} onChange={(siteEmail) => set({ siteEmail: siteEmail.trim() })} placeholder={d.gmail || "ismingiz@gmail.com"} error={!!errors.siteEmail} />
        </Q>
        <Check2 checked={d.showPhone} onChange={(showPhone) => set({ showPhone })}>
          Telefon raqamimni ({d.phone || "1-bosqichdagi raqam"}) saytda ko‘rsatish
        </Check2>
        <Q label="LinkedIn" htmlFor="linkedin" optional field="linkedin" error={errors.linkedin}>
          <Text id="linkedin" type="url" value={d.linkedin} onChange={(linkedin) => set({ linkedin: linkedin.trim() })} placeholder="https://www.linkedin.com/in/…" error={!!errors.linkedin} />
        </Q>
        <Q label="GitHub" htmlFor="github" optional field="github" error={errors.github}>
          <Text id="github" type="url" value={d.github} onChange={(github) => set({ github: github.trim() })} placeholder="https://github.com/…" error={!!errors.github} />
        </Q>
      </section>

      <section className="space-y-5">
        <h3 className="font-display text-lg font-semibold">Dizayn</h3>
        <Q label="Sayt uslubi" hint="Butun sayt ko‘rinishi. Tanlaganingizda unga mos rang ham tanlanadi, xohlasangiz pastda almashtirasiz. Bo‘limlar ko‘rinishini (karusel, jadval va h.k.) keyin birga tanlaymiz.">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Sayt uslubi">
            {STYLES.map((s) => {
              const on = d.siteStyle === s.key;
              const [bg, surface, fg, line, accent] = s.swatch.light;
              return (
                <button
                  key={s.key}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => set({ siteStyle: s.key, accentColor: s.accent })}
                  className={cn("text-left rounded-2xl border-2 p-2 transition", on ? "border-accent" : "border-line hover:border-line-strong")}
                >
                  <span className="relative block h-16 rounded-xl overflow-hidden border" style={{ background: bg, borderColor: line }}>
                    <span className="absolute left-2.5 top-2.5 text-base font-bold" style={{ color: fg, fontFamily: s.font === "serif" ? "Georgia, serif" : s.font === "mono" ? "var(--font-mono)" : undefined }}>
                      Aa
                    </span>
                    <span className="absolute left-2.5 bottom-2.5 h-2.5 w-8 rounded-sm" style={{ background: accent }} />
                    <span className="absolute right-2.5 top-2.5 bottom-2.5 w-10 rounded-md border" style={{ background: surface, borderColor: line }} />
                  </span>
                  <span className="mt-2 block px-1 text-sm font-semibold">{STYLE_LABELS[s.key].name}</span>
                  <span className="block px-1 text-xs text-muted leading-snug">{STYLE_LABELS[s.key].description}</span>
                </button>
              );
            })}
          </div>
        </Q>
        <Q label="Asosiy rang" field="accentColor" error={errors.accentColor} hint="Tugmalar, havolalar va ajratilgan joylar shu rangda bo‘ladi.">
          <div className="flex flex-wrap items-center gap-3">
            {ACCENT_PRESETS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => set({ accentColor: c.value })}
                aria-pressed={d.accentColor === c.value}
                aria-label={c.label}
                title={c.label}
                className={cn("h-12 w-12 rounded-full border-4 transition", d.accentColor === c.value ? "border-fg scale-110" : "border-transparent")}
                style={{ background: c.value }}
              />
            ))}
            <label className="h-12 px-4 rounded-full border border-line inline-flex items-center gap-2 text-sm font-semibold cursor-pointer">
              <input type="color" value={d.accentColor} onChange={(ev) => set({ accentColor: ev.target.value })} className="h-6 w-8 cursor-pointer border-0 bg-transparent p-0" />
              Boshqa rang
            </label>
          </div>
        </Q>
        <Q label="Standart rejim">
          <Choice
            name="theme"
            value={d.defaultTheme}
            onChange={(defaultTheme) => set({ defaultTheme })}
            options={[
              { value: "dark", label: "Qorong‘i", description: "Zamonaviy, ko‘zni charchatmaydi." },
              { value: "light", label: "Yorug‘", description: "Klassik, oq fon." },
            ]}
          />
        </Q>
        <Q label="Yoqadigan sayt" htmlFor="exampleSite" optional field="exampleSite" error={errors.exampleSite} hint="Ko‘rinishi sizga yoqadigan biror sayt havolasi.">
          <Text id="exampleSite" type="url" value={d.exampleSite} onChange={(exampleSite) => set({ exampleSite: exampleSite.trim() })} placeholder="https://…" error={!!errors.exampleSite} />
        </Q>
        <Q label="Qo‘shimcha istaklar" htmlFor="notes" optional>
          <Area id="notes" value={d.notes} onChange={(notes) => set({ notes })} rows={3} maxLength={2000} placeholder="Yana nimani bilishim kerak?" />
        </Q>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 9. Review and confirm
// ---------------------------------------------------------------------------

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-semibold text-right break-words min-w-0">{children}</span>
    </div>
  );
}

export function StepReview({ d, update, errors, goTo }: StepProps & { goTo: (step: number) => void }) {
  const { set } = useHelpers(update);
  const blocks: { step: number; rows: [string, React.ReactNode][] }[] = [
    { step: 1, rows: [["Ism", d.fullName], ["Gmail", d.gmail], ["Telefon", d.phone]] },
    { step: 2, rows: [["Domenlar", d.domains.filter(Boolean).map((x) => `${x}.uz`).join(", ")], ["Tillar", d.siteLanguages.map((l) => LANG_LABELS[l]).join(", ")]] },
    { step: 3, rows: [["Lavozim", d.titles.filter(Boolean).join(", ")], ["Tarjimai hol", `${d.bio.trim().length} ta belgi`], ["Shahar", d.city]] },
    { step: 4, rows: [["Rasm", d.photo ? "yuklandi" : "—"], ["Rezyume", d.cv ? "yuklandi" : "yo‘q"]] },
    { step: 5, rows: [["Ko‘nikmalar", `${d.skills.length} ta`]] },
    { step: 6, rows: [["Loyihalar", `${d.projects.length} ta`]] },
    { step: 7, rows: [["Ish joylari", `${d.experience.length} ta`], ["Sertifikatlar", `${d.certificates.length} ta`], ["Ta’lim", `${d.education.length} ta`], ["Fikrlar", `${d.testimonials.length} ta`]] },
    {
      step: 8,
      rows: [
        [
          "Rang",
          <span key="c" className="inline-flex items-center gap-2">
            <span className="h-4 w-4 rounded-full" style={{ background: d.accentColor }} /> {d.accentColor}
          </span>,
        ],
        ["Uslub", STYLE_LABELS[styleMeta(d.siteStyle).key].name],
        ["Rejim", d.defaultTheme === "dark" ? "Qorong‘i" : "Yorug‘"],
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <p className="text-fg-2">Hammasini tekshirib chiqing. Biror narsani o‘zgartirish uchun «Tahrirlash» tugmasini bosing.</p>
      <div className="space-y-3">
        {blocks.map((b) => (
          <div key={b.step} className="card p-4">
            <div className="flex items-center justify-between gap-3 mb-1">
              <h3 className="font-semibold">
                {b.step}. {STEP_TITLES[b.step - 1]}
              </h3>
              <button type="button" onClick={() => goTo(b.step)} className="inline-flex items-center gap-1 h-9 px-3 rounded-full text-sm font-semibold text-accent-strong hover:bg-accent-soft">
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Tahrirlash
              </button>
            </div>
            {b.rows.map(([label, value]) => (
              <Row key={label} label={label}>
                {value || "—"}
              </Row>
            ))}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div data-field="confirmTruth">
          <Check2 checked={d.confirmTruth} onChange={(confirmTruth) => set({ confirmTruth })} error={!!errors.confirmTruth}>
            Barcha ma’lumotlar haqiqiy. Loyiha, sertifikat va tajribalarni o‘ylab topmaganman.
          </Check2>
        </div>
        <div data-field="confirmNoGuarantee">
          <Check2 checked={d.confirmNoGuarantee} onChange={(confirmNoGuarantee) => set({ confirmNoGuarantee })} error={!!errors.confirmNoGuarantee}>
            Sayt ishga joylashishni kafolatlamasligini tushunaman.
          </Check2>
        </div>
        {(errors.confirmTruth || errors.confirmNoGuarantee) && (
          <p className="text-sm text-danger font-medium" role="alert">
            Yuborish uchun ikkala bandni ham belgilang.
          </p>
        )}
      </div>
    </div>
  );
}
