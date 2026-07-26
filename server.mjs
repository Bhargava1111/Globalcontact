import "dotenv/config";
import express from "express";
import nodemailer from "nodemailer";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

const port = Number.parseInt(process.env.PORT || "4173", 10);
const siteRoot = path.join(__dirname, "site");
const siteName = process.env.SITE_NAME || "Global Contact Hub";
const senderEmail = process.env.SMTP_USER || "info@globalcontacthub.com";
const recipients = (process.env.CONTACT_RECIPIENTS ||
  "info@globalcontacthub.com,robert.h@globalcontacthub.com")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtpout.secureserver.net",
  port: Number.parseInt(process.env.SMTP_PORT || "465", 10),
  secure: (process.env.SMTP_SECURE || "true").toLowerCase() === "true",
  auth: {
    user: senderEmail,
    pass: process.env.SMTP_PASS || "",
  },
});

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

function normalizeFieldKey(value) {
  return String(value || "")
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^./, (char) => char.toUpperCase());
}

function collectFields(body) {
  const rawFields =
    body && typeof body.fields === "object" && body.fields !== null ? body.fields : body;
  const fields = [];

  for (const [key, value] of Object.entries(rawFields || {})) {
    const trimmedValue = String(value ?? "").trim();
    if (!trimmedValue) {
      continue;
    }
    fields.push({
      key: normalizeFieldKey(key),
      value: trimmedValue,
    });
  }

  return fields;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmailContent(payloadFields, pageTitle, pageUrl) {
  const textLines = [
    `New enquiry from ${siteName}`,
    "",
    `Page title: ${pageTitle}`,
    `Page URL: ${pageUrl}`,
    "",
    "Submitted fields:",
    ...payloadFields.map((field) => `${field.key}: ${field.value}`),
  ];

  const htmlRows = payloadFields
    .map(
      (field) =>
        `<tr><td style="padding:8px 12px;border:1px solid #dbe2ea;font-weight:700;">${escapeHtml(field.key)}</td><td style="padding:8px 12px;border:1px solid #dbe2ea;">${escapeHtml(field.value)}</td></tr>`,
    )
    .join("");

  const html = `
    <div style="font-family:Arial,sans-serif;color:#222;">
      <h2 style="margin-bottom:8px;">New enquiry from ${escapeHtml(siteName)}</h2>
      <p style="margin:4px 0;"><strong>Page title:</strong> ${escapeHtml(pageTitle)}</p>
      <p style="margin:4px 0 16px;"><strong>Page URL:</strong> ${escapeHtml(pageUrl)}</p>
      <table style="border-collapse:collapse;width:100%;max-width:720px;">
        <tbody>${htmlRows}</tbody>
      </table>
    </div>
  `;

  return {
    text: textLines.join("\n"),
    html,
  };
}

app.post("/api/contact", async (req, res) => {
  const pageTitle = String(req.body.pageTitle || `${siteName} enquiry`).trim();
  const pageUrl = String(req.body.pageUrl || "").trim();
  const payloadFields = collectFields(req.body);

  if (!payloadFields.length) {
    res.status(400).json({ ok: false, error: "No form data provided." });
    return;
  }

  if (!process.env.SMTP_PASS) {
    res.status(500).json({ ok: false, error: "SMTP password is not configured." });
    return;
  }

  const replyToField = payloadFields.find((field) => field.key.toLowerCase() === "Email");
  const subjectField = payloadFields.find((field) => field.key.toLowerCase() === "Subject");
  const emailContent = buildEmailContent(payloadFields, pageTitle, pageUrl);

  try {
    await transporter.sendMail({
      from: `${siteName} <${senderEmail}>`,
      to: recipients,
      replyTo: replyToField ? replyToField.value : undefined,
      subject: subjectField ? `${siteName}: ${subjectField.value}` : `${siteName} website enquiry`,
      text: emailContent.text,
      html: emailContent.html,
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("Failed to send contact form email:", error);
    res.status(500).json({ ok: false, error: "Failed to send email." });
  }
});

app.use(express.static(siteRoot));

app.use(async (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    next();
    return;
  }

  const normalizedPath = req.path.replace(/^\/+/, "");
  const candidates = [
    path.join(siteRoot, normalizedPath),
    path.join(siteRoot, normalizedPath, "index.html"),
  ];

  for (const candidate of candidates) {
    try {
      const stats = await fs.stat(candidate);
      if (stats.isFile()) {
        res.sendFile(candidate);
        return;
      }
    } catch {
      // Continue to the next candidate.
    }
  }

  next();
});

app.use((req, res) => {
  res.status(404).send("Not found");
});

app.listen(port, () => {
  console.log(`${siteName} server running at http://127.0.0.1:${port}/`);
  transporter.verify().then(
    () => {
      console.log("SMTP connection verified.");
    },
    (error) => {
      console.warn("SMTP verification failed:", error.message);
    },
  );
});
