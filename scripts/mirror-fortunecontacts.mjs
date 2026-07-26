import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const ROOT_URL = "https://www.fortunecontacts.com/";
const ROOT_HOST = new URL(ROOT_URL).host;
const SITEMAP_URL = new URL("sitemap.xml", ROOT_URL).toString();
const OUTPUT_DIR = path.resolve("site");

const pageMap = new Map();
const assetMap = new Map();
const pageUrls = new Set();

const DEFAULT_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) FortuneContactsMirror/1.0",
  accept: "*/*",
};

function hashText(value) {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, 10);
}

function hasFileExtension(pathname) {
  return path.posix.basename(pathname).includes(".");
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizePageUrl(input) {
  const url = new URL(input, ROOT_URL);
  url.hash = "";
  if (!url.pathname) {
    url.pathname = "/";
  }
  if (url.pathname !== "/" && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }
  return url.toString();
}

function pageFileFromUrl(input) {
  const url = new URL(input);
  let pathname = safeDecode(url.pathname);
  if (!pathname || pathname === "/") {
    return path.join(OUTPUT_DIR, "index.html");
  }

  pathname = pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  if (!pathname) {
    return path.join(OUTPUT_DIR, "index.html");
  }

  if (hasFileExtension(pathname)) {
    return path.join(OUTPUT_DIR, pathname);
  }

  return path.join(OUTPUT_DIR, pathname, "index.html");
}

function ensureLeadingSlash(value) {
  return value.startsWith("/") ? value : `/${value}`;
}

function assetFileFromUrl(input) {
  const url = new URL(input);
  let pathname = safeDecode(url.pathname);
  if (!pathname || pathname.endsWith("/")) {
    pathname = `${pathname}index`;
  }

  const ext = path.posix.extname(pathname);
  const baseName = ext
    ? path.posix.basename(pathname, ext)
    : path.posix.basename(pathname);
  const suffix = url.search ? `-${hashText(url.search)}` : "";
  const finalName = ext ? `${baseName}${suffix}${ext}` : `${baseName}${suffix}`;
  const finalDir = path.posix.dirname(pathname);

  if (url.host === ROOT_HOST) {
    return path.join(OUTPUT_DIR, finalDir.replace(/^\/+/, ""), finalName);
  }

  return path.join(
    OUTPUT_DIR,
    "_external",
    url.host,
    finalDir.replace(/^\/+/, ""),
    finalName,
  );
}

function relativePath(fromFile, toFile) {
  return path
    .relative(path.dirname(fromFile), toFile)
    .split(path.sep)
    .join("/");
}

function shouldKeepLiteral(value) {
  if (!value) {
    return true;
  }

  const lower = value.trim().toLowerCase();
  return (
    lower.startsWith("#") ||
    lower.startsWith("data:") ||
    lower.startsWith("mailto:") ||
    lower.startsWith("tel:") ||
    lower.startsWith("javascript:") ||
    lower.startsWith("whatsapp:") ||
    lower.startsWith("sms:")
  );
}

function shouldDownloadExternalAsset(url, attributeName) {
  if (attributeName === "action") {
    return false;
  }

  const pathname = url.pathname.toLowerCase();
  const assetExtPattern =
    /\.(css|js|mjs|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|otf|eot|json|xml|mp4|webm|ogg)$/;

  return (
    assetExtPattern.test(pathname) ||
    attributeName === "src" ||
    attributeName === "poster" ||
    (attributeName === "content" &&
      (url.host.includes("imagekit") || pathname.match(/\.(png|jpe?g|webp|gif|svg)$/)))
  );
}

async function fetchUrl(url) {
  const response = await fetch(url, { headers: DEFAULT_HEADERS, redirect: "follow" });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response;
}

async function writeFile(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content);
}

async function loadSitemapUrls() {
  const response = await fetchUrl(SITEMAP_URL);
  const xml = await response.text();
  const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/gi)];
  return matches.map((match) => normalizePageUrl(match[1]));
}

async function downloadAsset(assetUrl) {
  const normalizedUrl = new URL(assetUrl).toString();
  if (assetMap.has(normalizedUrl)) {
    return assetMap.get(normalizedUrl);
  }

  const outputFile = assetFileFromUrl(normalizedUrl);
  assetMap.set(normalizedUrl, outputFile);

  try {
    const response = await fetchUrl(normalizedUrl);
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("text/css") || outputFile.toLowerCase().endsWith(".css")) {
      let css = await response.text();
      css = await rewriteCss(css, normalizedUrl, outputFile);
      await writeFile(outputFile, css);
      return outputFile;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(outputFile, buffer);
    return outputFile;
  } catch (error) {
    assetMap.delete(normalizedUrl);
    console.warn(`Skipping asset ${normalizedUrl}: ${error.message}`);
    return null;
  }
}

