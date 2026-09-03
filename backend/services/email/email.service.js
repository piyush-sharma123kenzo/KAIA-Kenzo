/**
 * KAIA Technologies — Centralized Transactional Email Service
 * 
 * Responsibilities:
 *  - SMTP & Resend API connection management
 *  - Transactional email dispatch
 *  - Fail-safe fallback logging in local development
 */

import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { buildOtpHtml } from './templates/authEmail.template.js';

dotenv.config({ path: '../.env' });
dotenv.config();

const isProduction = () => process.env.NODE_ENV === 'production';

/**
 * Create a Nodemailer SMTP transporter using configured environment variables.
 * @returns {object|null}
 */
const createTransporter = () => {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);
  const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : null;
  const pass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : null;

  if (!user || !pass) return null;

  // Gmail preset optimized for cloud containers
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
    secure: port === 465,
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
 * Resolve formatted RFC 5322 From address.
 * @returns {string}
 */
const getFromAddress = () => {
  let from = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@kaia.tech';
  if (!from.includes('<')) {
    from = `"KAIA Technologies" <${from}>`;
  }
  return from;
};

/**
 * Send an arbitrary email message.
 * @param {object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML message body
 * @param {string} [options.text] - Plaintext fallback
 * @returns {Promise<{ success: boolean, provider?: string, messageId?: string }>}
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  // 1. Try Resend HTTPS API if key exists
  const resendApiKey = process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim() : null;
  if (resendApiKey) {
    try {
      const fromEmail = process.env.RESEND_FROM || getFromAddress();
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: fromEmail, to: [to], subject, html, text }),
      });
      const resData = await res.json();
      if (res.ok && resData.id) {
        return { success: true, provider: 'resend', messageId: resData.id };
      }
    } catch (apiErr) {
      console.error('[KAIA Email] Resend HTTP dispatch failed:', apiErr.message);
    }
  }

  // 2. SMTP Transporter
  const transporter = createTransporter();
  const fromAddress = getFromAddress();

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject,
        html,
        text,
      });
      return { success: true, provider: 'smtp', messageId: info.messageId };
    } catch (err) {
      console.error(`[KAIA Email] ❌ SMTP delivery failed for ${to}: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  // 3. Fallback for unconfigured local development
  return { success: true, provider: 'dev-console' };
};

/**
 * Send OTP Verification or Password Reset email.
 * @param {string} toEmail - Recipient email address
 * @param {string} rawOtp - 6-digit plain text code
 * @param {string} purpose - 'SIGNUP_VERIFICATION' | 'PASSWORD_RESET'
 * @returns {Promise<{ success: boolean, rawOtp?: string }>}
 */
export const sendOtpEmail = async (toEmail, rawOtp, purpose) => {
  const { subject, html } = buildOtpHtml(rawOtp, purpose);
  const result = await sendEmail({ to: toEmail, subject, html });

  if (!result.success) {
    return {
      success: false,
      error: result.error || 'Email delivery failed.',
      rawOtp,
    };
  }

  if (!isProduction()) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`[KAIA Email Log] Verification Code for ${toEmail}:`);
    console.log(`  ➜  OTP Code: ${rawOtp}   |  Purpose: ${purpose}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  return {
    success: true,
    rawOtp,
  };
};

export default {
  sendEmail,
  sendOtpEmail,
};
