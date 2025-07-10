/* eslint-disable @typescript-eslint/no-explicit-any */
import { Resend } from "resend";
import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v1";

export interface EmailTemplateData {
  [key: string]: string | number | boolean | undefined;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  htmlContent?: string;
  textContent?: string;
  templateData?: EmailTemplateData;
  from?: string;
  replyTo?: string;
  priority?: "high" | "normal" | "low";
  emailType?: "verification" | "weekly_update" | "announcement" | "system";
}

export interface EmailLog {
  id?: string;
  to: string | string[];
  subject: string;
  template?: string;
  status: "pending" | "sent" | "failed" | "bounced";
  sentAt?: Date;
  failedAt?: Date;
  errorMessage?: string;
  resendId?: string;
  userId?: string;
  emailType: "verification" | "weekly_update" | "announcement" | "system";
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export class EmailService {
  private static resend: Resend;
  private static defaultFrom = "LinkedGoals <noreply@linkedgoals.app>";

  static initialize(apiKey: string) {
    this.resend = new Resend(apiKey);
    logger.info("📧 EmailService initialized with Resend");
  }

  static async sendEmail(
    options: EmailOptions
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const db = getFirestore(); // Get instance when needed

      // Validate required options
      if (!options.to || !options.subject) {
        throw new Error("Missing required email options: to, subject");
      }

      if (!options.htmlContent && !options.template) {
        throw new Error("Either htmlContent or template must be provided");
      }

      // Prepare email content
      let htmlContent = options.htmlContent;
      let textContent = options.textContent;

      if (options.template && options.templateData) {
        const templateResult = await this.renderTemplate(
          options.template,
          options.templateData
        );
        htmlContent = templateResult.html;
        textContent = templateResult.text;
      }

      // Create email log entry
      const emailLog: EmailLog = {
        to: options.to,
        subject: options.subject,
        template: options.template,
        status: "pending",
        emailType:
          options.emailType ||
          this.determineEmailType(options.template || "system"),
        createdAt: new Date(),
        metadata: options.templateData,
      };

      const logRef = await db.collection("emailLogs").add(emailLog);
      logger.info(`📧 Email log created: ${logRef.id}`);

      // Prepare email payload for Resend
      const emailPayload: any = {
        from: options.from || this.defaultFrom,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        text: textContent || "Please view this email in HTML format.",
        headers: {
          "X-Priority":
            options.priority === "high"
              ? "1"
              : options.priority === "low"
                ? "5"
                : "3",
        },
      };

      if (htmlContent) {
        emailPayload.html = htmlContent;
      }
      if (options.replyTo) {
        emailPayload.replyTo = options.replyTo;
      }

      // Send email via Resend
      const sendResult = await this.resend.emails.send(emailPayload);

      if (sendResult.error) {
        throw new Error(`Resend API error: ${sendResult.error.message}`);
      }

      // Update log with success
      await logRef.update({
        status: "sent",
        sentAt: new Date(),
        resendId: sendResult.data?.id,
      });

      logger.info(`✅ Email sent successfully: ${sendResult.data?.id}`);
      return { success: true, messageId: sendResult.data?.id };
    } catch (error: any) {
      logger.error("❌ Email sending failed:", error);

      // Update log with failure if possible
      try {
        const db = getFirestore();
        const logs = await db
          .collection("emailLogs")
          .where("to", "==", options.to)
          .where("subject", "==", options.subject)
          .where("status", "==", "pending")
          .orderBy("createdAt", "desc")
          .limit(1)
          .get();

        if (!logs.empty) {
          await logs.docs[0].ref.update({
            status: "failed",
            failedAt: new Date(),
            errorMessage: error.message,
          });
        }
      } catch (logError) {
        logger.error("Failed to update email log:", logError);
      }

      return { success: false, error: error.message };
    }
  }

  private static determineEmailType(template: string): EmailLog["emailType"] {
    if (template.includes("verification") || template.includes("verify")) {
      return "verification";
    }
    if (template.includes("weekly") || template.includes("update")) {
      return "weekly_update";
    }
    if (template.includes("announcement")) {
      return "announcement";
    }
    return "system";
  }

