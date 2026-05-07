import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/supabase";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seed() {
  console.log("Starting seed...");

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: "doctor@demo.com",
    password: "password123",
    email_confirm: true,
  });

  if (authError && !authError.message.includes("already registered")) {
    console.error("Auth error:", authError);
    return;
  }

  const userId = authUser?.user?.id || (
    await supabase.auth.admin.listUsers()
  ).data?.users?.find((u) => u.email === "doctor@demo.com")?.id;

  if (!userId) {
    console.error("Could not get user ID");
    return;
  }

  console.log("User ID:", userId);

  const { data: clinic, error: clinicError } = await supabase
    .from("clinics")
    .upsert({
      name: "CityCare Clinic",
      slug: "citycare-clinic",
      timezone: "America/New_York",
      owner_id: userId,
    })
    .select()
    .single();

  if (clinicError) {
    console.error("Clinic error:", clinicError);
    return;
  }

  console.log("Clinic created:", clinic.id);

  await supabase.from("users").upsert({
    id: userId,
    clinic_id: clinic.id,
    role: "owner",
    full_name: "Dr. Sarah Johnson",
    email: "doctor@demo.com",
  });

  const services = [
    { name: "General Consultation", duration_minutes: 30, price: 150, is_active: true },
    { name: "Follow Up Visit", duration_minutes: 15, price: 75, is_active: true },
    { name: "Specialist Visit", duration_minutes: 45, price: 250, is_active: true },
    { name: "Video Consultation", duration_minutes: 30, price: 100, is_active: true },
    { name: "Annual Physical", duration_minutes: 60, price: 200, is_active: true },
  ];

  const { data: createdServices } = await supabase
    .from("services")
    .upsert(services.map((s) => ({ ...s, clinic_id: clinic.id })))
    .select();

  console.log("Services created:", createdServices?.length);

  const availabilityRules = [
    { day_of_week: 1, start_time: "09:00", end_time: "17:00", break_start: "12:00", break_end: "13:00", is_active: true },
    { day_of_week: 2, start_time: "09:00", end_time: "17:00", break_start: "12:00", break_end: "13:00", is_active: true },
    { day_of_week: 3, start_time: "09:00", end_time: "17:00", break_start: "12:00", break_end: "13:00", is_active: true },
    { day_of_week: 4, start_time: "09:00", end_time: "17:00", break_start: "12:00", break_end: "13:00", is_active: true },
    { day_of_week: 5, start_time: "09:00", end_time: "15:00", break_start: null, break_end: null, is_active: true },
  ];

  await supabase.from("availability_rules").upsert(
    availabilityRules.map((r) => ({ ...r, clinic_id: clinic.id }))
  );

  await supabase.from("clinic_settings").upsert({
    clinic_id: clinic.id,
    widget_color: "#2563eb",
    welcome_message: "Welcome to CityCare Clinic! I'm your AI booking assistant. How can I help you today?",
    slot_duration_minutes: 15,
    tone: "professional and caring",
    booking_behavior: "Guide patients through booking smoothly. Always suggest the nearest available slot.",
    faq: [
      { question: "What are your clinic hours?", answer: "We are open Monday-Thursday 9AM-5PM and Friday 9AM-3PM." },
      { question: "Do you accept walk-ins?", answer: "We prefer appointments but do accept walk-ins based on availability." },
      { question: "What insurance do you accept?", answer: "We accept most major insurance plans. Please contact us for specific inquiries." },
      { question: "How do I cancel an appointment?", answer: "You can cancel through this chat or call us at least 24 hours in advance." },
    ],
  });

  await supabase.from("subscriptions").upsert({
    clinic_id: clinic.id,
    plan: "professional",
    status: "active",
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });

  const patients = [
    { full_name: "John Smith", phone: "+1-555-0101", email: "john.smith@email.com" },
    { full_name: "Emily Davis", phone: "+1-555-0102", email: "emily.davis@email.com" },
    { full_name: "Michael Chen", phone: "+1-555-0103", email: "michael.chen@email.com" },
    { full_name: "Sarah Williams", phone: "+1-555-0104", email: null },
    { full_name: "Robert Johnson", phone: "+1-555-0105", email: "robert.j@email.com" },
  ];

  const { data: createdPatients } = await supabase
    .from("patients")
    .upsert(patients.map((p) => ({ ...p, clinic_id: clinic.id })))
    .select();

  console.log("Patients created:", createdPatients?.length);

  if (createdPatients && createdServices) {
    const now = new Date();
    const appointments = [];

    for (let i = 0; i < 10; i++) {
      const daysOffset = Math.floor(Math.random() * 14) - 3;
      const apptDate = new Date(now);
      apptDate.setDate(apptDate.getDate() + daysOffset);
      apptDate.setHours(9 + Math.floor(Math.random() * 7), 0, 0, 0);

      const service = createdServices[Math.floor(Math.random() * createdServices.length)];
      const patient = createdPatients[Math.floor(Math.random() * createdPatients.length)];

      const startAt = new Date(apptDate);
      const endAt = new Date(apptDate);
      endAt.setMinutes(endAt.getMinutes() + service.duration_minutes);

      let status: string;
      if (daysOffset < 0) {
        status = Math.random() > 0.2 ? "completed" : "no_show";
      } else if (daysOffset === 0) {
        status = "confirmed";
      } else {
        status = Math.random() > 0.3 ? "booked" : "confirmed";
      }

      appointments.push({
        clinic_id: clinic.id,
        patient_id: patient.id,
        service_id: service.id,
        status,
        source: Math.random() > 0.5 ? "widget" : "manual",
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        notes: null,
      });
    }

    await supabase.from("appointments").insert(appointments as Parameters<typeof supabase.from<"appointments">>[0] extends never ? never : any[]);
    console.log("Appointments created:", appointments.length);
  }

  console.log("\nSeed complete!");
  console.log("Login credentials:");
  console.log("Email: doctor@demo.com");
  console.log("Password: password123");
  console.log("Clinic slug: citycare-clinic");
}

seed().catch(console.error);
