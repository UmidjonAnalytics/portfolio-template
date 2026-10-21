"use client";

import { BookOpen } from "lucide-react";
import { CrudPage, type CrudConfig } from "@/components/admin/CrudPage";
import { Field, Input, LocalizedInput, TagsInput } from "@/components/admin/fields";
import { ImageField } from "@/components/admin/MediaField";
import { LocalizedRichText } from "@/components/admin/RichTextEditor";
import { useLocale } from "@/lib/i18n";
import { emptyLocalized, type BlogPost } from "@/lib/types";
import { filled, formatDate, pick, slugify } from "@/lib/utils";

function BlogForm({ value, onChange }: { value: BlogPost; onChange: (v: BlogPost) => void }) {
  const { t } = useLocale();
  const set = (patch: Partial<BlogPost>) => onChange({ ...value, ...patch });
  return (
    <>
      <LocalizedInput
        label={t("admin.fields.title")}
        value={value.title}
        onChange={(title) => set({ title, slug: value.slug || slugify(pick(title, "en")) })}
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("admin.fields.slug")} hint={t("admin.fields.slugHint")} htmlFor="b-slug" required>
          <Input id="b-slug" value={value.slug} onChange={(slug) => set({ slug: slugify(slug) || slug.toLowerCase() })} className="font-mono" />
        </Field>
        <Field label={t("admin.fields.date")} htmlFor="b-date">
          <Input id="b-date" type="date" value={value.date} onChange={(date) => set({ date })} />
        </Field>
      </div>
      <LocalizedInput label={t("admin.fields.excerpt")} value={value.excerpt} onChange={(excerpt) => set({ excerpt })} multiline rows={2} />
      <LocalizedRichText label={t("admin.fields.content")} value={value.content} onChange={(content) => set({ content })} required />
      <TagsInput label={t("admin.fields.tags")} hint={t("admin.fields.tagsHint")} value={value.tags ?? []} onChange={(tags) => set({ tags })} />
      <ImageField label={t("admin.fields.cover")} value={value.cover} onChange={(cover) => set({ cover })} folder="blog" />
    </>
  );
}

const config: Omit<CrudConfig<BlogPost>, "Form"> = {
  collection: "blog",
  itemKey: "post",
  icon: BookOpen,
  getTitle: (p, tr) => tr(p.title),
  getSubtitle: (p) => [p.date ? formatDate(p.date, "en") : "", `/blog/${p.slug}`].filter(Boolean).join(" · "),
  getThumb: (p) => p.cover,
  newItem: () => ({ title: emptyLocalized(), slug: "", excerpt: emptyLocalized(), content: emptyLocalized(), cover: "", tags: [], date: new Date().toISOString().slice(0, 10) }),
  validate: (p, t) => (filled(p.title) && filled(p.content) && p.slug.trim() ? null : t("admin.form.requiredEn")),
  beforeSave: (p) => ({ ...p, slug: slugify(p.slug) || slugify(pick(p.title, "en")) }),
};

export default function BlogPage() {
  const { t } = useLocale();
  return <CrudPage config={{ ...config, Form: BlogForm }} title={t("admin.nav.blog")} />;
}
