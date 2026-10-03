# Loop log

Newest first. One entry per cycle: date, branch, PR link, items done, items reverted (and why), audit before/after counts, new questions.

## 2026-10-03 — improve cycle 1 (local mode, unattended)
- Branches: `loop/2026-10-03` (class A, `safe-auto`, reports/PR-loop-2026-10-03.md) and `loop/2026-10-03-leadership` (B13, `needs-review`, reports/PR-loop-2026-10-03-leadership.md). Merge class A first; the two were test-merged and merge cleanly.
- Measure: the live audit (pre-upload, so it still shows bootstrap-fixed defects) became the baseline: 105 errors / 195 warnings. The auditor subagent could not run Bash; it reviewed the source statically and added B40–B46.
- Done (A): B37 portraits (~9.5 MB → ~0.6 MB), B38 /ourprojects nav, B35 partly (19 MB web PDF everywhere, print file labelled), B40 FfD4 placeholders, B41 README/probe files 403, B04 ClimateWorks logo self-hosted.
- Done (B, awaiting human): B13. Home and /about show Merna A. Elboghdady as Chair and Agustín as Founder & Strategic Director, with his team photo standing in for the mislabelled poster (Q22).
- Reverted: B13 title fixes inside the class A PR failed guardian twice (poster with the old title printed, unconfirmed 2025 title), so they were removed from class A and redone as the class B branch.
- Not possible locally: B35 to <15 MB and B44 (97 MB video): no PDF or video tooling.
- Audit (local preview vs live baseline): errors 105 → 19, warnings 195 → 92, 0 new errors. facts check: 13 on class A (unchanged), 9 with the leadership branch.
- New questions: Q30 (Agustín's 2025 title), Q31 (GYC House prototype pages), Q32 (Merna's name in the 2025 archive); Q22 extended (stop-gap portrait).
- New tooling: scripts/compress-images.mjs, scripts/pdf-info.mjs, scripts/shoot-element.mjs (the homepage hides sections until clicked, and its intro plays on every visit; full-page screenshots miss the Champs grid).
- Next cycle (B32 first): B42 stale "Applications are open now" on /GYCT (score 15), then B12 Youth House rename / B43 Youth House link.
- Pattern that worked (design-critic): remove dead or placeholder elements outright instead of rewording them; when a printed asset carries a wrong fact, use an existing real photo and put the correct role in the HTML caption.

## 2026-10-03 — bootstrap (local mode)
- Branches: `loop/bootstrap` (merged into main; reports/PR-loop-bootstrap.md), `loop/design-brief` (B20, waiting for design review).
- Setup: git initialised from a byte-identical download of the live site (tag `live`). No GitHub; deploy is manual upload. Preview `scripts/preview.mjs` emulates .htaccess. Weekly runner `scripts/loop-local.ps1`, scheduler `scripts/schedule-loop.ps1`.
- Done: B01–B04, B06–B11, B33 (privacy), B05 partly (no shared include; guarded by check-facts.mjs). Dead Donate and Ecoverse links hidden (Q5, Q7).
- Reverted / held back: /mission_vision.html renders again but looks unfinished — 301 to /about instead (B38).
- Audit vs live: errors 87 → 19, warnings 146 → 93, 0 new errors, 178 fixed.
- Kit fixes: screens.mjs skipped the homepage and timed out on embeds; audit.mjs mis-resolved links on redirect sources, counted commented-out markup and compared full URLs (gate always failed locally). All fixed.
- New questions: Q21–Q29 (ICGA logo, Agustín's poster, save.php, internal tools, drafts, who uploads, research PDFs, 2024 report Gmail, partner Gmail).
- Pattern that worked (design-critic): hide the whole column/wrapper with its spacers, never just the inner element.
