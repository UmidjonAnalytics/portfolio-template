import { collection, doc, getDoc, getDocs, setDoc, writeBatch, type Firestore } from "firebase/firestore";

/**
 * Firestore-backed file storage for the free Spark plan (Cloud Storage needs Blaze).
 *
 * `media/{id}` holds the file. A Firestore document is capped at 1 MiB, so anything larger is
 * split: `media/{id}` keeps the metadata with `chunks: n` and an empty `dataUrl`, and the data
 * URL is spread across `media/{id}/chunks/{0..n-1}`. Small files stay in one document, which
 * is also the shape every older media document already has.
 */

export const MEDIA_CHUNK_CHARS = 900_000;
/** Above this a file is chunked. Leaves room in the document for the other fields. */
const SINGLE_DOC_CHARS = 950_000;

export interface StoredFile {
  dataUrl: string;
  type: string;
  size: number;
  name: string;
}

export async function putMedia(db: Firestore, id: string, file: StoredFile): Promise<void> {
  const base = { type: file.type, size: file.size, name: file.name, createdAt: Date.now() };
  if (file.dataUrl.length <= SINGLE_DOC_CHARS) {
    await setDoc(doc(db, "media", id), { ...base, dataUrl: file.dataUrl });
    return;
  }
  const chunks = Math.ceil(file.dataUrl.length / MEDIA_CHUNK_CHARS);
  // Write the pieces first so a reader never sees metadata pointing at missing chunks.
  for (let i = 0; i < chunks; i++) {
    await setDoc(doc(db, "media", id, "chunks", String(i)), { d: file.dataUrl.slice(i * MEDIA_CHUNK_CHARS, (i + 1) * MEDIA_CHUNK_CHARS) });
  }
  await setDoc(doc(db, "media", id), { ...base, dataUrl: "", chunks });
}

export async function getMedia(db: Firestore, id: string): Promise<string> {
  const snap = await getDoc(doc(db, "media", id));
  if (!snap.exists()) return "";
  const data = snap.data() as { dataUrl?: string; chunks?: number };
  if (!data.chunks) return data.dataUrl ?? "";
  const parts = await Promise.all(Array.from({ length: data.chunks }, (_, i) => getDoc(doc(db, "media", id, "chunks", String(i)))));
  return parts.map((p) => (p.data()?.d as string) ?? "").join("");
}

export async function removeMedia(db: Firestore, id: string): Promise<void> {
  const chunks = await getDocs(collection(db, "media", id, "chunks"));
  const batch = writeBatch(db);
  chunks.docs.forEach((c) => batch.delete(c.ref));
  batch.delete(doc(db, "media", id));
  await batch.commit();
}
