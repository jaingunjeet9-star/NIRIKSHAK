import nodemailer from 'nodemailer';

export async function sendPasswordResetCode(email: string, code: string): Promise<boolean> {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return false;
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
  });
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: 'NIRIKSHAK - Password Reset Verification Code',
    text: `Your verification code for resetting your NIRIKSHAK account password is: ${code}\n\nThis code expires in 10 minutes and can be used only once.`,
  });
  return true;
}