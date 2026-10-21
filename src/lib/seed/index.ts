import {
  collection,
  doc,
  getDocs,
  writeBatch,
  type Firestore,
} from "firebase/firestore";
import { removeMedia } from "../media-store";
import { COLLECTIONS, defaultProfile, type Profile, type SiteSettings } from "../types";
import {
  seedBlog,
  seedCertificates,
  seedEducation,
  seedExperience,
  seedMessages,
  seedProfile,
  seedProjects,
  seedSettings,
  seedSkills,
  seedTestimonials,
} from "./data";

const ALL_COLLECTIONS = [...COLLECTIONS, "messages"];
const BATCH_LIMIT = 400;

export type ProgressFn = (message: string) => void;

async function deleteCollection(db: Firestore, name: string, onProgress?: ProgressFn): Promise<number> {
  const snap = await getDocs(collection(db, name));
  let batch = writeBatch(db);
  let count = 0;
  let inBatch = 0;
  for (const d of snap.docs) {
    batch.delete(d.ref);
    count++;
    inBatch++;
    if (inBatch >= BATCH_LIMIT) {
      await batch.commit();
      batch = writeBatch(db);
      inBatch = 0;
    }
  }
  if (inBatch > 0) await batch.commit();
  onProgress?.(`Cleared ${name} (${count})`);
  return count;
}

/**
 * Delete every content document, message and uploaded media file, and reset the profile to
 * an empty one. Site settings are kept so the owner's colour/language choices survive.
 */
export async function clearAll(db: Firestore, onProgress?: ProgressFn): Promise<void> {
  for (const name of ALL_COLLECTIONS) await deleteCollection(db, name, onProgress);
  // Media documents may have chunk subcollections, which a plain delete would orphan.
  const media = await getDocs(collection(db, "media"));
  for (const m of media.docs) await removeMedia(db, m.id);
  onProgress?.(`Cleared media (${media.size})`);
  const batch = writeBatch(db);
  const empty: Profile = { ...defaultProfile(), updatedAt: Date.now() };
  batch.set(doc(db, "site", "profile"), empty);
  await batch.commit();
  onProgress?.("Profile reset");
}

/** Write the demo content. Existing content is cleared first so the result is predictable. */
export async function seedAll(
  db: Firestore,
  options: { keepSettings?: boolean; onProgress?: ProgressFn } = {},
): Promise<void> {
  const { keepSettings = true, onProgress } = options;
  await clearAll(db, onProgress);

  const now = Date.now();
  let batch = writeBatch(db);
  let inBatch = 0;
  const flush = async () => {
    if (inBatch > 0) {
      await batch.commit();
      batch = writeBatch(db);
      inBatch = 0;
    }
  };
  const add = async (name: string, data: Record<string, unknown>, i: number) => {
    batch.set(doc(collection(db, name)), { ...data, createdAt: now - i * 1000, updatedAt: now - i * 1000 });
    inBatch++;
    if (inBatch >= BATCH_LIMIT) await flush();
  };

  batch.set(doc(db, "site", "profile"), { ...seedProfile, updatedAt: now });
  inBatch++;
  if (!keepSettings) {
    const settings: SiteSettings = { ...seedSettings, updatedAt: now };
    batch.set(doc(db, "site", "settings"), settings);
    inBatch++;
  } else {
    // Only fill in the demo site name / SEO when they are blank.
    batch.set(
      doc(db, "site", "settings"),
      { siteName: seedSettings.siteName, seoTitle: seedSettings.seoTitle, seoDescription: seedSettings.seoDescription, updatedAt: now },
      { merge: true },
    );
    inBatch++;
  }

  const lists: [string, Record<string, unknown>[]][] = [
    ["skills", seedSkills],
    ["projects", seedProjects],
    ["experience", seedExperience],
    ["certificates", seedCertificates],
    ["education", seedEducation],
    ["testimonials", seedTestimonials],
    ["blog", seedBlog],
    ["messages", seedMessages],
  ];
  for (const [name, items] of lists) {
    for (let i = 0; i < items.length; i++) await add(name, items[i], i);
    onProgress?.(`Seeded ${name} (${items.length})`);
  }
  await flush();
  onProgress?.("Done");
}
