import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const testEmail = async () => {
  try {
    const user = (process.env.EMAIL_USER || 'piyush.sharma@kenzoinfosystems.com').trim();
    const pass = (process.env.EMAIL_PASS || 'zjpw nsvb jgwf pxfw').replace(/\s+/g, '');
    const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.EMAIL_PORT || '587', 10);

    console.log(`Connecting to ${host}:${port} with user: ${user}...`);

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: 10000,
    });

    const verify = await transporter.verify();
    console.log('✓ SMTP Connection Verified successfully:', verify);

    process.exit(0);
  } catch (err) {
    console.error('✗ SMTP Error:', err.message);
    process.exit(1);
  }
};

testEmail();
