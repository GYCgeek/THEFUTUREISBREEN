// Re-encode PNG posters as web JPEGs via headless Chromium canvas.
// Usage: node compress.mjs <srcDir> <maxWidth> <quality>
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const [srcDir, maxW = "900", q = "0.82"] = process.argv.slice(2);
const files = fs.readdirSync(srcDir).filter((f) => f.endsWith(".png"));
const browser = await chromium.launch();
const page = await browser.newPage();
for (const f of files) {
  const b64 = fs.readFileSync(path.join(srcDir, f)).toString("base64");
  const out = await page.evaluate(async ({ b64, maxW, q }) => {
    const img = new Image();
    img.src = "data:image/png;base64," + b64;
    await img.decode();
    const scale = Math.min(1, maxW / img.naturalWidth);
    const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, w, h);
    return { data: c.toDataURL("image/jpeg", q).split(",")[1], w, h, ow: img.naturalWidth, oh: img.naturalHeight };
  }, { b64, maxW: Number(maxW), q: Number(q) });
  const dest = path.join(srcDir, f.replace(/\.png$/, ".jpg"));
  fs.writeFileSync(dest, Buffer.from(out.data, "base64"));
  console.log(`${f} ${out.ow}x${out.oh} -> ${path.basename(dest)} ${out.w}x${out.h} ${(fs.statSync(dest).size / 1024).toFixed(0)} KB`);
}
await browser.close();
