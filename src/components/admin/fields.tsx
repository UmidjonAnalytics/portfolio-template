"use client";

import { X } from "lucide-react";
import { createContext, useContext, useId, useState, type ReactNode } from "react";
import { useLocale } from "@/lib/i18n";
import { LANGS, type Lang, type Localized, type LocalizedList } from "@/lib/types";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Per-form language tabs
// ---------------------------------------------------------------------------

interface FormLangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
}
const FormLangContext = createContext<FormLangCtx | null>(null);

export function FormLangProvider({ children, initial = "en" }: { children: ReactNode; initial?: Lang }) {
  const [lang, setLang] = useState<Lang>(initial);
  return <FormLangContext.Provider value={{ lang, setLang }}>{children}</FormLangContext.Provider>;
}

export function useFormLang(): FormLangCtx {
  const ctx = useContext(FormLangContext);
  if (!ctx) throw new Error("useFormLang must be used inside FormLangProvider");
  return ctx;
}

export function LangTabs({ className }: { className?: string }) {
  const { lang, setLang } = useFormLang();
  const { t } = useLocale();
  return (
    <div className={cn("inline-flex rounded-full border border-line bg-surface-2 p-0.5", className)} role="tablist" aria-label={t("admin.form.translationsLabel")}>
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          role="tab"
          aria-selected={lang === l}
          onClick={() => setLang(l)}
          className={cn("h-8 px-3.5 rounded-full text-xs font-bold transition", lang === l ? "bg-accent text-accent-fg shadow-sm" : "text-muted hover:text-fg")}
        >
          {t(`lang.short.${l}`)}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-fg outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/25 disabled:opacity-60";

export function Field({
  label,
  hint,
  error,
  required,
  children,
  htmlFor,
  className,
  right,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  htmlFor?: string;
  className?: string;
  right?: ReactNode;
}) {
  const { t } = useLocale();
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={htmlFor} className="text-sm font-semibold">
          {label}
          {required && (
            <span className="ml-1 text-danger" aria-hidden="true">
              *
            </span>
          )}
          {!required && <span className="sr-only"> ({t("common.optional")})</span>}
        </label>
        {right}
      </div>
      {children}
      {error ? <p className="text-xs text-danger">{error}</p> : hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string;
  onChange: (v: string) => void;
}
export function Input({ value, onChange, className, ...rest }: InputProps) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} className={cn(inputClass, className)} {...rest} />;
}

interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value"> {
  value: string;
  onChange: (v: string) => void;
}
export function Textarea({ value, onChange, className, rows = 4, ...rest }: TextareaProps) {
  return <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className={cn(inputClass, "resize-y", className)} {...rest} />;
}

export function NumberInput({ value, onChange, min, max, step, id, placeholder, className }: { value: number | null | undefined; onChange: (v: number | null) => void; min?: number; max?: number; step?: number; id?: string; placeholder?: string; className?: string }) {
  return (
    <input
      id={id}
      type="number"
      inputMode="numeric"
      value={value ?? ""}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      className={cn(inputClass, className)}
    />
  );
}

export function Select<T extends string>({ value, onChange, options, id, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; id?: string; className?: string }) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)} className={cn(inputClass, "cursor-pointer", className)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Toggle({ checked, onChange, label, description, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; id?: string }) {
  const autoId = useId();
  const tid = id ?? autoId;
  return (
    <label htmlFor={tid} className="flex items-start gap-3 cursor-pointer select-none">
      <button
        id={tid}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn("relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors", checked ? "bg-accent" : "bg-line-strong")}
      >
        <span className={cn("absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", checked && "translate-x-5")} />
      </button>
      <span>
        <span className="text-sm font-semibold block">{label}</span>
        {description && <span className="text-xs text-muted block">{description}</span>}
      </span>
    </label>
  );
}

