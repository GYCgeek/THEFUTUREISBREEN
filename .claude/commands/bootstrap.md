---
description: First run only. Learn the repo, set up measurement, make the site maintainable, apply safe fixes, propose a design brief.
---

# Bootstrap

Read CLAUDE.md and every file it lists first. Work on branch `loop/bootstrap`. Do the steps in order and stop at any STOP.

## 1. Understand the stack
- Identify how the site is built (static HTML, PHP includes, a framework, a CMS export) and how the live site is deployed (cPanel/FTP, GitHub Pages, Netlify, Vercel, Railway, other).
- Fetch https://theglobalyouth.co/ and compare it with the repo's homepage source. **STOP** and write a question in docs/QUESTIONS.md if the repo does not match what's live — we must not improve a copy that isn't deployed.
- Find out how clean URLs (`/about` without `.html`) and redirects work today (e.g. `.htaccess`).
- Fill the "Stack and deploy" section of CLAUDE.md.

## 2. Set up measurement
- `npm init -y` if needed, then `npm i -D playwright js-yaml` and `npx playwright install chromium`.
- Ensure there is a local preview command (e.g. `npx serve`, `php -S localhost:8080`). Record it in CLAUDE.md.
- Run `node scripts/audit.mjs --base https://theglobalyouth.co` (baseline against live) and `node scripts/screens.mjs --base https://theglobalyouth.co --out reports/screens/baseline`.
- Add every page you find in the repo to docs/site-map.md (status `undecided` if not already listed).

## 3. Make the site maintainable (least invasive option for the stack)
- One shared nav and one shared footer used by every page (PHP include, a small build step, or the framework's layout — choose whatever changes the fewest files and fits the existing deploy).
- Contact details, social links, leadership and headline numbers rendered from docs/brand/facts.yaml (via a tiny build script that writes a generated include/JSON if the stack can't read YAML at runtime). If this is too invasive for the stack, write a `scripts/check-facts.mjs` that fails if hard-coded facts disagree with facts.yaml, and use that instead.
- Add the redirects listed in docs/site-map.md.

## 4. Apply class A items from docs/BACKLOG.md
- Use docs/fix-pack.md for exact replacements.
- Skip anything marked `blocked`.

## 5. Review
- guardian → editor (for any visible text change) → design-critic (screenshots before/after). Fix FAILs (max 2 rounds per item; revert the item if still failing and log why).
- Re-run the audit against the local preview. There must be no new errors.

## 6. Design brief (proposal only — no redesign yet)
- Following docs/brand/references.md, write docs/brand/design-brief.md: 4–6 named colours (hex), 1–2 typefaces with roles and a type scale, spacing scale, layout concept for the homepage (ASCII wireframe, mobile and desktop), rules for photography, and the "one memorable thing" for each live page.
- Review the brief against the "must NOT look like" list and say what you changed and why.
- Include 2–3 small static mockups (HTML files under `docs/brand/mockups/`) of the homepage hero and the Champs section using real content and real images from /assets.

## 7. Ship
- Open two PRs: (1) `loop/bootstrap` with steps 2–5, label `needs-review` (it touches structure); (2) `loop/design-brief` with step 6, label `design-review`.
- Write the first entry in docs/LOOP_LOG.md and update docs/BACKLOG.md.
