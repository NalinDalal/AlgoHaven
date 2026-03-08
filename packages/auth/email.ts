import nodemailer from 'nodemailer';
export async function sendMagicLinkEmail({ to, url }: { to: string; url: string }) {
  // SMTP setup using Nodemailer
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: 'noreply@algohaven.com',
    to,
    subject: 'Your AlgoHaven login link',
    html: `<p>Click <a href="${url}">here</a> to sign in. Link expires in 15 minutes.</p>`,
  });

  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV] Magic link for ${to}: ${url}`);
    console.log('Email sent:', info.messageId);
  }
}