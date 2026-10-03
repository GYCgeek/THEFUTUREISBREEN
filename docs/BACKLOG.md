# Backlog

Scored by the loop each cycle: score = severity (1–5) × visibility (1–3) ÷ effort (1–3). Class per CLAUDE.md.
Seeded from `docs/fix-pack.md` (audit of 29 Sep 2026). Items blocked on a question are marked `blocked: Qn`.

| ID | Item | Page(s) | Class | Sev | Vis | Eff | Score | Status |
|---|---|---|---|---|---|---|---|---|
| B01 | Remove public link to internal GYCT platform decision form | /GYCT | A | 5 | 3 | 1 | 15 | done 2026-10-03 (loop/bootstrap) |
| B02 | Horizon Scanning menu link → /Foresight-Research#horizon-scanning (+ redirect) | all | A | 4 | 3 | 1 | 12 | done 2026-10-03 (loop/bootstrap) |
| B03 | Add 301 redirects listed in site-map.md | server | A | 4 | 2 | 1 | 8 | done 2026-10-03 (loop/bootstrap) |
| B04 | Foresight team photos → real files; self-host partner logos | /Foresight-Research | A | 3 | 2 | 1 | 6 | done except ICGA logo (Q21) and the FfD4 logo (UN DESA blocks downloads; the broken img was removed from /FfD4, and the `<object>` on /Foresight-Research stays blank). ClimateWorks self-hosted 2026-10-03 |
| B05 | Shared nav + footer, contact details from facts.yaml, fix "Speerstrassse" | all | A | 3 | 3 | 2 | 4.5 | contact facts done; no shared include possible without a build step — guarded by scripts/check-facts.mjs |
| B06 | Remove dead `#` buttons (Get Active, Update preferences, credits, FfD4 socials) | all | A | 3 | 3 | 1 | 9 | done 2026-10-03 (loop/bootstrap) |
| B07 | Hide 2025 report translation buttons; volunteer-translator mailto | /, /report2025 | A | 2 | 3 | 1 | 6 | done 2026-10-03 (loop/bootstrap) |
| B08 | Typos + mission_vision sentence | /, /ourprojects, /mission_vision.html | A | 2 | 3 | 1 | 6 | done 2026-10-03 (loop/bootstrap) |
| B09 | Hide 7 placeholder R4P videos | /Reeforesting4Peace | A | 3 | 1 | 1 | 3 | done 2026-10-03 (loop/bootstrap) |
| B10 | Fix R4P partner links (Sankari, Eco Interpreters, UNESCO typo) | /Reeforesting4Peace | A | 2 | 1 | 1 | 2 | done for Sankari, Eco Interpreters, UNESCO; rest blocked: Q6 |
| B11 | AI Labs links → gycailabs.org | all | A | 2 | 3 | 1 | 6 | done 2026-10-03 (loop/bootstrap) |
| B12 | Rename GYC House → Youth House | /, /GYCT, others | B | 4 | 3 | 1 | 12 | todo |
| B13 | Leadership: Merna as Chair, Agustín as Founder & Strategic Director (homepage + modal) | / | B | 5 | 3 | 1 | 15 | needs-human 2026-10-03: failed guardian twice inside the class A PR (the poster has the old title printed; the 2025 title is unconfirmed), so it moved to its own branch. `loop/2026-10-03-leadership` (Home + /about) passed guardian, editor and design-critic and is waiting for review |
| B14 | /about roster → champs_2026 | /about | B | 4 | 2 | 2 | 4 | blocked: Q2, Q3 |
| B15 | GYCT date-driven status + timeline cleanup | /GYCT | B | 4 | 3 | 2 | 6 | blocked: Q1 (date only) |
| B16 | Replace Contact page template copy | /contact | B | 2 | 2 | 1 | 4 | todo |
| B17 | Unify numbers from facts.yaml | all | B | 3 | 3 | 2 | 4.5 | blocked: Q10, Q11 |
| B18 | /FfD4 archive or redirect | /FfD4 | B | 2 | 1 | 1 | 2 | blocked: Q9 |
| B19 | /ecoverse decision | /Reeforesting4Peace | B | 3 | 1 | 1 | 3 | blocked: Q5 |
| B20 | Design brief (tokens, type, layout) from references.md | all | C | 4 | 3 | 3 | 4 | todo |
| B21 | Homepage redesign: proof-first, per design brief | / | C | 4 | 3 | 3 | 4 | after B20 |
| B22 | Credentials band (CIF, Connect4Climate, Swiss association, NKN) | / , /about | B | 3 | 3 | 1 | 9 | todo |
| B23 | "How GYC works" page: redrawn Sky Governance Model, decision domains, 90-day rhythm, Champs commitments (answers funders' "decision-making engine" question) | /how-we-work (new) | C | 4 | 2 | 3 | 2.7 | after B20 |
| B24 | Theory of change in one picture: Avocado lens → Skills Pipeline (CET / LD / NBS) → five pillars → success markers | /how-we-work, / | C | 4 | 3 | 2 | 6 | after B20 |
| B25 | Separate reach from depth in every number band (views/reach vs trained vs supported in person) | /, /about, /GYCT | B | 4 | 3 | 1 | 12 | blocked: Q10 |
| B26 | Two or three community co-design stories (e.g. Zach's Run-N-Ride Relays; Tapajós/Tupinambá route to COP30; R4P equipment to youth leaders) | /about or /how-we-work | B | 4 | 2 | 2 | 4 | blocked: Q18 |
| B27 | "How GYC is funded" section: sources by category, fiscal host, what partner money pays for, path to paid roles | /how-we-work | B | 4 | 2 | 2 | 4 | blocked: Q15 |
| B28 | 2026 strategy section: "The Year We Became the Sky" + Ocean → Sky → Roots → Fire arc; link 2025 Report as "the year we became the Ocean" | /, /about | B | 3 | 3 | 1 | 9 | blocked: Q17 |
| B29 | Unify GYC values across homepage, mission page and Champs Agreement | /, /mission_vision.html | B | 3 | 2 | 1 | 6 | blocked: Q16 |
| B30 | Replace pre-Sky "fight / unstoppable / relentless" language with Sky voice | /, /mission_vision.html | B | 3 | 3 | 1 | 9 | todo |
| B31 | Champs gallery shows each Champ's track (CET / LD / NBS); "Become a Champ" explains the commitments | / | B | 3 | 3 | 1 | 9 | todo |
| B32 | COP31 readiness: the site is part of Sky's November "public audit" — Home, About, GYCT, Youth House links must be finished before 9 Nov 2026 | all | B | 5 | 3 | 1 | 15 | deadline 2026-11-08 |
| B33 | Privacy: folder listings on; CV, email analyses, budget page, GYCT applicant list (56 personal emails) publicly reachable → `Options -Indexes` + 403 rules; stale copies 301 | server | A | 5 | 3 | 1 | 15 | done 2026-10-03 (loop/bootstrap) — live only after upload |
| B34 | A real "Fund / partner with GYC" path: every Donate link was dead (GoFundMe 404, `#`), now hidden. Funders need one clear next step | all footers, /, /about | B | 5 | 3 | 2 | 7.5 | blocked: Q7 |
| B35 | 2025 Report PDF is 113 MB — publish a compressed web version (<15 MB), keep the print file | /report2025, / | A | 3 | 3 | 2 | 4.5 | partly done 2026-10-03 (loop/2026-10-03): every link uses the 19 MB web PDF (v3C, same 27 pages); the 108 MB print file is labelled. Still above the 15 MB target and needs a better export (no PDF tooling locally) |
| B36 | Agustín's Champs poster has "Founder & Chair" printed in the image; homepage alt text too | / | B | 4 | 3 | 1 | 12 | blocked: Q22 (new image needed) |
| B37 | Champ portraits are 0.55–1.2 MB each (~10 MB for 12): compressed web versions | / | A | 3 | 3 | 1 | 9 | done 2026-10-03 (loop/2026-10-03): 11 posters are now 900px JPEGs (~0.6 MB in total); Agustín's poster stays PNG (Q22, B13) |
| B38 | /ourprojects and /mission_vision.html still use the 2023 nav ("Energy", "Network") — swap in the current nav | /ourprojects, /mission_vision.html | A | 2 | 2 | 2 | 2 | done 2026-10-03 for /ourprojects (loop/2026-10-03; adds the mobile hamburger the page lacked). /mission_vision.html redirects to /about. The page's copy (60K+, "Our Partners Rock!") still needs B17/B30 |
| B39 | `save.php` + `mc_state.json` at the web root: unauthenticated write endpoint (anyone can overwrite the file) | server | B | 3 | 1 | 1 | 3 | blocked: Q23 |
| B40 | /FfD4: visible `#` "Registration Coming Soon" button (CSS overrode `hidden`), TBC date/venue/agenda, empty organiser card, broken FfD4 logo | /FfD4 | A | 3 | 1 | 1 | 3 | done 2026-10-03 (loop/2026-10-03); rest of the page waits on Q9 |
| B41 | Developer README (local machine path) and deploy probe files publicly reachable | server | A | 3 | 1 | 1 | 3 | done 2026-10-03 (loop/2026-10-03): 403 |
| B42 | GYCT: "Applications are open now" + live apply link (GYCT:1041–1043), "Winners selected / notified shortly", close-out 15 Oct vs facts 10 Nov — split from B15, does not need Q1 | /GYCT | B | 5 | 3 | 1 | 15 | todo — top candidate next cycle (B32) |
| B43 | Youth House is not mentioned or linked on Home or /about; /GYCT has dates but no link to gycailabs.org/gyc-house | /, /about, /GYCT | B (C on homepage) | 4 | 3 | 1 | 12 | todo (B32); homepage part is class C, after B20 |
| B44 | IEvideo.mp4 is 97 MB and autoplays in the /Foresight-Research hero | /Foresight-Research | A | 3 | 2 | 2 | 3 | todo — no video tooling locally; poster image on mobile possible |
| B45 | GYC House prototype copies under public_html/ (gyc-house, house, public_html/…) | server | A | 3 | 1 | 1 | 3 | blocked: Q31 |
| B46 | GYCT translations (es/pt/tr) still say "GYC House", carry old dates and the closed-form link | /public_html/GYCT-*.html | B | 3 | 1 | 2 | 1.5 | todo (with B12) |
| B47 | "See All Options" nav label on 6 pages (voice.md bad line) → name the destination | all | B | 2 | 3 | 1 | 6 | todo |
| B48 | Champs copy: index.html:1247 design note on the page ("A fresh 2026 lineup presented as poster portraits…"); /about "THE CHAMPS" / "Meet our dedicated team members…"; Merna homepage alt could say Chair | /, /about | B | 2 | 3 | 1 | 6 | todo (after B13 merges) |
| B49 | /report2025: ~250px empty gap under the cover; download is ~4,000px down on mobile | /report2025 | C | 2 | 2 | 1 | 4 | after B20 |
| B50 | Leadership cards: Agustín's stop-gap photo is the only full-bleed card; long role wraps to 3 lines on mobile | / | C | 2 | 3 | 1 | 6 | after B13 + Q22 |
