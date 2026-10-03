# Agent Handoff Guide

Last updated: 2026-04-13

## Fast orientation
1. Read docs/SITE_SYSTEM_MAP.md
2. Read docs/WEBSITE_SPECS_TABLE.md
3. Read docs/SITE_MANIFEST.json for the full surface inventory
4. Inspect index.html and public_html/horizon-scanning first for user-visible impact

## Priority risk checklist before edits
- Verify all internal links still resolve.
- Verify submit/approve/reject/sign/comment flows still write correct json targets.
- Verify no endpoint path changes break frontend fetch URLs.
- Check duplicated endpoints in public_html root vs public_html/data.

## Operational hotspots
- index.html: central nav and global footer links
- OMWCOP30.html: involvement submission integration
- public_html/horizon-scanning: multi-endpoint workflow logic
- public_html/data/*.php: mutation and moderation logic
- assets/js/script.js and theme.js: shared UI behavior

## Recommended edit strategy
- Prefer additive changes and route-safe refactors.
- If moving files, create redirect or path compatibility layer first.
- Keep data schema compatibility for json files used by dashboard and endpoints.
- Treat extensionless files as real routes unless proven otherwise.
- Update both docs and repo memory when architecture or ownership changes.

## Minimal validation after each change
1. Load index.html and verify major nav links.
2. Load OMWCOP30 flow and test involvement submit.
3. Load horizon scanning app and test submit/sign/comment.
4. Confirm json files are still writable by expected endpoints.

## If you need to classify pages quickly
- Main public site: root `.html` pages
- Standalone special pages: `Article-test`, `test2`, `FfD4`
- Workflow app: `public_html/horizon-scanning` + `public_html/dashboard.html`
- Backend/data layer: `DB/TRIDENTDB/` and `public_html/data/`
