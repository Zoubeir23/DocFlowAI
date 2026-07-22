/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { validateApiKey, extractApiKey } from "@/lib/api-auth";
import { sanitizePostgrestSearchTerm } from "@/lib/security/sanitize-postgrest-search";
import { checkApiIpRateLimit, getClientIp } from "@/lib/rate-limit";
import { parseToolLimit } from "@/lib/api-pagination";

function unauthorized() {
  return NextResponse.json(
    { error: "Unauthorized. Provide a valid API key via x-api-key header." },
    { status: 401 }
  );
}

// ── Tool definitions ──────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: "get_today_appointments",
    description: "Get all appointments scheduled for today for this clinic.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "list_appointments",
    description: "List appointments, optionally filtered by status.",
    inputSchema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["booked", "confirmed", "completed", "cancelled", "no_show"],
          description: "Filter by appointment status",
        },
        limit: { type: "number", description: "Max results (1-50, default 20)" },
      },
    },
  },
  {
    name: "list_patients",
    description: "List patients, optionally search by name, phone, or email.",
    inputSchema: {
      type: "object",
      properties: {
        search: { type: "string", description: "Search query" },
        limit: { type: "number", description: "Max results (1-50, default 20)" },
      },
    },
  },
  {
    name: "get_dashboard_stats",
    description: "Get clinic stats: today's appointments, upcoming count, total patients, completion rate.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "create_appointment",
    description: "Create a new appointment. Finds or creates the patient by phone number.",
    inputSchema: {
      type: "object",
      required: ["patient_name", "patient_phone", "service_id", "start_at", "end_at"],
      properties: {
        patient_name: { type: "string" },
        patient_phone: { type: "string" },
        patient_email: { type: "string" },
        service_id: { type: "string", description: "UUID of the service" },
        start_at: { type: "string", description: "ISO datetime" },
        end_at: { type: "string", description: "ISO datetime" },
        notes: { type: "string" },
      },
    },
  },
  {
    name: "list_services",
    description: "List active services offered by the clinic.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
];

// ── Tool executors ────────────────────────────────────────────────────────────

