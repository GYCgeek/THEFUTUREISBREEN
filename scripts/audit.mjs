#!/usr/bin/env node
// GYC site audit — crawls same-origin pages, checks every link/asset, scans for known bad patterns.
// Usage: node scripts/audit.mjs --base https://theglobalyouth.co [--max 200] [--fail-on-regression]
// Output: reports/audit-latest.json, reports/audit-latest.md. Compares with reports/audit-previous.json.
// No dependencies (Node 18+).

import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const arg = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const BASE = (arg("--base", process.env.BASE_URL || "https://theglobalyouth.co")).replace(/\/$/, "");
const MAX_PAGES = Number(arg("--max", 200));
const FAIL_ON_REGRESSION = args.includes("--fail-on-regression");
const TIMEOUT_MS = 15000;
const CONCURRENCY = 6;
const OUT = "reports";
const SKIP_EXTERNAL = ["linkedin.com", "instagram.com", "twitter.com", "x.com", "unesco.org"]; // block bots; checked manually

// Seed pages that may not be linked (from site-map.md if present)
function seedPaths() {
  const seeds = ["/"];
  try {
    const sm = fs.readFileSync("docs/site-map.md", "utf8");
    for (const m of sm.matchAll(/\|\s*`(\/[^`\s]*)`/g)) seeds.push(m[1]);
  } catch {}
  return [...new Set(seeds)];
}

// Pattern rules: [id, severity, regex, message]
const RULES = [
  ["placeholder-video", "error", /YOUR_VIDEO_ID/g, "Template video placeholder"],
  ["placeholder-image", "error", /via\.placeholder\.com/g, "Dead placeholder image service"],
  ["lorem", "error", /lorem ipsum/gi, "Lorem ipsum text"],
  ["dead-hash-link", "warning", /<a\b[^>]*href=["']#["']/gi, "Link goes nowhere (href=\"#\")"],
  ["empty-href", "warning", /<a\b[^>]*href=["']["']/gi, "Empty href"],
  ["personal-email", "error", /[A-Za-z0-9._%+-]+@(gmail|outlook|hotmail|yahoo)\.com/gi, "Personal email address published"],
  ["uni-personal-email", "warning", /[A-Za-z0-9._%+-]+@fen\.uchile\.cl/gi, "Personal university email published"],
  ["whatsapp-invite", "error", /chat\.whatsapp\.com\/[A-Za-z0-9]+/g, "WhatsApp invite link exposed"],
  ["internal-form", "error", /gyct-platform-form/g, "Internal team form linked publicly"],
  ["retired-name", "error", /GYC House|Innovation House|Hack for the Future(?!s)/g, "Retired name (use Youth House / Hack for the Futures)"],
  ["old-chair", "error", /Founder\s*&(amp;)?\s*Chair|CHAIRPERSON/g, "Outdated leadership title"],
  ["tbc", "warning", /\bTBC\b|To Be Confirmed|Coming Soon/gi, "Unconfirmed / coming-soon content"],
  ["typo-address", "warning", /Speerstrassse/g, "Address typo"],
  ["typo-trough", "warning", /Mapped Trough/g, "Typo: Trough → Through"],
  ["template-copy", "warning", /Vibrant Website|Every Click Unveils/g, "Template filler copy"],
  ["hotlinked-expiring", "warning", /media\.licdn\.com|static\.wixstatic\.com/g, "Hotlinked third-party image (may expire)"],
  ["railway-url", "warning", /up\.railway\.app/g, "Use canonical gycailabs.org instead of Railway URL"],
  ["public-html-path", "error", /\/public_html\//g, "Server folder exposed in URL"],
  ["http-link", "warning", /href=["']http:\/\/theglobalyouth/gi, "Insecure http link to own site"],
];

const pages = new Map();     // url -> {status, rules:[], links:[]}
const linkStatus = new Map(); // url -> {status, error, from:Set}

async function fetchWithTimeout(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { redirect: "follow", signal: ctrl.signal, headers: { "user-agent": "GYC-site-audit/1.0" }, ...opts });
  } finally { clearTimeout(t); }
}

function normalise(href, pageUrl) {
  if (!href) return null;
  href = href.trim().replace(/&amp;/g, "&");
  if (/^(mailto:|tel:|javascript:|data:|#)/i.test(href)) return null;
  try {
    const u = new URL(href, pageUrl);
    u.hash = "";
    return u.toString();
  } catch { return null; }
}

function extract(html, pageUrl) {
  const out = [];
  const re = /\b(?:href|src)=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html))) { const u = normalise(m[1], pageUrl); if (u) out.push(u); }
  return [...new Set(out)];
}

const isInternal = (u) => { try { return new URL(u).host.replace(/^www\./, "") === new URL(BASE).host.replace(/^www\./, ""); } catch { return false; } };
const isHtmlLike = (u) => !/\.(pdf|png|jpe?g|gif|webp|svg|mp4|webm|css|js|ico|woff2?|ttf|zip|docx?|xlsx?)(\?|$)/i.test(u);

const SEEDS = new Set();
async function crawl() {
  seedPaths().forEach((p) => SEEDS.add(BASE + (p === "/" ? "/" : p)));
  const queue = seedPaths().map((p) => BASE + (p === "/" ? "/" : p));
  const seen = new Set();
  while (queue.length && pages.size < MAX_PAGES) {
    const batch = queue.splice(0, CONCURRENCY).filter((u) => !seen.has(u));
    batch.forEach((u) => seen.add(u));
    await Promise.all(batch.map(async (url) => {
      let res, html = "";
      try { res = await fetchWithTimeout(url); } catch (e) { pages.set(url, { status: 0, error: String(e.name || e), rules: [], links: [] }); return; }
      const ct = res.headers.get("content-type") || "";
      if (res.status >= 400) { pages.set(url, { status: res.status, rules: [], links: [] }); return; }
      // A redirect source is not a page: record where it went and crawl the target under its own URL
      // (otherwise the target's relative links resolve against the old path and look broken).
      if (res.redirected && res.url !== url) {
        pages.set(url, { status: res.status, redirectedTo: res.url, rules: [], links: [] });
        if (!seen.has(res.url)) queue.push(res.url);
        return;
      }
      if (!ct.includes("text/html")) { pages.set(url, { status: res.status, contentType: ct, rules: [{ id: "not-html", severity: "error", count: 1, message: `Page URL serves ${ct || "unknown type"}` }], links: [] }); return; }
      html = (await res.text()).replace(/<!--[\s\S]*?-->/g, ""); // commented-out markup is not shipped content
      const rules = [];
      for (const [id, severity, re, message] of RULES) {
        const matches = html.match(re);
        if (matches) rules.push({ id, severity, count: matches.length, sample: matches[0].slice(0, 80), message });
      }
      const links = extract(html, url);
      pages.set(url, { status: res.status, rules, links });
      for (const l of links) {
        if (!linkStatus.has(l)) linkStatus.set(l, { from: new Set() });
        linkStatus.get(l).from.add(url);
        if (isInternal(l) && isHtmlLike(l) && !seen.has(l)) queue.push(l);
      }
    }));
  }
}

async function checkLinks() {
  const urls = [...linkStatus.keys()].filter((u) => !pages.has(u));
  for (const u of [...linkStatus.keys()]) if (pages.has(u)) linkStatus.get(u).status = pages.get(u).status;
  let i = 0;
  async function worker() {
    while (i < urls.length) {
      const u = urls[i++];
      const entry = linkStatus.get(u);
      if (SKIP_EXTERNAL.some((d) => u.includes(d))) { entry.status = "skipped"; continue; }
      try {
        let r = await fetchWithTimeout(u, { method: "HEAD" });
        if (r.status === 405 || r.status === 403 || r.status === 501) r = await fetchWithTimeout(u, { method: "GET" });
        entry.status = r.status;
        if (r.headers.get("content-length") && Number(r.headers.get("content-length")) > 20_000_000) entry.large = Number(r.headers.get("content-length"));
      } catch (e) { entry.status = 0; entry.error = String(e.name || e); }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
}

function summarise() {
  const findings = [];
  for (const [url, p] of pages) {
    if ((p.status >= 400 || p.status === 0) && SEEDS.has(url)) findings.push({ severity: "error", id: "page-broken", page: url, message: `Page returns ${p.status || p.error}` });
    for (const r of p.rules) findings.push({ severity: r.severity, id: r.id, page: url, message: `${r.message} (${r.count}×)`, sample: r.sample });
  }
  for (const [url, l] of linkStatus) {
    const bad = l.status === 0 || (typeof l.status === "number" && l.status >= 400);
    if (bad) findings.push({ severity: isInternal(url) ? "error" : "warning", id: isInternal(url) ? "broken-internal" : "broken-external", page: [...l.from][0], target: url, message: `Link returns ${l.status || l.error}`, foundOn: [...l.from] });
    if (l.large) findings.push({ severity: "warning", id: "heavy-file", page: [...l.from][0], target: url, message: `File is ${(l.large / 1e6).toFixed(0)} MB` });
  }
  // Compare by path, not origin, so a local-preview audit can be gated against a live baseline
  // (and http/https/www variants of the same page count once).
  const SITE = /^https?:\/\/(www\.)?(theglobalyouth\.co|localhost(:\d+)?|127\.0\.0\.1(:\d+)?)/;
  const key = (f) => `${f.id}|${(f.page || "").replace(SITE, "") || "/"}|${(f.target || "").replace(SITE, "")}`;
  return { findings, key };
}

function writeReports(findings, key) {
  fs.mkdirSync(OUT, { recursive: true });
  const prevPath = path.join(OUT, "audit-previous.json");
  const prev = fs.existsSync(prevPath) ? JSON.parse(fs.readFileSync(prevPath, "utf8")) : null;
  const prevKeys = new Set((prev?.findings || []).map(key));
  const curKeys = new Set(findings.map(key));
  const newErrors = findings.filter((f) => f.severity === "error" && !prevKeys.has(key(f)));
  const fixed = (prev?.findings || []).filter((f) => !curKeys.has(key(f)));
  const counts = { pages: pages.size, links: linkStatus.size, errors: findings.filter((f) => f.severity === "error").length, warnings: findings.filter((f) => f.severity === "warning").length, newErrors: prev ? newErrors.length : null, fixedSincePrevious: prev ? fixed.length : null };
  const report = { base: BASE, date: new Date().toISOString(), counts, findings };
  fs.writeFileSync(path.join(OUT, "audit-latest.json"), JSON.stringify(report, null, 2));

  const lines = [`# Audit — ${BASE} — ${report.date.slice(0, 10)}`, "", `Pages: ${counts.pages} · Links checked: ${counts.links} · Errors: ${counts.errors} · Warnings: ${counts.warnings}` + (prev ? ` · New errors: ${counts.newErrors} · Fixed since last run: ${counts.fixedSincePrevious}` : ""), ""];
  for (const sev of ["error", "warning"]) {
    const list = findings.filter((f) => f.severity === sev);
    if (!list.length) continue;
    lines.push(`## ${sev === "error" ? "Errors" : "Warnings"}`, "", "| Rule | Page | Detail |", "|---|---|---|");
    for (const f of list) lines.push(`| ${f.id} | ${f.page.replace(BASE, "") || "/"} | ${f.message}${f.target ? ` → ${f.target}` : ""}${f.sample ? ` — \`${f.sample.replace(/\|/g, "\\|")}\`` : ""} |`);
    lines.push("");
  }
  if (prev && newErrors.length) { lines.push("## New errors since previous run", ""); newErrors.forEach((f) => lines.push(`- ${f.id} on ${f.page}: ${f.message}${f.target ? ` → ${f.target}` : ""}`)); }
  fs.writeFileSync(path.join(OUT, "audit-latest.md"), lines.join("\n") + "\n");
  console.log(lines.slice(0, 3).join("\n"));
  return { newErrors, prev };
}

await crawl();
await checkLinks();
const { findings, key } = summarise();
const { newErrors, prev } = writeReports(findings, key);
if (FAIL_ON_REGRESSION && prev && newErrors.length) { console.error(`FAIL: ${newErrors.length} new error(s) since previous audit`); process.exit(1); }
