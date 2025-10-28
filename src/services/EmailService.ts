import { Resend } from 'resend';
import { ConfigService } from '../config/ConfigService';
import Logger from '../utils/logger';

export class EmailService {
  private static instance: EmailService;
  private resend: Resend;
  private fromEmail: string;
  private frontendUrl: string;
  private logger = Logger;

  private constructor() {
    const config = ConfigService.getInstance();
    const resendConfig = config.getResendConfig();
    const appConfig = config.getAppConfig();

    this.resend = new Resend(resendConfig.apiKey);
    this.fromEmail = resendConfig.fromEmail;
    this.frontendUrl = appConfig.frontendUrl;
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Send account deletion confirmation email
   */
  public async sendAccountDeletionEmail(to: string, userName: string): Promise<void> {
    try {
      this.logger.info('Sending account deletion email', { to, userName });

      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: 'Account Deletion Confirmation - Messenger Brain',
        html: this.getAccountDeletionTemplate(userName)
      });

      this.logger.info('Account deletion email sent successfully', { to });
    } catch (error) {
      this.logger.error('Error sending account deletion email', error);
      throw new Error('Failed to send account deletion confirmation email');
    }
  }

  /**
   * Send account deletion request email with token
   */
  public async sendAccountDeletionRequestEmail(to: string, userName: string, token: string, expiresAt: Date): Promise<void> {
    try {
      this.logger.info('Sending account deletion request email', { to, userName, token });

      await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject: 'Account Deletion Request - Messenger Brain',
        html: this.getAccountDeletionRequestTemplate(userName, token, expiresAt)
      });

      this.logger.info('Account deletion request email sent successfully', { to });
    } catch (error) {
      this.logger.error('Error sending account deletion request email', error);
      throw new Error('Failed to send account deletion request email');
    }
  }

  /**
   * Account deletion request email template (with token)
   */
  private getAccountDeletionRequestTemplate(userName: string, token: string, expiresAt: Date): string {
    const expiresDate = new Date(expiresAt).toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .token-box { 
            background-color: #fff; 
            border: 3px dashed #dc3545; 
            padding: 20px; 
            margin: 25px 0; 
            text-align: center;
            border-radius: 8px;
          }
          .token { 
            font-size: 32px; 
            font-weight: bold; 
            letter-spacing: 8px; 
            color: #dc3545;
            font-family: 'Courier New', monospace;
            user-select: all;
          }
          .warning { 
            background-color: #fff3cd; 
            border-left: 4px solid #ffc107; 
            padding: 15px; 
            margin: 20px 0; 
            border-radius: 3px; 
          }
          .info-box {
            background-color: #d1ecf1;
            border-left: 4px solid #0c5460;
            padding: 15px;
            margin: 20px 0;
            border-radius: 3px;
          }
          ul { padding-left: 20px; }
          li { margin: 10px 0; }
          .button { 
            display: inline-block; 
            padding: 12px 30px; 
            background-color: #dc3545; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>  Account Deletion Request</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${userName}</strong>,</p>
            
            <p>We received a request to delete your Messenger Brain account. To confirm this action, please use the following deletion code:</p>
            
            <div class="token-box">
              <p style="margin: 0; font-size: 14px; color: #666; margin-bottom: 10px;">Your Deletion Code:</p>
              <div class="token">${token}</div>
              <p style="margin: 15px 0 0 0; font-size: 12px; color: #999;">Copy this code and paste it when confirming deletion</p>
            </div>

            <div class="info-box">
              <strong>  What you need to confirm deletion:</strong>
              <ul style="margin: 10px 0;">
                <li><strong>Deletion Code:</strong> ${token}</li>
                <li><strong>Your Password:</strong> Enter your current password</li>
                <li><strong>Confirmation Word:</strong> Type "DELETE" (all caps)</li>
              </ul>
            </div>
            
            <div class="warning">
              <strong> Important:</strong> This code expires on <strong>${expiresDate}</strong> (24 hours).
            </div>

            <p><strong>What will be deleted:</strong></p>
            <ul>
              <li>Your user account and profile</li>
              <li>All WhatsApp sessions</li>
              <li>Message history</li>
              <li>Preferences and settings</li>
              <li>Subscription information</li>
              <li>Personal access tokens</li>
            </ul>
            
            <div class="warning">
              <strong> Security Notice:</strong> If you didn't request this account deletion, please ignore this email and consider changing your password immediately.
            </div>
            
            <p style="margin-top: 30px;">If you have any questions or need assistance, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Messenger Brain. All rights reserved.</p>
            <p style="margin-top: 10px;">This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Account deletion confirmation email template (after deletion)
   */
  private getAccountDeletionTemplate(userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 5px 5px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 3px; }
          ul { padding-left: 20px; }
          li { margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Account Deleted</h1>
          </div>
          <div class="content">
            <p>Hello ${userName},</p>
            
            <p>We're sorry to see you go. Your Messenger Brain account has been successfully deleted.</p>
            
            <div class="warning">
              <strong>⚠️ Important:</strong> All your data, including WhatsApp sessions, messages, and preferences have been permanently deleted.
            </div>
            
            <p>What was deleted:</p>
            <ul>
              <li>Your user account and profile</li>
              <li>All WhatsApp sessions</li>
              <li>Message history</li>
              <li>Preferences and settings</li>
              <li>Subscription information</li>
              <li>Personal access tokens</li>
            </ul>
            
            <p>If you deleted your account by mistake or would like to return in the future, you can create a new account at any time.</p>
            
            <p>Thank you for using Messenger Brain!</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Messenger Brain. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export default EmailService.getInstance();