  private static async renderTemplate(
    templateName: string,
    data: EmailTemplateData
  ): Promise<{ html: string; text: string }> {
    try {
      const db = getFirestore();

      // Get template from Firestore
      const templateDoc = await db
        .collection("emailTemplates")
        .doc(templateName)
        .get();

      if (!templateDoc.exists) {
        throw new Error(`Email template not found: ${templateName}`);
      }

      const template = templateDoc.data();
      if (!template) {
        throw new Error(`Email template data is empty: ${templateName}`);
      }

      // Simple template variable replacement
      let html = template.htmlContent || "";
      let text = template.textContent || "";

      // Replace variables in format {{variableName}}
      for (const [key, value] of Object.entries(data)) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
        html = html.replace(regex, String(value));
        text = text.replace(regex, String(value));
      }

      return { html, text };
    } catch (error) {
      logger.error(`Failed to render template ${templateName}:`, error);
      throw error;
    }
  }

  // Email verification methods
  static async sendVerificationEmail(
    email: string,
    verificationToken: string,
    userName?: string
  ): Promise<{ success: boolean; error?: string }> {
    const verificationUrl = `https://app.linkedgoals.app/verify-email?token=${verificationToken}`;

    return this.sendEmail({
      to: email,
      subject: "Verify your email address - LinkedGoals",
      template: "email_verification",
      templateData: {
        userName: userName || email.split("@")[0],
        verificationUrl,
        appName: "LinkedGoals",
        supportEmail: "support@linkedgoals.app",
      },
      emailType: "verification",
    });
  }

  // Weekly update methods
  static async sendWeeklyUpdate(
    email: string,
    userData: any
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      to: email,
      subject: `Your weekly goal progress - ${userData.firstName}`,
      template: "weekly_update",
      templateData: {
        firstName: userData.firstName,
        goalsCompleted: userData.goalsCompleted || 0,
        goalsInProgress: userData.goalsInProgress || 0,
        upcomingDeadlines: userData.upcomingDeadlines || [],
        motivationalQuote: userData.motivationalQuote,
        dashboardUrl: "https://app.linkedgoals.app/dashboard",
        unsubscribeUrl: `https://app.linkedgoals.app/unsubscribe?token=${userData.unsubscribeToken}`,
      },
      emailType: "weekly_update",
    });
  }

  // System notification methods
  static async sendWelcomeEmail(
    email: string,
    userName: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      to: email,
      subject: "Welcome to LinkedGoals! 🎯",
      template: "welcome",
      templateData: {
        userName,
        dashboardUrl: "https://app.linkedgoals.app/dashboard",
        helpUrl: "https://app.linkedgoals.app/help",
        supportEmail: "support@linkedgoals.app",
      },
      emailType: "system",
    });
  }

  // Admin announcement methods
  static async sendAnnouncement(
    emails: string[],
    subject: string,
    content: string,
    adminName: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      to: emails,
      subject: `LinkedGoals Update: ${subject}`,
      template: "announcement",
      templateData: {
        subject,
        content,
        adminName,
        unsubscribeUrl: "https://app.linkedgoals.app/unsubscribe",
      },
      emailType: "announcement",
    });
  }

  // Utility methods
  static async getEmailStats(days: number = 30): Promise<any> {
    const db = getFirestore();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await db
      .collection("emailLogs")
      .where("createdAt", ">=", startDate)
      .get();

    const stats = {
      total: logs.size,
      sent: 0,
      failed: 0,
      pending: 0,
      byType: {} as any,
    };

    logs.forEach((doc) => {
      const log = doc.data();
      const status = log.status as "sent" | "failed" | "pending";
      if (status === "sent" || status === "failed" || status === "pending") {
        stats[status]++;
      }

      if (!stats.byType[log.emailType]) {
        stats.byType[log.emailType] = {
          total: 0,
          sent: 0,
          failed: 0,
          pending: 0,
        };
      }
      stats.byType[log.emailType].total++;
      if (status === "sent" || status === "failed" || status === "pending") {
        stats.byType[log.emailType][status]++;
      }
    });

    return stats;
  }

  static async createEmailTemplate(
    templateName: string,
    htmlContent: string,
    textContent: string
  ): Promise<void> {
    const db = getFirestore();
    await db.collection("emailTemplates").doc(templateName).set({
      htmlContent,
      textContent,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    logger.info(`📧 Email template created: ${templateName}`);
  }
}