async function rewriteCss(css, baseUrl, outputFile) {
  const urlPattern = /url\((['"]?)(.*?)\1\)/gi;
  let rewritten = "";
  let lastIndex = 0;

  for (const match of css.matchAll(urlPattern)) {
    const [fullMatch, quote, rawValue] = match;
    const start = match.index ?? 0;
    rewritten += css.slice(lastIndex, start);
    lastIndex = start + fullMatch.length;

    const value = rawValue.trim();
    if (shouldKeepLiteral(value)) {
      rewritten += fullMatch;
      continue;
    }

    try {
      const resolved = new URL(value, baseUrl);
      const localAsset = await downloadAsset(resolved.toString());
      if (!localAsset) {
        rewritten += fullMatch;
        continue;
      }
      const replacement = relativePath(outputFile, localAsset);
      rewritten += `url(${quote}${replacement}${quote})`;
    } catch {
      rewritten += fullMatch;
    }
  }

  rewritten += css.slice(lastIndex);
  return rewritten;
}

async function rewriteUrlValue(rawValue, attributeName, pageFile) {
  const value = rawValue.trim();
  if (shouldKeepLiteral(value)) {
    return value;
  }

  let resolved;
  try {
    resolved = new URL(value, ROOT_URL);
  } catch {
    return value;
  }

  if (resolved.host === ROOT_HOST) {
    const normalizedPage = normalizePageUrl(resolved.toString());
    const pathname = resolved.pathname.toLowerCase();
    const isPhpEndpoint = pathname.endsWith(".php");
    const routeExists = pageUrls.has(normalizedPage);
    const isLikelyPage = routeExists || (!hasFileExtension(resolved.pathname) && !isPhpEndpoint);

    if (isLikelyPage) {
      const targetFile = routeExists ? pageMap.get(normalizedPage) : pageFileFromUrl(normalizedPage);
      let output = relativePath(pageFile, targetFile);
      if (resolved.hash) {
        output += resolved.hash;
      }
      return output || "index.html";
    }

    if (isPhpEndpoint && attributeName === "action") {
      return resolved.toString();
    }

    const localAsset = await downloadAsset(resolved.toString());
    return localAsset ? relativePath(pageFile, localAsset) : resolved.toString();
  }

  if (!shouldDownloadExternalAsset(resolved, attributeName)) {
    return resolved.toString();
  }

  const localAsset = await downloadAsset(resolved.toString());
  return localAsset ? relativePath(pageFile, localAsset) : resolved.toString();
}

async function rewriteHtml(html, pageUrl, pageFile) {
  let rewritten = html;

  const srcsetPattern = /\bsrcset=(['"])(.*?)\1/gi;
  for (const match of [...rewritten.matchAll(srcsetPattern)].reverse()) {
    const [fullMatch, quote, value] = match;
    const entries = value.split(",").map((entry) => entry.trim()).filter(Boolean);
    const rewrittenEntries = [];

    for (const entry of entries) {
      const [rawUrl, descriptor] = entry.split(/\s+/, 2);
      const nextUrl = await rewriteUrlValue(rawUrl, "src", pageFile);
      rewrittenEntries.push(descriptor ? `${nextUrl} ${descriptor}` : nextUrl);
    }

    const replacement = `srcset=${quote}${rewrittenEntries.join(", ")}${quote}`;
    const start = match.index ?? 0;
    rewritten = `${rewritten.slice(0, start)}${replacement}${rewritten.slice(start + fullMatch.length)}`;
  }

  const attributePattern = /\b(href|src|poster|action)=(['"])(.*?)\2/gi;
  for (const match of [...rewritten.matchAll(attributePattern)].reverse()) {
    const [fullMatch, attributeName, quote, value] = match;
    const replacementValue = await rewriteUrlValue(value, attributeName.toLowerCase(), pageFile);
    const replacement = `${attributeName}=${quote}${replacementValue}${quote}`;
    const start = match.index ?? 0;
    rewritten = `${rewritten.slice(0, start)}${replacement}${rewritten.slice(start + fullMatch.length)}`;
  }

  const inlineCssPattern = /url\((['"]?)(.*?)\1\)/gi;
  for (const match of [...rewritten.matchAll(inlineCssPattern)].reverse()) {
    const [fullMatch, quote, value] = match;
    if (shouldKeepLiteral(value)) {
      continue;
    }

    try {
      const replacementValue = await rewriteUrlValue(value, "src", pageFile);
      const replacement = `url(${quote}${replacementValue}${quote})`;
      const start = match.index ?? 0;
      rewritten = `${rewritten.slice(0, start)}${replacement}${rewritten.slice(start + fullMatch.length)}`;
    } catch {
      // Leave the original literal when URL rewriting fails.
    }
  }

  return rewritten;
}

async function mirrorPage(pageUrl) {
  const normalizedUrl = normalizePageUrl(pageUrl);
  const outputFile = pageMap.get(normalizedUrl);
  const response = await fetchUrl(normalizedUrl);
  const html = await response.text();
  const rewritten = await rewriteHtml(html, normalizedUrl, outputFile);
  await writeFile(outputFile, rewritten);
}

async function main() {
  await fs.rm(OUTPUT_DIR, { recursive: true, force: true });

  const routes = await loadSitemapUrls();
  for (const route of routes) {
    pageUrls.add(route);
    pageMap.set(route, pageFileFromUrl(route));
  }

  for (const route of routes) {
    console.log(`Mirroring ${route}`);
    await mirrorPage(route);
  }

  console.log(`Completed ${routes.length} pages and ${assetMap.size} assets.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
