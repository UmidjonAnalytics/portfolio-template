"use client";

import { GraduationCap } from "lucide-react";
import { CrudPage, type CrudConfig } from "@/components/admin/CrudPage";
import { Field, Input, LocalizedInput } from "@/components/admin/fields";
import { useLocale } from "@/lib/i18n";
import { emptyLocalized, type Education } from "@/lib/types";
import { formatMonth } from "@/lib/utils";

function EducationForm({ value, onChange }: { value: Education; onChange: (v: Education) => void }) {
  const { t } = useLocale();
  const set = (patch: Partial<Education>) => onChange({ ...value, ...patch });
  return (
    <>
      <LocalizedInput label={t("admin.fields.school")} value={value.school} onChange={(school) => set({ school })} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <LocalizedInput label={t("admin.fields.degree")} value={value.degree} onChange={(degree) => set({ degree })} />
        <LocalizedInput label={t("admin.fields.field")} value={value.field} onChange={(field) => set({ field })} />
        <Field label={t("admin.fields.startDate")} htmlFor="ed-start">
          <Input id="ed-start" type="month" value={value.startDate} onChange={(startDate) => set({ startDate })} />
        </Field>
        <Field label={t("admin.fields.endDate")} htmlFor="ed-end">
          <Input id="ed-end" type="month" value={value.endDate} onChange={(endDate) => set({ endDate })} />
        </Field>
      </div>
      <LocalizedInput label={t("admin.fields.description")} value={value.description} onChange={(description) => set({ description })} multiline rows={3} />
    </>
  );
}

const config: Omit<CrudConfig<Education>, "Form"> = {
  collection: "education",
  itemKey: "education",
  icon: GraduationCap,
  getTitle: (e, tr) => tr(e.school),
  getSubtitle: (e, tr) => [tr(e.degree), tr(e.field), e.startDate ? `${formatMonth(e.startDate, "en")} — ${formatMonth(e.endDate, "en", "…")}` : ""].filter(Boolean).join(" · "),
  newItem: () => ({ school: emptyLocalized(), degree: emptyLocalized(), field: emptyLocalized(), startDate: "", endDate: "", description: emptyLocalized() }),
  validate: (e, t) => (e.school.en.trim() ? null : t("admin.form.requiredEn")),
};

export default function EducationPage() {
  const { t } = useLocale();
  return <CrudPage config={{ ...config, Form: EducationForm }} title={t("admin.nav.education")} />;
}
