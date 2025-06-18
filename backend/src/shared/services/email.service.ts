// src/shared/services/email.service.ts
import nodemailer from 'nodemailer';

import { config } from '../config';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.smtp.SMTP_USER,
        pass: config.smtp.SMTP_PASS,
      },
    });
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const verifyUrl = `${config.smtp.FRONTEND_BASE_URL}/verify-email?token=${token}`;
    const subject = 'Verify your email';

    const html = `
  <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <h2 style="color: #2d3748;">Welcome to <span style="color: #3182ce;">AthithiPro</span> 👋</h2>
      <p style="font-size: 16px; color: #4a5568;">Hi there,</p>
      <p style="font-size: 16px; color: #4a5568;">Thank you for registering! Please verify your email by clicking the button below:</p>
      <div style="text-align: center; margin: 20px 0;">
        <a href="${verifyUrl}" style="background-color: #3182ce; color: white; padding: 12px 20px; border-radius: 5px; text-decoration: none; font-size: 16px;">
          Verify Email
        </a>
      </div>
      <p style="font-size: 14px; color: #718096;">If you did not request this email, you can safely ignore it.</p>
      <hr style="margin: 30px 0;">
      <p style="font-size: 12px; color: #a0aec0;">&copy; ${new Date().getFullYear()} AthithiPro. All rights reserved.</p>
    </div>
  </div>
`;

    await this.transporter.sendMail({
      from: `"AthithiPro Team" <no-reply@athithipro.com>`,
      to,
      subject,
      html,
    });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const resetUrl = `${config.smtp.FRONTEND_BASE_URL}/reset-password?token=${token}`;
    const subject = 'Reset your password';

    const html = `
    <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px;">
      <div style="max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <h2 style="color: #2d3748;">Reset Your <span style="color: #3182ce;">AthithiPro</span> Password 🔒</h2>
        <p style="font-size: 16px; color: #4a5568;">Hi there,</p>
        <p style="font-size: 16px; color: #4a5568;">We received a request to reset your password. Click the button below to proceed:</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${resetUrl}" style="background-color: #3182ce; color: white; padding: 12px 20px; border-radius: 5px; text-decoration: none; font-size: 16px;">
            Reset Password
          </a>
        </div>
        <p style="font-size: 14px; color: #718096;">If you didn’t request a password reset, please ignore this email.</p>
        <hr style="margin: 30px 0;">
        <p style="font-size: 12px; color: #a0aec0;">&copy; ${new Date().getFullYear()} AthithiPro. All rights reserved.</p>
      </div>
    </div>
    `;

    await this.transporter.sendMail({
      from: `"AthithiPro Team" <no-reply@athithipro.com>`,
      to,
      subject,
      html,
    });
  }
}

export const emailService = new EmailService();
