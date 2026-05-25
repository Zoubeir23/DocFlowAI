export interface PatientCsvRow {
  full_name: string;
  phone: string;
  email: string | null;
  notes: string | null;
}

export interface PatientCsvParseResult {
  rows: PatientCsvRow[];
  errors: { line: number; message: string }[];
}

const REQUIRED_HEADERS = ["nom_complet", "telephone"] as const;
const OPTIONAL_HEADERS = ["email", "notes"] as const;
const ALL_HEADERS = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS] as const;
type CsvHeader = (typeof ALL_HEADERS)[number];

function normalizeHeader(raw: string): string {
  return raw.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function normalizePhone(raw: string): string {
  return raw.replace(/[\s.\-()]/g, "");
}

export function parsePatientsCSV(csvText: string): PatientCsvParseResult {
  const lines = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const rows: PatientCsvRow[] = [];
  const errors: { line: number; message: string }[] = [];

  const nonEmptyLines = lines.map((l, i) => ({ content: l, originalIndex: i + 1 })).filter(({ content }) => content.trim() !== "");
  if (nonEmptyLines.length === 0) {
    errors.push({ line: 1, message: "Le fichier est vide." });
    return { rows, errors };
  }

  const headerLine = nonEmptyLines[0];
  const rawHeaders = splitCsvLine(headerLine.content);
  const normalizedHeaders = rawHeaders.map(normalizeHeader);

  for (const required of REQUIRED_HEADERS) {
    if (!normalizedHeaders.includes(required)) {
      errors.push({ line: 1, message: `Colonne requise manquante : "${required}"` });
    }
  }
  if (errors.length > 0) return { rows, errors };

  const headerIndexMap = new Map<CsvHeader, number>();
  for (const header of ALL_HEADERS) {
    const idx = normalizedHeaders.indexOf(header);
    if (idx !== -1) headerIndexMap.set(header, idx);
  }

  const seenPhones = new Set<string>();

  for (let i = 1; i < nonEmptyLines.length; i++) {
    const { content, originalIndex } = nonEmptyLines[i];
    const fields = splitCsvLine(content);

    const fullName = (fields[headerIndexMap.get("nom_complet")!] ?? "").trim();
    const rawPhone = (fields[headerIndexMap.get("telephone")!] ?? "").trim();
    const phone = normalizePhone(rawPhone);
    const emailIndex = headerIndexMap.get("email");
    const email = emailIndex !== undefined ? (fields[emailIndex] ?? "").trim() || null : null;
    const notesIndex = headerIndexMap.get("notes");
    const notes = notesIndex !== undefined ? (fields[notesIndex] ?? "").trim() || null : null;

    if (!fullName) {
      errors.push({ line: originalIndex, message: "Nom complet manquant." });
      continue;
    }
    if (!phone) {
      errors.push({ line: originalIndex, message: `Ligne ${originalIndex} — téléphone manquant.` });
      continue;
    }
    if (phone.length < 8) {
      errors.push({ line: originalIndex, message: `Ligne ${originalIndex} — téléphone invalide : "${rawPhone}".` });
      continue;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ line: originalIndex, message: `Ligne ${originalIndex} — email invalide : "${email}".` });
      continue;
    }
    if (seenPhones.has(phone)) {
      errors.push({ line: originalIndex, message: `Ligne ${originalIndex} — téléphone en doublon dans le fichier : "${phone}".` });
      continue;
    }

    seenPhones.add(phone);
    rows.push({ full_name: fullName, phone, email, notes });
  }

  return { rows, errors };
}

function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

export function generatePatientsCsvTemplate(): string {
  const header = "nom_complet,telephone,email,notes";
  const example1 = "Marie Dupont,+33612345678,marie@example.com,Allergie pénicilline";
  const example2 = "Jean Martin,0623456789,,";
  return [header, example1, example2].join("\n");
}