async function executeTool(name: string, args: Record<string, any>, clinicId: string): Promise<string> {
  const db = (await createAdminClient()) as any;

  if (name === "get_today_appointments") {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const tomorrowStr = new Date(today.getTime() + 86400000).toISOString().split("T")[0];

    const { data, error } = await db
      .from("appointments")
      .select("id, start_at, end_at, status, patient:patients(full_name, phone), service:services(name)")
      .eq("clinic_id", clinicId)
      .gte("start_at", `${todayStr}T00:00:00`)
      .lt("start_at", `${tomorrowStr}T00:00:00`)
      .neq("status", "cancelled")
      .order("start_at", { ascending: true });

    if (error) return `Error: ${error.message}`;
    if (!data?.length) return "No appointments today.";
    return `${data.length} appointment(s) today:\n\n${JSON.stringify(data, null, 2)}`;
  }

  if (name === "list_appointments") {
    const limit = Math.min(Math.max(parseInt(args.limit ?? "20"), 1), 50);
    let query = db
      .from("appointments")
      .select("id, start_at, end_at, status, notes, patient:patients(full_name, phone, email), service:services(name, duration_minutes)")
      .eq("clinic_id", clinicId)
      .order("start_at", { ascending: false })
      .limit(limit);

    if (args.status) query = query.eq("status", args.status);

    const { data, error } = await query;
    if (error) return `Error: ${error.message}`;
    return JSON.stringify(data, null, 2);
  }

  if (name === "list_patients") {
    const limit = Math.min(Math.max(parseInt(args.limit ?? "20"), 1), 50);
    let query = db
      .from("patients")
      .select("id, full_name, phone, email, notes, created_at")
      .eq("clinic_id", clinicId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (args.search) {
      const safeSearch = sanitizePostgrestSearchTerm(String(args.search));
      if (safeSearch) {
        query = query.or(
          `full_name.ilike.%${safeSearch}%,phone.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%`
        );
      }
    }

    const { data, error } = await query;
    if (error) return `Error: ${error.message}`;
    return JSON.stringify(data, null, 2);
  }

  if (name === "get_dashboard_stats") {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const tomorrowStr = new Date(today.getTime() + 86400000).toISOString().split("T")[0];

    const [todayAppts, upcomingAppts, totalPatients, completedAppts, noShowAppts] = await Promise.all([
      db.from("appointments").select("id", { count: "exact" }).eq("clinic_id", clinicId)
        .gte("start_at", `${todayStr}T00:00:00`).lt("start_at", `${tomorrowStr}T00:00:00`).neq("status", "cancelled"),
      db.from("appointments").select("id", { count: "exact" }).eq("clinic_id", clinicId)
        .gte("start_at", new Date().toISOString()).in("status", ["booked", "confirmed"]),
      db.from("patients").select("id", { count: "exact" }).eq("clinic_id", clinicId),
      db.from("appointments").select("id", { count: "exact" }).eq("clinic_id", clinicId).eq("status", "completed"),
      db.from("appointments").select("id", { count: "exact" }).eq("clinic_id", clinicId).eq("status", "no_show"),
    ]);

    const totalFinished = (completedAppts.count || 0) + (noShowAppts.count || 0);
    return JSON.stringify({
      today_appointments: todayAppts.count ?? 0,
      upcoming_appointments: upcomingAppts.count ?? 0,
      total_patients: totalPatients.count ?? 0,
      completion_rate_percent: totalFinished > 0 ? Math.round(((completedAppts.count || 0) / totalFinished) * 100) : 0,
      no_show_rate_percent: totalFinished > 0 ? Math.round(((noShowAppts.count || 0) / totalFinished) * 100) : 0,
    }, null, 2);
  }

  if (name === "create_appointment") {
    const parsed = z.object({
      patient_name: z.string().min(1).max(200),
      patient_phone: z.string().min(1).max(30),
      patient_email: z.string().email().optional(),
      service_id: z.string().uuid(),
      start_at: z.string().datetime(),
      end_at: z.string().datetime(),
      notes: z.string().max(1000).optional(),
    }).safeParse(args);

    if (!parsed.success) return `Validation error: ${parsed.error.errors[0].message}`;

    const { data: service } = await db
      .from("services").select("id, name").eq("id", parsed.data.service_id).eq("clinic_id", clinicId).eq("is_active", true).maybeSingle();
    if (!service) return "Error: Service not found or inactive.";

    const { data: existingPatient } = await db
      .from("patients").select("id").eq("clinic_id", clinicId).eq("phone", parsed.data.patient_phone).maybeSingle();

    let patientId: string;
    if (existingPatient) {
      patientId = existingPatient.id;
    } else {
      const { data: newPatient, error: patientError } = await db
        .from("patients")
        .insert({ clinic_id: clinicId, full_name: parsed.data.patient_name, phone: parsed.data.patient_phone, email: parsed.data.patient_email ?? null })
        .select("id").maybeSingle();
      if (patientError) return `Error creating patient: ${patientError.message}`;
      patientId = newPatient.id;
    }

    const { data: appointment, error } = await db
      .from("appointments")
      .insert({ clinic_id: clinicId, patient_id: patientId, service_id: parsed.data.service_id, start_at: parsed.data.start_at, end_at: parsed.data.end_at, status: "confirmed", notes: parsed.data.notes ?? null })
      .select("id, start_at, end_at, status").maybeSingle();

    if (error) return `Error: ${error.message}`;
    return `Appointment created!\n${JSON.stringify({ ...appointment, patient_name: parsed.data.patient_name, service_name: service.name }, null, 2)}`;
  }

  if (name === "list_services") {
    const { data, error } = await db
      .from("services")
      .select("id, name, duration_minutes, price, description")
      .eq("clinic_id", clinicId)
      .eq("is_active", true)
      .order("name");

    if (error) return `Error: ${error.message}`;
    return JSON.stringify(data, null, 2);
  }

  return `Unknown tool: ${name}`;
}

// ── JSON-RPC 2.0 handler ──────────────────────────────────────────────────────

function jsonRpcError(id: unknown, code: number, message: string) {
  return NextResponse.json({ jsonrpc: "2.0", id, error: { code, message } });
}

export async function POST(req: NextRequest) {
  if (!(await checkApiIpRateLimit(getClientIp(req)))) {
    return NextResponse.json({ error: "Trop de requêtes. Réessayez dans une minute." }, { status: 429 });
  }

  const ctx = await validateApiKey(extractApiKey(req));
  if (!ctx) return unauthorized();

  let body: any;
  try { body = await req.json(); } catch {
    return jsonRpcError(null, -32700, "Parse error");
  }

  const { jsonrpc, id, method, params } = body;
  if (jsonrpc !== "2.0") return jsonRpcError(id, -32600, "Invalid Request");

  // MCP initialize
  if (method === "initialize") {
    return NextResponse.json({
      jsonrpc: "2.0", id,
      result: {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "DocFlow", version: "1.0.0" },
      },
    });
  }

  // MCP tools/list
  if (method === "tools/list") {
    return NextResponse.json({ jsonrpc: "2.0", id, result: { tools: TOOLS } });
  }

  // MCP tools/call
  if (method === "tools/call") {
    const toolName = params?.name;
    const toolArgs = params?.arguments ?? {};

    if (!toolName || !TOOLS.find((t) => t.name === toolName)) {
      return jsonRpcError(id, -32602, `Unknown tool: ${toolName}`);
    }

    try {
      const text = await executeTool(toolName, toolArgs, ctx.clinicId);
      return NextResponse.json({
        jsonrpc: "2.0", id,
        result: { content: [{ type: "text", text }] },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal error";
      return jsonRpcError(id, -32603, message);
    }
  }

  // notifications/initialized and other notifications (no response needed)
  if (method?.startsWith("notifications/")) {
    return new NextResponse(null, { status: 204 });
  }

  return jsonRpcError(id, -32601, `Method not found: ${method}`);
}

// GET for SSE ping / discovery
export async function GET(req: NextRequest) {
  if (!(await checkApiIpRateLimit(getClientIp(req)))) {
    return NextResponse.json({ error: "Trop de requêtes. Réessayez dans une minute." }, { status: 429 });
  }

  const ctx = await validateApiKey(extractApiKey(req));
  if (!ctx) return unauthorized();

  return NextResponse.json({
    name: "DocFlow MCP Server",
    version: "1.0.0",
    protocol: "2024-11-05",
    transport: "http",
    endpoint: req.url,
    tools: TOOLS.map((t) => t.name),
  });
}
