# GYC website — fix pack (29 Sep 2026)

> Note (3 Oct 2026): the COP31 house is now called **Youth House**. facts.yaml and QUESTIONS.md supersede anything in this file.


For whoever maintains theglobalyouth.co. Items marked **READY** can be applied as written. Items marked **Q1–Q10** wait on a decision (listed at the end).

---

## 1. Leadership after the Chair handover — READY (except Q2, Q3)

Merna A. Elboghdady has been Chair since 8 September 2026. Agustín moved to Founder & Strategic Director.

**Homepage, Champs section**
- Agustín card: `Founder & Chair` → `Founder & Strategic Director`
- Merna card: `2026 Champ` → `Chair`
- Move Merna's card to the first position (it is also the default "featured" card in the spotlight modal — that modal currently shows Agustín as "Founder & Chair" too).

**About page, "THE CHAMPS"** — replace the old roster (2023–25 titles) with the 2026 roster, matching the homepage and the Sky Phase roadmap:

| Name | Role / track | Country |
|---|---|---|
| Merna A. Elboghdady | Chair · Governance & Negotiation Literacy | Egypt |
| Agustín Ocaña Escobar | Founder & Strategic Director | Ecuador |
| Julia Anting Wolff | Governance & Negotiation Literacy | Spain / Germany |
| Shahnoza (Sasha) Rakhmanova | Governance & Negotiation Literacy | Uzbekistan |
| Ayooluwa F. Ogunsola | Clean Energy Transition | Nigeria |
| Zach Lubin | Sport & Clean Energy Transition · Avocado Framework steward | US |
| Seruni Salsabila | Clean Energy Transition · Fundraising | Indonesia |
| Finlay Wilson | Nature-Based Solutions & Responsible AI | UK |
| Tan Yin Yi (Henry) | Nature-Based Solutions · Youth House coordinator | Malaysia |
| Alice Piva | Nature-Based Solutions · R4P | Brazil |
| Bianca (surname → Q3) | Communications Director | Bolivia |
| Genaro (Genn) Godoy | AI Labs & Foresight lead | Chile |

Former roster members (Lujain, Shura, Raul, Sueley, Fredrick, Irene) → see Q2.

---

## 2. Broken links — READY

| Where | Current | Replace with |
|---|---|---|
| Main menu, every page ("See All Options") | `/public_html/horizon-scanning` (serves a binary file) | `/Foresight-Research#horizon-scanning` |
| Foresight-Research, "Explore Signals Platform" button | same | `#horizon-scanning` — or remove the button until the tool exists |
| Main menu + homepage "Visit the live AI Labs page" | `https://gyc-ai-labs-production.up.railway.app/` | `https://gycailabs.org/` |
| Our Projects footer | `about-us.html`, `services.html` (404), `ourproject.html` (404), `contact-us.html`, `index.html` | Use the same footer as every other page: `/index`, `/about`, `/GYCT`, `/ourprojects`, `/contact` |
| R4P "Featured by" → GEP logo | `unesco.org/en/sustainable-developmen/...` | `https://www.unesco.org/en/sustainable-development/education/greening-future` (missing "t") |
| /ecoverse (linked twice from R4P) | 404 | → Q5 |

**Server redirects (301)** so old links and old share cards keep working:
```
/energy            → /GYCT
/services.html     → /about
/ourproject.html   → /ourprojects
/ForesightResearch → /Foresight-Research   (printed on the back of the IE Impact Report)
/TT                → /thetrident           (used as og:url on The Trident page)
```

---

## 3. R4P partner logos pointing to the wrong sites — PARTLY READY

The Partners row was copy-pasted from the "Featured by" row, so each logo kept the link of the logo above it. The "Featured by" row is fine (apart from the UNESCO typo). Fix the Partners row:

| Logo | Currently goes to | Should go to |
|---|---|---|
| YTG (Youthinkgreen) | We Don't Have Time | → Q6 |
| World Climate School | Sankari Studios | → Q6 |
| E+C (ycr-logo.jpg) | E+C Pavilion | Check the image — the file is `ycr-logo.jpg`, so this may be a different partner → Q6 |
| Sankari | UNESCO | `https://www.sankaristudios.com/` |
| Trescon | Learning for Nature | → Q6 |
| CBA | UAE Ministry of Education | → Q6 |
| Eco Interpreters | UAE Ministry of Education | `https://ecointerpreters.org/` |

Also: the stray text link `index` before the Featured logos can be deleted.

