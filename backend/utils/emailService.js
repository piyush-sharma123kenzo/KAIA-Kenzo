/**
 * KAIA Technologies — Transactional Email Service
 * Uses Nodemailer with any SMTP provider (Gmail, SendGrid, AWS SES, etc.)
 *
 * CONFIGURATION (all via environment variables — never hardcode):
 *   EMAIL_HOST     SMTP host (e.g. smtp.gmail.com, smtp.sendgrid.net)
 *   EMAIL_PORT     SMTP port (465 for SSL, 587 for STARTTLS)
 *   EMAIL_USER     SMTP username / API key name (e.g. "apikey" for SendGrid)
 *   EMAIL_PASS     SMTP password or API key value
 *   EMAIL_FROM     Sender address (e.g. noreply@kaia.tech)
 */

import nodemailer from 'nodemailer';

const isProduction = () => process.env.NODE_ENV === 'production';

/**
 * Build a Nodemailer transporter from environment variables.
 * Returns null if credentials are missing (dev-only fallback path).
 */
const createTransporter = () => {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);
  const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : null;
  const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : null;

  if (!user || !pass) return null;

  // Use Nodemailer's native Gmail service preset for highest reliability in cloud environments
  if (host === 'smtp.gmail.com' || host === 'gmail' || !host) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // SSL for 465, STARTTLS for 587
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: isProduction(),
    },
  });
};

/**
 * Build the HTML email template for OTP delivery.
 */