export function Slider({ value, onChange, min = 0, max = 100, id, label }: { value: number; onChange: (v: number) => void; min?: number; max?: number; id?: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <input id={id} type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 accent-[var(--accent)]" aria-label={label} />
      <span className="font-mono text-sm font-bold w-12 text-right tabular-nums">{value}%</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Localized inputs (follow the form language tabs)
// ---------------------------------------------------------------------------

function FallbackHint({ value }: { value: Localized | LocalizedList }) {
  const { lang } = useFormLang();
  const { t } = useLocale();
  if (lang === "en") return null;
  const v = value[lang];
  const empty = Array.isArray(v) ? v.length === 0 : !v || !v.trim();
  return empty ? <span className="text-[11px] text-muted italic">{t("admin.form.fallbackHint")}</span> : null;
}

export function LocalizedInput({
  label,
  value,
  onChange,
  hint,
  required,
  multiline,
  rows,
  placeholder,
  error,
}: {
  label: string;
  value: Localized;
  onChange: (v: Localized) => void;
  hint?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  error?: string;
}) {
  const { lang } = useFormLang();
  const { t } = useLocale();
  const id = useId();
  const current = value?.[lang] ?? "";
  const set = (v: string) => onChange({ ...value, [lang]: v });
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required && lang === "en"}
      htmlFor={id}
      right={
        <span className="flex items-center gap-2">
          <FallbackHint value={value} />
          <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold text-muted">{t(`lang.short.${lang}`)}</span>
        </span>
      }
    >
      {multiline ? (
        <Textarea id={id} value={current} onChange={set} rows={rows ?? 4} placeholder={placeholder ?? (lang !== "en" ? value?.en : undefined)} />
      ) : (
        <Input id={id} value={current} onChange={set} placeholder={placeholder ?? (lang !== "en" ? value?.en : undefined)} />
      )}
    </Field>
  );
}

export function LocalizedListInput({ label, value, onChange, hint, rows = 4 }: { label: string; value: LocalizedList; onChange: (v: LocalizedList) => void; hint?: string; rows?: number }) {
  const { lang } = useFormLang();
  const { t } = useLocale();
  const id = useId();
  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  const list = value?.[lang] ?? [];
  const text = draft?.[lang] ?? list.join("\n");
  return (
    <Field
      label={label}
      hint={hint}
      htmlFor={id}
      right={
        <span className="flex items-center gap-2">
          <FallbackHint value={value} />
          <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold text-muted">{t(`lang.short.${lang}`)}</span>
        </span>
      }
    >
      <Textarea
        id={id}
        value={text}
        rows={rows}
        placeholder={lang !== "en" && value?.en?.length ? value.en.join("\n") : undefined}
        onChange={(v) => {
          setDraft({ ...(draft ?? {}), [lang]: v });
          onChange({ ...value, [lang]: v.split("\n").map((s) => s.trim()).filter(Boolean) });
        }}
        onBlur={() => setDraft(null)}
      />
    </Field>
  );
}

// ---------------------------------------------------------------------------
// Tags / chips
// ---------------------------------------------------------------------------

export function TagsInput({ label, value, onChange, suggestions = [], hint, placeholder }: { label: string; value: string[]; onChange: (v: string[]) => void; suggestions?: readonly string[]; hint?: string; placeholder?: string }) {
  const id = useId();
  const [draft, setDraft] = useState("");
  const add = (raw: string) => {
    const tag = raw.trim();
    if (!tag || value.includes(tag)) return;
    onChange([...value, tag]);
  };
  const remove = (tag: string) => onChange(value.filter((v) => v !== tag));
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {suggestions.map((s) => {
          const on = value.includes(s);
          return (
            <button
              key={s}
              type="button"
              aria-pressed={on}
              onClick={() => (on ? remove(s) : add(s))}
              className={cn("h-8 px-3 rounded-full text-xs font-semibold border transition", on ? "bg-fg text-bg border-fg" : "bg-surface border-line text-fg-2 hover:border-line-strong")}
            >
              {s}
            </button>
          );
        })}
      </div>
      <div className={cn(inputClass, "flex flex-wrap items-center gap-1.5 py-1.5 min-h-[2.75rem]")}>
        {value
          .filter((v) => !suggestions.includes(v))
          .map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-accent-soft text-accent-strong px-2.5 py-0.5 text-xs font-semibold">
              {tag}
              <button type="button" onClick={() => remove(tag)} aria-label={`${tag} ×`} className="hover:text-danger">
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </span>
          ))}
        <input
          id={id}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
              setDraft("");
            } else if (e.key === "Backspace" && !draft && value.length) {
              remove(value[value.length - 1]);
            }
          }}
          onBlur={() => {
            if (draft.trim()) {
              add(draft);
              setDraft("");
            }
          }}
          className="flex-1 min-w-[8rem] bg-transparent outline-none text-sm"
        />
      </div>
    </Field>
  );
}

export function FormSection({ title, children, description }: { title: string; children: ReactNode; description?: string }) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-accent-strong">{title}</h3>
        {description && <p className="text-xs text-muted mt-1">{description}</p>}
      </div>
      {children}
    </section>
  );
}
