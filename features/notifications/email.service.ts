import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { queryOne } from "@/lib/turso/client";

/**
 * E-mail side channel (Historia 13.3).
 *
 * Prepared architecture: the transport interface allows plugging a real
 * SMTP/provider client (Resend, SES, Nodemailer...) without touching the
 * callers.
 *
 * When SMTP_HOST is defined in the environment, SmtpTransport is activated
 * using Nodemailer. When SMTP_HOST is absent, it falls back to ConsoleTransport (log).
 */

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
  from?: string;
}

export interface EmailTransport {
  readonly name: string;
  send(message: EmailMessage): Promise<void>;
  verify?(): Promise<boolean>;
}

export class ConsoleTransport implements EmailTransport {
  readonly name = "console";

  async send(message: EmailMessage): Promise<void> {
    console.info(
      `[email:console] To: ${message.to} — Subject: ${message.subject}\nText: ${message.text}`,
    );
  }

  async verify(): Promise<boolean> {
    return true;
  }
}

export class SmtpTransport implements EmailTransport {
  readonly name = "smtp";
  private transporter: Transporter;
  private defaultFrom: string;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure =
      process.env.SMTP_SECURE === "true" ||
      process.env.SMTP_SECURE === "1" ||
      port === 465;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
    const appName = process.env.NEXT_PUBLIC_APP_NAME || "AdmiPy";

    this.defaultFrom =
      process.env.SMTP_FROM ||
      process.env.EMAIL_FROM ||
      (user ? `${appName} <${user}>` : `${appName} <noreply@admipy.local>`);

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth:
        user && pass
          ? {
              user,
              pass,
            }
          : undefined,
    });
  }

  async send(message: EmailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: message.from || this.defaultFrom,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    console.info(`[email:smtp] Sent to ${message.to} — ${message.subject}`);
  }

  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error("[email:smtp] Verification failed:", error);
      return false;
    }
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isQuietHours(now: Date, start: string | null, end: string | null): boolean {
  if (!start || !end) return false;
  const minutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);
  const startMinutes = startH * 60 + (startM || 0);
  const endMinutes = endH * 60 + (endM || 0);
  if (startMinutes === endMinutes) return false;
  return startMinutes < endMinutes
    ? minutes >= startMinutes && minutes < endMinutes
    : minutes >= startMinutes || minutes < endMinutes;
}

export class EmailService {
  private static cachedTransport: EmailTransport | null = null;

  static get transport(): EmailTransport {
    if (!this.cachedTransport) {
      const host = process.env.SMTP_HOST?.trim();
      if (host) {
        this.cachedTransport = new SmtpTransport();
      } else {
        this.cachedTransport = new ConsoleTransport();
      }
    }
    return this.cachedTransport;
  }

  /**
   * Override or reset the active transport (useful for testing or dynamic reconfiguration).
   */
  static setTransport(transport: EmailTransport | null): void {
    this.cachedTransport = transport;
  }

  /**
   * Verify connectivity of the active transport if supported.
   */
  static async verifyConnection(): Promise<boolean> {
    if (this.transport.verify) {
      return await this.transport.verify();
    }
    return true;
  }

  static async send(message: EmailMessage): Promise<boolean> {
    try {
      await this.transport.send(message);
      return true;
    } catch (error) {
      console.error("[email] Failed to send email:", error);
      return false;
    }
  }

  /**
   * Sends an e-mail for a notification, honoring the user's
   * e-mail frequency preference and quiet hours. "instant" delivers
   * immediately outside quiet hours; "daily"/"weekly" batches are marked
   * as queued and would be flushed by the digest job.
   */
  static async sendNotification(input: {
    receiverId: string;
    title: string;
    message: string | null;
    type: string;
    frequency: "instant" | "daily" | "weekly";
    quietHoursStart: string | null;
    quietHoursEnd: string | null;
  }): Promise<void> {
    const user = await queryOne<{ email: string; first_name: string; last_name: string }>(
      `SELECT email, first_name, last_name FROM users WHERE id = ? LIMIT 1`,
      [input.receiverId],
    );
    if (!user?.email) return;

    if (isQuietHours(new Date(), input.quietHoursStart, input.quietHoursEnd)) {
      console.info(`[email] deferred (quiet hours): ${user.email} — ${input.title}`);
      return;
    }

    if (input.frequency !== "instant") {
      console.info(
        `[email] queued for ${input.frequency} digest: ${user.email} — ${input.title}`,
      );
      return;
    }

    const titleEscaped = escapeHtml(input.title);
    const bodyText = input.message ?? input.title;
    const bodyEscaped = escapeHtml(bodyText);

    const textContent = [
      `Hello ${user.first_name} ${user.last_name},`,
      "",
      bodyText,
      "",
      "You can manage which e-mails you receive in your notification preferences.",
    ].join("\n");

    const htmlContent = [
      `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px 16px; color: #1e293b;">`,
      `  <div style="margin-bottom: 24px;">`,
      `    <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #0f172a;">[AdmiPy] ${titleEscaped}</h2>`,
      `  </div>`,
      `  <p style="font-size: 15px; line-height: 1.5; color: #334155;">Hello ${escapeHtml(user.first_name)} ${escapeHtml(user.last_name)},</p>`,
      `  <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 14px 16px; margin: 20px 0; border-radius: 4px;">`,
      `    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">${bodyEscaped}</p>`,
      `  </div>`,
      `  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />`,
      `  <p style="font-size: 12px; line-height: 1.4; color: #64748b; margin: 0;">`,
      `    You can manage which e-mails you receive in your notification preferences.`,
      `  </p>`,
      `</div>`,
    ].join("\n");

    await this.send({
      to: user.email,
      subject: `[AdmiPy] ${input.title}`,
      text: textContent,
      html: htmlContent,
    });
  }
}
