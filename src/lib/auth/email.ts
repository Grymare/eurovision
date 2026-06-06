import nodemailer from "nodemailer";

export function isEmailConfigured() {
  return Boolean(process.env.EMAIL_SERVER && process.env.EMAIL_FROM);
}

export function getAppBaseUrl() {
  return (
    process.env.PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export async function sendAppEmail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  if (!isEmailConfigured()) {
    throw new Error("Email is not configured");
  }

  const transport = nodemailer.createTransport(process.env.EMAIL_SERVER!);

  await transport.sendMail({
    from: process.env.EMAIL_FROM!,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html ?? input.text,
  });
}
