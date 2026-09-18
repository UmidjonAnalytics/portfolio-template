"use client";

import { doc, setDoc } from "firebase/firestore";
import { AlertTriangle, Database, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/AdminShell";
import { Field, FormLangProvider, FormSection, Input, LangTabs, LocalizedInput, Select, Textarea, Toggle, inputClass } from "@/components/admin/fields";
import { ImageField } from "@/components/admin/MediaField";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { db } from "@/lib/firebase";
import { useLocale } from "@/lib/i18n";
import { clearAll, seedAll } from "@/lib/seed";
import { useSiteData } from "@/lib/site-data";
import { useTheme } from "@/lib/theme";
import { LANGS, SECTION_KEYS, type Lang, type SiteSettings, type Theme } from "@/lib/types";
import { cn, isValidHex } from "@/lib/utils";

const PRESETS = ["#0f8b8d", "#2563eb", "#7c3aed", "#db2777", "#ea580c", "#16a34a", "#0f172a", "#b45309"];

export default function SettingsPage() {
  const { t } = useLocale();
  const { settings, loading } = useSiteData();
  const { applyAccent } = useTheme();
  const [draft, setDraft] = useState<SiteSettings | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmSeed, setConfirmSeed] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearText, setClearText] = useState("");
  const [busy, setBusy] = useState<"seed" | "clear" | null>(null);
  const [allowlistText, setAllowlistText] = useState("");

  useEffect(() => {
    if (!loading.settings && (!draft || !dirty)) {
      setDraft(settings);
      setAllowlistText(settings.embedAllowlist.join("\n"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, loading.settings]);

  const update = (patch: Partial<SiteSettings>) => {
    setDraft((d) => (d ? { ...d, ...patch } : d));
    setDirty(true);
  };

  const save = async () => {
    if (!draft) return;
    if (!isValidHex(draft.accentColor)) {
      toast.error(t("admin.settings.accentHint"));
      return;
    }
    setSaving(true);
    try {
      await setDoc(doc(db, "site", "settings"), { ...draft, updatedAt: Date.now() });
      applyAccent(draft.accentColor);
      toast.success(t("admin.crud.savedToast"));
      setDirty(false);
    } catch (e) {
      console.error(e);
      toast.error(t("admin.crud.errorToast"));
    } finally {
      setSaving(false);
    }
  };

  const runSeed = async () => {
    setConfirmSeed(false);
    setBusy("seed");
    try {
      await seedAll(db);
      toast.success(t("admin.settings.seeded"));
    } catch (e) {
      console.error(e);
      toast.error(t("admin.crud.errorToast"));
    } finally {
      setBusy(null);
    }
  };

  const runClear = async () => {
    if (clearText !== "DELETE") return;
    setConfirmClear(false);
    setClearText("");
    setBusy("clear");
    try {
      await clearAll(db);
      toast.success(t("admin.settings.cleared"));
    } catch (e) {
      console.error(e);
      toast.error(t("admin.crud.errorToast"));
    } finally {
      setBusy(null);
    }
  };

  if (!draft) {
    return (
      <>
        <PageHeader title={t("admin.settings.title")} subtitle={t("admin.settings.subtitle")} />
        <Skeleton className="h-64 w-full" />
      </>
    );
  }

  const saveButton = (
    <Button onClick={save} loading={saving} disabled={!dirty}>
      {!saving && <Save className="h-4 w-4" aria-hidden="true" />}
      {saving ? t("common.saving") : t("common.save")}
    </Button>
  );

  return (
    <FormLangProvider>
      <PageHeader
        title={t("admin.settings.title")}
        subtitle={t("admin.settings.subtitle")}
        action={
          <div className="flex items-center gap-3">
            <LangTabs />
            {saveButton}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6 space-y-5">
          <FormSection title={t("admin.settings.general")}>
            <Field label={t("admin.settings.siteName")} hint={t("admin.settings.siteNameHint")} htmlFor="s-name">
              <Input id="s-name" value={draft.siteName} onChange={(siteName) => update({ siteName })} />
            </Field>
            <Field label={t("admin.settings.accent")} hint={t("admin.settings.accentHint")} htmlFor="s-accent">
              <div className="flex flex-wrap items-center gap-2">
                {PRESETS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      update({ accentColor: c });
                      applyAccent(c);
                    }}
                    aria-label={c}
                    aria-pressed={draft.accentColor.toLowerCase() === c}
                    className={cn("h-8 w-8 rounded-full border-2 transition", draft.accentColor.toLowerCase() === c ? "border-fg scale-110" : "border-transparent")}
                    style={{ background: c }}
                  />
                ))}
                <input
                  type="color"
                  value={isValidHex(draft.accentColor) ? draft.accentColor : "#0f8b8d"}
                  onChange={(e) => {
                    update({ accentColor: e.target.value });
                    applyAccent(e.target.value);
                  }}
                  aria-label={t("admin.settings.accent")}
                  className="h-8 w-10 rounded-lg border border-line bg-surface cursor-pointer"
                />
                <Input id="s-accent" value={draft.accentColor} onChange={(accentColor) => update({ accentColor })} className="w-28 font-mono" maxLength={7} />
              </div>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("admin.settings.defaultLang")} htmlFor="s-lang">
                <Select<Lang> id="s-lang" value={draft.defaultLang} onChange={(defaultLang) => update({ defaultLang })} options={LANGS.map((l) => ({ value: l, label: t(`lang.${l}`) }))} />
              </Field>
              <Field label={t("admin.settings.defaultTheme")} htmlFor="s-theme">
                <Select<Theme>
                  id="s-theme"
                  value={draft.defaultTheme}
                  onChange={(defaultTheme) => update({ defaultTheme })}
                  options={[
                    { value: "system", label: t("theme.system") },
                    { value: "light", label: t("theme.light") },
                    { value: "dark", label: t("theme.dark") },
                  ]}
                />
              </Field>
            </div>
          </FormSection>

          <FormSection title={t("admin.settings.sections")} description={t("admin.settings.sectionsHint")}>
            <div className="grid gap-3 sm:grid-cols-2">
              {SECTION_KEYS.map((k) => (
                <Toggle key={k} checked={draft.sections[k] !== false} onChange={(v) => update({ sections: { ...draft.sections, [k]: v } })} label={t(`nav.${k}`)} />
              ))}
            </div>
          </FormSection>
        </div>

        <div className="space-y-6">
          <div className="card p-6 space-y-5">
            <FormSection title={t("admin.settings.seo")}>
              <LocalizedInput label={t("admin.settings.seoTitle")} value={draft.seoTitle} onChange={(seoTitle) => update({ seoTitle })} />
              <LocalizedInput label={t("admin.settings.seoDescription")} value={draft.seoDescription} onChange={(seoDescription) => update({ seoDescription })} multiline rows={3} />
              <ImageField label={t("admin.settings.favicon")} value={draft.favicon} onChange={(favicon) => update({ favicon })} folder="site" aspect="aspect-square max-w-[6rem]" />
              <Field label={t("admin.settings.gaId")} hint={t("admin.settings.gaHint")} htmlFor="s-ga">
                <Input id="s-ga" value={draft.gaId} onChange={(gaId) => update({ gaId })} placeholder="G-XXXXXXXXXX" className="font-mono" />
              </Field>
              <Field label={t("admin.settings.embedAllowlist")} hint={t("admin.settings.embedHint")} htmlFor="s-allow">
                <Textarea
                  id="s-allow"
                  rows={4}
                  value={allowlistText}
                  className="font-mono text-xs"
                  onChange={(v) => {
                    setAllowlistText(v);
                    update({ embedAllowlist: v.split("\n").map((s) => s.trim().toLowerCase()).filter(Boolean) });
                  }}
                />
              </Field>
            </FormSection>
          </div>

          <div className="card p-6 border-danger/40 space-y-5">
            <FormSection title={t("admin.settings.danger")} description={t("admin.settings.dangerHint")}>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 rounded-2xl border border-line p-4">
                  <p className="font-semibold flex items-center gap-2">
                    <Database className="h-4 w-4 text-accent-strong" aria-hidden="true" />
                    {t("admin.settings.seed")}
                  </p>
                  <p className="mt-1 text-xs text-muted">{t("admin.settings.seedHint")}</p>
                  <Button variant="secondary" size="sm" className="mt-3" onClick={() => setConfirmSeed(true)} loading={busy === "seed"} disabled={busy !== null}>
                    {busy === "seed" ? t("admin.settings.seeding") : t("admin.settings.seed")}
                  </Button>
                </div>
                <div className="flex-1 rounded-2xl border border-danger/40 bg-danger-soft/40 p-4">
                  <p className="font-semibold flex items-center gap-2 text-danger">
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                    {t("admin.settings.clear")}
                  </p>
                  <p className="mt-1 text-xs text-muted">{t("admin.settings.clearHint")}</p>
                  <Button variant="danger" size="sm" className="mt-3" onClick={() => setConfirmClear(true)} loading={busy === "clear"} disabled={busy !== null}>
                    {busy !== "clear" && <Trash2 className="h-4 w-4" aria-hidden="true" />}
                    {busy === "clear" ? t("admin.settings.clearing") : t("admin.settings.clear")}
                  </Button>
                </div>
              </div>
            </FormSection>
          </div>
        </div>
      </div>

      <div className="sticky bottom-4 mt-6 flex justify-end">{saveButton}</div>

      <ConfirmDialog open={confirmSeed} title={t("admin.settings.seedConfirm")} description={t("admin.settings.seedHint")} confirmLabel={t("admin.settings.seed")} cancelLabel={t("common.cancel")} onConfirm={runSeed} onCancel={() => setConfirmSeed(false)} />
      <ConfirmDialog
        open={confirmClear}
        title={t("admin.settings.clearConfirm")}
        description={t("admin.settings.clearHint")}
        confirmLabel={t("admin.settings.clear")}
        cancelLabel={t("common.cancel")}
        onConfirm={runClear}
        onCancel={() => {
          setConfirmClear(false);
          setClearText("");
        }}
        danger
      >
        <label className="block text-sm font-semibold mb-1.5" htmlFor="clear-confirm">
          {t("admin.settings.clearConfirmType")}
        </label>
        <input id="clear-confirm" value={clearText} onChange={(e) => setClearText(e.target.value)} className={cn(inputClass, "font-mono")} autoComplete="off" />
      </ConfirmDialog>
    </FormLangProvider>
  );
}