const buildOtpHtml = (rawOtp, purpose) => {
  const year = new Date().getFullYear();

  const isReset = purpose === 'PASSWORD_RESET';
  const subject = isReset
    ? 'KAIA Technologies — Password Reset Code'
    : 'KAIA Technologies — Your Email Verification Code';
  const heading = isReset ? 'Reset Your Account Password' : 'Verify Your Email Address';
  const message = isReset
    ? 'A password reset was requested for your KAIA Technologies account. Use the 6-digit code below to proceed. If you did not request this, you can safely ignore this email.'
    : 'Use the 6-digit verification code below to complete your KAIA Technologies account registration. Do not share this code with anyone.';

  return {
    subject,
    html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background-color: #f0f2f5;
        padding: 32px 16px;
        -webkit-font-smoothing: antialiased;
      }
      .wrapper { max-width: 520px; margin: 0 auto; }
      .card {
        background: #ffffff;
        border-radius: 6px;
        overflow: hidden;
        box-shadow: 0 2px 16px rgba(0,0,0,0.10);
      }
      /* Header */
      .header {
        background: linear-gradient(135deg, #0f1111 0%, #1a2332 100%);
        padding: 28px 32px;
        text-align: center;
      }
      .logo-text {
        font-size: 26px;
        font-weight: 900;
        letter-spacing: -1px;
        color: #ffffff;
        line-height: 1;
      }
      .logo-dot { color: #FF9900; }
      .logo-sub {
        font-size: 9px;
        letter-spacing: 0.25em;
        color: #94a3b8;
        text-transform: uppercase;
        margin-top: 4px;
        font-weight: 500;
      }
      /* Content */
      .content { padding: 36px 32px; text-align: center; }
      .icon-wrap {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: ${isReset ? '#fff7ed' : '#f0fdf4'};
        border: 1px solid ${isReset ? '#fed7aa' : '#bbf7d0'};
        margin-bottom: 20px;
      }
      .heading {
        font-size: 20px;
        font-weight: 800;
        color: #0f172a;
        margin-bottom: 12px;
        letter-spacing: -0.3px;
      }
      .message {
        font-size: 13px;
        color: #475569;
        line-height: 1.7;
        margin-bottom: 28px;
        max-width: 380px;
        margin-left: auto;
        margin-right: auto;
      }
      /* OTP Code Box */
      .otp-label {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #64748b;
        margin-bottom: 12px;
      }
      .code-box {
        display: inline-block;
        background: #f8fafc;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        padding: 16px 32px;
        font-size: 38px;
        font-weight: 900;
        letter-spacing: 12px;
        color: #0f172a;
        font-family: 'Courier New', 'Lucida Console', monospace;
        margin-bottom: 20px;
        text-indent: 12px;
      }
      /* Timer badge */
      .timer-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: ${isReset ? '#fff7ed' : '#eff6ff'};
        border: 1px solid ${isReset ? '#fed7aa' : '#bfdbfe'};
        border-radius: 20px;
        padding: 6px 14px;
        font-size: 12px;
        font-weight: 600;
        color: ${isReset ? '#c2410c' : '#1d4ed8'};
        margin-bottom: 28px;
      }
      /* Security notice */
      .security-box {
        background: #fefce8;
        border: 1px solid #fde047;
        border-radius: 6px;
        padding: 12px 16px;
        font-size: 11px;
        color: #713f12;
        text-align: left;
        line-height: 1.6;
        margin-top: 4px;
      }
      .security-box strong { font-weight: 700; }
      /* Divider */
      .divider { height: 1px; background: #f1f5f9; margin: 28px 0; }
      /* Footer */
      .footer {
        background: #f8fafc;
        padding: 20px 32px;
        text-align: center;
        border-top: 1px solid #e2e8f0;
      }
      .footer-logo {
        font-size: 12px;
        font-weight: 800;
        color: #334155;
        letter-spacing: -0.3px;
        margin-bottom: 6px;
      }
      .footer-logo span { color: #FF9900; }
      .footer-text {
        font-size: 11px;
        color: #94a3b8;
        line-height: 1.5;
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="card">

        <!-- Header -->
        <div class="header">
          <div class="logo-text">KAIA<span class="logo-dot">.</span> TECHNOLOGIES</div>
          <div class="logo-sub">Multi-Brand Electronics Marketplace</div>
        </div>

        <!-- Content -->
        <div class="content">
          <div class="icon-wrap">
            ${isReset
              ? '<svg width="24" height="24" fill="none" stroke="#ea580c" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
              : '<svg width="24" height="24" fill="none" stroke="#16a34a" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013 6.18a2 2 0 012-2.18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L9.91 11a16 16 0 006.09 6.09l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>'
            }
          </div>

          <h1 class="heading">${heading}</h1>
          <p class="message">${message}</p>

          <div class="otp-label">Your Verification Code</div>
          <div class="code-box">${rawOtp}</div>

          <div class="timer-badge">
            ⏱&nbsp; Valid for <strong>&nbsp;5 minutes</strong>
          </div>

          <div class="security-box">
            <strong>🔒 Security Notice:</strong> KAIA Technologies will never ask for this code via phone or chat.
            This code is single-use and expires in 5 minutes. If you didn't request this, please ignore this email.
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="footer-logo">KAIA<span>.</span> TECHNOLOGIES</div>
          <div class="footer-text">
            © ${year} KAIA Technologies Pvt. Ltd. &nbsp;•&nbsp; Bengaluru, India<br />
            This is an automated transactional email — please do not reply.
          </div>
        </div>

      </div>
    </div>
  </body>
</html>`,
  };
};

/**
 * Send an OTP verification email to a recipient.
 *
 * Behaviour by environment:
 *
 *   PRODUCTION + SMTP configured:
 *     → Sends email. Throws on failure (so caller can handle/clean up).
 *
 *   PRODUCTION + SMTP NOT configured:
 *     → Throws immediately with a configuration error (never silently fails).
 *
 *   DEVELOPMENT + SMTP configured:
 *     → Sends email. On failure, logs the OTP to console as fallback (dev only).
 *
 *   DEVELOPMENT + SMTP NOT configured:
 *     → Logs OTP to console. Does NOT block the flow (dev convenience only).
 *
 * @param {string} toEmail - Recipient email address
 * @param {string} rawOtp  - Plain-text 6-digit OTP (used only in email/console, never stored)
 * @param {string} purpose - 'SIGNUP_VERIFICATION' | 'PASSWORD_RESET'
 * @throws {Error} In production if email cannot be sent
 */
export const sendOtpEmail = async (toEmail, rawOtp, purpose) => {
  const prod = isProduction();
  const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@kaia.tech';

  const { subject, html } = buildOtpHtml(rawOtp, purpose);
  const transporter = createTransporter();

  // ── Production: SMTP must be configured ───────────────────────────────────
  if (prod && !transporter) {
    throw new Error(
      '[KAIA Email] FATAL: EMAIL_HOST, EMAIL_USER, and EMAIL_PASS must be configured in production. OTP email cannot be sent.'
    );
  }

  // ── SMTP configured (any environment) ─────────────────────────────────────
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"KAIA Technologies" <${fromAddress}>`,
        to: toEmail,
        subject,
        html,
      });
      // Log delivery confirmation — does NOT expose OTP
      console.log(`[KAIA Email] ✅ OTP dispatched to ${toEmail} | MsgId: ${info.messageId} | Purpose: ${purpose}`);
      return { success: true };
    } catch (err) {
      // In production: throw so the caller can delete the stored OTP and return an error to the user
      if (prod) {
        console.error(`[KAIA Email] ❌ SMTP delivery failed for ${toEmail} (${purpose}): ${err.message}`);
        throw new Error('Email delivery failed. Please try again or contact support.');
      }

      // In development: log as dev fallback (console OTP is acceptable in dev)
      console.error(`[KAIA Email] ❌ SMTP failed for ${toEmail}: ${err.message}`);
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`[KAIA Email Dev Fallback] SMTP failed — OTP for ${toEmail}:`);
      console.log(`  ➜  Code: ${rawOtp}   |  Purpose: ${purpose}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      return { success: true, devFallback: true };
    }
  }

  // ── Development only: no SMTP configured — console fallback ───────────────
  // This branch is ONLY reachable in development (production throws above).
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`[KAIA Email Dev] No SMTP configured. OTP for ${toEmail}:`);
  console.log(`  ➜  Code: ${rawOtp}   |  Purpose: ${purpose}`);
  console.log('  ✏  Set EMAIL_HOST, EMAIL_USER, EMAIL_PASS in .env to send real emails.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  return { success: true, devFallback: true };
};
