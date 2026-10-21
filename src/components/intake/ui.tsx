"use client";

import { Check, FileText, ImagePlus, Lightbulb, Loader2, Plus, Trash2, UploadCloud, X } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { formatSize, MAX_FILE_BYTES, uploadIntakeFile } from "@/lib/intake/files";
import type { IntakeFileRef } from "@/lib/intake/types";
import { cn } from "@/lib/utils";

export const inputCls =
  "w-full rounded-2xl border bg-surface px-4 py-3 text-base text-fg outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/25";

const MAX_IMAGE_INPUT = 25 * 1024 * 1024;

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export function Q({
  label,
  hint,
  error,
  optional,
  htmlFor,
  children,
  field,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  htmlFor?: string;
  children: ReactNode;
  /** Error path, used to scroll to the first error. */
  field?: string;
}) {
  return (
    <div className="space-y-2" data-field={field}>
      <label htmlFor={htmlFor} className="flex items-baseline justify-between gap-3">
        <span className="font-semibold text-[15px]">{label}</span>
        {optional && <span className="text-xs font-semibold text-muted">ixtiyoriy</span>}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-danger font-medium" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-sm text-muted leading-relaxed">{hint}</p>
      ) : null}
    </div>
  );
}

export function Tip({ children, title = "Maslahat" }: { children: ReactNode; title?: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-line bg-accent-soft/40 px-4 py-3 text-sm leading-relaxed">
      <Lightbulb className="h-5 w-5 shrink-0 text-accent-strong mt-0.5" aria-hidden="true" />
      <div>
        <p className="font-bold text-accent-strong">{title}</p>
        <div className="mt-0.5 text-fg-2">{children}</div>
      </div>
    </div>
  );
}

