"use client";

import { doc, setDoc } from "firebase/firestore";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/AdminShell";
import { Field, FormLangProvider, FormSection, Input, LangTabs, LocalizedInput, LocalizedListInput, NumberInput, Select } from "@/components/admin/fields";
import { FileField, ImageField, StorageNotice } from "@/components/admin/MediaField";
import { LocalizedRichText } from "@/components/admin/RichTextEditor";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { db } from "@/lib/firebase";
import { useLocale } from "@/lib/i18n";
import { useSiteData } from "@/lib/site-data";
import type { Availability, Profile } from "@/lib/types";

export default function ProfilePage() {
  const { t } = useLocale();
  const { profile, loading } = useSiteData();
  const [draft, setDraft] = useState<Profile | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading.profile && (!draft || !dirty)) setDraft(profile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, loading.profile]);

  const update = (patch: Partial<Profile>) => {
    setDraft((d) => (d ? { ...d, ...patch } : d));
    setDirty(true);
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "site", "profile"), { ...draft, updatedAt: Date.now() });
      toast.success(t("admin.crud.savedToast"));
      setDirty(false);
    } catch (e) {
      console.error(e);
      toast.error(t("admin.crud.errorToast"));
    } finally {
      setSaving(false);
    }
  };

  if (!draft) {
    return (
      <>
        <PageHeader title={t("admin.profile.title")} subtitle={t("admin.profile.subtitle")} />
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </>
    );
  }

  const availabilityOptions: { value: Availability; label: string }[] = [
    { value: "open", label: t("hero.availability.open") },
    { value: "freelance", label: t("hero.availability.freelance") },
    { value: "unavailable", label: t("hero.availability.unavailable") },
  ];

  return (
    <FormLangProvider>
      <PageHeader
        title={t("admin.profile.title")}
        subtitle={t("admin.profile.subtitle")}
        action={
          <div className="flex items-center gap-3">
            <LangTabs />
            <Button onClick={save} loading={saving} disabled={!dirty}>
              {!saving && <Save className="h-4 w-4" aria-hidden="true" />}
              {saving ? t("common.saving") : t("common.save")}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-6">
          <div className="card p-6 space-y-5">
            <FormSection title={t("admin.profile.basic")}>
              <Field label={t("admin.fields.name")} htmlFor="p-name" required>
                <Input id="p-name" value={draft.name} onChange={(v) => update({ name: v })} />
              </Field>
              <LocalizedListInput label={t("admin.fields.titles")} hint={t("admin.fields.titlesHint")} value={draft.titles} onChange={(v) => update({ titles: v })} rows={3} />
              <LocalizedInput label={t("admin.fields.tagline")} value={draft.tagline} onChange={(v) => update({ tagline: v })} required />
              <LocalizedRichText label={t("admin.fields.bio")} value={draft.bio} onChange={(v) => update({ bio: v })} />
              <div className="grid gap-4 sm:grid-cols-2">
                <LocalizedInput label={t("admin.fields.location")} value={draft.location} onChange={(v) => update({ location: v })} />
                <Field label={t("admin.fields.availability")} htmlFor="p-availability">
                  <Select id="p-availability" value={draft.availability} onChange={(v) => update({ availability: v })} options={availabilityOptions} />
                </Field>
              </div>
              <LocalizedListInput label={t("admin.fields.spokenLanguages")} hint={t("admin.fields.spokenLanguagesHint")} value={draft.spokenLanguages} onChange={(v) => update({ spokenLanguages: v })} rows={3} />
            </FormSection>
          </div>

          <div className="card p-6 space-y-5">
            <FormSection title={t("admin.profile.contact")}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("admin.fields.email")} htmlFor="p-email">
                  <Input id="p-email" type="email" value={draft.email} onChange={(v) => update({ email: v })} />
                </Field>
                <Field label={t("admin.fields.phone")} htmlFor="p-phone">
                  <Input id="p-phone" type="tel" value={draft.phone} onChange={(v) => update({ phone: v })} placeholder="+998 90 123 45 67" />
                </Field>
                <Field label={t("admin.fields.telegram")} htmlFor="p-telegram">
                  <Input id="p-telegram" value={draft.telegram} onChange={(v) => update({ telegram: v })} placeholder="@username" />
                </Field>
                <Field label={t("admin.fields.linkedin")} htmlFor="p-linkedin">
                  <Input id="p-linkedin" type="url" value={draft.linkedin} onChange={(v) => update({ linkedin: v })} placeholder="https://linkedin.com/in/…" />
                </Field>
                <Field label={t("admin.fields.githubProfile")} htmlFor="p-github">
                  <Input id="p-github" type="url" value={draft.github} onChange={(v) => update({ github: v })} placeholder="https://github.com/…" />
                </Field>
              </div>
            </FormSection>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6 space-y-5">
            <FormSection title={t("admin.profile.media")}>
              <StorageNotice />
              <ImageField label={t("admin.fields.photo")} value={draft.photo} onChange={(v) => update({ photo: v })} folder="profile" aspect="aspect-[4/5]" />
              <FileField label={t("admin.fields.cv")} hint={t("admin.media.pdfOnly")} value={draft.cv} onChange={(v) => update({ cv: v })} folder="cv" />
            </FormSection>
          </div>

          <div className="card p-6 space-y-5">
            <FormSection title={t("admin.profile.counters")} description={t("admin.fields.statsHint")}>
              <div className="grid gap-4 grid-cols-2">
                <Field label={t("admin.fields.statProjects")} htmlFor="s-projects">
                  <NumberInput id="s-projects" min={0} value={draft.stats?.projects} onChange={(v) => update({ stats: { ...draft.stats, projects: v } })} />
                </Field>
                <Field label={t("admin.fields.statYears")} htmlFor="s-years">
                  <NumberInput id="s-years" min={0} value={draft.stats?.yearsExperience} onChange={(v) => update({ stats: { ...draft.stats, yearsExperience: v } })} />
                </Field>
                <Field label={t("admin.fields.statTools")} htmlFor="s-tools">
                  <NumberInput id="s-tools" min={0} value={draft.stats?.tools} onChange={(v) => update({ stats: { ...draft.stats, tools: v } })} />
                </Field>
                <Field label={t("admin.fields.statStudents")} htmlFor="s-students">
                  <NumberInput id="s-students" min={0} value={draft.stats?.studentsTaught} onChange={(v) => update({ stats: { ...draft.stats, studentsTaught: v } })} />
                </Field>
              </div>
            </FormSection>
          </div>
        </div>
      </div>

      <div className="sticky bottom-4 mt-6 flex justify-end">
        <Button onClick={save} loading={saving} disabled={!dirty} size="lg" className="shadow-float">
          {!saving && <Save className="h-4 w-4" aria-hidden="true" />}
          {saving ? t("common.saving") : t("common.save")}
        </Button>
      </div>
    </FormLangProvider>
  );
}
