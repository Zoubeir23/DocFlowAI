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

const MAX_ROWS = 1000;

function normalizeHeader(raw: string): string {
  return raw.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function normalizePhone(raw: string): string {
  return raw.replace(/[\s.\-()]/g, "");
}

/**
 * RFC 4180-compliant CSV parser — handles multi-line quoted fields,
 * double-quote escaping, and mixed line endings.
 * Returns an array of records (each record is an array of field strings).
 * Also returns a line-number map: record index → starting CSV line number.
 */
function parseCsvRecords(csvText: string): { records: string[][]; startLines: number[] } {
  const records: string[][] = [];
  const startLines: number[] = [];

  let currentRecord: string[] = [];
  let currentField = "";
  let inQuotes = false;
  let lineNumber = 1;
  let recordStartLine = 1;

  const text = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        if (char === "\n") lineNumber++;
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRecord.push(currentField);
        currentField = "";
      } else if (char === "\n") {
        currentRecord.push(currentField);
        currentField = "";
        // Skip fully empty lines (handles trailing newlines)
        if (currentRecord.some((f) => f.trim() !== "")) {
          records.push(currentRecord);
          startLines.push(recordStartLine);
        }
        currentRecord = [];
        lineNumber++;
        recordStartLine = lineNumber;
      } else {
        currentField += char;
      }
    }
  }

  // Flush last record
  currentRecord.push(currentField);
  if (currentRecord.some((f) => f.trim() !== "")) {
    records.push(currentRecord);
    startLines.push(recordStartLine);
  }

  return { records, startLines };
}

export function parsePatientsCSV(csvText: string): PatientCsvParseResult {
  const rows: PatientCsvRow[] = [];
  const errors: { line: number; message: string }[] = [];

  if (!csvText.trim()) {
    errors.push({ line: 1, message: "Le fichier est vide." });
    return { rows, errors };
  }

  const { records, startLines } = parseCsvRecords(csvText);

  if (records.length === 0) {
    errors.push({ line: 1, message: "Le fichier est vide." });
    return { rows, errors };
  }

  const rawHeaders = records[0].map((h) => h.trim());
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
  const dataRecords = records.slice(1);

  for (let i = 0; i < dataRecords.length; i++) {
    if (rows.length >= MAX_ROWS) {
      errors.push({ line: startLines[i + 1]!, message: `Limite de ${MAX_ROWS} lignes atteinte — le reste est ignoré.` });
      break;
    }

    const fields = dataRecords[i];
    const csvLine = startLines[i + 1]!;

    const fullName = (fields[headerIndexMap.get("nom_complet")!] ?? "").trim();
    const rawPhone = (fields[headerIndexMap.get("telephone")!] ?? "").trim();
    const phone = normalizePhone(rawPhone);
    const emailIndex = headerIndexMap.get("email");
    const email = emailIndex !== undefined ? (fields[emailIndex] ?? "").trim() || null : null;
    const notesIndex = headerIndexMap.get("notes");
    const notes = notesIndex !== undefined ? (fields[notesIndex] ?? "").trim() || null : null;

    if (!fullName) {
      errors.push({ line: csvLine, message: "Nom complet manquant." });
      continue;
    }
    if (!phone) {
      errors.push({ line: csvLine, message: "Téléphone manquant." });
      continue;
    }
    if (phone.length < 8) {
      errors.push({ line: csvLine, message: `Téléphone invalide : "${rawPhone}".` });
      continue;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ line: csvLine, message: `Email invalide : "${email}".` });
      continue;
    }
    if (seenPhones.has(phone)) {
      errors.push({ line: csvLine, message: `Téléphone en doublon dans le fichier : "${phone}".` });
      continue;
    }

    seenPhones.add(phone);
    rows.push({ full_name: fullName, phone, email, notes });
  }

  return { rows, errors };
}

export function generatePatientsCsvTemplate(): string {
  const header = "nom_complet,telephone,email,notes";
  const example1 = "Marie Dupont,+33612345678,marie@example.com,Allergie pénicilline";
  const example2 = "Jean Martin,0623456789,,";
  return [header, example1, example2].join("\n");
}
