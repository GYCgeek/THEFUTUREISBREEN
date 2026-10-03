#!/usr/bin/env node
// Local preview that behaves like the live Apache host (Awardspace) for this site.
// It reads .htaccess and emulates the parts the site uses: Redirect 301, RewriteRule
// (internal rewrites and [R=301] redirects), the "real file or directory wins" pass-through,
// ForceType text/html for extensionless pages, DirectoryIndex and ErrorDocument 404.
// PHP is not executed (no PHP on this machine): .php requests return 501.
// Usage: node scripts/preview.mjs [--port 8080]
// No dependencies (Node 18+).

import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const PORT = Number(args[args.indexOf("--port") + 1] || process.env.PORT || 8080);
const ROOT = process.cwd();

const MIME = {
  ".html": "text/html; charset=UTF-8", ".htm": "text/html; charset=UTF-8", ".css": "text/css", ".js": "text/javascript",
  ".mjs": "text/javascript", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".pdf": "application/pdf",
  ".mp4": "video/mp4", ".webm": "video/webm", ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf",
  ".txt": "text/plain; charset=UTF-8", ".xml": "application/xml", ".csv": "text/csv", ".md": "text/plain; charset=UTF-8",
};

// Paths the kit adds to the repo. They are never uploaded, so the preview hides them like the live host would.
// "reports/" (the loop's notes folder) is hidden; the public /reports page is not.
const LOCAL_ONLY = /^\/(\.claude|\.github|\.git|scripts|reports(?=\/)|node_modules|docs\/brand|CLAUDE\.md|README-LOOP\.md|package(-lock)?\.json)(\/|$)/;

function loadHtaccess() {
  const text = fs.readFileSync(path.join(ROOT, ".htaccess"), "utf8");
  const rules = [];      // in file order: {type:'redirect'|'rewrite'|'passthrough', re, target, status, last}
  const forceHtml = new Set();
  let directoryIndex = "index.html";
  let errorDoc = null;
  let pendingConds = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    let m;
    if ((m = line.match(/^DirectoryIndex\s+(\S+)/i))) directoryIndex = m[1];
    else if ((m = line.match(/^ErrorDocument\s+404\s+(\S+)/i))) errorDoc = m[1];
    else if ((m = line.match(/^Redirect(?:Permanent)?\s+(?:301\s+)?(\/\S*)\s+(\S+)/i))) rules.push({ type: "redirect-prefix", from: m[1], target: m[2], status: 301 });
    else if ((m = line.match(/^RedirectMatch\s+(?:301\s+)?(\S+)\s+(\S+)/i))) rules.push({ type: "redirect", re: new RegExp(m[1]), target: m[2], status: 301 });
    else if ((m = line.match(/^<Files\s+"?([^">]+)"?>/i))) forceHtml.add(m[1]); // only ForceType/HTML headers live in <Files> here
    else if ((m = line.match(/^RewriteCond\s+%\{REQUEST_FILENAME\}\s+-([fd])/i))) pendingConds.push(m[1]);
    else if ((m = line.match(/^RewriteCond\s+%\{REQUEST_URI\}\s+(\S+)/i))) pendingConds.push({ uri: new RegExp(m[1]) });
    else if ((m = line.match(/^RewriteRule\s+(\S+)\s+(\S+)(?:\s+\[([^\]]*)\])?/i))) {
      const flags = (m[3] || "").split(",").map((f) => f.trim().toUpperCase());
      const nc = flags.includes("NC");
      const re = new RegExp(m[1], nc ? "i" : "");
      const redirect = flags.find((f) => f.startsWith("R"));
      const fsConds = pendingConds.filter((c) => typeof c === "string");
      const uriConds = pendingConds.filter((c) => typeof c === "object");
      if (fsConds.length && m[2] === "-") rules.push({ type: "passthrough" });
      else if (m[2] === "-" && flags.includes("F")) rules.push({ type: "forbidden", re, uriConds });
      else if (redirect) rules.push({ type: "redirect", re, target: m[2], status: Number(redirect.split("=")[1] || 302), uriConds });
      else rules.push({ type: "rewrite", re, target: m[2], last: flags.includes("L"), uriConds });
      pendingConds = [];
    }
  }
  return { rules, forceHtml, directoryIndex, errorDoc };
}

