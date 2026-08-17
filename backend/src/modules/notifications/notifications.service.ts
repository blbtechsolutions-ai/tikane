import nodemailer from 'nodemailer';
import { config } from '../../config';
import { logger } from '../../common/utils/logger';
import { prisma } from '../../config/database';

class NotificationsService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (config.smtp.host && config.smtp.user) {
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: { user: config.smtp.user, pass: config.smtp.pass },
      });
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      logger.warn('Email transporter not configured');
      return;
    }

    try {
      await this.transporter.sendMail({
        from: config.smtp.from,
        to,
        subject,
        html,
      });
      logger.info(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      logger.error('Failed to send email:', error);
    }
  }

  async sendWelcomeEmail(userId: string, firstName: string, email: string): Promise<void> {
    await this.saveNotification(userId, 'WELCOME', 'EMAIL', {
      subject: 'Bienvenue sur Tikane! 🇭🇹',
      body: `Bonjour ${firstName}, bienvenue sur Tikane...`,
    });

    await this.sendEmail(
      email,
      'Bienvenue sur Tikane!',
      this.welcomeEmailTemplate(firstName),
    );
  }

  async sendPaymentConfirmation(
    userId: string,
    email: string,
    paymentRef: string,
    amount: number,
    planName: string,
  ): Promise<void> {
    await this.saveNotification(userId, 'PAYMENT_CONFIRMED', 'EMAIL', {
      subject: `Paiement confirmé - ${paymentRef}`,
      body: `Votre paiement de ${amount} HTG a été confirmé.`,
    });

    await this.sendEmail(
      email,
      `Paiement confirmé - ${paymentRef}`,
      this.paymentConfirmTemplate(paymentRef, amount, planName),
    );
  }

  async sendPaymentReminder(
    userId: string,
    email: string,
    firstName: string,
    dayNumber: number,
    amount: number,
    planName: string,
  ): Promise<void> {
    await this.saveNotification(userId, 'PAYMENT_REMINDER', 'EMAIL', {
      subject: `Rappel de paiement - Jour ${dayNumber}`,
      body: `Votre paiement du jour ${dayNumber} est dû.`,
    });

    await this.sendEmail(
      email,
      `Rappel: Paiement Jour ${dayNumber} - ${planName}`,
      this.reminderTemplate(firstName, dayNumber, amount, planName),
    );
  }

  async getMyNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, readAt: null, status: 'DELIVERED' } }),
    ]);

    return { data, total, unread, page, limit };
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { readAt: new Date(), status: 'READ' },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date(), status: 'READ' },
    });
  }

  private async saveNotification(
    userId: string,
    type: any,
    channel: any,
    data: { subject?: string; body: string },
  ) {
    await prisma.notification.create({
      data: {
        userId,
        type,
        channel,
        status: 'PENDING',
        subject: data.subject,
        body: data.body,
      },
    });
  }

  // ─── Email Templates ─────────────────────────────────────────

  private welcomeEmailTemplate(firstName: string): string {
    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">🇭🇹 TIKANE</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Tontine Numérique Haïtienne</p>
    </div>
    <div style="padding: 40px;">
      <h2 style="color: #333;">Bienvenue, ${firstName}!</h2>
      <p style="color: #666; line-height: 1.6;">
        Nou kontan wè w sou Tikane! Platfòm nou an pèmèt ou patisipe nan sòl ak tontine nimerik an sekirite.
      </p>
      <p style="color: #666; line-height: 1.6;">
        Votre compte a été créé avec succès. Vérifiez votre email pour activer votre compte.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${config.frontendUrl}/auth/verify-email" 
           style="background: #667eea; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Vérifier mon email
        </a>
      </div>
    </div>
    <div style="background: #f8f9fa; padding: 20px; text-align: center;">
      <p style="color: #999; font-size: 12px; margin: 0;">
        © 2024 Tikane · support@tikane.ht
      </p>
    </div>
  </div>
</body>
</html>`;
  }

  private paymentConfirmTemplate(
    ref: string,
    amount: number,
    planName: string,
  ): string {
    return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden;">
    <div style="background: #10b981; padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0;">✅ Paiement Confirmé</h1>
    </div>
    <div style="padding: 40px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px 0; color: #666;">Référence</td>
          <td style="padding: 12px 0; font-weight: bold; text-align: right;">${ref}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
          <td style="padding: 12px 0; color: #666;">Plan</td>
          <td style="padding: 12px 0; font-weight: bold; text-align: right;">${planName}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #666;">Montant</td>
          <td style="padding: 12px 0; font-weight: bold; font-size: 20px; color: #10b981; text-align: right;">
            ${amount.toLocaleString()} HTG
          </td>
        </tr>
      </table>
    </div>
  </div>
</body>
</html>`;
  }

  private reminderTemplate(
    firstName: string,
    dayNumber: number,
    amount: number,
    planName: string,
  ): string {
    return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden;">
    <div style="background: #f59e0b; padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0;">⏰ Rappel de Paiement</h1>
    </div>
    <div style="padding: 40px;">
      <p>Bonjour ${firstName},</p>
      <p>Votre paiement du <strong>Jour ${dayNumber}</strong> pour le plan <strong>${planName}</strong> est dû.</p>
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin: 20px 0;">
        <strong>Montant dû: ${amount.toLocaleString()} HTG</strong>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${config.frontendUrl}/dashboard/payments" 
           style="background: #667eea; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
          Payer maintenant
        </a>
      </div>
    </div>
  </div>
</body>
</html>`;
  }
}

export const notificationsService = new NotificationsService();
