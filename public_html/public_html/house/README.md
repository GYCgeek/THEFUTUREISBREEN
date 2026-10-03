# GYC House — HTML5 v0 site

Pure **HTML5 + CSS + JS** public site for GYC House (LCAW-first).

## Open locally

```powershell
Start-Process chrome.exe "C:\Users\Genn\.openclaw\workspace\projects\gyc-house\web\index.html"
```

Or double-click `index.html`.

## Pages

| File | Purpose |
|------|---------|
| `index.html` | Home — dual CTA, product lines, calendar, day spine |
| `houses/lcaw-2026.html` | Flagship moment page + Event JSON-LD |
| `partners.html` | Tiers + partner inquiry form |
| `apply.html` | Youth / delegate application |
| `legal/code-of-conduct.html` | Safeguarding / CoC |
| `legal/privacy.html` | Privacy notice (includes v0 localStorage note) |
| `css/site.css` | Design system (GYCT teal family) |
| `js/site.js` | Nav, reveals, form handling |

## Forms (v0)

- HTML5 `required` / `type` validation
- On submit: payload saved to `localStorage` key `gyc-house-submissions`
- Success message shown (no server yet)
- Optional: set `data-mailto="ops@example.org"` on a `<form>` for email handoff

Inspect submissions in DevTools:

```js
JSON.parse(localStorage.getItem("gyc-house-submissions"))
```

## Next engineering steps

1. Wire forms to Sheet / Airtable / CRM API  
2. Deploy static host (Railway static, Cloudflare Pages, Netlify, or parent site path)  
3. Point `house.theglobalyouth.co` when ready  
4. Replace TBC venue / dates when locked  
5. Add real photography with rights + alt text  

## Spec

See `../docs/gyc-house-spec-reengineering.md` and `../blueprint/gyc-house-blueprint.html`.
