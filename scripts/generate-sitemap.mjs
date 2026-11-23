import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const siteRoot = path.join(__dirname, "..", "site");
const baseUrl = "https://globalmarco.com";

async function collectPages(dir, relativeDir = "") {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const pages = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "assets" || entry.name === "_external") {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    const nextRelative = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      pages.push(...(await collectPages(fullPath, nextRelative)));
      continue;
    }

    if (entry.name === "index.html") {
      const urlPath = relativeDir ? `${relativeDir}/` : "";
      pages.push(`${baseUrl}/${urlPath}`);
    }
  }

  return pages.sort();
}

function buildSitemap(urls) {
  const today = new Date().toISOString().slice(0, 10);
  const entries = urls
    .map((url) => {
      const priority = url === `${baseUrl}/` ? "1.0" : "0.8";
      return [
        "  <url>",
        `    <loc>${url}</loc>`,
        `    <lastmod>${today}</lastmod>`,
        `    <changefreq>weekly</changefreq>`,
        `    <priority>${priority}</priority>`,
        "  </url>",
      ].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    entries,
    "</urlset>",
    "",
  ].join("\n");
}

const urls = await collectPages(siteRoot);
const sitemap = buildSitemap(urls);
await fs.writeFile(path.join(siteRoot, "sitemap.xml"), sitemap, "utf8");
console.log(`Generated sitemap with ${urls.length} URLs.`);
