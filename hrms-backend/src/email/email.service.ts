// hrms-backend/src/email/email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer'; // In a real app, configure this.

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter;

  constructor() {
    // --- IMPORTANT: For production, configure a real SMTP transporter ---
    // Example with Mailtrap (for development) or a real SMTP server
    // This is a placeholder and won't actually send emails without configuration.
    if (process.env.NODE_ENV !== 'production') {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email', // Example for Ethereal, replace with your SMTP host
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: 'your_ethereal_email@ethereal.email', // generated ethereal user
          pass: 'your_ethereal_password', // generated ethereal password
        },
      });
      this.logger.warn('Email service is using a mock/test transporter. Configure for production!');
    } else {
      // Configure your production SMTP transporter here
      this.transporter = nodemailer.createTransport({
         // Example: Using Gmail SMTP (less secure apps need to be enabled)
         // service: 'gmail',
         // auth: {
         //   user: process.env.EMAIL_USER,
         //   pass: process.env.EMAIL_PASS,
         // },
         // OR: AWS SES, SendGrid, etc.
      });
    }
  }

  async sendEmployeeWelcomeEmail(email: string, firstName: string, tempPassword?: string, loginUrl: string = process.env.FRONTEND_URL || 'http://localhost:3001'): Promise<void> {
    const subject = `Welcome to ${process.env.APP_NAME || 'HRMS'}! Your Account Details`;

    // Changed from 'const' to 'let' to allow modification
    let text = `Dear ${firstName},\n\n`
               + `Welcome to our company's HR Management System! Your account has been created.\n\n`
               + `Please use the following details to log in and complete your profile:\n`
               + `Email: ${email}\n`;

    // Changed from 'const' to 'let' to allow modification
    let htmlContent = `<p>Dear <strong>${firstName}</strong>,</p>`
                    + `<p>Welcome to our company's HR Management System! Your account has been created.</p>`
                    + `<p>Please use the following details to log in and complete your profile:</p>`
                    + `<p><strong>Email:</strong> ${email}</p>`;

    if (tempPassword) {
        text += `Temporary Password: ${tempPassword}\n\n`
              + `Please log in using this temporary password and change it immediately.\n`;
        htmlContent += `<p><strong>Temporary Password:</strong> ${tempPassword}</p>`
                     + `<p>Please log in using this temporary password and change it immediately.</p>`;
    } else {
        text += `You can set up your password by visiting the login page.\n`;
        htmlContent += `<p>You can set up your password by visiting the login page.</p>`;
    }

    text += `Login URL: ${loginUrl}\n\n`
          + `Best regards,\nYour HR Team`;

    htmlContent += `<p>Click here to log in: <a href="<span class="math-inline">\{loginUrl\}"\></span>{loginUrl}</a></p>`
                 + `<p>Best regards,<br>Your HR Team</p>`;


    const mailOptions = {
      from: process.env.EMAIL_FROM || 'no-reply@hrms.com',
      to: email,
      subject: subject,
      text: text,
      html: htmlContent,
    };

    try {
      if (process.env.NODE_ENV !== 'production') {
        const info = await this.transporter.sendMail(mailOptions);
        this.logger.log(`Mock Email sent to ${email}: ${info.messageId}`);
        this.logger.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      } else {
        // In production, log success or actual message ID from your configured transporter
        await this.transporter.sendMail(mailOptions);
        this.logger.log(`Production Email sent to ${email}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send email to ${email}: ${error.message}`, error.stack);
      // In a real application, you might want to retry or queue this email
    }
  }
}