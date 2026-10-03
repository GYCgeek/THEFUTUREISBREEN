#!/usr/bin/env node
// Lists the site files a human must upload to Awardspace: everything that changed between the
// `live` tag (what is on the server) and a ref (default `main`), minus the loop's own files.
// Usage: node scripts/upload-list.mjs [ref=main] [--write]   (--write saves reports/UPLOAD-<date>.md)
// After uploading: git tag -f live <ref>

import { execFileSync } from "node:child_process";
import fs from "node:fs";

const args = process.argv.slice(2);
const ref = args.find((a) => !a.startsWith("--")) || "main";
const git = (...a) => execFileSync("git", a, { encoding: "utf8" }).trim();

// Never uploaded: the loop's tooling and private working notes (facts.yaml lists internal material).
const LOCAL_ONLY = /^(\.claude\/|\.github\/|scripts\/|reports\/|node_modules\/|docs\/(brand\/|BACKLOG|QUESTIONS|LOOP_LOG|fix-pack|site-map)|CLAUDE\.md$|README-LOOP\.md$|package(-lock)?\.json$|\.gitignore$)/;

const rows = git("diff", "--name-status", "--no-renames", `live..${ref}`).split("\n").filter(Boolean)
  .map((l) => { const [status, ...p] = l.split("\t"); return { status, path: p.join("\t") }; })
  .filter((r) => !LOCAL_ONLY.test(r.path));

const upload = rows.filter((r) => r.status !== "D");
const removed = rows.filter((r) => r.status === "D");
const lines = [
  `# Upload list — live..${ref} — ${new Date().toISOString().slice(0, 10)}`, "",
  upload.length ? `Upload these ${upload.length} file(s) to the same paths on the server (overwrite):` : "Nothing to upload.", "",
  ...upload.map((r) => `- ${r.status === "A" ? "(new) " : ""}\`${r.path}\``),
];
if (removed.length) lines.push("", "Removed in git (delete on the server only if you are sure):", ...removed.map((r) => `- \`${r.path}\``));
if (upload.some((r) => r.path === ".htaccess")) lines.push("", "`.htaccess` changed: upload it LAST, then open https://theglobalyouth.co/ . If the site shows a 500 error, the host does not allow `Options -Indexes` — delete that one line from `.htaccess` on the server and re-upload.");
lines.push("", `When done: \`git tag -f live ${ref}\``);
const out = lines.join("\n") + "\n";
console.log(out);
if (args.includes("--write")) { fs.mkdirSync("reports", { recursive: true }); fs.writeFileSync(`reports/UPLOAD-${new Date().toISOString().slice(0, 10)}.md`, out); }
