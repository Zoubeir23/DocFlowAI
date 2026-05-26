/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface ReceiptPatient {
  full_name: string;
  phone: string | null;
  email: string | null;
}

interface ReceiptService {
  name: string;
  price: number | null;
  duration_minutes: number | null;
}

interface ReceiptClinic {
  name: string;
}

interface ReceiptAppointment {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  notes: string | null;
  patient: ReceiptPatient;
  service: ReceiptService;
  clinic: ReceiptClinic;
}

async function getAuthenticatedClinicId(db: any): Promise<string | null> {
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;
  const { data: userData } = await db
    .from("users")
    .select("clinic_id")
    .eq("id", user.id)
    .maybeSingle();
  return userData?.clinic_id ?? null;
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(price);
}

function buildReceiptHtml(appointment: ReceiptAppointment): string {
  const { patient, service, clinic } = appointment;
  const emissionDate = formatDate(new Date().toISOString());
  const consultationDate = formatDateTime(appointment.start_at);
  const consultationEnd = formatDateTime(appointment.end_at);
  const showPrice = typeof service.price === "number" && service.price > 0;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reçu de consultation — ${patient.full_name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #f5f7fa;
      color: #1a1a2e;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
    }

    .receipt-wrapper {
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 4px 32px rgba(0,0,0,0.10);
      max-width: 640px;
      width: 100%;
      overflow: hidden;
    }

    .receipt-header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      padding: 36px 40px 28px;
      color: #ffffff;
    }

    .receipt-brand {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 6px;
    }

    .receipt-clinic-name {
      font-size: 14px;
      opacity: 0.85;
      font-weight: 500;
    }

    .receipt-title {
      font-size: 13px;
      opacity: 0.7;
      margin-top: 20px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 600;
    }

    .receipt-body {
      padding: 36px 40px;
    }

    .receipt-section {
      margin-bottom: 28px;
    }

    .receipt-section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #6b7280;
      margin-bottom: 14px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }

    .receipt-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
    }

    .receipt-row-label {
      font-size: 13px;
      color: #6b7280;
      font-weight: 500;
      min-width: 140px;
    }

    .receipt-row-value {
      font-size: 13px;
      color: #111827;
      font-weight: 600;
      text-align: right;
    }

    .receipt-total-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
    }

    .receipt-total-label {
      font-size: 14px;
      font-weight: 600;
      color: #166534;
    }

    .receipt-total-amount {
      font-size: 22px;
      font-weight: 800;
      color: #166534;
    }

    .receipt-notes {
      background: #f9fafb;
      border-left: 3px solid #4f46e5;
      border-radius: 4px;
      padding: 12px 16px;
      font-size: 13px;
      color: #374151;
      font-style: italic;
    }

    .receipt-footer {
      border-top: 1px solid #e5e7eb;
      padding: 20px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f9fafb;
    }

    .receipt-footer-text {
      font-size: 12px;
      color: #9ca3af;
    }

    .print-button {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 10px 22px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      letter-spacing: 0.3px;
      transition: opacity 0.15s;
    }

    .print-button:hover { opacity: 0.88; }

    @media print {
      body {
        background: #ffffff;
        padding: 0;
        display: block;
      }
      .receipt-wrapper {
        border-radius: 0;
        box-shadow: none;
        max-width: 100%;
      }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="receipt-wrapper">

    <div class="receipt-header">
      <div class="receipt-brand">DocFlow IA</div>
      <div class="receipt-clinic-name">${clinic.name}</div>
      <div class="receipt-title">Reçu de consultation</div>
    </div>

    <div class="receipt-body">

      <div class="receipt-section">
        <div class="receipt-section-title">Informations patient</div>
        <div class="receipt-row">
          <span class="receipt-row-label">Nom complet</span>
          <span class="receipt-row-value">${patient.full_name}</span>
        </div>
        ${patient.phone ? `
        <div class="receipt-row">
          <span class="receipt-row-label">Téléphone</span>
          <span class="receipt-row-value">${patient.phone}</span>
        </div>` : ""}
        ${patient.email ? `
        <div class="receipt-row">
          <span class="receipt-row-label">Email</span>
          <span class="receipt-row-value">${patient.email}</span>
        </div>` : ""}
      </div>

      <div class="receipt-section">
        <div class="receipt-section-title">Détails de la consultation</div>
        <div class="receipt-row">
          <span class="receipt-row-label">Prestation</span>
          <span class="receipt-row-value">${service.name}</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-row-label">Date</span>
          <span class="receipt-row-value">${consultationDate}</span>
        </div>
        <div class="receipt-row">
          <span class="receipt-row-label">Fin</span>
          <span class="receipt-row-value">${consultationEnd}</span>
        </div>
        ${service.duration_minutes ? `
        <div class="receipt-row">
          <span class="receipt-row-label">Durée</span>
          <span class="receipt-row-value">${service.duration_minutes} min</span>
        </div>` : ""}
        ${showPrice ? `
        <div class="receipt-total-box">
          <span class="receipt-total-label">Montant total</span>
          <span class="receipt-total-amount">${formatPrice(service.price as number)}</span>
        </div>` : ""}
      </div>

      ${appointment.notes ? `
      <div class="receipt-section">
        <div class="receipt-section-title">Notes</div>
        <div class="receipt-notes">${appointment.notes}</div>
      </div>` : ""}

    </div>

    <div class="receipt-footer">
      <span class="receipt-footer-text">Document généré le ${emissionDate}</span>
      <button class="print-button no-print" onclick="window.print()">Imprimer</button>
    </div>

  </div>
</body>
</html>`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  const { appointmentId } = await params;
  const db = (await createClient()) as any;

  const clinicId = await getAuthenticatedClinicId(db);
  if (!clinicId) {
    return new NextResponse("Non autorisé", { status: 401 });
  }

  const { data, error } = await db
    .from("appointments")
    .select(
      "id, start_at, end_at, status, notes, patient:patients(full_name, phone, email), service:services(name, price, duration_minutes), clinic:clinics(name)"
    )
    .eq("id", appointmentId)
    .eq("clinic_id", clinicId)
    .maybeSingle();

  if (error || !data) {
    return new NextResponse("Rendez-vous introuvable", { status: 404 });
  }

  const appointment = data as ReceiptAppointment;
  const html = buildReceiptHtml(appointment);

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