---

## 4. R4P session videos — needs the YouTube IDs (Q4)

The 7 "Did you miss a session?" embeds are template placeholders (`YOUR_VIDEO_ID_1` … `_7`). Until the IDs are available, hide the whole "Did you miss a session?" block so the page doesn't show seven empty players.

---

## 5. Foresight-Research page — READY

**Team photos** — replace dead `via.placeholder.com` images with the real photos already on the server (used on the homepage):
```
https://via.placeholder.com/220?text=Genn   → /assets/images/IE Research/Genn.png
https://via.placeholder.com/220?text=Olga   → /assets/images/IE Research/Olga.png
https://via.placeholder.com/220?text=Elena  → /assets/images/IE Research/Elena.png
https://via.placeholder.com/220?text=Julia  → /assets/images/IE Research/Julia.png
```
(URL-encode the space: `IE%20Research`.)

**ICGA logo** — it's hotlinked from LinkedIn's CDN with an expired token. Download the logo once, save it as `/assets/images/logos/icga.png`, and point to that. Same advice for the Wix-hosted logos (YNA, GYBN, CYMG, FfD Youth): self-host them.

**Contact emails** → Q8.

---

## 6. GYCT page — READY (except Q1)

The page still reads as if it's mid-August. As of today (Tue 29 Sep) the Main track is done and the YNA track has started.

- Hero status line: `Selected participants will be notified shortly` → `Cohort confirmed · YNA advanced track in progress (29 Sep – 13 Oct)`
- "The 2026 cohort has been selected" block: drop "will be notified shortly by email… including spam".
- "Session 2 is Tuesday 8 September…" (appears above the schedule table and in the FAQ) → `The Main track ran 1–22 September. The YNA advanced track runs 29 September, 6 and 13 October. All sessions start 14:00 UTC.`
- Timeline: `Now — Applications open` → `Applications closed 10 August`. Move the "Now" marker to `29 Sep – 13 Oct · YNA advanced track`.
- "Applications are open now and close on 10 August 2026" → `Applications for 2026 are closed.`
- Session 1 date → Q1.
- Cohort map shows "None on the map": either load the data or hide the map section.
- **Remove the "Input into the 2026 programme" button and the FAQ link to `gycailabs.org/gyct-platform-form`.** That form is the internal team MVP decision form, and anyone can currently submit to it. Replace the FAQ line with: `Programme enquiries: takeaction@theglobalyouth.co`.

**Stop this going stale again:** replace the hard-coded status line with a date-driven one.
```html
<span id="gyct-status"></span>
<script>
(function () {
  var now = new Date();
  var phases = [
    ["2026-08-10T23:59:00+01:00", "Applications open until 10 August"],
    ["2026-08-31T23:59:00Z", "Cohort selected · onboarding underway"],
    ["2026-09-22T23:59:00Z", "Main track in progress (1–22 September)"],
    ["2026-10-13T23:59:00Z", "YNA advanced track in progress (29 Sep – 13 Oct)"],
    ["2026-11-10T23:59:00Z", "Closing ceremony at Youth House, Antalya · 10 November"],
    ["2099-01-01T00:00:00Z", "GYCT 2026 complete · watch the recordings below"]
  ];
  for (var i = 0; i < phases.length; i++) {
    if (now <= new Date(phases[i][0])) {
      document.getElementById("gyct-status").textContent = phases[i][1];
      break;
    }
  }
})();
</script>
```

---

## 7. GYCT learning platform — READY

The cohort WhatsApp invite link (`chat.whatsapp.com/C5E4...`) is in the page HTML before sign-in, so anyone who opens gyct.gycailabs.org can read it. Load the link only after authentication (fetch it from the API once the user is signed in), and reset the invite link in WhatsApp once that's done.

---

## 8. Contact details — READY

