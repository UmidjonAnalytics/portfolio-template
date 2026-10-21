"use client";

import { deleteObject, getDownloadURL, ref as storageRef, uploadBytesResumable } from "firebase/storage";
import { db, storage } from "./firebase";
import { getMedia, putMedia, removeMedia } from "./media-store";
import { uid } from "./utils";

/**
 * Media abstraction.
 *
 * A "media reference" is a plain string stored in Firestore documents:
 *   - "https://..."   a Firebase Storage download URL (or any remote image)
 *   - "data:..."      an inline data URI (seed placeholders are tiny SVGs)
 *   - "media:<id>"    a document in the `media` collection holding a compressed data URI.
 *
 * New Firebase projects need the Blaze plan for Cloud Storage, so on the free plan uploads
 * transparently fall back to `media:` documents. Everything else in the app only sees strings.
 */

export type MediaMode = "storage" | "firestore";
const MODE_STORAGE_KEY = "media-mode-resolved";

const FIRESTORE_IMAGE_LIMIT = 650 * 1024; // bytes of the *compressed* file (base64 adds ~33 %)
/** Larger files are split across chunk documents (see media-store.ts). */
const FIRESTORE_FILE_LIMIT = 10 * 1024 * 1024;
const STORAGE_FILE_LIMIT = 15 * 1024 * 1024;

export function configuredMediaMode(): MediaMode | "auto" {
  const v = process.env.NEXT_PUBLIC_MEDIA_MODE;
  if (v === "storage" || v === "firestore") return v;
  return "auto";
}

export function resolvedMediaMode(): MediaMode {
  const configured = configuredMediaMode();
  if (configured !== "auto") return configured;
  if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) return "firestore";
  try {
    const v = localStorage.getItem(MODE_STORAGE_KEY);
    if (v === "firestore" || v === "storage") return v;
  } catch {
    /* ignore */
  }
  return "storage";
}

