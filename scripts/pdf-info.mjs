#!/usr/bin/env node
// Rough PDF facts without dependencies: size, page count (largest /Count), title, dates.
// Usage: node scripts/pdf-info.mjs file.pdf [more.pdf]
import fs from "node:fs";

for (const f of process.argv.slice(2)) {
  const buf = fs.readFileSync(f);
  const s = buf.toString("latin1");
  const counts = [...s.matchAll(/\/Count\s+(\d+)/g)].map((m) => +m[1]);
  const pick = (re) => (s.match(re) || [])[1] || "";
  console.log(JSON.stringify({
    file: f,
    mb: +(buf.length / 1048576).toFixed(1),
    pages: counts.length ? Math.max(...counts) : null,
    pageObjects: (s.match(/\/Type\s*\/Page[^s]/g) || []).length,
    title: pick(/\/Title\s*\(([^)]*)\)/),
    producer: pick(/\/Producer\s*\(([^)]*)\)/),
    created: pick(/\/CreationDate\s*\(([^)]*)\)/),
    modified: pick(/\/ModDate\s*\(([^)]*)\)/),
  }));
}
