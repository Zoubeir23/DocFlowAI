import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/utils", () => ({
  formatDateTime: (date: string) => "May 15, 2026 2:30 PM",
}));

import {
  buildSmsConfirmationMessage,
  buildSmsReminderMessage,
} from "@/lib/sms/messages";

describe("buildSmsConfirmationMessage", () => {
  const baseData = {
    patientName: "Marie Dupont",
    clinicName: "Clinique Saint-Louis",
    serviceName: "Consultation générale",
    startAt: "2026-05-15T14:30:00",
  };

  it("includes first name, service, clinic and date", () => {
    const msg = buildSmsConfirmationMessage(baseData);
    expect(msg).toContain("Marie");
    expect(msg).toContain("Consultation générale");
    expect(msg).toContain("Clinique Saint-Louis");
    expect(msg).toContain("May 15, 2026");
  });

  it("only uses first name, not full name", () => {
    const msg = buildSmsConfirmationMessage(baseData);
    expect(msg).not.toContain("Dupont");
  });

  it("includes cancel URL when cancelToken is provided", () => {
    const msg = buildSmsConfirmationMessage({
      ...baseData,
      cancelToken: "abc-123",
    });
    expect(msg).toContain("/rdv/abc-123/annuler");
  });

  it("omits cancel URL when cancelToken is absent", () => {
    const msg = buildSmsConfirmationMessage(baseData);
    expect(msg).not.toContain("annuler");
  });
});

describe("buildSmsReminderMessage", () => {
  const baseData = {
    patientName: "Jean-Pierre Martin",
    clinicName: "Cabinet Dr. Diallo",
    serviceName: "Suivi cardiologique",
    startAt: "2026-05-16T09:00:00",
  };

  it("includes first name, service, clinic and formatted date", () => {
    const msg = buildSmsReminderMessage(baseData);
    expect(msg).toContain("Jean-Pierre");
    expect(msg).toContain("Suivi cardiologique");
    expect(msg).toContain("Cabinet Dr. Diallo");
  });

  it("mentions demain (tomorrow)", () => {
    const msg = buildSmsReminderMessage(baseData);
    expect(msg.toLowerCase()).toContain("demain");
  });

  it("does not include a cancel link", () => {
    const msg = buildSmsReminderMessage(baseData);
    expect(msg).not.toContain("annuler");
  });
});
