import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/utils", () => ({
  formatDateTime: () => "May 15, 2026 2:30 PM",
}));

import {
  buildPatientConfirmationSubject,
  buildPatientConfirmationHtml,
} from "@/lib/email/templates/patient-confirmation";
import {
  buildPatientReminderSubject,
  buildPatientReminderHtml,
} from "@/lib/email/templates/patient-reminder";
import {
  buildDoctorNotificationSubject,
  buildDoctorNotificationHtml,
} from "@/lib/email/templates/doctor-notification";

const confirmationData = {
  patientName: "Marie Dupont",
  clinicName: "Clinique Saint-Louis",
  serviceName: "Consultation générale",
  startAt: "2026-05-15T14:30:00",
  locale: "fr" as const,
  cancelToken: "token-abc",
};

describe("Patient confirmation email", () => {
  it("subject contains service and clinic name", () => {
    const subject = buildPatientConfirmationSubject("Consultation générale", "Clinique Saint-Louis", "fr");
    expect(subject).toContain("Consultation générale");
    expect(subject).toContain("Clinique Saint-Louis");
  });

  it("HTML contains patient name", () => {
    const html = buildPatientConfirmationHtml(confirmationData);
    expect(html).toContain("Marie Dupont");
  });

  it("HTML contains service name", () => {
    const html = buildPatientConfirmationHtml(confirmationData);
    expect(html).toContain("Consultation générale");
  });

  it("HTML contains formatted date", () => {
    const html = buildPatientConfirmationHtml(confirmationData);
    expect(html).toContain("May 15, 2026");
  });

  it("HTML contains cancel link when cancelToken provided", () => {
    const html = buildPatientConfirmationHtml(confirmationData);
    expect(html).toContain("/rdv/token-abc/annuler");
  });

  it("HTML omits cancel link when cancelToken is absent", () => {
    const html = buildPatientConfirmationHtml({ ...confirmationData, cancelToken: undefined });
    expect(html).not.toContain("annuler");
  });

  it("HTML escapes dangerous characters in patient name", () => {
    const html = buildPatientConfirmationHtml({
      ...confirmationData,
      patientName: '<script>alert("xss")</script>',
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("Patient reminder email", () => {
  const reminderData = {
    patientName: "Jean Martin",
    clinicName: "Cabinet Dr. Diallo",
    serviceName: "Suivi",
    startAt: "2026-05-16T09:00:00",
    locale: "fr" as const,
  };

  it("subject mentions rappel", () => {
    const subject = buildPatientReminderSubject("Suivi", "Cabinet Dr. Diallo", "fr");
    expect(subject.toLowerCase()).toContain("rappel");
  });

  it("HTML contains patient name", () => {
    const html = buildPatientReminderHtml(reminderData);
    expect(html).toContain("Jean Martin");
  });

  it("HTML contains clinic name", () => {
    const html = buildPatientReminderHtml(reminderData);
    expect(html).toContain("Cabinet Dr. Diallo");
  });
});

describe("Doctor notification email", () => {
  const doctorData = {
    patientName: "Marie Dupont",
    patientPhone: "+33612345678",
    patientEmail: "marie@example.com",
    clinicName: "Clinique Saint-Louis",
    serviceName: "Consultation",
    startAt: "2026-05-15T14:30:00",
    appointmentId: "appt-001",
    locale: "fr" as const,
  };

  it("subject contains patient name", () => {
    const subject = buildDoctorNotificationSubject("Marie Dupont", "Consultation", "fr");
    expect(subject).toContain("Marie Dupont");
  });

  it("HTML contains patient phone", () => {
    const html = buildDoctorNotificationHtml(doctorData);
    expect(html).toContain("+33612345678");
  });

  it("HTML contains patient email", () => {
    const html = buildDoctorNotificationHtml(doctorData);
    expect(html).toContain("marie@example.com");
  });

  it("HTML handles missing email gracefully", () => {
    expect(() =>
      buildDoctorNotificationHtml({ ...doctorData, patientEmail: undefined })
    ).not.toThrow();
  });
});
