import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const testGmailService = async () => {
  try {
    const user = (process.env.EMAIL_USER || 'piyush.sharma@kenzoinfosystems.com').trim();
    const pass = (process.env.EMAIL_PASS || 'zjpw nsvb jgwf pxfw').replace(/\s+/g, '');

    console.log(`Testing nodemailer with service: 'gmail' and user: ${user}...`);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
      connectionTimeout: 10000,
    });

    const verify = await transporter.verify();
    console.log('✓ Gmail Service verified successfully:', verify);

    const info = await transporter.sendMail({
      from: `"KAIA Technologies" <${user}>`,
      to: 'piyushdeg9@gmail.com',
      subject: 'KAIA Technologies — Live Verification Test',
      html: '<h1>KAIA Live Email System</h1><p>Your OTP email delivery is working perfectly!</p>',
    });

    console.log('✓ Test Email Sent Successfully! Message ID:', info.messageId);
    process.exit(0);
  } catch (err) {
    console.error('✗ SMTP Error:', err);
    process.exit(1);
  }
};

testGmailService();
