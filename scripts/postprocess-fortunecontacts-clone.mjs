import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const SITE_ROOT = path.resolve("site");
const FALLBACK_SCRIPT = "assets/js/local-form-fallback.js";
const PRIMARY_EMAIL = "info@globalcontacthub.com";
const SECONDARY_EMAIL = "robert.h@globalcontacthub.com";
const PRIMARY_PHONE_DISPLAY = "+1 661-451-2161";
const PRIMARY_PHONE_HREF = "tel:+16614512161";
const WHATSAPP_URL = "https://wa.me/918106768968";
const SOCIAL_LINK_PLACEHOLDER = "#";
const ANNIVERSARY_IMAGE = "assets/img/5-years-local.png";
const LOGO_IMAGE = "assets/img/logo-gch-mark.svg";
const HERO_IMAGE = "assets/img/hero-main.webp";
const DEFAULT_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) FortuneContactsClonePostProcess/1.0",
  accept: "*/*",
};

async function collectHtmlFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await collectHtmlFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      results.push(fullPath);
    }
  }

  return results;
}

function relativeFallbackPath(htmlFile) {
  return path
    .relative(path.dirname(htmlFile), path.join(SITE_ROOT, FALLBACK_SCRIPT))
    .split(path.sep)
    .join("/");
}

async function fileExists(filePath) {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

function hashText(value) {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, 10);
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
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
  const finalDir = path.posix.dirname(pathname).replace(/^\/+/, "");

  return path.join(SITE_ROOT, "_external", url.host, finalDir, finalName);
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

async function downloadExternalAsset(assetUrl) {
  const normalizedUrl = new URL(assetUrl).toString();
  const outputFile = assetFileFromUrl(normalizedUrl);

  if (await fileExists(outputFile)) {
    return outputFile;
  }

  const response = await fetchUrl(normalizedUrl);
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outputFile, buffer);
  return outputFile;
}

function injectFallbackScript(html, scriptPath) {
  if (html.includes("local-form-fallback.js")) {
    return html;
  }

  const tag = `  <script src="${scriptPath}" defer></script>\n`;
  if (html.includes("</body>")) {
    return html.replace("</body>", `${tag}</body>`);
  }

  return `${html}\n${tag}`;
}

function rewriteKnownExternalStyles(html, htmlFile) {
  const localBootstrapIcons = path
    .relative(path.dirname(htmlFile), path.join(SITE_ROOT, "assets", "vendor", "bootstrap-icons", "bootstrap-icons.css"))
    .split(path.sep)
    .join("/");

  return html.replace(
    /https:\/\/cdn\.jsdelivr\.net\/npm\/bootstrap-icons@1\.17\.1\/font\/bootstrap-icons\.css/gi,
    localBootstrapIcons,
  );
}

