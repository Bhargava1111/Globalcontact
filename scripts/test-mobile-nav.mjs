import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = 4175;
const baseUrl = `http://127.0.0.1:${port}/`;

const server = spawn("node", ["server.mjs"], {
  cwd: projectRoot,
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"],
  shell: process.platform === "win32",
});

async function waitForServer() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) {
        return;
      }
    } catch {
      // retry
    }
    await delay(500);
  }
  throw new Error("Server did not start in time.");
}

try {
  await waitForServer();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  await page.goto(baseUrl, { waitUntil: "networkidle" });

  await page.evaluate(() => {
    const popup = document.getElementById("enquiryPopup");
    if (popup) {
      popup.style.display = "none";
    }
  });

  const toggle = page.locator("#header-nav-toggle");
  await toggle.waitFor({ state: "visible", timeout: 10000 });

  const overlay = page.locator("#mobile-nav-overlay");
  await overlay.waitFor({ state: "attached", timeout: 10000 });

  const closedClass = await overlay.evaluate((node) => node.classList.contains("is-open"));
  if (closedClass) {
    throw new Error("Mobile nav overlay should start closed.");
  }

  await toggle.click();
  await page.waitForFunction(() => {
    const node = document.getElementById("mobile-nav-overlay");
    return node && node.classList.contains("is-open");
  });

  const menuVisible = await page.locator("#mobile-nav-panel a", { hasText: "Home" }).isVisible();
  if (!menuVisible) {
    throw new Error("Mobile menu links did not appear after opening.");
  }

  await toggle.click();
  await page.waitForFunction(() => {
    const node = document.getElementById("mobile-nav-overlay");
    return node && !node.classList.contains("is-open");
  });

  await browser.close();
  console.log("PASS: mobile navigation opens and closes on mobile viewport.");
} finally {
  server.kill("SIGTERM");
}
