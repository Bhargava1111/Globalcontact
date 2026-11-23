import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = 4174;
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

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

try {
  await waitForServer();

  const home = await fetch(baseUrl);
  const homeHtml = await home.text();
  assert(homeHtml.includes('/assets/img/favicon.ico?v=3'), "Homepage missing favicon.ico link");
  assert(homeHtml.includes('assets/js/main.js'), "Homepage missing main.js");

  const favicon = await fetch(`${baseUrl}assets/img/favicon.ico?v=3`);
  assert(favicon.ok, `Favicon request failed: ${favicon.status}`);
  assert((favicon.headers.get("content-type") || "").includes("image"), "Favicon is not an image");

  const mainJs = await fetch(`${baseUrl}assets/js/main.js`);
  const mainJsText = await mainJs.text();
  assert(mainJsText.includes("header-nav-toggle"), "Mobile nav toggle script missing header-nav-toggle logic");
  assert(mainJsText.includes("setMobileNavIcon"), "Mobile nav icon swap logic missing");

  console.log("PASS: favicon and mobile-nav assets are served correctly.");
} finally {
  server.kill("SIGTERM");
}