function rewriteBrandAssets(html) {
  let updated = html;
  const assetPathPattern = /(["'])(?:\/assets\/img\/|(?:\.\.\/)?assets\/img\/)(logo\.webp|logo-global\.svg|logo-gch\.png|logo-gch-mark\.svg)\1/gi;

  updated = updated.replace(assetPathPattern, `$1/${LOGO_IMAGE}$1`);
  updated = updated.replace(
    /(["'])((?:\.\.\/)?assets\/img\/)Global Contact Hub\.webp\1/gi,
    '$1/assets/img/hero-main.webp$1',
  );
  updated = updated.replace(
    /(["'])((?:\.\.\/)?assets\/img\/)hero-network\.svg\1/gi,
    '$1/assets/img/hero-main.webp$1',
  );
  updated = updated.replace(
    /(["'])((?:\.\.\/)?assets\/img\/)hero-main\.webp\1/gi,
    '$1/assets/img/hero-main.webp$1',
  );

  return updated;
}

function rewriteBrandingAndContacts(html) {
  let updated = html;

  updated = updated.replace(/david@fortunecontacts\.com/gi, SECONDARY_EMAIL);
  updated = updated.replace(/david@globalcontacthub\.com/gi, SECONDARY_EMAIL);
  updated = updated.replace(/sales@fortunecontacts\.com/gi, PRIMARY_EMAIL);
  updated = updated.replace(/sales@globalcontacthub\.com/gi, PRIMARY_EMAIL);
  updated = updated.replace(/info@fortunecontacts\.com/gi, PRIMARY_EMAIL);
  updated = updated.replace(/[A-Z0-9._%+-]+@fortunecontacts\.com/gi, PRIMARY_EMAIL);

  updated = updated.replace(/Fortune Contacts/g, "Global Contact Hub");
  updated = updated.replace(/FORTUNE CONTACTS/g, "GLOBAL CONTACT HUB");
  updated = updated.replace(/fortune contacts/g, "global contact hub");
  updated = updated.replace(/Fortune Contact/g, "Global Contact Hub");
  updated = updated.replace(/fortune contact/g, "global contact hub");
  updated = updated.replace(/Fortunecontacts/g, "Global Contact Hub");
  updated = updated.replace(/fortunecontacts/g, "global contact hub");
  updated = updated.replace(/fortunecontacts\.com/gi, "globalcontacthub.com");
  updated = updated.replace(/https:\/\/twitter\.com\/fortunecontacts/gi, SOCIAL_LINK_PLACEHOLDER);
  updated = updated.replace(/https:\/\/www\.facebook\.com\/FortuneContacts\/?/gi, SOCIAL_LINK_PLACEHOLDER);
  updated = updated.replace(/https:\/\/www\.instagram\.com\/fortunecontacts\/?/gi, SOCIAL_LINK_PLACEHOLDER);
  updated = updated.replace(/https:\/\/www\.linkedin\.com\/company\/fortune-contacts\/?/gi, SOCIAL_LINK_PLACEHOLDER);

  updated = updated.replace(
    /href=(["'])tel:(?:\+?\s*1[\s-]*)?661[\s-]*485[\s-]*1595\1/gi,
    `href="${
      PRIMARY_PHONE_HREF
    }"`,
  );
  updated = updated.replace(
    /href=(["'])tel:(?:\+?\s*1[\s-]*)?919[\s-]*533[\s-]*4002\1/gi,
    `href="${
      PRIMARY_PHONE_HREF
    }"`,
  );
  updated = updated.replace(
    /(?:\+\s*1\s*661\s*485\s*1595|\+?\s*1[\s-]*661[\s-]*485[\s-]*1595)/g,
    PRIMARY_PHONE_DISPLAY,
  );
  updated = updated.replace(
    /(?:\+\s*1\s*919\s*533\s*4002|\+?\s*1[\s-]*919[\s-]*533[\s-]*4002)/g,
    PRIMARY_PHONE_DISPLAY,
  );

  updated = updated.replace(/href=(["'])https:\/\/wa\.me\/[^"']+\1/gi, `href="${WHATSAPP_URL}"`);
  updated = updated.replace(
    /href=(["'])https:\/\/api\.whatsapp\.com\/send\?phone=[^"']+\1/gi,
    `href="${WHATSAPP_URL}"`,
  );
  updated = updated.replace(/src=(["'])(?:\/assets\/img\/|(?:\.\.\/)?assets\/img\/)(9 years 3\.png|5-years-celebration\.svg|5-years-premium\.png|5-years-final\.png|5-years-local\.png)\1/gi, `src="/${ANNIVERSARY_IMAGE}"`);
  updated = updated.replace(
    /src=(["'])https:\/\/coresg-normal\.trae\.ai\/api\/ide\/v1\/text_to_image\?[^"']+\1/gi,
    `src="/${ANNIVERSARY_IMAGE}"`,
  );
  updated = updated.replace(/alt=(["'])9 Years Celebration\1/gi, 'alt="5 Years Celebration"');
  updated = updated.replace(/9 YEARS/gi, "5 YEARS");
  updated = updated.replace(/9 years/gi, "5 years");

  return updated;
}

function rewriteFormHandlers(html) {
  let updated = html;

  updated = updated.replace(
    /action=(["'])https:\/\/www\.fortunecontacts\.com\/send_email\.php\1/gi,
    'action="#local-form-handler"',
  );
  updated = updated.replace(
    /action=(["'])https:\/\/www\.fortunecontacts\.com\/forms\/contact\.php\1/gi,
    'action="#local-form-handler"',
  );
  updated = updated.replace(
    /action=(["'])send_email\.php\1/gi,
    'action="#local-form-handler"',
  );
  updated = updated.replace(
    /xhr\.open\((["'])POST\1,\s*(["'])send_email\.php\2\);/gi,
    'console.info("Local clone form submission intercepted.");',
  );

  return updated;
}

async function resolveLocalTarget(urlPath) {
  const cleanPath = urlPath.replace(/^\/+/, "");
  if (!cleanPath) {
    const rootIndex = path.join(SITE_ROOT, "index.html");
    return (await fileExists(rootIndex)) ? rootIndex : null;
  }

  const directFile = path.join(SITE_ROOT, cleanPath);
  const nestedIndex = path.join(SITE_ROOT, cleanPath, "index.html");
  if (await fileExists(directFile)) {
    return directFile;
  }
  if (await fileExists(nestedIndex)) {
    return nestedIndex;
  }
  if (cleanPath.toLowerCase().endsWith(".html")) {
    const trimmedPath = cleanPath.slice(0, -5);
    const trimmedDirect = path.join(SITE_ROOT, trimmedPath);
    const trimmedIndex = path.join(SITE_ROOT, trimmedPath, "index.html");
    if (await fileExists(trimmedDirect)) {
      return trimmedDirect;
    }
    if (await fileExists(trimmedIndex)) {
      return trimmedIndex;
    }
  }
  return null;
}

async function rewriteInternalAbsoluteUrls(html, htmlFile) {
  const matches = [...html.matchAll(/https?:\/\/www\.fortunecontacts\.com(\/[A-Za-z0-9_./%\-]*)?/gi)];
  let updated = html;

  for (const match of matches.reverse()) {
    const fullMatch = match[0];
    const urlPath = match[1] || "/";
    const targetFile = await resolveLocalTarget(urlPath);
    if (!targetFile) {
      continue;
    }

    let replacement = path
      .relative(path.dirname(htmlFile), targetFile)
      .split(path.sep)
      .join("/");

    if (!replacement) {
      replacement = "index.html";
    }

    const start = match.index ?? 0;
    updated = `${updated.slice(0, start)}${replacement}${updated.slice(start + fullMatch.length)}`;
  }

  return updated;
}

async function rewriteHostedAssetUrls(html, htmlFile) {
  const matches = [
    ...html.matchAll(
      /https?:\/\/(?:ik\.imagekit\.io|p16-cc-image-search-sign-sg\.ibyteimg\.com|p19-cc-image-search-sign-sg\.ibyteimg\.com)[^\s"'<>)}]+/gi,
    ),
  ];

  let updated = html;

  for (const match of matches.reverse()) {
    const fullMatch = match[0];

    try {
      const assetFile = await downloadExternalAsset(fullMatch);
      let replacement = path
        .relative(path.dirname(htmlFile), assetFile)
        .split(path.sep)
        .join("/");

      if (!replacement) {
        replacement = "index.html";
      }

      const start = match.index ?? 0;
      updated = `${updated.slice(0, start)}${replacement}${updated.slice(start + fullMatch.length)}`;
    } catch {
      // Keep the original URL when the hosted asset cannot be downloaded.
    }
  }

  return updated;
}

async function main() {
  const htmlFiles = await collectHtmlFiles(SITE_ROOT);

  for (const file of htmlFiles) {
    let html = await fs.readFile(file, "utf8");
    html = rewriteBrandAssets(html);
    html = rewriteBrandingAndContacts(html);
    html = rewriteFormHandlers(html);
    html = rewriteKnownExternalStyles(html, file);
    html = await rewriteInternalAbsoluteUrls(html, file);
    html = await rewriteHostedAssetUrls(html, file);
    html = injectFallbackScript(html, relativeFallbackPath(file));
    await fs.writeFile(file, html);
  }

  console.log(`Post-processed ${htmlFiles.length} HTML files.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
