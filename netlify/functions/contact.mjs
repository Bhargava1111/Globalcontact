import nodemailer from "nodemailer";

const siteName = process.env.SITE_NAME || "Global Contact Hub";
const senderEmail = process.env.SMTP_USER || "info@globalcontacthub.com";
const recipients = (process.env.CONTACT_RECIPIENTS ||
  "info@globalcontacthub.com,robert.h@globalcontacthub.com")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  };
}

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

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { ok: false, error: "Method not allowed." });
  }

  if (!process.env.SMTP_PASS) {
    return jsonResponse(500, { ok: false, error: "SMTP password is not configured." });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return jsonResponse(400, { ok: false, error: "Invalid JSON payload." });
  }

  const pageTitle = String(body.pageTitle || `${siteName} enquiry`).trim();
  const pageUrl = String(body.pageUrl || "").trim();
  const payloadFields = collectFields(body);

  if (!payloadFields.length) {
    return jsonResponse(400, { ok: false, error: "No form data provided." });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtpout.secureserver.net",
    port: Number.parseInt(process.env.SMTP_PORT || "465", 10),
    secure: (process.env.SMTP_SECURE || "true").toLowerCase() === "true",
    auth: {
      user: senderEmail,
      pass: process.env.SMTP_PASS,
    },
  });

  const replyToField = payloadFields.find((field) => field.key.toLowerCase() === "email");
  const subjectField = payloadFields.find((field) => field.key.toLowerCase() === "subject");
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

    return jsonResponse(200, { ok: true });
  } catch (error) {
    console.error("Netlify contact function failed:", error);
    return jsonResponse(500, { ok: false, error: "Failed to send email." });
  }
}
