"use client";

import { FolderKanban, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { CrudPage, type CrudConfig } from "@/components/admin/CrudPage";
import { Field, FormSection, Input, LocalizedInput, NumberInput, TagsInput, Toggle, inputClass } from "@/components/admin/fields";
import { FileField, GalleryField, ImageField, StorageNotice } from "@/components/admin/MediaField";
import { validateChart } from "@/components/public/InteractiveChart";
import { useLocale } from "@/lib/i18n";
import { emptyLocalized, PROJECT_DOMAINS, PROJECT_TOOLS, type Project, type ProjectChart, type ProjectMetric } from "@/lib/types";
import { cn, filled, formatMonth } from "@/lib/utils";

const CHART_EXAMPLE: ProjectChart = {
  type: "bar",
  xKey: "month",
  series: [
    { key: "revenue", name: { en: "Revenue", ru: "Выручка", uz: "Tushum" } },
    { key: "target", name: { en: "Target", ru: "План", uz: "Reja" } },
  ],
  data: [
    { month: "Jan", revenue: 120, target: 100 },
    { month: "Feb", revenue: 135, target: 110 },
    { month: "Mar", revenue: 150, target: 120 },
    { month: "Apr", revenue: 142, target: 130 },
  ],
};

function MetricsEditor({ value, onChange }: { value: ProjectMetric[]; onChange: (v: ProjectMetric[]) => void }) {
  const { t } = useLocale();
  const update = (i: number, patch: Partial<ProjectMetric>) => onChange(value.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  return (
    <div className="space-y-3">
      {value.map((m, i) => (
        <div key={i} className="rounded-2xl border border-line p-3 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] items-end">
          <Field label={t("admin.fields.metricValue")} htmlFor={`m-value-${i}`}>
            <Input id={`m-value-${i}`} value={m.value} onChange={(v) => update(i, { value: v })} placeholder="-34%" className="font-mono" />
          </Field>
          <LocalizedInput label={t("admin.fields.metricLabel")} value={m.label} onChange={(label) => update(i, { label })} />
          <LocalizedInput label={t("admin.fields.metricHint")} value={m.hint ?? emptyLocalized()} onChange={(hint) => update(i, { hint })} />
          <button
            type="button"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            aria-label={t("common.remove")}
            className="h-10 w-10 inline-flex items-center justify-center rounded-full border border-line text-muted hover:text-danger hover:bg-danger-soft"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, { label: emptyLocalized(), value: "", hint: emptyLocalized() }])}
        className="inline-flex items-center gap-2 h-9 px-4 rounded-full border border-dashed border-line-strong text-sm font-semibold hover:bg-surface-2"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        {t("admin.fields.addMetric")}
      </button>
    </div>
  );
}

function ChartEditor({ value, onChange }: { value: ProjectChart | null | undefined; onChange: (v: ProjectChart | null) => void }) {
  const { t } = useLocale();
  const [text, setText] = useState(() => (value ? JSON.stringify(value, null, 2) : ""));
  const [error, setError] = useState<string | null>(null);
  const enabled = value !== null && value !== undefined;

  const apply = (raw: string) => {
    setText(raw);
    if (!raw.trim()) {
      setError(null);
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      const err = validateChart(parsed);
      setError(err);
      if (!err) onChange(parsed as ProjectChart);
    } catch {
      setError(t("admin.fields.chartInvalid"));
    }
  };

  return (
    <div className="space-y-3">
      <Toggle
        checked={enabled}
        onChange={(on) => {
          if (on) {
            const initial = text.trim() ? null : CHART_EXAMPLE;
            if (initial) {
              setText(JSON.stringify(initial, null, 2));
              onChange(initial);
            } else apply(text);
          } else onChange(null);
        }}
        label={t("admin.fields.chartEnabled")}
      />
      {enabled && (
        <Field
          label={t("admin.fields.chartJson")}
          hint={t("admin.fields.chartHelp")}
          error={error ?? undefined}
          htmlFor="chart-json"
          right={
            <button type="button" onClick={() => apply(JSON.stringify(CHART_EXAMPLE, null, 2))} className="text-xs font-bold text-accent-strong hover:underline">
              {t("admin.fields.chartExample")}
            </button>
          }
        >
          <textarea id="chart-json" value={text} onChange={(e) => apply(e.target.value)} rows={12} spellCheck={false} className={cn(inputClass, "font-mono text-xs leading-relaxed")} />
          {!error && text.trim() && <p className="text-xs text-success">{t("admin.fields.chartValid")}</p>}
        </Field>
      )}
    </div>
  );
}

function ProjectForm({ value, onChange }: { value: Project; onChange: (v: Project) => void }) {
  const { t } = useLocale();
  const set = (patch: Partial<Project>) => onChange({ ...value, ...patch });
  return (
    <>
      <FormSection title={t("admin.form.generalSection")}>
        <LocalizedInput label={t("admin.fields.title")} value={value.title} onChange={(title) => set({ title })} required />
        <LocalizedInput label={t("admin.fields.summary")} value={value.summary} onChange={(summary) => set({ summary })} required />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("admin.fields.domain")} htmlFor="p-domain">
            <Input id="p-domain" list="domain-list" value={value.domain} onChange={(domain) => set({ domain })} />
            <datalist id="domain-list">
              {PROJECT_DOMAINS.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </Field>
          <Field label={t("admin.fields.date")} htmlFor="p-date">
            <Input id="p-date" type="month" value={value.date} onChange={(date) => set({ date })} />
          </Field>
          <Field label={t("admin.fields.impact")} hint={t("admin.fields.impactHint")} htmlFor="p-impact">
            <NumberInput id="p-impact" min={1} max={10} value={value.impact} onChange={(v) => set({ impact: v ?? 5 })} />
          </Field>
        </div>
        <TagsInput label={t("admin.fields.tools")} value={value.tools} onChange={(tools) => set({ tools })} suggestions={PROJECT_TOOLS} placeholder={t("admin.fields.customTool")} />
        <Toggle checked={value.featured} onChange={(featured) => set({ featured })} label={t("admin.fields.featured")} description={t("admin.fields.featuredHint")} />
      </FormSection>

      <FormSection title={t("admin.form.contentSection")}>
        <LocalizedInput label={t("admin.fields.problem")} value={value.problem} onChange={(problem) => set({ problem })} multiline rows={4} />
        <LocalizedInput label={t("admin.fields.approach")} value={value.approach} onChange={(approach) => set({ approach })} multiline rows={4} />
        <LocalizedInput label={t("admin.fields.result")} value={value.result} onChange={(result) => set({ result })} multiline rows={4} />
        <Field label={t("admin.fields.metrics")}>
          <MetricsEditor value={value.metrics ?? []} onChange={(metrics) => set({ metrics })} />
        </Field>
      </FormSection>

      <FormSection title={t("admin.form.mediaSection")}>
        <StorageNotice />
        <ImageField label={t("admin.fields.cover")} value={value.cover} onChange={(cover) => set({ cover })} folder="projects" />
        <GalleryField label={t("admin.fields.gallery")} value={value.gallery ?? []} onChange={(gallery) => set({ gallery })} folder="projects" />
      </FormSection>

      <FormSection title={t("admin.form.linksSection")}>
        <Field label={t("admin.fields.embedUrl")} hint={t("admin.fields.embedHint")} htmlFor="p-embed">
          <Input id="p-embed" type="url" value={value.embedUrl} onChange={(embedUrl) => set({ embedUrl })} placeholder="https://app.powerbi.com/view?r=…" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("admin.fields.github")} htmlFor="p-github">
            <Input id="p-github" type="url" value={value.github} onChange={(github) => set({ github })} />
          </Field>
          <Field label={t("admin.fields.demo")} htmlFor="p-demo">
            <Input id="p-demo" type="url" value={value.demo} onChange={(demo) => set({ demo })} />
          </Field>
        </div>
        <FileField
          label={t("admin.fields.file")}
          value={value.file}
          onChange={(file) => set({ file })}
          folder="files"
          accept=".pdf,.xlsx,.xls,.csv,.pbix,.twbx,.zip,.ipynb"
          acceptTypes={[]}
        />
      </FormSection>

      <FormSection title={t("admin.form.chartSection")}>
        <ChartEditor value={value.chart} onChange={(chart) => set({ chart })} />
      </FormSection>
    </>
  );
}

const config: Omit<CrudConfig<Project>, "Form"> = {
  collection: "projects",
  itemKey: "project",
  icon: FolderKanban,
  getTitle: (p, tr) => tr(p.title),
  getSubtitle: (p) => [p.domain, p.tools?.join(", "), p.date ? formatMonth(p.date, "en") : ""].filter(Boolean).join(" · "),
  getThumb: (p) => p.cover,
  newItem: () => ({
    title: emptyLocalized(),
    summary: emptyLocalized(),
    problem: emptyLocalized(),
    approach: emptyLocalized(),
    result: emptyLocalized(),
    tools: [],
    domain: "",
    cover: "",
    gallery: [],
    metrics: [],
    embedUrl: "",
    github: "",
    demo: "",
    file: "",
    featured: false,
    impact: 5,
    date: new Date().toISOString().slice(0, 7),
    chart: null,
  }),
  validate: (p, t) => (filled(p.title) && filled(p.summary) ? null : t("admin.form.requiredEn")),
  beforeSave: (p) => ({ ...p, chart: p.chart ?? null, metrics: (p.metrics ?? []).filter((m) => m.value.trim() || filled(m.label)) }),
};

export default function ProjectsPage() {
  const { t } = useLocale();
  return <CrudPage config={{ ...config, Form: ProjectForm }} title={t("admin.nav.projects")} />;
}