Use one version everywhere:
```
Speerstrasse 36, 8038 Zurich, Switzerland
takeaction@theglobalyouth.co
+41 77 807 10 68
```
- Footer on all pages: fix `Speerstrassse` (three s's).
- Contact page: fix `+41 77807 1068` spacing.
- Our Projects footer: replace the Bad Iburg, Germany address and the +593 number.
- Contact page intro ("Welcome to Our Vibrant Website! Embark on an Exciting Journey…") is template filler. Suggested replacement: `Partnerships, media, programme questions or ideas — write to us and the right team will get back to you.`

---

## 9. Dead `#` buttons — READY (except Q7)

| Where | Fix |
|---|---|
| Footer "Get Active" (Get Active, Volunteer, Digital Activism, Events) | Point Get Active + Volunteer to the Join Us form (`docs.google.com/forms/d/e/1FAIpQLSe8ageTzIA0tmtsmmvX3KqdoOjrdyoN6FsYpNRyyauJv1kaWw/viewform`). Delete Digital Activism and Events, or point Events to `/GYCT`. |
| Footer "About You → Update Your Preferences" | Delete (it only reloads the homepage). |
| Footer "Donate" block (7 links) | → Q7 |
| 2025 report language buttons (homepage + /report2025) | Hide the six buttons; keep the line "Help us translate the report. Be a volunteer translator." and link it to `mailto:takeaction@theglobalyouth.co?subject=Volunteer%20translator%20-%20GYC%20Report%202025`. |
| R4P "Learn more about our program" | Point to the Google Drive preview already embedded under it, or delete. |
| FfD4 social icons (4 × `#`) | Instagram `https://www.instagram.com/theglobalyouth_co/`, LinkedIn `https://www.linkedin.com/company/the-global-youth-coalition/`, X `https://twitter.com/theglobalyouthc`; delete the fourth. |
| Empty "Designed and developed by" credit link | Remove the link, keep the text. |
| Homepage empty link after the CIF news item (`[](<>)`) | Delete. |

---

## 10. Stale pages — READY (except Q9)

- **/energy** — old GYCT 2024 page still advertising a "July 15th" start. Redirect to `/GYCT` (see section 2).
- **/FfD4** — still shows date/time/location "TBC", "Registration coming soon" and a pre-event application button → Q9.
- **Our Projects** — uses the 2023 template (old nav with "Energy", old footer, $300K). At minimum swap in the current nav + footer and change `$300K` → `$350K`.
- **Copyright lines** — standardise to `© 2026 Global Youth Coalition` (currently 2023, 2024, 2025 and 2026 across pages).

---

## 11. Numbers — needs one decision (Q10)

The site uses different figures for the same thing:
- Invested: homepage/About `$350K`, Our Projects `$300K` → use **$350K** (READY).
- Views of training sessions: homepage/About/Our Projects `60K+` vs GYCT page and 2025 Report `100,000+` → Q10.

---

## 12. Typos and copy — READY

| Where | Current | Fix |
|---|---|---|
| Homepage + Our Projects | Projects Mapped Trough Our Networks | Projects Mapped Through Our Networks |
| Homepage values | knowdledge | knowledge |
| Homepage values | make SDG's a reality | make the SDGs a reality |
| mission_vision.html | The mission of the global youth coalition is By building capacities, creating networks… | The mission of the Global Youth Coalition is to build capacities, create networks, and foster collaboration… |
| mission_vision.html | Breadcrumb says "About Us"; empty "Meet Our Team" heading | Breadcrumb → "Mission & Vision"; delete the empty heading |
| About page | SPORTS DINAMO | (removed with the new roster) |
| Report file name link | `(Bahasa Indonesia)` has an unencoded space | `(Bahasa%20Indonesia)` |
| FrÜtz site og:url / twitter:url | `https://frutz.club/` | `https://fruitz.club/` |

---

## Open questions

- **Q1** — GYCT Session 1: Tue 1 Sep or Wed 2 Sep? The page says "Tue, 2 Sep", but 2 Sep 2026 was a Wednesday.
- **Q2** — Former roster (Lujain, Shura, Raul, Sueley, Fredrick, Irene): drop, or keep in an "Alumni & Administrative Circle" section? Is Lujain still Vice Chair?
- **Q3** — Bianca's public name: "Bianca Malfert" (site) or "Bianca M. Gutierrez" (roadmap)?
- **Q4** — YouTube IDs for the 7 R4P sessions, if they exist.
- **Q5** — Ecoverse: rebuild the page, or remove both R4P links?
- **Q6** — Correct URLs for YTG, World Climate School, Trescon, CBA, and what `ycr-logo.jpg` is.
- **Q7** — Is there a live donation destination (GoFundMe R4P still active? a Norsk Klimanettverk page?) or should the Donate block be removed?
- **Q8** — Public contact emails for the Foresight team to replace the personal Gmails (gen@theglobalyouth.co exists — others?).
- **Q9** — FfD4: did the side event take place? Convert the page to a past-event summary, or redirect it to Foresight-Research?
- **Q10** — Training views: switch the site to 100K+ (matches GYCT page and 2025 Report)?
