import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "site");

function normalizeText(value) {
  return String(value || "")
    .replace(/<[^>]+>/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeHref(value) {
  return String(value || "")
    .toLowerCase()
    .split("#")[0]
    .replace(/\/+$/, "");
}

function dedupeKey(href, text) {
  return `${normalizeHref(href)}::${normalizeText(text)}`;
}

function dedupeListBlock(content) {
  const pattern = /<li>\s*<a\s+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>\s*<\/li>/gi;
  const matches = [...content.matchAll(pattern)];

  if (!matches.length) {
    return content;
  }

  const seen = new Set();
  const kept = [];

  for (const match of matches) {
    const href = match[1];
    const text = match[2].trim();
    const key = dedupeKey(href, text);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    kept.push(`<li><a href="${href}">${text}</a></li>`);
  }

  if (kept.length === matches.length) {
    return content;
  }

  const prefix = content.slice(0, matches[0].index);
  const suffix = content.slice(matches[matches.length - 1].index + matches[matches.length - 1][0].length);
  const indent = matches[0][0].match(/^\s*/)?.[0] || "              ";

  return `${prefix}${kept.map((item) => `${indent}${item}`).join("\n")}${suffix}`;
}

function dedupeHtml(html) {
  let next = html;

  next = next.replace(/<div class="box">([\s\S]*?)<\/div>/gi, (full, inner) => {
    const deduped = dedupeListBlock(inner);
    return `<div class="box">${deduped}</div>`;
  });

  next = next.replace(/<ul class="([^"]*)">([\s\S]*?)<\/ul>/gi, (full, className, inner) => {
    if (!/<li>\s*<a\s/i.test(inner)) {
      return full;
    }

    const deduped = dedupeListBlock(inner);
    return `<ul class="${className}">${deduped}</ul>`;
  });

  return next;
}

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
  const original = await fs.readFile(file, "utf8");
  const next = dedupeHtml(original);

  if (next !== original) {
    await fs.writeFile(file, next, "utf8");
    updated += 1;
  }
}

console.log(`Deduped link lists in ${updated} HTML files.`);
