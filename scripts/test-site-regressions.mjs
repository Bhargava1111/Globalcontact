import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = 4176;
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

  const oilPage = await fetch(`${baseUrl}Oil-and-Gas-Industry-List/`);
  const oilHtml = await oilPage.text();
  const oilMatches = [...oilHtml.matchAll(/Natural Gas Transmission Email List/g)];
  if (oilMatches.length !== 1) {
    throw new Error(`Expected 1 Natural Gas Transmission link, found ${oilMatches.length}`);
  }

  const formResponse = await fetch(`${baseUrl}api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pageTitle: "Form Health Check",
      pageUrl: baseUrl,
      fields: {
        name: "Test User",
        email: "test@example.com",
        subject: "Health check",
        message: "Please ignore this automated test.",
      },
    }),
  });
  const formPayload = await formResponse.json();
  if (!formResponse.ok || !formPayload.ok) {
    throw new Error(`Form API failed: ${JSON.stringify(formPayload)}`);
  }

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

  await page.locator("#header-nav-toggle").click();
  await page.waitForFunction(() => document.getElementById("mobile-nav-overlay")?.classList.contains("is-open"));
  await page.locator("#header-nav-toggle").click();
  await page.waitForFunction(() => !document.getElementById("mobile-nav-overlay")?.classList.contains("is-open"));

  const laptop = await browser.newPage({ viewport: { width: 1366, height: 800 } });
  await laptop.goto(baseUrl, { waitUntil: "networkidle" });
  const desktopNavVisible = await laptop.locator("#navbar > ul").isVisible();
  const toggleHidden = await laptop.locator("#header-nav-toggle").isHidden();
  if (!desktopNavVisible || !toggleHidden) {
    throw new Error("Large laptop nav should show desktop menu and hide hamburger.");
  }

  const smallLaptop = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  await smallLaptop.goto(baseUrl, { waitUntil: "networkidle" });
  await smallLaptop.evaluate(() => {
    const popup = document.getElementById("enquiryPopup");
    if (popup) {
      popup.style.display = "none";
    }
  });
  const smallLaptopToggle = smallLaptop.locator("#header-nav-toggle");
  await smallLaptopToggle.waitFor({ state: "visible" });
  await smallLaptopToggle.click();
  await smallLaptop.waitForFunction(() => document.getElementById("mobile-nav-overlay")?.classList.contains("is-open"));
  await smallLaptopToggle.click();
  await smallLaptop.waitForFunction(() => !document.getElementById("mobile-nav-overlay")?.classList.contains("is-open"));

  await browser.close();
  console.log("PASS: duplicates cleaned, forms accept submissions, and nav works on mobile + laptop.");
} finally {
  server.kill("SIGTERM");
}
