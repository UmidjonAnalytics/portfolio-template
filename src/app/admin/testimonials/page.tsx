"use client";

import { MessageSquareQuote } from "lucide-react";
import { CrudPage, type CrudConfig } from "@/components/admin/CrudPage";
import { Field, Input, LocalizedInput, NumberInput } from "@/components/admin/fields";
import { ImageField } from "@/components/admin/MediaField";
import { useLocale } from "@/lib/i18n";
import { emptyLocalized, type Testimonial } from "@/lib/types";

function TestimonialForm({ value, onChange }: { value: Testimonial; onChange: (v: Testimonial) => void }) {
  const { t } = useLocale();
  const set = (patch: Partial<Testimonial>) => onChange({ ...value, ...patch });
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("admin.fields.name")} htmlFor="t-name" required>
          <Input id="t-name" value={value.name} onChange={(name) => set({ name })} />
        </Field>
        <Field label={t("admin.fields.company")} htmlFor="t-company">
          <Input id="t-company" value={value.company} onChange={(company) => set({ company })} />
        </Field>
      </div>
      <LocalizedInput label={t("admin.fields.role")} value={value.role} onChange={(role) => set({ role })} />
      <LocalizedInput label={t("admin.fields.quote")} value={value.quote} onChange={(quote) => set({ quote })} multiline rows={4} required />
      <div className="grid gap-4 sm:grid-cols-[1fr_2fr] items-start">
        <Field label={t("admin.fields.rating")} htmlFor="t-rating">
          <NumberInput id="t-rating" min={1} max={5} value={value.rating} onChange={(v) => set({ rating: v ?? 5 })} />
        </Field>
        <ImageField label={t("admin.fields.avatar")} value={value.avatar} onChange={(avatar) => set({ avatar })} folder="testimonials" aspect="aspect-square max-w-[10rem]" />
      </div>
    </>
  );
}

const config: Omit<CrudConfig<Testimonial>, "Form"> = {
  collection: "testimonials",
  itemKey: "testimonial",
  icon: MessageSquareQuote,
  getTitle: (x) => x.name,
  getSubtitle: (x, tr) => [tr(x.role), x.company].filter(Boolean).join(" · "),
  getThumb: (x) => x.avatar,
  squareThumb: true,
  newItem: () => ({ name: "", role: emptyLocalized(), company: "", quote: emptyLocalized(), avatar: "", rating: 5 }),
  validate: (x, t) => (x.name.trim() && x.quote.en.trim() ? null : t("admin.form.requiredEn")),
};

export default function TestimonialsPage() {
  const { t } = useLocale();
  return <CrudPage config={{ ...config, Form: TestimonialForm }} title={t("admin.nav.testimonials")} />;
}
