import { collection, doc, setDoc, writeBatch, type Firestore } from "firebase/firestore";
import { putMedia } from "./media-store";
import { clearAll } from "./seed";
import type {
  BaseItem,
  Certificate,
  Education,
  Experience,
  Profile,
  Project,
  SiteSettings,
  Skill,
  Testimonial,
} from "./types";

/**
 * A site package is everything needed to fill one portfolio site, in one JSON file:
 * the profile, settings, every content collection and the uploaded files.
 *
 * The owner exports it from a submitted intake form (/admin/buyurtmalar) and imports it
 * into the customer's own site (Settings → Danger zone). Files are referenced from the
 * content as "file:<id>" and become media documents during import.
 */

export const PACKAGE_FORMAT = "portfolio-site-package";
export const PACKAGE_VERSION = 1;

type Item<T extends BaseItem> = Omit<T, "id" | "createdAt" | "updatedAt">;

export interface SitePackage {
  format: typeof PACKAGE_FORMAT;
  version: typeof PACKAGE_VERSION;
  createdAt: number;
  /** Who it is for — informational, not imported. */
  source: Record<string, unknown>;
  profile: Profile;
  settings: Partial<SiteSettings>;
  skills: Item<Skill>[];
  projects: Item<Project>[];
  experience: Item<Experience>[];
  certificates: Item<Certificate>[];
  education: Item<Education>[];
  testimonials: Item<Testimonial>[];
  files: Record<string, { name: string; type: string; dataUrl: string }>;
}

export function isSitePackage(value: unknown): value is SitePackage {
  const v = value as Partial<SitePackage> | null;
  return !!v && v.format === PACKAGE_FORMAT && v.version === PACKAGE_VERSION && typeof v.profile === "object" && typeof v.files === "object";
}

export type ImportWarning = { kind: "file-too-large"; name: string };

/** Matches the largest upload the site accepts (10 MB, base64-encoded). */
const MAX_MEDIA_CHARS = 14_500_000;
const BATCH_LIMIT = 400;

function mediaId(): string {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 16);
}

/** Replace every "file:<id>" string, at any depth, with its media reference. */
function resolveRefs<T>(value: T, refs: Map<string, string>): T {
  if (typeof value === "string") return (value.startsWith("file:") ? refs.get(value.slice(5)) ?? "" : value) as T;
  if (Array.isArray(value)) {
    // Drop only references that could not be imported, never ordinary empty strings.
    return value.filter((v) => !(typeof v === "string" && v.startsWith("file:") && !refs.has(v.slice(5)))).map((v) => resolveRefs(v, refs)) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = resolveRefs(v, refs);
    return out as T;
  }
  return value;
}

/**
 * Replace the site's content with the package. Settings are merged, so anything the package
 * does not mention (section toggles, embed allowlist…) is kept.
 */
export async function importSitePackage(db: Firestore, pkg: SitePackage, onProgress?: (msg: string) => void): Promise<ImportWarning[]> {
  if (!isSitePackage(pkg)) throw new Error("invalid-package");
  const warnings: ImportWarning[] = [];

  await clearAll(db, onProgress);

  const refs = new Map<string, string>();
  for (const [id, file] of Object.entries(pkg.files)) {
    if (!file?.dataUrl || file.dataUrl.length > MAX_MEDIA_CHARS) {
      warnings.push({ kind: "file-too-large", name: file?.name ?? id });
      continue;
    }
    const newId = mediaId();
    await putMedia(db, newId, { dataUrl: file.dataUrl, type: file.type, size: Math.round((file.dataUrl.length * 3) / 4), name: file.name });
    refs.set(id, `media:${newId}`);
  }
  onProgress?.(`Files imported (${refs.size})`);

  const now = Date.now();
  await setDoc(doc(db, "site", "profile"), { ...resolveRefs(pkg.profile, refs), updatedAt: now });
  await setDoc(doc(db, "site", "settings"), { ...resolveRefs(pkg.settings, refs), updatedAt: now }, { merge: true });

  const lists: [string, object[]][] = [
    ["skills", pkg.skills],
    ["projects", pkg.projects],
    ["experience", pkg.experience],
    ["certificates", pkg.certificates],
    ["education", pkg.education],
    ["testimonials", pkg.testimonials],
  ];
  let batch = writeBatch(db);
  let inBatch = 0;
  for (const [name, items] of lists) {
    const list = items ?? [];
    for (let i = 0; i < list.length; i++) {
      batch.set(doc(collection(db, name)), { ...resolveRefs(list[i], refs), createdAt: now - i * 1000, updatedAt: now - i * 1000 });
      if (++inBatch >= BATCH_LIMIT) {
        await batch.commit();
        batch = writeBatch(db);
        inBatch = 0;
      }
    }
    onProgress?.(`Imported ${name} (${list.length})`);
  }
  if (inBatch > 0) await batch.commit();
  return warnings;
}
