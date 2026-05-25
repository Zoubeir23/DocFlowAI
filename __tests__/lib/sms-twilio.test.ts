import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockCreate = vi.fn();
const mockTwilioClient = vi.fn(() => ({
  messages: { create: mockCreate },
}));

vi.mock("twilio", () => ({ default: mockTwilioClient }));

describe("sendSms", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      TWILIO_ACCOUNT_SID: "ACtest",
      TWILIO_AUTH_TOKEN: "authtest",
      TWILIO_PHONE_NUMBER: "+15550000000",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  it("returns not-configured when env vars are missing", async () => {
    delete process.env.TWILIO_ACCOUNT_SID;
    const { sendSms } = await import("@/lib/sms/twilio");
    const result = await sendSms("+33612345678", "Test message");
    expect(result.success).toBe(false);
    expect(result.error).toContain("not configured");
  });

  it("sends SMS and returns success with messageId", async () => {
    mockCreate.mockResolvedValue({ sid: "SM123456" });
    const { sendSms } = await import("@/lib/sms/twilio");
    const result = await sendSms("+33612345678", "Bonjour Marie");
    expect(result.success).toBe(true);
    expect(result.messageId).toBe("SM123456");
    expect(result.channel).toBe("sms");
    expect(mockCreate).toHaveBeenCalledWith({
      body: "Bonjour Marie",
      from: "+15550000000",
      to: "+33612345678",
    });
  });

  it("returns failure on Twilio error", async () => {
    mockCreate.mockRejectedValue(new Error("Invalid phone number"));
    const { sendSms } = await import("@/lib/sms/twilio");
    const result = await sendSms("+invalid", "Test");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid phone number");
  });
});
