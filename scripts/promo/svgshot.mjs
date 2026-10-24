// Renders an SVG file to a PNG with a transparent background: node scripts/promo/svgshot.mjs in.svg out.png [size]
// node svgshot.mjs in.svg out.png size
import puppeteer from "puppeteer-core";
import { readFileSync } from "node:fs";
const [, , inp, out, size = "512"] = process.argv;
const b = await puppeteer.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
const p = await b.newPage();
await p.setViewport({ width: +size, height: +size, deviceScaleFactor: 1 });
const svg = readFileSync(inp, "utf8");
await p.setContent(`<html><body style="margin:0;background:transparent">${svg.replace("<svg ", `<svg style="width:${size}px;height:${size}px;display:block" `)}</body></html>`);
await p.screenshot({ path: out, omitBackground: true });
await b.close();