const fileOf = (rel) => path.join(ROOT, decodeURIComponent(rel).replace(/^\/+/, ""));
const isFile = (p) => { try { return fs.statSync(p).isFile(); } catch { return false; } };
const isDir = (p) => { try { return fs.statSync(p).isDirectory(); } catch { return false; } };

function send(res, status, filePath, cfg, headOnly) {
  const ext = path.extname(filePath).toLowerCase();
  let type = MIME[ext];
  if (!type && cfg.forceHtml.has(path.basename(filePath))) type = "text/html; charset=UTF-8";
  if (!type && !ext) type = "application/octet-stream"; // what Apache does for extensionless files without ForceType
  res.writeHead(status, { "content-type": type || "application/octet-stream", "cache-control": "no-store" });
  if (headOnly) return res.end();
  fs.createReadStream(filePath).pipe(res);
}

function notFound(res, cfg, headOnly) {
  const doc = cfg.errorDoc && fileOf(cfg.errorDoc);
  if (doc && isFile(doc)) return send(res, 404, doc, cfg, headOnly);
  res.writeHead(404, { "content-type": "text/plain" }); res.end("404");
}

const server = http.createServer((req, res) => {
  const cfg = loadHtaccess(); // re-read every request so .htaccess edits apply instantly
  const headOnly = req.method === "HEAD";
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let p = url.pathname;
  if (LOCAL_ONLY.test(p)) return notFound(res, cfg, headOnly);
  if (/\.php$/i.test(p)) { res.writeHead(501, { "content-type": "text/plain" }); return res.end("PHP is not available in local preview"); }

  const rel = p.replace(/^\//, "");
  for (const r of cfg.rules) {
    if (r.type === "redirect-prefix" && (p === r.from || p.startsWith(r.from + "/"))) {
      res.writeHead(r.status, { location: r.target + p.slice(r.from.length) }); return res.end();
    }
    if (r.uriConds && !r.uriConds.every((c) => c.uri.test(p))) continue;
    if (r.type === "redirect" && r.re.test(rel)) {
      let loc = rel.replace(r.re, r.target);
      if (!/^https?:/.test(loc) && !loc.startsWith("/")) loc = "/" + loc;
      res.writeHead(r.status, { location: loc }); return res.end();
    }
    if (r.type === "forbidden" && r.re.test(rel)) { res.writeHead(403, { "content-type": "text/plain" }); return res.end("Forbidden"); }
    if (r.type === "passthrough") {
      const f = fileOf(p);
      if (isFile(f)) return send(res, 200, f, cfg, headOnly);
      if (isDir(f) && !LOCAL_ONLY.test(p.replace(/\/?$/, "/"))) { // local-only folders don't exist on the server
        if (!p.endsWith("/")) { res.writeHead(301, { location: p + "/" + url.search }); return res.end(); }
        const idx = path.join(f, cfg.directoryIndex);
        return isFile(idx) ? send(res, 200, idx, cfg, headOnly) : notFound(res, cfg, headOnly);
      }
    }
    if (r.type === "rewrite" && r.re.test(rel)) {
      const target = rel.replace(r.re, r.target);
      const f = fileOf("/" + target);
      return isFile(f) ? send(res, 200, f, cfg, headOnly) : notFound(res, cfg, headOnly);
    }
  }
  // No rule matched: plain static serving.
  const f = fileOf(p);
  if (isFile(f)) return send(res, 200, f, cfg, headOnly);
  if (isDir(f) && isFile(path.join(f, cfg.directoryIndex))) return send(res, 200, path.join(f, cfg.directoryIndex), cfg, headOnly);
  return notFound(res, cfg, headOnly);
});

server.listen(PORT, () => console.log(`Preview: http://localhost:${PORT}  (root: ${ROOT})`));
