import type { Localized, SkillCategory } from "../types";
import type { StyleKey } from "@/lib/design";

// ---------------------------------------------------------------------------
// Professions. The customer picks one in step 3; it decides which skills, tools and examples the
// form shows. Nothing about the job is stored on the site itself, only the skills and projects.
// ---------------------------------------------------------------------------

export const JOB_KEYS = ["data", "developer", "designer", "marketing", "finance", "hr", "pm", "teacher", "other"] as const;
export type JobKey = (typeof JOB_KEYS)[number];

interface ProjectExample {
  title: string;
  summary: string;
  problem: string;
  approach: string;
  result: string;
  metrics: [string, string][];
}

export interface Job {
  key: JobKey;
  icon: string;
  label: string;
  titles: [string, string, string];
  tagline: string;
  /** Tools offered on each project. */
  tools: string[];
  project: ProjectExample;
}

export const JOBS: Job[] = [
  {
    key: "data",
    icon: "📊",
    label: "Ma’lumotlar tahlilchisi",
    titles: ["Data Analyst", "Power BI Developer", "SQL mutaxassisi"],
    tagline: "Ma’lumotlarni tushunarli dashbordlarga aylantiraman.",
    tools: ["Excel", "Power BI", "SQL", "Python", "Tableau", "Google Sheets", "Looker Studio", "Power Query", "R", "VBA"],
    project: {
      title: "Do‘kon savdosi dashbordi",
      summary: "14 ta Excel faylini bitta Power BI hisobotiga aylantirdim.",
      problem: "Do‘kon har hafta 14 ta alohida Excel faylda hisobot olardi, raqamlar mos kelmasdi va yig‘ilishda vaqt behuda ketardi.",
      approach: "Ma’lumotlarni SQL orqali bitta jadvalga yig‘dim, Power BI’da model qurdim va asosiy ko‘rsatkichlar uchun DAX formulalar yozdim.",
      result: "Haftalik hisobot vaqti 6 soatdan 15 daqiqaga tushdi, rahbariyat endi bitta raqamga tayanadi.",
      metrics: [["-96%", "Hisobot vaqti"], ["60", "Do‘konlar soni"], ["$4.2M", "Oylik tushum"]],
    },
  },
  {
    key: "developer",
    icon: "💻",
    label: "Dasturchi",
    titles: ["Frontend Developer", "React dasturchi", "Full-stack Developer"],
    tagline: "Tez va qulay ishlaydigan veb-ilovalar yarataman.",
    tools: ["JavaScript", "TypeScript", "React", "Next.js", "Node.js", "Python", "Django", "PHP", "Laravel", "Java", "C#", "Flutter", "PostgreSQL", "Docker", "Git"],
    project: {
      title: "Restoran uchun onlayn buyurtma sayti",
      summary: "Telefon orqali buyurtmani 2 daqiqalik onlayn jarayonga aylantirdim.",
      problem: "Restoran buyurtmalarni faqat telefon orqali qabul qilardi, band paytlarda qo‘ng‘iroqlar javobsiz qolardi.",
      approach: "React va Node.js bilan menyu, savat va to‘lov sahifasini yozdim, buyurtmalar Telegram botga tushadigan qildim.",
      result: "Birinchi oyda buyurtmalarning 40% i saytdan keldi, javobsiz qo‘ng‘iroqlar deyarli qolmadi.",
      metrics: [["40%", "Onlayn buyurtmalar"], ["2 daq", "Buyurtma vaqti"], ["0.8 s", "Sahifa yuklanishi"]],
    },
  },
  {
    key: "designer",
    icon: "🎨",
    label: "Dizayner (UI/UX, grafik)",
    titles: ["UI/UX Designer", "Graphic Designer", "Brend dizayner"],
    tagline: "Chiroyli va tushunarli interfeyslar chizaman.",
    tools: ["Figma", "Photoshop", "Illustrator", "Canva", "After Effects", "Premiere Pro", "Blender", "InDesign", "Framer"],
    project: {
      title: "Bank ilovasi uchun yangi to‘lov ekrani",
      summary: "To‘lov jarayonini 5 qadamdan 2 qadamga qisqartirdim.",
      problem: "Foydalanuvchilar to‘lov sahifasida adashib qolar, ko‘pchilik to‘lovni oxiriga yetkazmasdi.",
      approach: "10 ta foydalanuvchi bilan suhbat o‘tkazdim, Figma’da 3 ta variant chizdim va prototipni sinab ko‘rdim.",
      result: "To‘lovni yakunlaganlar soni 35% oshdi, qo‘llab-quvvatlash xizmatiga savollar kamaydi.",
      metrics: [["+35%", "Yakunlangan to‘lovlar"], ["5 → 2", "Qadamlar soni"], ["10", "Suhbatlar"]],
    },
  },
  {
    key: "marketing",
    icon: "📣",
    label: "SMM / marketolog",
    titles: ["SMM Manager", "Digital Marketer", "Target mutaxassisi"],
    tagline: "Brendlarni ijtimoiy tarmoqlarda o‘stiraman.",
    tools: ["Instagram", "Telegram", "Meta Ads", "Google Ads", "TikTok", "Canva", "CapCut", "Google Analytics", "Yandex Direct"],
    project: {
      title: "Kafe Instagram sahifasini o‘stirish",
      summary: "3 oyda obunachilarni 2 baravar ko‘paytirdim.",
      problem: "Kafe sahifasi faol emas edi, postlar tartibsiz chiqar va yangi mijoz olib kelmasdi.",
      approach: "Kontent reja tuzdim, haftada 4 ta reels chiqardim va kichik byudjet bilan target reklama yo‘lga qo‘ydim.",
      result: "Obunachilar 4 000 dan 8 500 ga yetdi, Instagram orqali bron qilishlar oyiga 120 taga chiqdi.",
      metrics: [["×2.1", "Obunachilar"], ["120", "Oylik bronlar"], ["$0.3", "Bitta murojaat narxi"]],
    },
  },
  {
    key: "finance",
    icon: "🧾",
    label: "Buxgalter / moliyachi",
    titles: ["Buxgalter", "Financial Analyst", "Bosh buxgalter yordamchisi"],
    tagline: "Raqamlarni tartibga solaman va pulni hisobli qilaman.",
    tools: ["1C", "Excel", "Google Sheets", "Power BI", "SAP", "Didox", "Soliq.uz", "MS Dynamics"],
    project: {
      title: "Oylik moliyaviy hisobotni avtomatlashtirish",
      summary: "Oylik yopilishni 5 kundan 2 kunga qisqartirdim.",
      problem: "Oylik hisobot qo‘lda yig‘ilar, xatolar tufayli soliq hisobotlari kechikardi.",
      approach: "1C’dan eksportni Excel shablonlariga bog‘ladim, solishtirish jadvallari va tekshiruv formulalarini qo‘shdim.",
      result: "Oy yopilishi 5 kundan 2 kunga tushdi, so‘nggi 6 oyda birorta jarima bo‘lmadi.",
      metrics: [["5 → 2", "Oy yopilishi, kun"], ["0", "Jarimalar"], ["300+", "Oylik hujjatlar"]],
    },
  },
  {
    key: "hr",
    icon: "🤝",
    label: "HR / rekruter",
    titles: ["HR Manager", "Recruiter", "HR Business Partner"],
    tagline: "Kompaniyaga to‘g‘ri odamlarni topaman.",
    tools: ["hh.uz", "LinkedIn", "Excel", "Google Forms", "Notion", "Bitrix24", "1C ZUP"],
    project: {
      title: "Sotuv bo‘limiga tez yollash jarayoni",
      summary: "Yollash muddatini 45 kundan 18 kunga qisqartirdim.",
      problem: "Sotuv bo‘limida bo‘sh o‘rinlar uzoq to‘ldirilmas, yangi xodimlar tez ketib qolardi.",
      approach: "Vakansiya matnini qayta yozdim, Telegram kanallarga chiqardim, ikki bosqichli intervyu va adaptatsiya rejasini kiritdim.",
      result: "Yollash 18 kunga tushdi, birinchi 3 oyda ketganlar ulushi 40% dan 12% ga kamaydi.",
      metrics: [["18 kun", "Yollash muddati"], ["25", "Yollangan xodim"], ["-28 p.p.", "Erta ketish"]],
    },
  },
  {
    key: "pm",
    icon: "🗂️",
    label: "Loyiha menejeri",
    titles: ["Project Manager", "Product Manager", "Scrum Master"],
    tagline: "Jamoani maqsadga muddatida olib boraman.",
    tools: ["Jira", "Trello", "Notion", "ClickUp", "Miro", "Confluence", "Asana", "Excel"],
    project: {
      title: "Mobil ilovani muddatida ishga tushirish",
      summary: "8 kishilik jamoa bilan ilovani 4 oyda chiqardik.",
      problem: "Loyiha 2 oy kechikkan, vazifalar chalkash va jamoa kim nima qilayotganini bilmasdi.",
      approach: "Ikki haftalik sprintlar, Jira’da aniq vazifalar va har kuni 15 daqiqalik uchrashuvlar joriy qildim.",
      result: "Ilova rejalashtirilgan kunda chiqdi, birinchi oyda 10 000 dan ortiq yuklab olindi.",
      metrics: [["4 oy", "Ishlab chiqish"], ["8", "Jamoa a’zolari"], ["10K+", "Yuklab olishlar"]],
    },
  },
  {
    key: "teacher",
    icon: "🎓",
    label: "O‘qituvchi / trener",
    titles: ["Ingliz tili o‘qituvchisi", "IELTS trener", "Matematika o‘qituvchisi"],
    tagline: "Murakkab narsani oson tushuntiraman.",
    tools: ["Google Classroom", "Zoom", "Canva", "Kahoot", "Quizlet", "PowerPoint", "Moodle", "Notion"],
    project: {
      title: "IELTS tayyorlov kursi",
      summary: "3 oylik kursda o‘quvchilar o‘rtacha 1.5 ballga o‘sdi.",
      problem: "O‘quvchilar Writing va Speaking bo‘limlarida qiynalar, darsliklar ularga mos kelmasdi.",
      approach: "Har hafta mock imtihon, yozma ishlarga batafsil izoh va Telegram guruhda kundalik topshiriqlar joriy qildim.",
      result: "40 o‘quvchidan 28 tasi 6.5 va undan yuqori ball oldi.",
      metrics: [["+1.5", "O‘rtacha ball o‘sishi"], ["40", "O‘quvchilar"], ["70%", "6.5+ olganlar"]],
    },
  },
  {
    key: "other",
    icon: "✨",
    label: "Boshqa kasb",
    titles: ["Lavozimingiz", "Ikkinchi lavozim", "Mutaxassisligingiz"],
    tagline: "Ishingizni bir gap bilan yozing.",
    tools: [],
    project: {
      title: "Loyiha yoki ish nomi",
      summary: "Nima qildingiz va qanday natija bo‘ldi — bir gapda.",
      problem: "Qanday muammo bor edi? Kimga va nega muhim edi?",
      approach: "Siz nima qildingiz? Qaysi vositalar yoki usullardan foydalandingiz?",
      result: "Nima o‘zgardi? Iloji bo‘lsa raqam keltiring.",
      metrics: [["+30%", "Natija"], ["50", "Mijozlar"], ["2 hafta", "Muddat"]],
    },
  },
];

