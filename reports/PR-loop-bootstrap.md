# loop/bootstrap — kit setup and safe fixes

Label: needs-review
Merged into main: 2026-10-03 (local mode; the human gate is the upload — nothing is live until the files in reports/UPLOAD-*.md are uploaded)

## Summary
Installed the improvement loop locally (no GitHub), added a preview that behaves like the live Apache host, and applied the class A items from the 29 Sep fix pack plus privacy fixes found during the audit. Audit against live: 87 → 19 errors, 0 new errors, 178 findings fixed (raw counts; 27 → 9 errors after de-duplicating http/www variants).

## Items
- B33 (privacy, new): folder listings off (`Options -Indexes`); 403 on a personal CV + motivation letters, email-thread analyses, the operating budget page and a GYCT applicant eligibility list with 56 personal emails. Stale page copies with personal emails / the internal form → 301.
- B01: internal GYCT platform form removed from /GYCT (and the ES/PT/TR pages, which also lost a personal Gmail).
- B02: Horizon Scanning menu → /Foresight-Research#horizon-scanning; redirect for the old URL; self-link button removed.
- B03: 301s for /energy, /services.html, /ourproject.html, /ForesightResearch, /TT, /test2; /mission_vision.html → /about until it is rebuilt (B38).
- B04: Foresight team photos are real; YNA, GYBN, CYMG, FfD Youth logos self-hosted; ICGA shown as text (logo link expired, Q21).
- B05: one address and phone everywhere; Bad Iburg / +593 gone; old footer forms no longer post to a personal Gmail.
- B06: dead `#` footer links replaced (Join GYC, GYCT 2026); "Update your preferences" removed; FfD4 social icons real; empty credit links removed.
- B07: translation buttons hidden; "Volunteer to translate the report" mailto.
- B08: typos (Through, knowledge, the SDGs); mission sentence rewritten.
- B09: 7 placeholder R4P videos hidden (Q4).
- B10: R4P Sankari, Eco Interpreters and UNESCO links fixed; stray link removed. Copyright lines → © 2026.
- B11: AI Labs links → gycailabs.org.
- Q5/Q7: dead /ecoverse links and dead Donate links (GoFundMe 404) hidden with their spacers.
- Personal emails on /Foresight-Research and /FfD4 → gen@theglobalyouth.co / takeaction@.
- Homepage invested figure → $350K+ (facts.yaml).

## Reviewers
- guardian: FAIL → fixed → FAIL (new findings only) → fixed or turned into questions Q27–Q29. All round-1 items verified resolved.
- editor: FAIL → fixed → PASS.
- design-critic: FAIL → fixed → PASS. Pattern to repeat: hide the whole column/wrapper with its spacers, never just the inner element.

## Screenshots
reports/screens/before/ (live) and reports/screens/after/ (preview), mobile 390 and desktop 1440, for /, /about, /GYCT, /Foresight-Research, /report2025, /contact, /Reeforesting4Peace, /ourprojects. (Screens are local only, not in git.)

## Not in this branch
Leadership titles and "GYC House" (class B: next cycle). New questions: Q21–Q29.
