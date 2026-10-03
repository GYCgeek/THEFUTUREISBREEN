#!/usr/bin/env node
// Screenshots of live pages at desktop (1440) and mobile (390), full page.
// Usage: node scripts/screens.mjs --base http://localhost:8080 --out reports/screens/after [--pages /,/about,/GYCT]
// Requires: npm i -D playwright && npx playwright install chromium

import fs from "node:fs";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const arg = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const BASE = arg("--base", process.env.BASE_URL || "https://theglobalyouth.co").replace(/\/$/, "");
const OUT = arg("--out", "reports/screens/latest");

function livePages() {
  const explicit = arg("--pages");
  if (explicit) return explicit.split(",");
  try {
    const sm = fs.readFileSync("docs/site-map.md", "utf8");
    return [...sm.matchAll(/^\|\s*`(\/[^`\s]*)`[^|]*\|[^\n]*\|\s*live\b/gm)].map((m) => m[1]);
  } catch { return ["/", "/about", "/GYCT", "/contact"]; }
}

const viewports = [
  { name: "mobile", width: 390, height: 844, deviceScaleFactor: 2, isMobile: true },
  { name: "desktop", width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false },
];

const browser = await chromium.launch();
fs.mkdirSync(OUT, { recursive: true });
for (const vp of viewports) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.deviceScaleFactor, isMobile: vp.isMobile, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  for (const p of livePages()) {
    const slug = (p === "/" ? "home" : p.replace(/^\//, "").replace(/[^\w-]+/g, "_")) + `-${vp.name}`;
    try {
      // "networkidle" never fires on pages with video embeds/analytics; wait for load, then let late images settle.
      await page.goto(BASE + p, { waitUntil: "load", timeout: 60000 }).catch(() => page.goto(BASE + p, { waitUntil: "domcontentloaded", timeout: 60000 }));
      await page.waitForTimeout(1000);
      // Scroll through the page so lazy images and scroll-reveal sections render before the full-page shot.
      await page.evaluate(async () => {
        for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1000);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      await page.screenshot({ path: `${OUT}/${slug}.png`, fullPage: true });
      await page.screenshot({ path: `${OUT}/${slug}-firstscreen.png`, fullPage: false });
      console.log(`${slug}${overflow ? "  ⚠ horizontal overflow" : ""}`);
    } catch (e) { console.log(`${slug}  ✗ ${e.message.split("\n")[0]}`); }
  }
  await ctx.close();
}
await browser.close();
