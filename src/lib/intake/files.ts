"use client";

import { doc, getDoc, setDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { compressImage } from "../media";
import type { IntakeFileRef } from "./types";

/**
 * Intake uploads live in Firestore because Cloud Storage needs the paid Blaze plan.
 * A Firestore document holds at most 1 MiB, so each file is stored as a data URL split
 * into chunks: `intakeFiles/{id}` holds the metadata, `intakeFiles/{id}/chunks/{n}` the
 * pieces. Customers can only create; reading back is admin-only (see firestore.rules).
 */

const CHUNK_CHARS = 900_000;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function fileId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function makeThumb(file: File): Promise<string | undefined> {
  if (!file.type.startsWith("image/")) return undefined;
  try {
    const blob = await compressImage(file, { maxDimension: 200, quality: 0.7 });
    return await blobToDataUrl(blob);
  } catch {
    return undefined;
  }
}

export interface UploadOptions {
  /** Images are downscaled before upload; the site does not need more than this. */
  maxDimension?: number;
  onProgress?: (percent: number) => void;
}

export async function uploadIntakeFile(code: string, file: File, opts: UploadOptions = {}): Promise<IntakeFileRef> {
  const isImage = file.type.startsWith("image/") && file.type !== "image/svg+xml";
  const blob: Blob = isImage ? await compressImage(file, { maxDimension: opts.maxDimension ?? 1600, quality: 0.85, targetBytes: 600 * 1024 }) : file;
  if (blob.size > MAX_FILE_BYTES) throw new Error("too-large");

  const dataUrl = await blobToDataUrl(blob);
  const chunks = Math.max(1, Math.ceil(dataUrl.length / CHUNK_CHARS));
  const id = fileId();
  const type = blob.type || file.type || "application/octet-stream";

  opts.onProgress?.(5);
  await setDoc(doc(db, "intakeFiles", id), { code, name: file.name.slice(0, 200), type, size: blob.size, chunks, createdAt: Date.now() });
  for (let i = 0; i < chunks; i++) {
    await setDoc(doc(db, "intakeFiles", id, "chunks", String(i)), { d: dataUrl.slice(i * CHUNK_CHARS, (i + 1) * CHUNK_CHARS) });
    opts.onProgress?.(Math.round(5 + ((i + 1) / chunks) * 95));
  }

  const ref: IntakeFileRef = { id, name: file.name.slice(0, 200), type, size: blob.size };
  // Firestore rejects undefined values, so only set the preview when there is one (images).
  const thumb = await makeThumb(file);
  if (thumb) ref.thumb = thumb;
  return ref;
}

export interface DownloadedFile {
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

/** Admin only: reassemble a file from its chunks. */
export async function downloadIntakeFile(id: string): Promise<DownloadedFile> {
  const meta = await getDoc(doc(db, "intakeFiles", id));
  if (!meta.exists()) throw new Error("missing");
  const { name, type, size, chunks } = meta.data() as { name: string; type: string; size: number; chunks: number };
  const parts = await Promise.all(Array.from({ length: chunks }, (_, i) => getDoc(doc(db, "intakeFiles", id, "chunks", String(i)))));
  const dataUrl = parts.map((p) => (p.data()?.d as string) ?? "").join("");
  return { name, type, size, dataUrl };
}

/** Admin only: delete a file and its chunks. */
export async function deleteIntakeFile(id: string, chunks: number): Promise<void> {
  const batch = writeBatch(db);
  for (let i = 0; i < chunks; i++) batch.delete(doc(db, "intakeFiles", id, "chunks", String(i)));
  batch.delete(doc(db, "intakeFiles", id));
  await batch.commit();
}

export function triggerDownload(dataUrl: string, name: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
