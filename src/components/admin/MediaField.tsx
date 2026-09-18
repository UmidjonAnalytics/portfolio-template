"use client";

import { FileText, ImagePlus, Trash2, UploadCloud, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocale } from "@/lib/i18n";
import { deleteMedia, formatBytes, maxUploadSize, resolvedMediaMode, uploadFile, uploadImage } from "@/lib/media";
import { cn } from "@/lib/utils";
import { SmartImage, useMediaUrl } from "@/components/ui/SmartImage";
import { Field } from "./fields";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml", "image/avif"];

function useUpload(kind: "image" | "file") {
  const { t } = useLocale();
  const [progress, setProgress] = useState<number | null>(null);
  const limit = maxUploadSize(kind);

  const run = async (file: File, folder: string, accept: string[]): Promise<string | null> => {
    if (accept.length && !accept.includes(file.type) && !(kind === "image" && file.type.startsWith("image/"))) {
      toast.error(t("admin.media.wrongType"));
      return null;
    }
    if (file.size > limit) {
      toast.error(t("admin.media.tooLarge", { size: formatBytes(limit) }));
      return null;
    }
    setProgress(0);
    try {
      const ref = kind === "image" ? await uploadImage(file, folder, { onProgress: setProgress }) : await uploadFile(file, folder, { onProgress: setProgress });
      return ref;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(msg === "too-large" ? t("admin.media.tooLarge", { size: formatBytes(limit) }) : t("common.error"));
      return null;
    } finally {
      setProgress(null);
    }
  };
  return { run, progress, limit };
}

function DropZone({
  onFile,
  accept,
  progress,
  limit,
  children,
  compact,
  inputId,
}: {
  onFile: (f: File) => void;
  accept: string;
  progress: number | null;
  limit: number;
  children?: React.ReactNode;
  compact?: boolean;
  inputId: string;
}) {
  const { t } = useLocale();
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div
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
        "relative rounded-2xl border-2 border-dashed transition text-center",
        over ? "border-accent bg-accent-soft" : "border-line bg-surface-2/50 hover:border-line-strong",
        compact ? "p-4" : "p-6",
      )}
    >
      {progress !== null ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold">{t("admin.media.uploading", { percent: progress })}</p>
          <div className="h-2 rounded-full bg-surface-2 overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : (
        <>
          {children ?? <UploadCloud className="mx-auto h-7 w-7 text-muted" aria-hidden="true" />}
          <p className="mt-2 text-sm">
            {t("admin.media.drop")} {t("admin.media.or")}{" "}
            <label htmlFor={inputId} className="font-semibold text-accent-strong cursor-pointer underline underline-offset-2">
              {t("admin.media.browse")}
            </label>
          </p>
          <p className="mt-1 text-xs text-muted">{t("admin.media.maxSize", { size: formatBytes(limit) })}</p>
        </>
      )}
      <input
        ref={inputRef}
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
    </div>
  );
}

export function StorageNotice() {
  const { t } = useLocale();
  if (resolvedMediaMode() !== "firestore") return null;
  return <p className="text-xs text-muted rounded-xl border border-line bg-surface-2/60 px-3 py-2">{t("admin.media.fallbackNotice")}</p>;
}

