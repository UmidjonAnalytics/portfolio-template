/**
 * Command-line seeding.
 *
 *   npm run seed          -> fill Firestore with the demo content
 *   npm run seed:clear    -> delete all content (settings are kept)
 *
 * Signs in with SEED_EMAIL / SEED_PASSWORD from .env.local (the admin account), because the
 * security rules only allow the admin to write. Set NEXT_PUBLIC_USE_EMULATORS=true to target
 * the local Firebase emulator instead of the real project.
 */
import { config as loadEnv } from "dotenv";
import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { clearAll, seedAll } from "../src/lib/seed";

loadEnv({ path: ".env.local" });
loadEnv();

async function main() {
  const mode = process.argv.includes("--clear") ? "clear" : "seed";
  const email = process.env.SEED_EMAIL;
  const password = process.env.SEED_PASSWORD;
  if (!email || !password) {
    console.error("Set SEED_EMAIL and SEED_PASSWORD in .env.local (the admin account) before running this script.");
    process.exit(1);
  }

  const app = initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
  const auth = getAuth(app);
  const db = getFirestore(app);
  if (process.env.NEXT_PUBLIC_USE_EMULATORS === "true") {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    console.log("Using the Firebase emulators");
  }

  console.log(`Signing in as ${email}…`);
  await signInWithEmailAndPassword(auth, email, password);

  if (mode === "clear") {
    await clearAll(db, (m) => console.log("  " + m));
    console.log("All content cleared.");
  } else {
    await seedAll(db, { onProgress: (m) => console.log("  " + m) });
    console.log("Demo data written.");
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
