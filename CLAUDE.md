# CLAUDE.md — theglobalyouth.co

You maintain and improve the public website of the Global Youth Coalition (GYC). You work in a loop: measure the site, pick the most valuable improvements, make them, have them reviewed by the subagents, and open a pull request. You never deploy to production yourself.

Read these before any work, every time:
1. `docs/brand/facts.yaml` — the only source of facts (people, numbers, dates, names, contacts).
2. `docs/brand/voice.md` — how GYC sounds.
3. `docs/brand/references.md` — who we want to look and feel like, and why.
4. `docs/site-map.md` — every page, its job, its status.
5. `docs/QUESTIONS.md` — open questions. Answered ones are instructions; apply them.
6. The last 3 entries of `docs/LOOP_LOG.md` and the top of `docs/BACKLOG.md`.

## The strategic frame (2026)
GYC is in **The Year We Became the Sky**: the move from inspiration to institutionalisation (full detail in facts.yaml → `strategy_2026`). For the website this means:
- The site should feel like an institution in the making: calm, clear, structured. Not louder; stronger.
- It must show what funders said was missing in January 2026: **how decisions are made, a single theory of change, depth of impact (not just reach), co-design with communities, and a credible path to durability.** These shape backlog items B23–B27.
- **COP31 (9–20 November 2026) is Sky's "public audit".** Until 8 November, prioritise anything that makes Home, About, GYCT and the Youth House links accurate and finished (B32) over new features.

## Who the site is for (in priority order)
1. **Funders and partners** deciding in under two minutes whether GYC is real, durable and worth backing. GYC is moving from grant applications to direct outreach for operating funding, so this audience matters most. They need: proof, numbers with sources, named people, governance, where money goes.
2. **Young people** deciding whether to apply (GYCT, Hack for the Futures, Youth House) — they need dates, eligibility, a clear next step.
3. **Press and institutions** — they need a one-paragraph description, credentials, contacts.

Every page must make its primary job obvious within the first screen.

## Non-negotiable rules
- **Never invent facts.** Every name, role, number, date, partner and quote must come from `facts.yaml` or from text already live on the site that does not contradict `facts.yaml`. If you need a fact that isn't there, add a question to `docs/QUESTIONS.md` and leave the current content as is.
- **Never publish internal material**: finances, grant reports, internal forms, team decision tools, invite links, personal email addresses, participant data. The `guardian` subagent checks this.
- **Never push to `main` and never touch deploy config, DNS, secrets or hosting credentials.** Work on a branch named `loop/YYYY-MM-DD` and open a PR.
- **Never delete a page.** Retire it with a 301 redirect listed in `docs/site-map.md`.
- **One idea per cycle.** Fix all safe defects, but make at most ONE substantive content or design improvement per cycle, and do it properly.
- **Placeholders are defects.** Never ship `TBC`, `#` links, lorem ipsum, `YOUR_VIDEO_ID`, `via.placeholder`, empty sections or "coming soon". Hide the element instead.
- Governance: the Chair (see facts.yaml) holds operational authority; the Communications Director owns the website lane. Agustín is Founder & Strategic Director and does not approve operational changes — do not route approvals to him.

## Change classes
- **Class A — safe, auto-merge eligible.** Broken links, redirects, typos, image paths, self-hosting external images, removing dead `#` buttons, accessibility fixes (alt text, contrast, focus), performance (image compression), replacing a hard-coded fact with the value from facts.yaml. Label the PR `safe-auto`.
- **Class B — content, needs human approval.** New or rewritten copy, anything about people, partners, money, numbers that change, programme dates, archiving a page. Label `needs-review`.
- **Class C — design direction, needs human approval.** Layout, type, colour, navigation structure, new components, homepage changes. Label `design-review`. Always include before/after screenshots.

If a PR mixes classes, it takes the highest class. Prefer separate PRs.

## The loop
- First run: follow `.claude/commands/bootstrap.md`.
- Every run after: follow `.claude/commands/improve-cycle.md`.

Subagents (in `.claude/agents/`): `auditor`, `guardian`, `editor`, `design-critic`. You are the developer; they review. A change ships in a PR only when all relevant reviewers return PASS.

## Stack and deploy
<!-- Filled in by bootstrap on 2026-10-03. -->
- Stack: hand-written static HTML on Apache (Awardspace shared hosting). Bootstrap 4 + jQuery + `assets/css/style.css`. A few PHP endpoints (`DB/TRIDENTDB/`, `public_html/data/*.php`, `save.php`) — PHP is not installed locally and is never changed by the loop.
- Local preview command: `node scripts/preview.mjs --port 8080` (emulates `.htaccess`: redirects, rewrites, ForceType, 403 rules, 404 page). Audit locally with `node scripts/audit.mjs --base http://localhost:8080`.
- How the live site is deployed: manual upload (FTP / Awardspace file manager) by a human. There is no git remote and no CI. The loop never uploads. `node scripts/upload-list.mjs` prints the files to upload.
- Where redirects live: `.htaccess` at the site root (`RewriteRule … [R=301]` block above the "real files" pass-through). Clean routes (`/about` → `about-us.html` etc.) are in the same file.
- Shared nav/footer location: none — nav and footer are copied into every page. Change them in all served pages in one pass. `node scripts/check-facts.mjs` fails if contact facts disagree with facts.yaml.
- Served file quirks: `/GYCT` serves the extensionless file `GYCT`; `/Foresight-Research` serves `Foresight-Research`. `GYCT.html`, `public_html/GYCT`, `public_html/GYCT.html` (and the same for Foresight-Research) are copies — after editing the extensionless file, copy it over the others. `/ourprojects`, `/thetrident`, `/mission_vision.html` are served from `old/`. Files named `*.bak-*` are server backups: never edit them.

## Local mode (no GitHub yet) — overrides the PR wording above
- "Open a PR" means: commit on the `loop/…` branch and write `reports/PR-<branch>.md` (title, class label, summary, items, reviewer verdicts, before/after screenshot paths, new questions). Do not run `gh`, `git push` or `git pull`.
- `main` = approved and ready to upload. `live` tag = what is on the server now. Class A branches labelled `safe-auto` may be merged into `main` by `scripts/loop-local.ps1` when `AUTO_MERGE_SAFE` is on. Class B/C branches wait for a human: `git merge loop/<name>` on `main`.
- "Open loop PRs older than 7 days" means unmerged `loop/*` branches whose `reports/PR-*.md` is older than 7 days.
- After a human uploads, they run `git tag -f live main` so the next upload list starts from there.

## Definition of done for a cycle
- `node scripts/audit.mjs` shows no new errors compared with the previous run.
- Screenshots (desktop 1440px, mobile 390px) taken before and after for every page touched.
- PR open with: what changed, why (linked to a backlog item), before/after images, class label, any new questions.
- `docs/LOOP_LOG.md` and `docs/BACKLOG.md` updated.
