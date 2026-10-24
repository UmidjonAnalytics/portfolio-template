// Records the story video's interactive parts: language switching, live style changes and a
// project case study opening. Same setup as record.mjs (emulators, dev server, puppeteer-core).
//   node scripts/promo/record_story.mjs [part]
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

// Styles cycled live in the "designs" part, with the theme and accent each one uses.
const CYCLE = [
  ["classic", "light", "#0f8b8d"],
  ["excel", "light", "#217346"],
  ["sql", "dark", "#2f81f7"],
  ["powerbi", "light", "#118dff"],
  ["mono", "dark", "#f5f5f5"],
  ["notebook", "light", "#e46e1b"],
];
const CYCLE_STEP = 0.55; // seconds per style
const CYCLE_START = 0.3;

const PARTS = [
  { name: "languages", device: "tablet", design: ["style=mono", "hero=split"], theme: "dark", plan: [["hold", 1300], ["lang", "RU"], ["hold", 1300], ["lang", "EN"], ["hold", 1300], ["scroll", "about", 1500], ["hold", 600]] },
  { name: "designs", device: "laptop", design: ["style=classic", "accent=#0f8b8d", "hero=split"], theme: "light", plan: [["hold", CYCLE_START * 1000], ["cycle"], ["hold", 800]] },
  // The admin panel, signed in to the local emulator with its throwaway test account.
  { name: "admin", device: "laptop", path: "admin/experience", login: true, design: ["style=classic"], theme: "dark", plan: [["hold", 700], ["add"], ["hold", 700], ["type", "#e-company", "Uzum Market"], ["hold", 250], ["type", "role", "Senior Data Analyst"], ["hold", 1400]] },
  { name: "projects", device: "tablet", design: ["style=sql", "accent=#2f81f7", "projects=grid"], theme: "dark", plan: [["hold", 500], ["scroll", "projects", 1300], ["hold", 500], ["open"], ["hold", 1300], ["modal", 700, 1600], ["hold", 1200]] },
];

