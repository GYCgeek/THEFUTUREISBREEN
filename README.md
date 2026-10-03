# GYC Website Workspace Guide

Start here for orientation.

## What this repo contains
- Main public-facing GYC site pages at the repo root
- Shared frontend assets in `assets/`
- Submission endpoint for TRIDENT in `DB/TRIDENTDB/`
- Horizon scanning workflow and moderation tools in `public_html/`
- Agent-facing documentation in `docs/`

## Canonical docs
- docs/SITE_SYSTEM_MAP.md
- docs/WEBSITE_SPECS_TABLE.md
- docs/SITE_MANIFEST.json
- docs/AGENT_HANDOFF.md

## Highest-impact surfaces
- `index.html`: main public landing page
- `OMWCOP30.html`: involvement campaign page posting to TRIDENT endpoint
- `public_html/horizon-scanning`: extensionless app page for signal submission/signing/commenting
- `public_html/dashboard.html`: moderation and operations dashboard

## Core backend endpoints
- `DB/TRIDENTDB/send-involvement.php`
- `public_html/data/submit_signal.php`
- `public_html/data/approve_signal.php`
- `public_html/data/reject_signal.php`
- `public_html/data/sign_signal.php`
- `public_html/data/comment_signal.php`
- `public_html/data/upload.php`

## Working rules for future agents
- Treat the current layout as path-sensitive legacy infrastructure.
- Prefer documentation-first changes unless a move is paired with redirect/path updates.
- Check `docs/SITE_MANIFEST.json` before assuming a file is dead; several extensionless files are real HTML entry points.
- Use `OpenSpec-GYC-Upgrade.md` at the workspace root as the planning baseline for modernization work.

## Known structure quirks
- Root-level pages use mixed naming styles: kebab-case, snake_case, and Pascal-like casing.
- Some pages are extensionless HTML files: `Article-test`, `FfD4`, `test2`, `public_html/horizon-scanning`.
- `public_html/` duplicates some API endpoints that also exist under `public_html/data/`.
