import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/email/router", () => ({
  sendConfirmationEmail: vi.fn().mockResolvedValue([{ success: true, channel: "email_patient" }]),
}));

vi.mock("@/lib/sms/twilio", () => ({
  sendSms: vi.fn().mockResolvedValue({ success: true, channel: "sms" }),
}));

vi.mock("@/lib/sms/messages", () => ({
  buildSmsConfirmationMessage: vi.fn().mockReturnValue("SMS confirmation text"),
  buildSmsReminderMessage: vi.fn().mockReturnValue("SMS reminder text"),
}));

vi.mock("@/lib/utils", () => ({
  formatDateTime: (d: string) => d,
}));

import { sendNotification, buildNotificationMessage } from "@/lib/notifications";
import { sendConfirmationEmail } from "@/lib/email/router";
import { sendSms } from "@/lib/sms/twilio";
import { buildSmsConfirmationMessage, buildSmsReminderMessage } from "@/lib/sms/messages";

const basePayload = {
  type: "appointment_confirmation" as const,
  appointmentId: "appt-1",
  cancelToken: "token-abc",
  patientName: "Marie Dupont",
  patientPhone: "+33612345678",
  patientEmail: "marie@example.com",
  doctorEmail: "doctor@clinic.com",
  clinicName: "Clinique Test",
  serviceName: "Consultation",
  startAt: "2026-05-15T14:30:00",
};

describe("sendNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sendConfirmationEmail).mockResolvedValue([{ success: true, channel: "email_patient" }]);
    vi.mocked(sendSms).mockResolvedValue({ success: true, channel: "sms" });
    vi.mocked(buildSmsConfirmationMessage).mockReturnValue("SMS confirmation text");
    vi.mocked(buildSmsReminderMessage).mockReturnValue("SMS reminder text");
  });

  it("sends email and SMS in parallel for confirmation", async () => {
    const results = await sendNotification(basePayload);
    expect(sendConfirmationEmail).toHaveBeenCalledOnce();
    expect(sendSms).toHaveBeenCalledOnce();
    expect(results).toHaveLength(2);
  });

  it("passes cancelToken to email", async () => {
    await sendNotification(basePayload);
    expect(sendConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ cancelToken: "token-abc" })
    );
  });

  it("passes doctorEmail for confirmation type", async () => {
    await sendNotification(basePayload);
    expect(sendConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ doctorEmail: "doctor@clinic.com" })
    );
  });

  it("does not pass doctorEmail for reminder type", async () => {
    await sendNotification({ ...basePayload, type: "appointment_reminder" });
    expect(sendConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ doctorEmail: undefined })
    );
  });

  it("returns skipped result for unsupported type", async () => {
    const results = await sendNotification({
      ...basePayload,
      type: "appointment_cancellation" as never,
    });
    expect(results).toEqual([{ success: true, channel: "skipped" }]);
    expect(sendConfirmationEmail).not.toHaveBeenCalled();
    expect(sendSms).not.toHaveBeenCalled();
  });

  it("still returns results when SMS fails", async () => {
    vi.mocked(sendSms).mockResolvedValue({ success: false, channel: "sms", error: "Twilio error" });
    const results = await sendNotification(basePayload);
    expect(results.some((r) => r.channel === "sms" && !r.success)).toBe(true);
    expect(results.some((r) => r.channel === "email_patient")).toBe(true);
  });

  it("calls buildSmsConfirmationMessage for confirmation", async () => {
    await sendNotification(basePayload);
    expect(buildSmsConfirmationMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        patientName: "Marie Dupont",
        cancelToken: "token-abc",
      })
    );
  });

  it("calls buildSmsReminderMessage for reminder", async () => {
    await sendNotification({ ...basePayload, type: "appointment_reminder" });
    expect(buildSmsReminderMessage).toHaveBeenCalledOnce();
  });
});

describe("buildNotificationMessage", () => {
  it("builds confirmation message", () => {
    const msg = buildNotificationMessage(basePayload);
    expect(msg).toContain("Marie Dupont");
    expect(msg).toContain("Consultation");
    expect(msg).toContain("Clinique Test");
  });

  it("builds reminder message", () => {
    const msg = buildNotificationMessage({ ...basePayload, type: "appointment_reminder" });
    expect(msg.toLowerCase()).toContain("rappel");
  });

  it("builds cancellation message", () => {
    const msg = buildNotificationMessage({ ...basePayload, type: "appointment_cancellation" });
    expect(msg.toLowerCase()).toContain("annulé");
  });

  it("returns generic message for unknown type", () => {
    const msg = buildNotificationMessage({ ...basePayload, type: "unknown" as never });
    expect(msg).toContain("Clinique Test");
  });
});
