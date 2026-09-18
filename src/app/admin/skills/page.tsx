"use client";

import { Sparkles } from "lucide-react";
import { CrudPage, type CrudConfig } from "@/components/admin/CrudPage";
import { Field, Input, LocalizedInput, Select, Slider } from "@/components/admin/fields";
import { useLocale } from "@/lib/i18n";
import { emptyLocalized, SKILL_CATEGORIES, type Skill, type SkillCategory } from "@/lib/types";

function SkillForm({ value, onChange }: { value: Skill; onChange: (v: Skill) => void }) {
  const { t } = useLocale();
  return (
    <>
      <LocalizedInput label={t("admin.fields.name")} value={value.name} onChange={(name) => onChange({ ...value, name })} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("admin.fields.icon")} htmlFor="skill-icon">
          <Input id="skill-icon" value={value.icon} onChange={(icon) => onChange({ ...value, icon })} placeholder="📊" maxLength={4} />
        </Field>
        <Field label={t("admin.fields.category")} htmlFor="skill-category">
          <Select<SkillCategory>
            id="skill-category"
            value={value.category}
            onChange={(category) => onChange({ ...value, category })}
            options={SKILL_CATEGORIES.map((c) => ({ value: c, label: t(`skills.categories.${c}`) }))}
          />
        </Field>
      </div>
      <Field label={t("admin.fields.level")} htmlFor="skill-level">
        <Slider id="skill-level" label={t("admin.fields.level")} value={value.level ?? 0} onChange={(level) => onChange({ ...value, level })} />
      </Field>
    </>
  );
}

const config: Omit<CrudConfig<Skill>, "Form"> = {
  collection: "skills",
  itemKey: "skill",
  icon: Sparkles,
  getTitle: (s, tr) => `${s.icon ? s.icon + " " : ""}${tr(s.name)}`,
  getSubtitle: (s, _tr, t) => `${t(`skills.categories.${s.category}`)} · ${s.level}%`,
  newItem: () => ({ name: emptyLocalized(), icon: "", category: "bi", level: 70 }),
  validate: (s, t) => (s.name.en.trim() ? null : t("admin.form.requiredEn")),
};

export default function SkillsPage() {
  const { t } = useLocale();
  return <CrudPage config={{ ...config, Form: SkillForm }} title={t("admin.nav.skills")} />;
}