export function jobOf(key: string | undefined): Job {
  return JOBS.find((j) => j.key === key) ?? JOBS[0];
}

/** Tools offered on projects: the job's own, or every job's for "Boshqa kasb". */
export function toolsFor(job: JobKey): string[] {
  if (job !== "other") return jobOf(job).tools;
  return [...new Set(JOBS.flatMap((j) => j.tools))];
}

// ---------------------------------------------------------------------------
// Skills
// ---------------------------------------------------------------------------

export interface CatalogSkill {
  key: string;
  icon: string;
  category: SkillCategory;
  /** Tool names are the same everywhere; soft skills are translated. */
  name: Localized;
  /** Jobs that see this skill first. Soft skills ("all") show for everyone. */
  jobs: JobKey[] | "all";
}

const same = (name: string): Localized => ({ en: name, ru: name, uz: name });
const s = (key: string, icon: string, category: SkillCategory, name: string | Localized, jobs: JobKey[] | "all"): CatalogSkill => ({
  key,
  icon,
  category,
  name: typeof name === "string" ? same(name) : name,
  jobs,
});

export const SKILL_CATALOG: CatalogSkill[] = [
  // BI and analytics
  s("excel", "📗", "bi", "Excel", ["data", "finance", "hr", "pm", "marketing"]),
  s("power-bi", "📊", "bi", "Power BI", ["data", "finance"]),
  s("tableau", "📈", "bi", "Tableau", ["data"]),
  s("google-sheets", "🧮", "bi", "Google Sheets", ["data", "finance", "marketing", "hr"]),
  s("looker-studio", "📉", "bi", "Looker Studio", ["data", "marketing"]),
  s("power-query", "🔄", "bi", "Power Query", ["data", "finance"]),
  s("google-analytics", "📶", "bi", "Google Analytics", ["marketing"]),
  // Programming
  s("python", "🐍", "programming", "Python", ["data", "developer"]),
  s("pandas", "🐼", "programming", "Pandas", ["data"]),
  s("numpy", "🔢", "programming", "NumPy", ["data"]),
  s("dax", "🧠", "programming", "DAX", ["data", "finance"]),
  s("r", "📐", "programming", "R", ["data"]),
  s("vba", "🧾", "programming", "VBA", ["data", "finance"]),
  s("jupyter", "📓", "programming", "Jupyter", ["data"]),
  s("html-css", "🧱", "programming", { en: "HTML & CSS", ru: "HTML и CSS", uz: "HTML va CSS" }, ["developer", "designer"]),
  s("javascript", "🟨", "programming", "JavaScript", ["developer"]),
  s("typescript", "🔷", "programming", "TypeScript", ["developer"]),
  s("react", "⚛️", "programming", "React", ["developer"]),
  s("nextjs", "▲", "programming", "Next.js", ["developer"]),
  s("nodejs", "🟩", "programming", "Node.js", ["developer"]),
  s("django", "🎸", "programming", "Django", ["developer"]),
  s("php", "🐘", "programming", "PHP / Laravel", ["developer"]),
  s("java", "☕", "programming", "Java", ["developer"]),
  s("csharp", "#️⃣", "programming", "C# / .NET", ["developer"]),
  s("flutter", "🦋", "programming", "Flutter", ["developer"]),
  // Databases
  s("sql", "🗄️", "databases", "SQL", ["data", "developer"]),
  s("postgresql", "🐘", "databases", "PostgreSQL", ["data", "developer"]),
  s("mysql", "🐬", "databases", "MySQL", ["data", "developer"]),
  s("sql-server", "🧱", "databases", "SQL Server", ["data"]),
  s("bigquery", "☁️", "databases", "BigQuery", ["data"]),
  s("mongodb", "🍃", "databases", "MongoDB", ["developer"]),
  // Design
  s("figma", "🎨", "design", "Figma", ["designer", "developer"]),
  s("photoshop", "🖼️", "design", "Photoshop", ["designer", "marketing"]),
  s("illustrator", "✒️", "design", "Illustrator", ["designer"]),
  s("canva", "🟣", "design", "Canva", ["designer", "marketing", "teacher"]),
  s("after-effects", "🎞️", "design", "After Effects", ["designer"]),
  s("premiere", "🎬", "design", "Premiere Pro / CapCut", ["designer", "marketing"]),
  s("ui-design", "📱", "design", { en: "UI design", ru: "UI-дизайн", uz: "UI dizayn" }, ["designer"]),
  s("ux-research", "🔎", "design", { en: "UX research", ru: "UX-исследования", uz: "UX tadqiqot" }, ["designer"]),
  s("branding", "🏷️", "design", { en: "Branding", ru: "Брендинг", uz: "Brending" }, ["designer", "marketing"]),
  // Marketing
  s("smm", "📲", "marketing", "SMM", ["marketing"]),
  s("targeting", "🎯", "marketing", { en: "Paid ads (Meta, Google)", ru: "Таргет (Meta, Google)", uz: "Target reklama (Meta, Google)" }, ["marketing"]),
  s("copywriting", "✍️", "marketing", { en: "Copywriting", ru: "Копирайтинг", uz: "Kopirayting" }, ["marketing"]),
  s("content-plan", "🗓️", "marketing", { en: "Content planning", ru: "Контент-план", uz: "Kontent reja" }, ["marketing"]),
  s("seo", "🔍", "marketing", "SEO", ["marketing", "developer"]),
  s("telegram-mkt", "✈️", "marketing", { en: "Telegram marketing", ru: "Telegram-маркетинг", uz: "Telegram marketing" }, ["marketing"]),
  // Finance and accounting
  s("1c", "🟡", "finance", "1C", ["finance", "hr"]),
  s("ifrs", "📘", "finance", { en: "IFRS", ru: "МСФО", uz: "MHXS (IFRS)" }, ["finance"]),
  s("tax", "🏛️", "finance", { en: "Tax accounting", ru: "Налоговый учёт", uz: "Soliq hisobi" }, ["finance"]),
  s("budgeting", "💰", "finance", { en: "Budgeting", ru: "Бюджетирование", uz: "Byudjet tuzish" }, ["finance", "pm"]),
  s("fin-analysis", "📑", "finance", { en: "Financial analysis", ru: "Финансовый анализ", uz: "Moliyaviy tahlil" }, ["finance", "data"]),
  // Work tools
  s("jira", "🧩", "tools", "Jira", ["pm", "developer"]),
  s("trello", "📋", "tools", "Trello", ["pm"]),
  s("notion", "🗒️", "tools", "Notion", ["pm", "hr", "teacher"]),
  s("agile", "🔁", "tools", { en: "Agile / Scrum", ru: "Agile / Scrum", uz: "Agile / Scrum" }, ["pm", "developer"]),
  s("git", "🔀", "tools", "Git", ["developer", "data"]),
  s("docker", "🐳", "tools", "Docker", ["developer"]),
  s("bitrix24", "🔵", "tools", "Bitrix24", ["hr", "pm", "marketing"]),
  s("recruiting", "🧲", "tools", { en: "Recruiting", ru: "Подбор персонала", uz: "Xodim tanlash" }, ["hr"]),
  s("interviewing", "🗨️", "tools", { en: "Interviewing", ru: "Проведение интервью", uz: "Intervyu o‘tkazish" }, ["hr"]),
  s("labor-law", "⚖️", "tools", { en: "Labour law", ru: "Трудовое право", uz: "Mehnat qonunchiligi" }, ["hr"]),
  s("google-classroom", "🏫", "tools", "Google Classroom", ["teacher"]),
  s("lesson-planning", "📚", "tools", { en: "Lesson planning", ru: "Планирование уроков", uz: "Dars rejalashtirish" }, ["teacher"]),
  s("ielts", "🇬🇧", "tools", "IELTS", ["teacher"]),
  // Soft skills, for everyone
  s("storytelling", "🎯", "soft", { en: "Data storytelling", ru: "Сторителлинг данных", uz: "Ma’lumotlar bilan hikoya qilish" }, ["data"]),
  s("communication", "🗣️", "soft", { en: "Communication", ru: "Коммуникация", uz: "Muloqot" }, "all"),
  s("problem-solving", "🧩", "soft", { en: "Problem solving", ru: "Решение проблем", uz: "Muammolarni hal qilish" }, "all"),
  s("teamwork", "🤝", "soft", { en: "Teamwork", ru: "Работа в команде", uz: "Jamoada ishlash" }, "all"),
  s("presentation", "🎤", "soft", { en: "Presenting", ru: "Презентации", uz: "Taqdimot qilish" }, "all"),
  s("critical-thinking", "💡", "soft", { en: "Critical thinking", ru: "Критическое мышление", uz: "Tanqidiy fikrlash" }, "all"),
  s("time-management", "⏱️", "soft", { en: "Time management", ru: "Тайм-менеджмент", uz: "Vaqtni boshqarish" }, "all"),
  s("attention", "🔍", "soft", { en: "Attention to detail", ru: "Внимание к деталям", uz: "Tafsilotlarga e’tibor" }, "all"),
  s("leadership", "🧭", "soft", { en: "Leadership", ru: "Лидерство", uz: "Yetakchilik" }, "all"),
  s("creativity", "🌈", "soft", { en: "Creativity", ru: "Креативность", uz: "Ijodkorlik" }, "all"),
];