export function ImageField({
  label,
  value,
  onChange,
  folder,
  hint,
  aspect = "aspect-[16/10]",
  maxDimension,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  folder: string;
  hint?: string;
  aspect?: string;
  maxDimension?: number;
}) {
  const { t } = useLocale();
  const id = useId();
  const { run, progress, limit } = useUpload("image");

  const handle = async (file: File) => {
    const ref = await run(file, folder, IMAGE_TYPES);
    if (ref) {
      const old = value;
      onChange(ref);
      if (old && old !== ref) void deleteMedia(old);
    }
  };
  void maxDimension;

  return (
    <Field label={label} hint={hint} htmlFor={id}>
      {value ? (
        <div className={cn("relative rounded-2xl overflow-hidden border border-line bg-surface-2", aspect)}>
          <SmartImage src={value} alt="" fill sizes="480px" className="object-cover" />
          <div className="absolute top-2 right-2 flex gap-2">
            <label
              htmlFor={id}
              className="h-9 px-3 inline-flex items-center gap-1 rounded-full bg-surface/90 border border-line text-xs font-semibold cursor-pointer hover:bg-surface"
            >
              <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
              {t("common.replace")}
            </label>
            <button
              type="button"
              onClick={() => {
                void deleteMedia(value);
                onChange("");
              }}
              aria-label={t("admin.media.remove")}
              className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-surface/90 border border-line text-danger hover:bg-surface"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <input
            id={id}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handle(f);
              e.target.value = "";
            }}
          />
          {progress !== null && (
            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-surface-2">
              <div className="h-full bg-accent transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      ) : (
        <DropZone onFile={handle} accept="image/*" progress={progress} limit={limit} inputId={id}>
          <ImagePlus className="mx-auto h-7 w-7 text-muted" aria-hidden="true" />
        </DropZone>
      )}
    </Field>
  );
}

export function FileField({ label, value, onChange, folder, hint, accept = "application/pdf", acceptTypes = ["application/pdf"] }: { label: string; value: string; onChange: (v: string) => void; folder: string; hint?: string; accept?: string; acceptTypes?: string[] }) {
  const { t } = useLocale();
  const id = useId();
  const { run, progress, limit } = useUpload("file");
  const { url } = useMediaUrl(value);

  const handle = async (file: File) => {
    const ref = await run(file, folder, acceptTypes);
    if (ref) {
      const old = value;
      onChange(ref);
      if (old && old !== ref) void deleteMedia(old);
    }
  };

  return (
    <Field label={label} hint={hint} htmlFor={id}>
      {value && (
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2/60 px-4 py-3 mb-2">
          <FileText className="h-5 w-5 text-accent-strong shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{t("admin.media.currentFile")}</p>
            {url && !url.startsWith("data:") && (
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent-strong underline">
                {t("common.open")}
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              void deleteMedia(value);
              onChange("");
            }}
            aria-label={t("admin.media.remove")}
            className="h-9 w-9 inline-flex items-center justify-center rounded-full border border-line text-danger hover:bg-surface"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
      <DropZone onFile={handle} accept={accept} progress={progress} limit={limit} inputId={id} compact>
        <FileText className="mx-auto h-6 w-6 text-muted" aria-hidden="true" />
      </DropZone>
    </Field>
  );
}

export function GalleryField({ label, value, onChange, folder, hint }: { label: string; value: string[]; onChange: (v: string[]) => void; folder: string; hint?: string }) {
  const { t } = useLocale();
  const id = useId();
  const { run, progress, limit } = useUpload("image");
  const handle = async (file: File) => {
    const ref = await run(file, folder, IMAGE_TYPES);
    if (ref) onChange([...value, ref]);
  };
  return (
    <Field label={label} hint={hint} htmlFor={id}>
      {value.length > 0 && (
        <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
          {value.map((img, i) => (
            <li key={img + i} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-line bg-surface-2 group">
              <SmartImage src={img} alt="" fill sizes="160px" className="object-cover" />
              <button
                type="button"
                onClick={() => {
                  void deleteMedia(img);
                  onChange(value.filter((_, j) => j !== i));
                }}
                aria-label={t("admin.media.remove")}
                className="absolute top-1 right-1 h-7 w-7 inline-flex items-center justify-center rounded-full bg-surface/90 border border-line text-danger opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <DropZone onFile={handle} accept="image/*" progress={progress} limit={limit} inputId={id} compact>
        <ImagePlus className="mx-auto h-6 w-6 text-muted" aria-hidden="true" />
      </DropZone>
    </Field>
  );
}
