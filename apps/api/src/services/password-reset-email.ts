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

export const passwordResetText = (input: PasswordResetEmailInput): string =>
  [
    "LogMyPlate password reset",
    "",
    "Use this code to reset your password:",
    input.code,
    "",
    "This code expires in 15 minutes.",
    "If you did not request this, you can ignore this email.",
  ].join("\n");

const logMyPlateLogoUrl = "https://logmyplate.com/icon-192.png";

export const passwordResetHtml = (input: PasswordResetEmailInput): string => `
  <div style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#17201b">
    <div style="max-width:520px;margin:0 auto;padding:28px 20px">
      <div style="margin:0 0 22px">
        <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
          <tr>
            <td style="padding:0 10px 0 0;vertical-align:middle">
              <img src="${logMyPlateLogoUrl}" width="40" height="40" alt="LogMyPlate" style="display:block;border:0;border-radius:9px;outline:none;text-decoration:none" />
            </td>
            <td style="padding:0;vertical-align:middle;font-size:20px;font-weight:700;line-height:1.2;color:#17201b">
              LogMyPlate
            </td>
          </tr>
        </table>
      </div>
      <div style="border:1px solid #e7e3da;border-radius:12px;padding:26px;background:#ffffff">
        <h1 style="margin:0 0 10px;font-size:22px;line-height:1.25;font-weight:700;color:#17201b">
          Password reset code
        </h1>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#5f6862">
          Use this code to reset your LogMyPlate password.
        </p>
        <div style="margin:0 0 20px;padding:16px 18px;border:1px solid #e4d7b7;border-radius:10px;background:#fbf8ef;text-align:center">
          <div style="font-size:30px;font-weight:700;letter-spacing:7px;line-height:1;color:#17201b">
            ${escapeHtml(input.code)}
          </div>
        </div>
        <p style="margin:0 0 14px;font-size:14px;line-height:1.5;color:#5f6862">
          This code expires in 15 minutes.
        </p>
        <p style="margin:0;font-size:14px;line-height:1.5;color:#5f6862">
          If you did not request a password reset, you can ignore this email.
        </p>
      </div>
      <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#8a928d">
        LogMyPlate account security
      </p>
    </div>
  </div>
`;

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