export function skillsFor(job: JobKey): CatalogSkill[] {
  return job === "other" ? SKILL_CATALOG : SKILL_CATALOG.filter((x) => x.jobs === "all" || x.jobs.includes(job));
}

export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  bi: "BI va tahlil",
  programming: "Dasturlash",
  databases: "Ma’lumotlar bazalari",
  design: "Dizayn",
  marketing: "Marketing",
  finance: "Moliya va buxgalteriya",
  tools: "Ish vositalari",
  soft: "Shaxsiy ko‘nikmalar",
};

export const SKILL_LEVELS = [
  { value: 40, label: "Boshlang‘ich" },
  { value: 60, label: "O‘rta" },
  { value: 80, label: "Yaxshi" },
  { value: 95, label: "A’lo" },
] as const;

/** Stored value is the English name the site's filters use; the label is what the customer sees. */
export const PROJECT_DOMAIN_OPTIONS = [
  { value: "Finance", label: "Moliya" },
  { value: "Banking", label: "Bank" },
  { value: "Retail", label: "Chakana savdo" },
  { value: "E-commerce", label: "Onlayn savdo" },
  { value: "HR", label: "HR / kadrlar" },
  { value: "Education", label: "Ta’lim" },
  { value: "Marketing", label: "Marketing" },
  { value: "IT", label: "IT va dasturlash" },
  { value: "Telecom", label: "Telekom" },
  { value: "Logistics", label: "Logistika" },
  { value: "Healthcare", label: "Tibbiyot" },
  { value: "Manufacturing", label: "Ishlab chiqarish" },
  { value: "Construction", label: "Qurilish" },
  { value: "Real estate", label: "Ko‘chmas mulk" },
  { value: "Food & HoReCa", label: "Restoran va kafe" },
  { value: "Tourism", label: "Turizm" },
  { value: "Agriculture", label: "Qishloq xo‘jaligi" },
  { value: "Energy", label: "Energetika" },
  { value: "Government", label: "Davlat sektori" },
  { value: "Media", label: "Media" },
  { value: "Non-profit", label: "Notijorat" },
  { value: "Other", label: "Boshqa" },
] as const;

