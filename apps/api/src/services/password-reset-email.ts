import type { ApiConfig } from "../config.js";

export type PasswordResetEmailInput = {
  email: string;
  code: string;
  expiresAt: string;
};

export interface PasswordResetEmailSender {
  sendPasswordResetCode(input: PasswordResetEmailInput): Promise<void>;
}

export class DisabledPasswordResetEmailSender implements PasswordResetEmailSender {
  async sendPasswordResetCode(input: PasswordResetEmailInput): Promise<void> {
    if (process.env.NODE_ENV === "production") return;
    console.info(
      `Password reset code for ${input.email}: ${input.code} (expires ${input.expiresAt})`,
    );
  }
}

export class ResendPasswordResetEmailSender implements PasswordResetEmailSender {
  constructor(
    private readonly options: {
      apiKey: string;
      from: string;
    },
  ) {}

  async sendPasswordResetCode(input: PasswordResetEmailInput): Promise<void> {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.options.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: this.options.from,
        to: input.email,
        subject: "Your LogMyPlate password reset code",
        text: passwordResetText(input),
        html: passwordResetHtml(input),
      }),
    });

    if (!response.ok) {
      throw new Error(`Password reset email failed with status ${response.status}.`);
    }
  }
}

export const createPasswordResetEmailSender = (config: ApiConfig): PasswordResetEmailSender => {
  if (config.email.resendApiKey) {
    return new ResendPasswordResetEmailSender({
      apiKey: config.email.resendApiKey,
      from: config.email.passwordResetFrom,
    });
  }

  return new DisabledPasswordResetEmailSender();
};

const passwordResetText = (input: PasswordResetEmailInput): string =>
  [
    "Your LogMyPlate password reset code is:",
    "",
    input.code,
    "",
    `This code expires at ${formatExpiry(input.expiresAt)}.`,
    "If you did not request this, you can ignore this email.",
  ].join("\n");

const passwordResetHtml = (input: PasswordResetEmailInput): string => `
  <div style="margin:0;background:#f7f4eb;padding:32px 16px;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#18201c">
    <div style="margin:0 auto;max-width:520px">
      <div style="padding:0 0 18px;text-align:center">
        <div style="display:inline-block;border-radius:22px;background:#18201c;padding:14px 18px;color:#f0bd45;font-size:22px;font-weight:800;letter-spacing:.08em">
          LogMyPlate
        </div>
      </div>
      <div style="overflow:hidden;border:1px solid #eadfbd;border-radius:26px;background:#fffdf7;box-shadow:0 18px 48px rgba(86,67,27,.12)">
        <div style="padding:34px 30px 30px">
          <p style="margin:0 0 8px;color:#7a756c;font-size:13px;font-weight:700;letter-spacing:.18em;text-transform:uppercase">
            Password reset
          </p>
          <h1 style="margin:0;color:#18201c;font-size:30px;line-height:1.15;font-weight:800">
            Use this code to get back in
          </h1>
          <p style="margin:16px 0 0;color:#6f746e;font-size:16px;line-height:1.55">
            Enter the code below in LogMyPlate to reset your password.
          </p>
          <div style="margin:26px 0;border-radius:20px;background:#f5ead0;padding:22px 18px;text-align:center">
            <div style="color:#18201c;font-size:36px;font-weight:800;letter-spacing:.24em;line-height:1">
              ${escapeHtml(input.code)}
            </div>
          </div>
          <p style="margin:0;color:#6f746e;font-size:14px;line-height:1.55">
            This code expires at <strong style="color:#3f3520">${escapeHtml(formatExpiry(input.expiresAt))}</strong>.
          </p>
          <p style="margin:18px 0 0;color:#9a9489;font-size:13px;line-height:1.55">
            If you did not request a password reset, you can safely ignore this email.
          </p>
        </div>
      </div>
      <p style="margin:18px 0 0;text-align:center;color:#9a9489;font-size:12px;line-height:1.5">
        Photos are analyzed and saved with your meal logs.
      </p>
    </div>
  </div>
`;

const formatExpiry = (value: string): string => {
  const expiry = new Date(value);
  if (Number.isNaN(expiry.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(expiry);
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
