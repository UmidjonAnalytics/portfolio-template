"use client";

import { Briefcase } from "lucide-react";
import { CrudPage, type CrudConfig } from "@/components/admin/CrudPage";
import { Field, Input, LocalizedInput, LocalizedListInput } from "@/components/admin/fields";
import { useLocale } from "@/lib/i18n";
import { emptyLocalized, emptyLocalizedList, type Experience } from "@/lib/types";
import { filled, formatMonth } from "@/lib/utils";

function ExperienceForm({ value, onChange }: { value: Experience; onChange: (v: Experience) => void }) {
  const { t } = useLocale();
  const set = (patch: Partial<Experience>) => onChange({ ...value, ...patch });
  return (
    <>
      <Field label={t("admin.fields.company")} htmlFor="e-company" required>
        <Input id="e-company" value={value.company} onChange={(company) => set({ company })} />
      </Field>
      <LocalizedInput label={t("admin.fields.role")} value={value.role} onChange={(role) => set({ role })} required />
      <LocalizedInput label={t("admin.fields.location")} value={value.location} onChange={(location) => set({ location })} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("admin.fields.startDate")} htmlFor="e-start" required>
          <Input id="e-start" type="month" value={value.startDate} onChange={(startDate) => set({ startDate })} />
        </Field>
        <Field label={t("admin.fields.endDate")} hint={t("admin.fields.endDateHint")} htmlFor="e-end">
          <Input id="e-end" type="month" value={value.endDate} onChange={(endDate) => set({ endDate })} />
        </Field>
      </div>
      <LocalizedListInput label={t("admin.fields.bullets")} hint={t("admin.fields.bulletsHint")} value={value.bullets} onChange={(bullets) => set({ bullets })} rows={5} />
    </>
  );
}

const config: Omit<CrudConfig<Experience>, "Form"> = {
  collection: "experience",
  itemKey: "experience",
  icon: Briefcase,
  getTitle: (e, tr) => `${tr(e.role)} — ${e.company}`,
  getSubtitle: (e, _tr, t) => `${formatMonth(e.startDate, "en")} — ${formatMonth(e.endDate, "en", t("experience.present"))}`,
  newItem: () => ({ company: "", role: emptyLocalized(), location: emptyLocalized(), startDate: "", endDate: "", bullets: emptyLocalizedList() }),
  validate: (e, t) => (e.company.trim() && filled(e.role) ? null : t("admin.form.requiredEn")),
};

export default function ExperiencePage() {
  const { t } = useLocale();
  return <CrudPage config={{ ...config, Form: ExperienceForm }} title={t("admin.nav.experience")} />;
}