export const ACCENT_PRESETS = [
  { value: "#0f8b8d", label: "Firuza" },
  { value: "#2563eb", label: "Ko‘k" },
  { value: "#7c3aed", label: "Binafsha" },
  { value: "#db2777", label: "Pushti" },
  { value: "#ea580c", label: "To‘q sariq" },
  { value: "#16a34a", label: "Yashil" },
  { value: "#b45309", label: "Jigarrang" },
  { value: "#0f172a", label: "Qora" },
];

export const LANG_LABELS = { uz: "O‘zbekcha", ru: "Ruscha", en: "Inglizcha" } as const;

/** Site styles as the customer sees them. Keys match lib/design.ts STYLE_KEYS. */
export const STYLE_LABELS: Record<StyleKey, { name: string; description: string }> = {
  classic: { name: "Klassik", description: "Yumshoq ranglar, yumaloq kartalar." },
  mono: { name: "Oq-qora", description: "Faqat oq va qora, jiddiy va nafis." },
  excel: { name: "Excel", description: "Jadval katakchalari, yashil rang." },
  sql: { name: "SQL", description: "Dasturchi muharriri ko‘rinishi." },
  powerbi: { name: "Power BI", description: "Hisobot sahifasi, oq plitkalar." },
  notebook: { name: "Notebook", description: "Python/Jupyter daftari uslubi." },
};

/** Paid back to the customer who brought a new buyer. */
export const REFERRAL_REWARD = 50_000;
