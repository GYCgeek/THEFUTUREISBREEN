# GYC Site System Map

Last updated: 2026-04-13
Workspace root analyzed: theglobalyouth.co

## Why this file exists
This repo mixes public pages, campaign microsites, experimental one-off pages, and PHP/JSON-backed workflow tools. This map is the human-readable navigation layer for future agents.

## Reorganization status
This reorganization is documentation-led and non-breaking.
- Live pages and endpoints were left in place to avoid path regressions on AwardSpace/shared hosting.
- The repo was organized logically through `docs/` and repo memory rather than physical moves.
- Machine-readable inventory now lives in `docs/SITE_MANIFEST.json`.

## Current top-level structure
- `.git`: git metadata
- `assets`: shared CSS, JS, images, documents, fonts, videos, and SCSS
- `DB`: TRIDENT involvement endpoint
- `docs`: agent-facing structure/spec documentation
- `FT`: media-only folder used by foresight content
- `public_html`: horizon scanning app, moderation dashboard, JSON data, mirrored endpoints
- Root files: public marketing pages, campaign pages, utility PHP, JSON state, extensionless HTML pages

## Canonical logical zones

### Zone A: Coalition and marketing pages
- `index.html`
- `about-us.html`
- `contact-us.html`
- `mission_vision.html`
- `ourproject.html`
- `PrivacyPolicy.html`
- `error.html`

### Zone B: Programs and campaign microsites
- `OMW.html`
- `OMWCOP30.html`
- `Reeforesting4Peace.html`
- `report2025.html`
- `GYCN.html`
- `GYCT.html`
- `GYX.html`
- `avocado.html`
- `AvocadoF.html`
- `Ecoverse.html`
- `impact-tech.html`
- `onceinalifetime.html`
- `mission-control.html`
- `kit.html`
- `map-test.html`

### Zone C: Research and special standalone pages
- `Foresight-ResearchOLD.html`
- `public_html/Foresight-Research-updated.html`
- `Article-test` (extensionless HTML)
- `test2` (extensionless HTML)
- `FfD4` (extensionless HTML)

### Zone D: Operations, forms, and persistence
- `save.php`
- `DB/TRIDENTDB/send-involvement.php`
- `public_html/horizon-scanning` (extensionless HTML app)
- `public_html/dashboard.html`
- `public_html/*.php`
- `public_html/data/*.php`
- `public_html/*.json`
- `public_html/data/*.json`

### Zone E: Shared frontend framework
- `assets/css/*.css`
- `assets/js/*.js`
- `assets/images/*`
- `assets/documents/*`
- `assets/scss/*`

## Structural interpretation
- Root-level HTML files are the main public website.
- Extensionless files are not random artifacts; several are valid HTML pages that should be treated as route surfaces.
- `public_html/` behaves like a separate mini-application for foresight/horizon scanning.
- `DB/TRIDENTDB/` is a narrow backend integration zone, not a general API layer.

## High-risk integration notes
- `index.html` references `services.html` and `blog.html`, but those files are not present.
- `public_html` duplicates endpoint logic at both the root and `public_html/data` levels.
- File naming is inconsistent across the repo, so path changes are risky.
- Some page titles/content suggest duplicated or mislabeled pages, for example `Ecoverse.html` appears to reuse Reeforesting content.

## Safe next-step reorganization options
1. Keep physical paths stable and continue improving the docs layer first.
2. Introduce redirects before any file renames or folder moves.
3. Consolidate duplicated `public_html` endpoints only after tracing every frontend call site.
4. Normalize future additions to lowercase kebab-case without retroactively renaming legacy files in one pass.
