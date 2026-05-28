import { describe, expect, it } from "vitest";
import { passwordResetHtml, passwordResetText } from "./password-reset-email.js";

describe("password reset email", () => {
  const input = {
    email: "user@example.com",
    code: "123456",
    expiresAt: "2026-05-28T10:53:00.000Z",
  };

  it("renders a simple professional password reset email", () => {
    const html = passwordResetHtml(input);
    const text = passwordResetText(input);

    expect(html).toContain("LogMyPlate");
    expect(html).toContain("https://logmyplate.com/icon-192.png");
    expect(html).toContain("Password reset code");
    expect(html).toContain("123456");
    expect(html).toContain("This code expires in 15 minutes.");
    expect(html).not.toContain("Use this code to get back in");
    expect(html).not.toContain("May 28, 2026");
    expect(text).toContain("LogMyPlate password reset");
    expect(text).toContain("This code expires in 15 minutes.");
  });
});