function rememberMode(mode: MediaMode) {
  try {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

export function maxUploadSize(kind: "image" | "file"): number {
  if (resolvedMediaMode() === "storage") return STORAGE_FILE_LIMIT;
  return kind === "image" ? 8 * 1024 * 1024 : FIRESTORE_FILE_LIMIT;
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export function isMediaRef(value: string | undefined | null): boolean {
  return !!value && value.startsWith("media:");
}

// ---------------------------------------------------------------------------
// Resolving references to displayable URLs
// ---------------------------------------------------------------------------

const cache = new Map<string, Promise<string>>();

export function resolveMedia(ref: string | undefined | null): Promise<string> {
  if (!ref) return Promise.resolve("");
  if (!ref.startsWith("media:")) return Promise.resolve(ref);
  const id = ref.slice(6);
  let p = cache.get(id);
  if (!p) {
    p = getMedia(db, id).catch(() => "");
    cache.set(id, p);
  }
  return p;
}

// ---------------------------------------------------------------------------
// Image compression (canvas -> WebP)
// ---------------------------------------------------------------------------

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export interface CompressOptions {
  maxDimension?: number;
  quality?: number;
  /** Target maximum size in bytes; quality/dimensions are reduced until met. */
  targetBytes?: number;
}

/** Downscale + re-encode an image. SVG and GIF files are returned untouched. */
export async function compressImage(file: File, opts: CompressOptions = {}): Promise<Blob> {
  if (file.type === "image/svg+xml" || file.type === "image/gif") return file;
  const maxDim = opts.maxDimension ?? 1600;
  const targetBytes = opts.targetBytes ?? Infinity;
  const img = await loadImage(file);
  let scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  let quality = opts.quality ?? 0.84;

  for (let attempt = 0; attempt < 8; attempt++) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = (await canvasToBlob(canvas, "image/webp", quality)) ?? (await canvasToBlob(canvas, "image/jpeg", quality));
    if (!blob) return file;
    if (blob.size <= targetBytes) return blob;
    if (quality > 0.55) quality -= 0.12;
    else scale *= 0.8;
  }
  throw new Error("too-large");
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

export interface UploadOptions {
  onProgress?: (percent: number) => void;
}

async function uploadToStorage(blob: Blob, path: string, contentType: string, opts: UploadOptions): Promise<string> {
  const r = storageRef(storage, path);
  const task = uploadBytesResumable(r, blob, { contentType, cacheControl: "public,max-age=31536000,immutable" });
  await new Promise<void>((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => opts.onProgress?.(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      reject,
      () => resolve(),
    );
  });
  return getDownloadURL(r);
}

async function uploadToFirestore(blob: Blob, name: string, contentType: string, limit: number, opts: UploadOptions): Promise<string> {
  if (blob.size > limit) throw new Error("too-large");
  const dataUrl = await blobToDataUrl(blob);
  const id = uid();
  opts.onProgress?.(50);
  await putMedia(db, id, { dataUrl, type: contentType, size: blob.size, name });
  opts.onProgress?.(100);
  cache.set(id, Promise.resolve(dataUrl));
  return `media:${id}`;
}

function storageUnavailable(err: unknown): boolean {
  const code = (err as { code?: string })?.code ?? "";
  // Rules denial or explicit cancel are real errors; anything else means the bucket is unusable.
  return !["storage/unauthorized", "storage/canceled", "storage/quota-exceeded"].includes(code);
}

/**
 * Upload an image and return a media reference. Images are compressed client-side first
 * (WebP, max 1600px by default) to stay comfortably within free-tier limits.
 */
export async function uploadImage(file: File, folder: string, opts: UploadOptions & CompressOptions = {}): Promise<string> {
  const mode = resolvedMediaMode();
  const configured = configuredMediaMode();
  const targetBytes = mode === "firestore" ? FIRESTORE_IMAGE_LIMIT : opts.targetBytes;
  const blob = await compressImage(file, { ...opts, targetBytes });
  const contentType = blob.type || file.type || "image/webp";
  const ext = contentType === "image/svg+xml" ? "svg" : contentType === "image/gif" ? "gif" : contentType === "image/jpeg" ? "jpg" : "webp";
  const name = `${Date.now()}-${uid()}.${ext}`;

  if (mode === "storage") {
    try {
      return await uploadToStorage(blob, `${folder}/${name}`, contentType, opts);
    } catch (err) {
      if (configured === "auto" && storageUnavailable(err)) {
        rememberMode("firestore");
        const small = await compressImage(file, { ...opts, targetBytes: FIRESTORE_IMAGE_LIMIT });
        return uploadToFirestore(small, file.name, small.type || contentType, FIRESTORE_IMAGE_LIMIT + 1024, opts);
      }
      throw err;
    }
  }
  return uploadToFirestore(blob, file.name, contentType, FIRESTORE_IMAGE_LIMIT + 1024, opts);
}

/** Upload a non-image file (PDF/XLSX…) and return a media reference. */
export async function uploadFile(file: File, folder: string, opts: UploadOptions = {}): Promise<string> {
  const mode = resolvedMediaMode();
  const configured = configuredMediaMode();
  const contentType = file.type || "application/octet-stream";
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  if (mode === "storage") {
    if (file.size > STORAGE_FILE_LIMIT) throw new Error("too-large");
    try {
      return await uploadToStorage(file, `${folder}/${Date.now()}-${safeName}`, contentType, opts);
    } catch (err) {
      if (configured === "auto" && storageUnavailable(err)) {
        rememberMode("firestore");
        return uploadToFirestore(file, file.name, contentType, FIRESTORE_FILE_LIMIT, opts);
      }
      throw err;
    }
  }
  return uploadToFirestore(file, file.name, contentType, FIRESTORE_FILE_LIMIT, opts);
}

/** Best-effort removal of a previously uploaded file. Never throws. */
export async function deleteMedia(ref: string | undefined | null): Promise<void> {
  if (!ref) return;
  try {
    if (ref.startsWith("media:")) {
      await removeMedia(db, ref.slice(6));
      cache.delete(ref.slice(6));
    } else if (ref.includes("firebasestorage") || ref.includes("/o/")) {
      await deleteObject(storageRef(storage, ref));
    }
  } catch {
    /* ignore */
  }
}

/** Turn any media reference into a URL that can be used in an <a download> / window.open. */
export async function mediaToDownloadUrl(ref: string): Promise<string> {
  const url = await resolveMedia(ref);
  if (!url.startsWith("data:")) return url;
  const res = await fetch(url);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
