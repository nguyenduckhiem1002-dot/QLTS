import nodemailer from "nodemailer";

function smtpPort() {
  const port = Number(process.env.SMTP_PORT ?? "587");
  return Number.isFinite(port) ? port : 587;
}

export function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST?.trim() && process.env.SMTP_FROM?.trim());
}

function createTransporter() {
  if (!isSmtpConfigured()) {
    throw new Error("SMTP is not configured.");
  }

  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS ?? "";

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST?.trim(),
    port: smtpPort(),
    secure: process.env.SMTP_SECURE?.trim().toLowerCase() === "true",
    auth: user ? { user, pass } : undefined,
  });
}

function appBaseUrl() {
  return (process.env.APP_BASE_URL?.trim() || "http://localhost:3000").replace(/\/$/, "");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function sendMail(to: string, subject: string, html: string, text: string) {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    html,
    text,
  });
}

export async function sendInvitationEmail(input: {
  email: string;
  name: string;
  token: string;
}) {
  const activationUrl = `${appBaseUrl()}/activate?token=${encodeURIComponent(input.token)}`;
  const safeName = escapeHtml(input.name);

  await sendMail(
    input.email,
    "Kích hoạt tài khoản Casla Assets",
    `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#243B74">
      <img src="${appBaseUrl()}/casla-logo-compact.svg" alt="Casla" width="160" style="margin-bottom:24px"/>
      <h2>Xin chào ${safeName},</h2>
      <p>Bạn đã được cấp quyền truy cập hệ thống quản lý tài sản nội bộ Casla Assets.</p>
      <p><a href="${activationUrl}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#243B74;color:white;text-decoration:none">Kích hoạt tài khoản</a></p>
      <p>Liên kết có hiệu lực trong 24 giờ. Nếu bạn không yêu cầu tài khoản này, hãy liên hệ quản trị viên.</p>
    </div>`,
    `Xin chào ${input.name}. Kích hoạt tài khoản Casla Assets tại: ${activationUrl}. Liên kết có hiệu lực trong 24 giờ.`,
  );
}

export async function sendAccountCreatedEmail(input: {
  email: string;
  name: string;
}) {
  const loginUrl = `${appBaseUrl()}/login`;

  await sendMail(
    input.email,
    "Tài khoản Casla Assets đã được tạo",
    `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#243B74">
      <img src="${appBaseUrl()}/casla-logo-compact.svg" alt="Casla" width="160" style="margin-bottom:24px"/>
      <h2>Xin chào ${escapeHtml(input.name)},</h2>
      <p>Quản trị viên đã tạo tài khoản Casla Assets cho bạn.</p>
      <p>Đăng nhập bằng email của bạn và mật khẩu tạm thời do quản trị viên cung cấp riêng.</p>
      <p><a href="${loginUrl}">Mở Casla Assets</a></p>
    </div>`,
    `Tài khoản Casla Assets của bạn đã được tạo. Đăng nhập tại ${loginUrl}. Mật khẩu tạm thời được quản trị viên cung cấp riêng.`,
  );
}

export async function sendSmtpTestEmail(email: string) {
  await sendMail(
    email,
    "Casla Assets - SMTP test",
    `<p>SMTP của <strong>Casla Assets</strong> đang hoạt động.</p>`,
    "SMTP của Casla Assets đang hoạt động.",
  );
}
