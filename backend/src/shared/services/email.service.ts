// import nodemailer from 'nodemailer';
// import { config } from '../config';

class EmailService {
  //   private transporter: nodemailer.Transporter;

  constructor() {
    // this.transporter = nodemailer.createTransport({
    //   host: config.email.host,
    //   port: config.email.port,
    //   secure: config.email.secure,
    //   auth: {
    //     user: config.email.user,
    //     pass: config.email.password,
    //   },
    // });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    console.log('email', email);
    console.log('token', token);
    // const verificationUrl = `${config.app.url}/api/auth/verify-email/${token}`;
    // await this.transporter.sendMail({
    //   from: config.email.from,
    //   to: email,
    //   subject: 'Verify Your Email',
    //   html: `
    //     <h1>Email Verification</h1>
    //     <p>Please click the link below to verify your email address. This link will expire in 24 hours.</p>
    //     <a href="${verificationUrl}">Verify Email</a>
    //   `,
    // });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    console.log('email', email);
    console.log('token', token);
    // const resetUrl = `${config.app.url}/api/auth/reset-password/${token}`;
    // await this.transporter.sendMail({
    //   from: config.email.from,
    //   to: email,
    //   subject: 'Password Reset Request',
    //   html: `
    //     <h1>Password Reset</h1>
    //     <p>Please click the link below to reset your password. This link will expire in 30 minutes.</p>
    //     <a href="${resetUrl}">Reset Password</a>
    //   `,
    // });
  }
}

export const emailService = new EmailService();