const PORTRAIT = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(188 40% 22%)"/><stop offset="1" stop-color="hsl(223 45% 40%)"/></linearGradient><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(188 30% 80%)"/><stop offset="1" stop-color="hsl(188 30% 60%)"/></linearGradient></defs><rect width="800" height="1000" fill="url(#bg)"/><circle cx="640" cy="160" r="240" fill="white" opacity="0.06"/><circle cx="400" cy="380" r="150" fill="url(#b)"/><path d="M120 1000 C120 720 240 640 400 640 C560 640 680 720 680 1000 Z" fill="url(#b)"/></svg>`);
const HIDE = `nextjs-portal{display:none!important}button[aria-expanded].fixed{display:none!important}`;

async function runPlan(page, plan) {
  for (const step of plan) {
    const [kind, a, b] = step;
    if (kind === "hold") await new Promise((r) => setTimeout(r, a));
    else if (kind === "lang") {
      await page.evaluate((code) => {
        const btn = [...document.querySelectorAll("header button")].find((x) => x.textContent.trim() === code);
        btn?.click();
      }, a);
    } else if (kind === "add") {
      await page.evaluate(() => document.querySelector("main button svg.lucide-plus")?.closest("button")?.click());
    } else if (kind === "type") {
      // "role" is the first text field after the company field in the editor.
      const handle =
        a === "role"
          ? await page.evaluateHandle(() => {
              const fields = [...document.querySelectorAll("[role=dialog] input")].filter((x) => !x.type || x.type === "text");
              return fields[fields.findIndex((x) => x.id === "e-company") + 1];
            })
          : await page.$(a);
      await handle.click();
      // One character at a time through React's own input path; simulated key presses in headless
      // Chrome only reached the field once.
      await page.evaluate(
        async (el, text) => {
          const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
          el.focus();
          for (let i = 1; i <= text.length; i++) {
            setter.call(el, text.slice(0, i));
            el.dispatchEvent(new Event("input", { bubbles: true }));
            await new Promise((r) => setTimeout(r, 55));
          }
        },
        handle,
        b,
      );
    } else if (kind === "open") {
      await page.evaluate(() => document.querySelector("#projects ul li button")?.click());
    } else if (kind === "cycle") {
      // Switch the whole look in place: the same attributes and colours the site sets itself.
      await page.evaluate(async (cycle, step) => {
        const h = document.documentElement;
        const bg = { classic: "plain", excel: "grid", sql: "dots", powerbi: "plain", mono: "plain", notebook: "lines" };
        for (const [style, theme, accent] of cycle) {
          h.dataset.style = style;
          h.dataset.bg = bg[style];
          h.classList.toggle("dark", theme === "dark");
          h.style.colorScheme = theme;
          h.style.setProperty("--accent", accent);
          h.style.setProperty("--accent-fg", style === "mono" ? "#0a0a0a" : "#ffffff");
          await new Promise((r) => setTimeout(r, step * 1000));
        }
      }, CYCLE, CYCLE_STEP);
    } else {
      // "scroll": the page to a section; "modal": the open dialog's scroll area by a px.
      await page.evaluate(
        async (kind, a, b) => {
          const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
          let el, from, to, ms;
          if (kind === "scroll") {
            el = document.scrollingElement;
            const target = document.getElementById(a);
            from = el.scrollTop;
            to = Math.max(0, (target ? target.getBoundingClientRect().top + el.scrollTop : 0) - 70);
            ms = b;
          } else {
            el = [...document.querySelectorAll("[role=dialog], [role=dialog] *")].find((x) => x.scrollHeight > x.clientHeight + 20 && getComputedStyle(x).overflowY !== "visible");
            if (!el) return;
            from = el.scrollTop;
            to = from + a;
            ms = b;
          }
          const start = performance.now();
          await new Promise((resolve) => {
            const tick = (now) => {
              const p = Math.min(1, (now - start) / ms);
              el.scrollTop = from + (to - from) * ease(p);
              if (p < 1) requestAnimationFrame(tick);
              else resolve();
            };
            requestAnimationFrame(tick);
          });
        },
        kind,
        a,
        b,
      );
    }
  }
}

async function record(browser, part) {
  const dir = join(OUT, part.name, part.device);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const page = await browser.newPage();
  await page.setViewport(DEVICES[part.device]);
  await page.evaluateOnNewDocument(
    (theme, css, photo) => {
      localStorage.setItem("theme", theme);
      localStorage.setItem("lang", "uz");
      localStorage.setItem("demo-me", JSON.stringify({ name: "Ismingiz Familiyangiz", photo }));
      document.addEventListener("DOMContentLoaded", () => {
        const s = document.createElement("style");
        s.textContent = css;
        document.head.appendChild(s);
      });
    },
    part.theme,
    HIDE,
    PORTRAIT,
  );
  if (part.login) {
    await page.goto(SITE + "admin/login", { waitUntil: "networkidle2", timeout: 120000 });
    // The browser profile keeps the session, so the login form only shows the first time.
    const form = await page.waitForSelector("input[type=email]", { timeout: 6000 }).catch(() => null);
    if (form) {
      await page.type("input[type=email]", "umidjonarslonov.analytics@gmail.com");
      await page.type("input[type=password]", "emulator-only-pass-123");
      await page.keyboard.press("Enter");
      await page.waitForFunction(() => !location.pathname.includes("login"), { timeout: 60000 });
    }
    await page.goto(SITE + part.path, { waitUntil: "networkidle2", timeout: 120000 });
    await page.waitForSelector("main button svg.lucide-plus", { timeout: 60000 });
    await new Promise((r) => setTimeout(r, 1500));
  } else {
    await page.goto(SITE, { waitUntil: "networkidle2", timeout: 120000 });
    await page.waitForSelector("#projects", { timeout: 60000 });
    await new Promise((r) => setTimeout(r, 1200));
    // Let the hero finish animating before recording; these parts are about the interaction.
    await page.reload({ waitUntil: "networkidle2" });
    await page.waitForSelector("#projects", { timeout: 60000 });
    await new Promise((r) => setTimeout(r, 1800));
  }

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
  const { width, height, deviceScaleFactor } = DEVICES[part.device];
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 88, maxWidth: Math.round(width * deviceScaleFactor), maxHeight: Math.round(height * deviceScaleFactor), everyNthFrame: 1 });
  // A first frame even if nothing moves yet.
  await page.evaluate(() => window.scrollBy(0, 1));
  const ready = Date.now() / 1000;
  await runPlan(page, part.plan);
  await new Promise((r) => setTimeout(r, 300));
  await cdp.send("Page.stopScreencast");
  writeFileSync(join(dir, "frames.json"), JSON.stringify({ t0: ready, ready, frames }));
  await page.close();
  return frames.length;
}

{
  const only = process.argv[2];
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, userDataDir: join(import.meta.dirname, "profile"), args: ["--hide-scrollbars"] });
  try {
    for (const part of PARTS) {
      if (only && part.name !== only) continue;
      execFileSync("python", [SETDESIGN, ...part.design, "motion=smooth", "speed=normal"], { stdio: "inherit" });
      console.log(part.name, part.device, await record(browser, part), "frames");
    }
  } finally {
    await browser.close();
  }
}
