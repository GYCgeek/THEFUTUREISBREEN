# Website Specs Table

Last updated: 2026-04-13

## Stack summary
- Frontend: static HTML pages using Bootstrap, custom CSS, inline CSS on some standalone pages, and legacy jQuery-driven scripts
- Shared assets: `assets/css`, `assets/js`, `assets/images`, `assets/documents`, `assets/scss`
- Backend: PHP endpoints for submission, moderation, upload, and state persistence
- Data persistence: JSON files in `public_html` and `public_html/data`
- Hosting model: shared hosting / AwardSpace-style path-sensitive deployment

## Website and app surfaces

| Surface | Path | Type | Purpose | Main dependencies | Data or backend dependency | Status / notes |
|---|---|---|---|---|---|---|
| Main landing | `index.html` | HTML | Primary GYC homepage | Shared CSS/JS, Bootstrap, jQuery | None direct | Active; footer has missing links |
| About | `about-us.html` | HTML | Organization overview | Shared CSS/JS | None direct | Active |
| Contact | `contact-us.html` | HTML | Contact surface | Shared CSS/JS | Potential form wiring | Active |
| Mission and vision | `mission_vision.html` | HTML | Mission narrative | Shared CSS/JS | None direct | Active |
| Projects overview | `ourproject.html` | HTML | Program listing | Shared CSS/JS | None direct | Active |
| Privacy policy | `PrivacyPolicy.html` | HTML | Policy and legal page | Shared CSS/JS | None direct | Active |
| Error page | `error.html` | HTML | 404 page | Shared CSS/JS | None direct | Active |
| OMW | `OMW.html` | HTML | OMW program page | Shared CSS/JS | None direct | Active |
| OMW COP30 | `OMWCOP30.html` | HTML | COP30 campaign and involvement flow | Shared CSS/JS | `DB/TRIDENTDB/send-involvement.php` | Active; high-impact integration |
| Reeforesting 4 Peace | `Reeforesting4Peace.html` | HTML | Campaign/event page | Shared assets plus custom reeforesting CSS/JS | None direct | Active |
| Report 2025 | `report2025.html` | HTML | Report distribution page | Shared CSS/JS | `assets/documents/Report2025/` | Active |
| GYCN | `GYCN.html` | HTML | Program page | Shared CSS/JS | None direct | Active |
| GYCT | `GYCT.html` | HTML | Program/training page | Shared CSS/JS | None direct | Active |
| GYX | `GYX.html` | HTML | Interactive session surface | Shared CSS/JS | None direct | Active |
| Avocado intro | `avocado.html` | HTML | Avocado framework intro | Shared CSS/JS | Documents in `assets/documents/` | Active |
| Avocado detail | `AvocadoF.html` | HTML | Avocado framework detail page | Shared CSS/JS | Documents in `assets/documents/` | Active |
| Ecoverse | `Ecoverse.html` | HTML | Program page | Shared CSS/JS | None direct | Active; content/title mismatch risk |
| Impact Tech | `impact-tech.html` | HTML | Initiative / thought leadership page | Shared CSS/JS | None direct | Active |
| Mission Control | `mission-control.html` | HTML | Mission-control style launch page | Shared CSS/JS | `mc_state.json` | Active |
| Once In A Lifetime | `onceinalifetime.html` | HTML | Campaign page | Shared CSS/JS | None direct | Active |
| Resource kit | `kit.html` | HTML | Supporting campaign/resource page | Shared CSS/JS | None direct | Active |
| Map test | `map-test.html` | HTML | Experimental journey map page | Shared CSS/JS | None direct | Experimental |
| Legacy foresight research | `Foresight-ResearchOLD.html` | HTML | Earlier research page | Mixed inline/shared assets | None direct | Legacy |
| Updated foresight research | `public_html/Foresight-Research-updated.html` | HTML | Newer research page | Mixed inline/shared assets | None direct | Active/standalone |
| Article test | `Article-test` | Extensionless HTML | Standalone research/article page | Inline CSS + external fonts/icons | None direct | Active standalone; extensionless |
| Test2 | `test2` | Extensionless HTML | Standalone research/article variant | Inline CSS + external fonts/icons | None direct | Experimental/duplicate risk |
| FfD4 side event | `FfD4` | Extensionless HTML | Side-event landing page | Inline CSS + external fonts | `FT/` image assets | Active standalone; extensionless |
| Save endpoint | `save.php` | PHP | Generic save handler | Frontend callers/scripts | Server-side state writes | Active; review security if expanded |
| TRIDENT involvement | `DB/TRIDENTDB/send-involvement.php` | PHP | Receives involvement submissions | Called from OMW flow | Server handling and mail/storage behavior | Active |
| Horizon scanning app | `public_html/horizon-scanning` | Extensionless HTML app | Signal submission/signing/comment workflow | Large inline app shell + JS | submit/approve/reject/sign/comment endpoints | Active; high-impact |
| Dashboard | `public_html/dashboard.html` | HTML | Moderation/operations UI | Custom JS + data fetches | JSON and PHP endpoints | Active |
| Root approve endpoint | `public_html/approve_signal.php` | PHP | Approve signal | Called by app/admin flows | JSON data files | Duplicated endpoint layer |
| Root reject endpoint | `public_html/reject_signal.php` | PHP | Reject signal | Called by app/admin flows | JSON data files | Duplicated endpoint layer |
| Root sign endpoint | `public_html/sign_signal.php` | PHP | Add signatures | Called by app flows | `signatures.json` | Duplicated endpoint layer |
| Root comment endpoint | `public_html/comment_signal.php` | PHP | Add comments | Called by app flows | `comments.json` | Duplicated endpoint layer |
| Root submit endpoint | `public_html/submit_signal.php` | PHP | Submit pending signal | Called by app flows | `signals-pending.json` | Duplicated endpoint layer |
| Data approve endpoint | `public_html/data/approve_signal.php` | PHP | Approve signal | Dashboard/app callers | `signals-db.json` | Canonical candidate |
| Data reject endpoint | `public_html/data/reject_signal.php` | PHP | Reject signal | Dashboard/app callers | `signals-pending.json` | Canonical candidate |
| Data sign endpoint | `public_html/data/sign_signal.php` | PHP | Add signatures | Visitor action | `signatures.json` | Canonical candidate |
| Data comment endpoint | `public_html/data/comment_signal.php` | PHP | Add comments | Visitor action | `comments.json` | Canonical candidate |
| Data submit endpoint | `public_html/data/submit_signal.php` | PHP | Submit new signals | Visitor/app action | `signals-pending.json` | Canonical candidate |
| Data upload endpoint | `public_html/data/upload.php` | PHP | Upload or refresh data payload | Agent/system upload | `signals-db.json` | Active |
| Data check endpoint | `public_html/data/check_updates.php` | PHP | Polling/update helper | Dashboard/app action | JSON data files | Active |

## Folder-level specs

| Folder | Role | Notes |
|---|---|---|
| `assets/` | Shared design system and media | Main frontend dependency zone |
| `DB/TRIDENTDB/` | Narrow backend integration | Used by COP30 involvement flow |
| `FT/` | Media/image storage | Supports foresight/FfD4 content, not a standalone site |
| `public_html/` | Separate mini-app zone | Moderation + horizon scanning logic |
| `docs/` | Agent-facing organization layer | Canonical starting point for future agents |

## Known inconsistencies and risks
- Missing files linked from `index.html`: `services.html` and `blog.html`.
- Endpoint duplication between `public_html/` root and `public_html/data/`.
- Mixed naming style: snake_case, kebab-case, Pascal-like casing, and extensionless routes.
- Some page titles/content suggest copy-paste reuse or stale labeling.

## Suggested convention going forward
- Use lowercase kebab-case for all new public pages and scripts.
- Preserve legacy paths unless redirects and all internal links are updated in the same change.
- Add new surfaces to `docs/SITE_MANIFEST.json` and this file together.
