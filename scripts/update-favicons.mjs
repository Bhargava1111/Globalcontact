import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.join(__dirname, "..", "site");

const faviconBlock = `  <link href="/assets/img/favicon.ico?v=2" rel="icon" sizes="any">
  <link href="/assets/img/favicon-32.png?v=2" rel="icon" type="image/png" sizes="32x32">
  <link href="/assets/img/favicon-16.png?v=2" rel="icon" type="image/png" sizes="16x16">
  <link href="/assets/img/apple-touch-icon.png?v=2" rel="apple-touch-icon" sizes="180x180">`;

const faviconPatterns = [
  /<!-- Favicons -->\s*<link[^>]+favicon[^>]*>\s*(?:<link[^>]+(?:favicon|apple-touch-icon)[^>]*>\s*)*/gi,
  /<link[^>]+rel="icon"[^>]*>\s*(?:<link[^>]+rel="(?:icon|apple-touch-icon)"[^>]*>\s*)*/gi,
];

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(fullPath);
    }
  }

  return files;
}

let updated = 0;

for (const file of await walk(siteRoot)) {
  let html = await fs.readFile(file, "utf8");
  let next = html;

  for (const pattern of faviconPatterns) {
    if (pattern.test(next)) {
      next = next.replace(pattern, `<!-- Favicons -->\n${faviconBlock}\n`);
      break;
    }
  }

  if (next !== html) {
    await fs.writeFile(file, next, "utf8");
    updated += 1;
  }
}

console.log(`Updated favicon links in ${updated} HTML files.`);
