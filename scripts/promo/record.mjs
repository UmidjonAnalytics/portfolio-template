// Records the local demo site scrolling, per style and device, as timestamped JPEG frames.
// Needs the emulators with demo data and `npm run dev` on :3000 with NEXT_PUBLIC_DESIGN_DEMO=true
// (see .env.development.local in LAUNCH.md), Chrome, and `npm i --no-save puppeteer-core`.
//   node scripts/promo/record.mjs            all scenes
//   node scripts/promo/record.mjs excel      one scene
// Then: python scripts/promo/compose.py docs/offer/video/promo-devices.mp4
import puppeteer from "puppeteer-core";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const SITE = "http://localhost:3000/";
const OUT = join(import.meta.dirname, "frames");
const SETDESIGN = join(import.meta.dirname, "setdesign.py");

const DEVICES = {
  laptop: { width: 1440, height: 900, deviceScaleFactor: 1 },
  tablet: { width: 820, height: 1180, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
  phone: { width: 390, height: 844, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true },
};

// Each scene: a design, a theme, and a scroll plan. Steps: [sectionId | "top", milliseconds].
const SCENES = [
  { name: "classic", design: ["style=classic", "accent=#0f8b8d", "hero=split", "skills=cards", "projects=grid"], theme: "light", plan: [["hold", 1800], ["about", 1800], ["skills", 2000], ["projects", 2200]] },
  { name: "excel", design: ["style=excel", "accent=#217346", "hero=split", "skills=table", "projects=compact"], theme: "light", plan: [["hold", 700], ["skills", 1800], ["projects", 2000]] },
  { name: "sql", design: ["style=sql", "accent=#2f81f7", "hero=centered", "skills=rings", "projects=carousel"], theme: "dark", plan: [["hold", 900], ["skills", 1700], ["projects", 1900]] },
  { name: "powerbi", design: ["style=powerbi", "accent=#118dff", "hero=split", "skills=chips", "experience=cards"], theme: "light", plan: [["hold", 600], ["skills", 1500], ["experience", 1800]] },
  { name: "mono", design: ["style=mono", "accent=#0a0a0a", "hero=minimal", "projects=stacked", "certificates=list"], theme: "dark", plan: [["hold", 700], ["projects", 2000], ["certificates", 1300]] },
  { name: "notebook", design: ["style=notebook", "accent=#e46e1b", "hero=centered", "skills=cards"], theme: "light", plan: [["hold", 1500], ["about", 1600]] },
];

// The demo portrait without the demo person's name on it.
const PORTRAIT = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(188 40% 22%)"/><stop offset="1" stop-color="hsl(223 45% 40%)"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(188 30% 80%)"/><stop offset="1" stop-color="hsl(188 30% 60%)"/></linearGradient></defs><rect width="800" height="1000" fill="url(#bg)"/><circle cx="640" cy="160" r="240" fill="white" opacity="0.06"/><circle cx="400" cy="380" r="150" fill="url(#b)"/><path d="M120 1000 C120 720 240 640 400 640 C560 640 680 720 680 1000 Z" fill="url(#b)"/></svg>`);

const HIDE = `nextjs-portal{display:none!important}button[aria-expanded].fixed{display:none!important}`;

async function record(browser, scene, device) {
  const dir = join(OUT, scene.name, device);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const page = await browser.newPage();
  await page.setViewport(DEVICES[device]);
  await page.evaluateOnNewDocument((theme, css, photo) => {
    localStorage.setItem("theme", theme);
    localStorage.setItem("lang", "uz");
    localStorage.setItem("demo-me", JSON.stringify({ name: "Ismingiz Familiyangiz", photo }));
    document.addEventListener("DOMContentLoaded", () => {
      const s = document.createElement("style");
      s.textContent = css;
      document.head.appendChild(s);
    });
  }, scene.theme, HIDE, PORTRAIT);
  // Warm-up load: compiles the page and fills the style cache, so the recorded load paints styled.
  await page.goto(SITE, { waitUntil: "networkidle2", timeout: 120000 });
  await page.waitForSelector("#projects", { timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1200));

  const cdp = await page.createCDPSession();
  const frames = [];
  let n = 0;
  cdp.on("Page.screencastFrame", async (f) => {
    const file = `${String(n++).padStart(4, "0")}.jpg`;
    writeFileSync(join(dir, file), Buffer.from(f.data, "base64"));
    frames.push({ file, t: f.metadata.timestamp });
    try {
      await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId });
    } catch {}
  });
  const { width, height, deviceScaleFactor } = DEVICES[device];
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 88, maxWidth: Math.round(width * deviceScaleFactor), maxHeight: Math.round(height * deviceScaleFactor), everyNthFrame: 1 });

  // The recorded load: hero entrance animations, then the scroll plan.
  const t0 = Date.now() / 1000;
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector("#projects", { timeout: 60000 });
  const ready = Date.now() / 1000;
  await page.evaluate(async (plan) => {
    const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const header = 70;
    for (const [target, ms] of plan) {
      if (target === "hold") {
        await new Promise((r) => setTimeout(r, ms));
        continue;
      }
      const el = document.getElementById(target);
      const from = window.scrollY;
      const to = Math.max(0, (el ? el.getBoundingClientRect().top + window.scrollY : 0) - header);
      const start = performance.now();
      await new Promise((resolve) => {
        const tick = (now) => {
          const p = Math.min(1, (now - start) / ms);
          window.scrollTo(0, from + (to - from) * ease(p));
          if (p < 1) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      });
    }
    await new Promise((r) => setTimeout(r, 400));
  }, scene.plan);
  await cdp.send("Page.stopScreencast");
  await new Promise((r) => setTimeout(r, 300));
  writeFileSync(join(dir, "frames.json"), JSON.stringify({ t0, ready, frames }));
  await page.close();
  return frames.length;
}

const only = process.argv[2];
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, userDataDir: join(import.meta.dirname, "profile"), args: ["--hide-scrollbars", "--disable-features=Translate"] });
try {
  for (const scene of SCENES) {
    if (only && scene.name !== only) continue;
    execFileSync("python", [SETDESIGN, ...scene.design, "motion=smooth", "speed=normal"], { stdio: "inherit" });
    for (const device of Object.keys(DEVICES)) {
      const count = await record(browser, scene, device);
      console.log(scene.name, device, count, "frames");
    }
  }
} finally {
  await browser.close();
}