export function Card({ title, onRemove, removeLabel = "O‘chirish", children }: { title: string; onRemove?: () => void; removeLabel?: string; children: ReactNode }) {
  return (
    <div className="card p-4 sm:p-5 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display font-semibold">{title}</h3>
        {onRemove && (
          <button type="button" onClick={onRemove} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-sm font-semibold text-muted hover:text-danger hover:bg-danger-soft transition">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {removeLabel}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

export function AddButton({ onClick, children, disabled }: { onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full h-14 rounded-2xl border-2 border-dashed border-line-strong text-fg-2 font-semibold inline-flex items-center justify-center gap-2 hover:border-accent hover:text-accent-strong transition disabled:opacity-50 disabled:pointer-events-none"
    >
      <Plus className="h-5 w-5" aria-hidden="true" />
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

interface TextProps {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoComplete?: string;
  maxLength?: number;
  error?: boolean;
  prefix?: string;
  suffix?: string;
}

export function Text({ id, value, onChange, placeholder, type = "text", inputMode, autoComplete, maxLength, error, prefix, suffix }: TextProps) {
  const input = (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={inputMode}
      autoComplete={autoComplete}
      maxLength={maxLength}
      aria-invalid={error || undefined}
      className={cn(inputCls, error ? "border-danger" : "border-line", (prefix || suffix) && "border-0 focus:ring-0 rounded-none bg-transparent px-0")}
    />
  );
  if (!prefix && !suffix) return input;
  return (
    <div className={cn("flex items-center rounded-2xl border bg-surface px-4 transition focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25", error ? "border-danger" : "border-line")}>
      {prefix && <span className="text-muted font-semibold mr-1 select-none">{prefix}</span>}
      {input}
      {suffix && <span className="text-muted font-bold ml-1 select-none">{suffix}</span>}
    </div>
  );
}

export function Area({ id, value, onChange, placeholder, rows = 4, error, maxLength = 4000, counter }: { id: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; error?: boolean; maxLength?: number; counter?: number }) {
  return (
    <div className="relative">
      <textarea
        id={id}
        value={value}
        rows={rows}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={error || undefined}
        className={cn(inputCls, "resize-y leading-relaxed", error ? "border-danger" : "border-line")}
      />
      {counter !== undefined && (
        <span className={cn("absolute bottom-2.5 right-3.5 text-xs font-semibold tabular-nums", value.trim().length >= counter ? "text-success" : "text-muted")}>
          {value.trim().length}/{counter}
        </span>
      )}
    </div>
  );
}

export function Chips({ options, value, onChange, max }: { options: readonly { value: string; label: string }[]; value: string[]; onChange: (v: string[]) => void; max?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o.value);
        const blocked = !on && max !== undefined && value.length >= max;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            disabled={blocked}
            onClick={() => onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])}
            className={cn(
              "min-h-11 px-4 rounded-full border text-[15px] font-semibold inline-flex items-center gap-1.5 transition disabled:opacity-40",
              on ? "bg-accent text-accent-fg border-accent" : "bg-surface border-line text-fg-2 hover:border-line-strong",
            )}
          >
            {on && <Check className="h-4 w-4" aria-hidden="true" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Choice<T extends string>({ name, options, value, onChange }: { name: string; options: { value: T; label: string; description?: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="grid gap-2" role="radiogroup">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <label key={o.value} className={cn("flex items-start gap-3 rounded-2xl border px-4 py-3.5 cursor-pointer transition", on ? "border-accent bg-accent-soft/50" : "border-line bg-surface hover:border-line-strong")}>
            <input type="radio" name={name} checked={on} onChange={() => onChange(o.value)} className="sr-only" />
            <span className={cn("mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center", on ? "border-accent" : "border-line-strong")} aria-hidden="true">
              {on && <span className="h-2.5 w-2.5 rounded-full bg-accent" />}
            </span>
            <span>
              <span className="block font-semibold">{o.label}</span>
              {o.description && <span className="block text-sm text-muted mt-0.5">{o.description}</span>}
            </span>
          </label>
        );
      })}
    </div>
  );
}

export function Check2({ checked, onChange, children, error }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode; error?: boolean }) {
  return (
    <label className={cn("flex items-start gap-3 rounded-2xl border px-4 py-3.5 cursor-pointer transition", checked ? "border-accent bg-accent-soft/40" : error ? "border-danger" : "border-line bg-surface")}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      <span className={cn("mt-0.5 h-5 w-5 shrink-0 rounded-md border-2 flex items-center justify-center", checked ? "bg-accent border-accent text-white" : "border-line-strong")} aria-hidden="true">
        {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
      <span className="text-[15px] leading-relaxed">{children}</span>
    </label>
  );
}

// ---------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------

function useUploader(code: string) {
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const run = async (file: File, kind: "image" | "pdf", maxDimension?: number): Promise<IntakeFileRef | null> => {
    setError("");
    if (kind === "image" && !file.type.startsWith("image/")) {
      setError("Faqat rasm fayllari (JPG, PNG, WEBP)");
      return null;
    }
    if (kind === "pdf" && file.type !== "application/pdf") {
      setError("Faqat PDF fayl");
      return null;
    }
    if (file.size > (kind === "image" ? MAX_IMAGE_INPUT : MAX_FILE_BYTES)) {
      setError(`Fayl juda katta (maks. ${formatSize(kind === "image" ? MAX_IMAGE_INPUT : MAX_FILE_BYTES)})`);
      return null;
    }
    setProgress(0);
    try {
      return await uploadIntakeFile(code, file, { maxDimension, onProgress: setProgress });
    } catch (e) {
      console.error(e);
      setError((e as Error).message === "too-large" ? "Fayl juda katta" : "Yuklab bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring.");
      return null;
    } finally {
      setProgress(null);
    }
  };
  return { run, progress, error };
}

function Dropzone({ inputId, accept, onFile, children, compact }: { inputId: string; accept: string; onFile: (f: File) => void; children: ReactNode; compact?: boolean }) {
  const [over, setOver] = useState(false);
  return (
    <label
      htmlFor={inputId}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      className={cn(
        "flex flex-col items-center justify-center text-center rounded-2xl border-2 border-dashed cursor-pointer transition",
        compact ? "p-4 min-h-28" : "p-6 min-h-40",
        over ? "border-accent bg-accent-soft" : "border-line-strong bg-surface-2/40 hover:border-accent",
      )}
    >
      {children}
      <input
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </label>
  );
}

function Progress({ value }: { value: number }) {
  return (
    <div className="w-full max-w-xs space-y-2" role="status">
      <p className="text-sm font-semibold inline-flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Yuklanmoqda… {value}%
      </p>
      <div className="h-2 rounded-full bg-surface-2 overflow-hidden">
        <div className="h-full bg-accent transition-all" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

/** One image or one PDF. */
export function FileSlot({
  code,
  value,
  onChange,
  kind,
  maxDimension,
  error,
  emptyText,
  aspect = "aspect-[4/5]",
}: {
  code: string;
  value: IntakeFileRef | null;
  onChange: (v: IntakeFileRef | null) => void;
  kind: "image" | "pdf";
  maxDimension?: number;
  error?: string;
  emptyText: string;
  aspect?: string;
}) {
  const id = useId();
  const { run, progress, error: uploadError } = useUploader(code);
  const handle = async (f: File) => {
    const r = await run(f, kind, maxDimension);
    if (r) onChange(r);
  };
  const accept = kind === "image" ? "image/*" : "application/pdf";
  const message = uploadError || error;

  return (
    <div className="space-y-2">
      {value && progress === null ? (
        kind === "image" && value.thumb ? (
          <div className={cn("relative w-full max-w-[16rem] rounded-2xl overflow-hidden border border-line bg-surface-2", aspect)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value.thumb} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute top-2 right-2 flex gap-2">
              <label htmlFor={id} className="h-9 px-3 inline-flex items-center gap-1 rounded-full bg-surface/95 border border-line text-sm font-semibold cursor-pointer">
                <ImagePlus className="h-4 w-4" aria-hidden="true" /> Almashtirish
              </label>
              <button type="button" onClick={() => onChange(null)} aria-label="O‘chirish" className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-surface/95 border border-line text-danger">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <input id={id} type="file" accept={accept} className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handle(f); e.target.value = ""; }} />
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
            <FileText className="h-6 w-6 text-accent-strong shrink-0" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold truncate">{value.name}</p>
              <p className="text-xs text-muted">{formatSize(value.size)} · yuklandi</p>
            </div>
            <label htmlFor={id} className="h-9 px-3 inline-flex items-center rounded-full border border-line text-sm font-semibold cursor-pointer hover:bg-surface-2">
              Almashtirish
            </label>
            <button type="button" onClick={() => onChange(null)} aria-label="O‘chirish" className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-line text-danger">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
            <input id={id} type="file" accept={accept} className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handle(f); e.target.value = ""; }} />
          </div>
        )
      ) : (
        <Dropzone inputId={id} accept={accept} onFile={handle}>
          {progress !== null ? (
            <Progress value={progress} />
          ) : (
            <>
              <UploadCloud className="h-8 w-8 text-muted" aria-hidden="true" />
              <p className="mt-2 font-semibold">{emptyText}</p>
              <p className="text-sm text-muted">{kind === "image" ? "JPG, PNG yoki WEBP" : `PDF, maks. ${formatSize(MAX_FILE_BYTES)}`}</p>
            </>
          )}
        </Dropzone>
      )}
      {message && (
        <p className="text-sm text-danger font-medium" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}

/** Several images, e.g. project screenshots. Add/remove callbacks so the parent applies them to its latest state. */
export function ImageList({ code, value, onAdd, onRemove, max = 3, error }: { code: string; value: IntakeFileRef[]; onAdd: (ref: IntakeFileRef) => void; onRemove: (id: string) => void; max?: number; error?: string }) {
  const id = useId();
  const { run, progress, error: uploadError } = useUploader(code);
  const handle = async (f: File) => {
    const r = await run(f, "image", 1600);
    if (r) onAdd(r);
  };
  const message = uploadError || error;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {value.map((img, i) => (
          <div key={img.id} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-line bg-surface-2">
            {img.thumb && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img.thumb} alt="" className="absolute inset-0 h-full w-full object-cover" />
            )}
            {i === 0 && <span className="absolute bottom-1 left-1 rounded-full bg-accent text-accent-fg px-2 py-0.5 text-[10px] font-bold">Muqova</span>}
            <button type="button" onClick={() => onRemove(img.id)} aria-label="O‘chirish" className="absolute top-1 right-1 h-8 w-8 inline-flex items-center justify-center rounded-full bg-surface/95 border border-line text-danger">
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
        {value.length < max && (
          <Dropzone inputId={id} accept="image/*" onFile={handle} compact>
            {progress !== null ? (
              <Loader2 className="h-6 w-6 animate-spin text-accent" aria-label={`Yuklanmoqda ${progress}%`} />
            ) : (
              <>
                <ImagePlus className="h-6 w-6 text-muted" aria-hidden="true" />
                <span className="mt-1 text-xs font-semibold text-muted">Qo‘shish</span>
              </>
            )}
          </Dropzone>
        )}
      </div>
      {message && (
        <p className="text-sm text-danger font-medium" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
