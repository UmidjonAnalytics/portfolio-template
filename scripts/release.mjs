#!/usr/bin/env node
/**
 * Build and deploy one site to Firebase Hosting, with Firestore rules made for that site.
 *
 *   npm run release -- .env.orders            build + deploy rules + hosting
 *   npm run release -- .env.orders --rules    deploy rules only
 *   npm run release -- .env.local --hosting   build + deploy hosting only
 *
 * The env file names the Firebase project and the admin emails. Those emails go both into the
 * built site (NEXT_PUBLIC_ADMIN_EMAILS) and into the deployed firestore.rules, so the two can never
 * disagree, and one customer's admin is never written into another customer's rules.
 *
 * Uses the Firebase CLI's own login (`firebase login`). Nothing here reads credentials.
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const envFile = args.find((a) => !a.startsWith("--"));
const rulesOnly = args.includes("--rules");
const hostingOnly = args.includes("--hosting");

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

if (!envFile) fail("Pass the env file of the site to release, e.g.  npm run release -- .env.orders");
const envPath = resolve(root, envFile);
if (!existsSync(envPath)) fail(`${envFile} not found`);

function parseEnv(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!m || line.trim().startsWith("#")) continue;
    out[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

const env = parseEnv(readFileSync(envPath, "utf8"));
const projectId = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const admins = (env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

for (const key of ["NEXT_PUBLIC_FIREBASE_API_KEY", "NEXT_PUBLIC_FIREBASE_PROJECT_ID", "NEXT_PUBLIC_FIREBASE_APP_ID"]) {
  if (!env[key]) fail(`${key} is missing in ${envFile}`);
}
if (!/^[a-z0-9-]{4,40}$/.test(projectId)) fail(`Not a Firebase project id: ${projectId}`);
if (admins.length === 0) fail(`NEXT_PUBLIC_ADMIN_EMAILS is empty in ${envFile}; nobody could administer the site`);
for (const e of admins) if (!/^[^\s@'"]+@[^\s@'"]+\.[^\s@'"]+$/.test(e)) fail(`Not an email address: ${e}`);

// Arguments are fixed strings plus a validated project id, so running through the shell is safe.
// The shell is needed on Windows, where npx and firebase are .cmd files.
const run = (cmd, cmdArgs, extraEnv = {}) => {
  const line = [cmd, ...cmdArgs].join(" ");
  console.log(`\n› ${line}`);
  const r = spawnSync(line, { cwd: root, stdio: "inherit", shell: true, env: { ...process.env, ...extraEnv } });
  if (r.status !== 0) fail(`${cmd} failed (exit ${r.status})`);
};

console.log(`Releasing ${projectId}  ·  admins: ${admins.join(", ")}`);

// 1. Build a static export with exactly this site's public variables. Every NEXT_PUBLIC_ key the
//    project knows about is set explicitly, so nothing leaks in from .env.local.
if (!rulesOnly) {
  const known = new Set();
  for (const file of [".env.example", ".env.local", envFile]) {
    const p = resolve(root, file);
    if (existsSync(p)) for (const k of Object.keys(parseEnv(readFileSync(p, "utf8")))) if (k.startsWith("NEXT_PUBLIC_")) known.add(k);
  }
  const buildEnv = { STATIC_EXPORT: "true" };
  for (const k of known) buildEnv[k] = env[k] ?? "";
  buildEnv.NEXT_PUBLIC_USE_EMULATORS = "false";
  buildEnv.NEXT_PUBLIC_ADMIN_EMAILS = admins.join(",");
  run("npx", ["next", "build"], buildEnv);
  if (!existsSync(resolve(root, "out", "index.html"))) fail("Build finished but out/index.html is missing");
  // The product page (/info) plays the promo; only the orders deployment has that page.
  const promo = resolve(root, "docs", "offer", "video", "promo-story-Charon.mp4");
  if (env.NEXT_PUBLIC_INTAKE_ENABLED === "true" && existsSync(promo)) copyFileSync(promo, resolve(root, "out", "promo.mp4"));
}

// 2. Rules for this project only: replace the admin list in firestore.rules.
const rules = readFileSync(resolve(root, "firestore.rules"), "utf8");
const listRe = /(function adminEmails\(\)\s*\{[\s\S]*?return\s*)\[[\s\S]*?\](\s*;)/;
if (!listRe.test(rules)) fail("Could not find adminEmails() in firestore.rules");
const siteRules = rules.replace(listRe, `$1[\n        ${admins.map((e) => `'${e}'`).join(",\n        ")}\n      ]$2`);
mkdirSync(resolve(root, ".release"), { recursive: true });
writeFileSync(resolve(root, ".release", "firestore.rules"), siteRules);

// 3. Firebase config for this release.
const intakeOnly = env.NEXT_PUBLIC_INTAKE_ONLY === "true";
const config = {
  firestore: { rules: ".release/firestore.rules", indexes: "firestore.indexes.json" },
  hosting: {
    public: "out",
    cleanUrls: true,
    trailingSlash: false,
    redirects: intakeOnly ? [{ source: "/", destination: "/forma", type: 302 }] : [],
    // Every blog address is served the one prerendered blog page, which reads the slug itself.
    rewrites: [{ source: "/blog/**", destination: "/blog/_.html" }],
    headers: [
      {
        source: "**",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
      { source: "/_next/static/**", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ],
  },
};
writeFileSync(resolve(root, "firebase.release.json"), JSON.stringify(config, null, 2));

// 4. Deploy.
const only = rulesOnly ? "firestore:rules" : hostingOnly ? "hosting" : "firestore:rules,hosting";
run("firebase", ["deploy", "--only", only, "--project", projectId, "--config", "firebase.release.json", "--non-interactive"]);

console.log(`\n✔ Released ${projectId}`);
if (!rulesOnly) console.log(`  https://${projectId}.web.app${intakeOnly ? "/forma" : ""}`);
