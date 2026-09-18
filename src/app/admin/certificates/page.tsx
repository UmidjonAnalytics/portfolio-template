"use client";

import { Award } from "lucide-react";
import { CrudPage, type CrudConfig } from "@/components/admin/CrudPage";
import { Field, Input, LocalizedInput } from "@/components/admin/fields";
import { ImageField, StorageNotice } from "@/components/admin/MediaField";
import { useLocale } from "@/lib/i18n";
import { emptyLocalized, type Certificate } from "@/lib/types";
import { formatMonth } from "@/lib/utils";

function CertificateForm({ value, onChange }: { value: Certificate; onChange: (v: Certificate) => void }) {
  const { t } = useLocale();
  const set = (patch: Partial<Certificate>) => onChange({ ...value, ...patch });
  return (
    <>
      <LocalizedInput label={t("admin.fields.title")} value={value.title} onChange={(title) => set({ title })} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("admin.fields.issuer")} htmlFor="c-issuer" required>
          <Input id="c-issuer" value={value.issuer} onChange={(issuer) => set({ issuer })} placeholder="Google / Coursera" />
        </Field>
        <Field label={t("admin.fields.date")} htmlFor="c-date">
          <Input id="c-date" type="month" value={value.date} onChange={(date) => set({ date })} />
        </Field>
        <Field label={t("admin.fields.credentialId")} htmlFor="c-cred">
          <Input id="c-cred" value={value.credentialId} onChange={(credentialId) => set({ credentialId })} className="font-mono" />
        </Field>
        <Field label={t("admin.fields.verifyUrl")} htmlFor="c-verify">
          <Input id="c-verify" type="url" value={value.verifyUrl} onChange={(verifyUrl) => set({ verifyUrl })} placeholder="https://…" />
        </Field>
      </div>
      <StorageNotice />
      <ImageField label={t("admin.fields.image")} value={value.image} onChange={(image) => set({ image })} folder="certificates" aspect="aspect-[4/3]" />
    </>
  );
}

const config: Omit<CrudConfig<Certificate>, "Form"> = {
  collection: "certificates",
  itemKey: "certificate",
  icon: Award,
  getTitle: (c, tr) => tr(c.title),
  getSubtitle: (c) => [c.issuer, c.date ? formatMonth(c.date, "en") : ""].filter(Boolean).join(" · "),
  getThumb: (c) => c.image,
  newItem: () => ({ title: emptyLocalized(), issuer: "", date: "", credentialId: "", verifyUrl: "", image: "" }),
  validate: (c, t) => (c.title.en.trim() && c.issuer.trim() ? null : t("admin.form.requiredEn")),
};

export default function CertificatesPage() {
  const { t } = useLocale();
  return <CrudPage config={{ ...config, Form: CertificateForm }} title={t("admin.nav.certificates")} />;
}
