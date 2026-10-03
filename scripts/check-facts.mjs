#!/usr/bin/env node
// Fails if served pages contradict docs/brand/facts.yaml on the facts that are copied into every
// page (contact details, leadership titles, retired names). The site has no shared include, so this
// is the guard that keeps the copies in sync.
// Usage: node scripts/check-facts.mjs   (exit 1 on any contradiction)

import fs from "node:fs";
import * as yaml from "js-yaml";

const facts = yaml.load(fs.readFileSync("docs/brand/facts.yaml", "utf8"));
const SERVED = ["index.html", "about-us.html", "contact-us.html", "report2025.html", "Reeforesting4Peace.html", "GYCT", "Foresight-Research", "FfD4.html", "old/ourproject.html", "old/mission_vision.html", "old/onceinalifetime.html"];

const checks = [
  // [id, regex that must NOT appear, message]
  ["address", /Speerstras{3,}|Bad Iburg|Birkenweg/g, `address must be "${facts.contact.address}"`],
  ["phone", /\+593|\+41 77807|\+41 77 807 1068/g, `phone must be "${facts.contact.phone}"`],
  ["old-chair", /Founder\s*&(?:amp;)?\s*Chair|CHAIRPERSON/g, `Chair is ${facts.governance.chair.name}; founder is "${facts.governance.founder.title}"`],
  ["retired-name", new RegExp(facts.programmes.youth_house.retired_names.join("|"), "g"), `use "${facts.programmes.youth_house.name}"`],
  ["railway", /up\.railway\.app/g, `AI Labs is ${facts.programmes.ai_labs.url}`],
  ["personal-email", /[\w.+-]+@(gmail|outlook|hotmail|yahoo)\.com|@fen\.uchile\.cl/g, `use ${facts.contact.email} or a role address`],
  ["internal-form", /gyct-platform-form/g, "internal form must not be linked"],
];

let problems = 0;
for (const file of SERVED) {
  if (!fs.existsSync(file)) continue;
  const lines = fs.readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const [id, re, msg] of checks) {
      re.lastIndex = 0;
      const m = line.match(re);
      if (m) { problems++; console.log(`${file}:${i + 1} [${id}] "${m[0]}" — ${msg}`); }
    }
  });
}
console.log(problems ? `\n${problems} contradiction(s) with facts.yaml` : "check-facts: OK");
process.exit(problems ? 1 : 0);
