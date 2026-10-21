import type { Localized, SkillCategory } from "../types";

export interface CatalogSkill {
  key: string;
  icon: string;
  category: SkillCategory;
  /** Tool names are the same everywhere; soft skills are translated. */
  name: Localized;
}

const same = (name: string): Localized => ({ en: name, ru: name, uz: name });

export const SKILL_CATALOG: CatalogSkill[] = [
  // BI tools
  { key: "excel", icon: "📗", category: "bi", name: same("Excel") },
  { key: "power-bi", icon: "📊", category: "bi", name: same("Power BI") },
  { key: "tableau", icon: "📈", category: "bi", name: same("Tableau") },
  { key: "google-sheets", icon: "🧮", category: "bi", name: same("Google Sheets") },
  { key: "looker-studio", icon: "📉", category: "bi", name: same("Looker Studio") },
  { key: "power-query", icon: "🔄", category: "bi", name: same("Power Query") },
  // Programming
  { key: "python", icon: "🐍", category: "programming", name: same("Python") },
  { key: "pandas", icon: "🐼", category: "programming", name: same("Pandas") },
  { key: "numpy", icon: "🔢", category: "programming", name: same("NumPy") },
  { key: "dax", icon: "🧠", category: "programming", name: same("DAX") },
  { key: "r", icon: "📐", category: "programming", name: same("R") },
  { key: "vba", icon: "🧾", category: "programming", name: same("VBA") },
  { key: "git", icon: "🔀", category: "programming", name: same("Git") },
  { key: "jupyter", icon: "📓", category: "programming", name: same("Jupyter") },
  // Databases
  { key: "sql", icon: "🗄️", category: "databases", name: same("SQL") },
  { key: "postgresql", icon: "🐘", category: "databases", name: same("PostgreSQL") },
  { key: "mysql", icon: "🐬", category: "databases", name: same("MySQL") },
  { key: "sql-server", icon: "🧱", category: "databases", name: same("SQL Server") },
  { key: "bigquery", icon: "☁️", category: "databases", name: same("BigQuery") },
  { key: "sqlite", icon: "🪶", category: "databases", name: same("SQLite") },
  // Soft skills
  { key: "storytelling", icon: "🎯", category: "soft", name: { en: "Data storytelling", ru: "Сторителлинг данных", uz: "Ma’lumotlar bilan hikoya qilish" } },
  { key: "communication", icon: "🗣️", category: "soft", name: { en: "Communication", ru: "Коммуникация", uz: "Muloqot" } },
  { key: "problem-solving", icon: "🧩", category: "soft", name: { en: "Problem solving", ru: "Решение проблем", uz: "Muammolarni hal qilish" } },
  { key: "teamwork", icon: "🤝", category: "soft", name: { en: "Teamwork", ru: "Работа в команде", uz: "Jamoada ishlash" } },
  { key: "presentation", icon: "🎤", category: "soft", name: { en: "Presenting", ru: "Презентации", uz: "Taqdimot qilish" } },
  { key: "critical-thinking", icon: "💡", category: "soft", name: { en: "Critical thinking", ru: "Критическое мышление", uz: "Tanqidiy fikrlash" } },
  { key: "time-management", icon: "⏱️", category: "soft", name: { en: "Time management", ru: "Тайм-менеджмент", uz: "Vaqtni boshqarish" } },
  { key: "attention", icon: "🔍", category: "soft", name: { en: "Attention to detail", ru: "Внимание к деталям", uz: "Tafsilotlarga e’tibor" } },
];

export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  bi: "BI vositalari",
  programming: "Dasturlash",
  databases: "Ma’lumotlar bazalari",
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
  { value: "HR", label: "HR / kadrlar" },
  { value: "Education", label: "Ta’lim" },
  { value: "Marketing", label: "Marketing" },
  { value: "Logistics", label: "Logistika" },
  { value: "Healthcare", label: "Sog‘liqni saqlash" },
  { value: "Other", label: "Boshqa" },
] as const;

export const PROJECT_TOOL_OPTIONS = ["Excel", "Power BI", "SQL", "Python", "Tableau", "Google Sheets", "Looker Studio", "Power Query", "R", "VBA"];

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
