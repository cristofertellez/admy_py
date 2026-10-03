import { queryOne } from "@/lib/turso/client";

/**
 * E-mail side channel (Historia 13.3).
 *
 * Prepared architecture: the transport interface allows plugging a real
 * SMTP/provider client (Resend, SES, Nodemailer...) without touching the
 * callers. Until SMTP_* environment variables exist, delivery is logged
 * only — no external dependency is introduced (AGENTS.md).
 */

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
}

interface EmailTransport {
  readonly name: string;
  send(message: EmailMessage): Promise<void>;
}

class ConsoleTransport implements EmailTransport {
  readonly name = "console";

  async send(message: EmailMessage): Promise<void> {
    console.info(
      `[email] ${message.to} — ${message.subject}\n${message.text}`,
    );
  }
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
  private static get transport(): EmailTransport {
    return new ConsoleTransport();
  }

  static async send(message: EmailMessage): Promise<boolean> {
    await this.transport.send(message);
    return true;
  }

  /**
   * Sends (or logs) an e-mail for a notification, honoring the user's
   * e-mail frequency preference and quiet hours. "instant" delivers
   * immediately outside quiet hours; "daily"/"weekly" batches are marked
   * as queued and would be flushed by the digest job when a real
   * transport is configured.
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

    await this.send({
      to: user.email,
      subject: `[AdmiPy] ${input.title}`,
      text: [
        `Hello ${user.first_name} ${user.last_name},`,
        "",
        input.message ?? input.title,
        "",
        "You can manage which e-mails you receive in your notification preferences.",
      ].join("\n"),
    });
  }
}
