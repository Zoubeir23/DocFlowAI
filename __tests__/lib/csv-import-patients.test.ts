import { describe, it, expect } from "vitest";
import { parsePatientsCSV, generatePatientsCsvTemplate } from "@/lib/csv/parse-patients-csv";

const VALID_CSV = `nom_complet,telephone,email,notes
Marie Dupont,+33612345678,marie@example.com,Allergie pénicilline
Jean Martin,0623456789,,
Paul Durand,+33698765432,paul@test.fr,RAS`;

describe("parsePatientsCSV — cas valides", () => {
  it("parse les lignes valides avec tous les champs", () => {
    const { rows, errors } = parsePatientsCSV(VALID_CSV);
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      full_name: "Marie Dupont",
      phone: "+33612345678",
      email: "marie@example.com",
      notes: "Allergie pénicilline",
    });
  });

  it("retourne null pour email et notes vides", () => {
    const { rows } = parsePatientsCSV(VALID_CSV);
    expect(rows[1].email).toBeNull();
    expect(rows[1].notes).toBeNull();
  });

  it("normalise les espaces dans le téléphone", () => {
    const csv = "nom_complet,telephone\nAlice Duval,06 12 34 56 78";
    const { rows } = parsePatientsCSV(csv);
    expect(rows[0].phone).toBe("0612345678");
  });

  it("normalise les points et tirets dans le téléphone", () => {
    const csv = "nom_complet,telephone\nAlice Duval,06.12.34.56.78";
    const { rows } = parsePatientsCSV(csv);
    expect(rows[0].phone).toBe("0612345678");
  });

  it("gère les fins de ligne Windows (CRLF)", () => {
    const csv = "nom_complet,telephone\r\nAlice,0612345678";
    const { rows, errors } = parsePatientsCSV(csv);
    expect(errors).toHaveLength(0);
    expect(rows).toHaveLength(1);
  });

  it("ignore les lignes vides", () => {
    const csv = "nom_complet,telephone\n\nAlice,0612345678\n\n";
    const { rows } = parsePatientsCSV(csv);
    expect(rows).toHaveLength(1);
  });

  it("gère les champs entre guillemets avec virgule interne", () => {
    const csv = `nom_complet,telephone,notes\n"Dupont, Marie",0612345678,"Note, avec virgule"`;
    const { rows } = parsePatientsCSV(csv);
    expect(rows[0].full_name).toBe("Dupont, Marie");
    expect(rows[0].notes).toBe("Note, avec virgule");
  });

  it("accepte des colonnes optionnelles absentes (sans email ni notes)", () => {
    const csv = "nom_complet,telephone\nAlice,0612345678";
    const { rows, errors } = parsePatientsCSV(csv);
    expect(errors).toHaveLength(0);
    expect(rows[0].email).toBeNull();
    expect(rows[0].notes).toBeNull();
  });
});

describe("parsePatientsCSV — erreurs", () => {
  it("retourne erreur si fichier vide", () => {
    const { errors } = parsePatientsCSV("");
    expect(errors.length).toBeGreaterThan(0);
  });

  it("retourne erreur si colonne nom_complet manquante", () => {
    const { errors } = parsePatientsCSV("telephone,email\n0612345678,a@b.com");
    expect(errors.some((e) => e.message.includes("nom_complet"))).toBe(true);
  });

  it("retourne erreur si colonne telephone manquante", () => {
    const { errors } = parsePatientsCSV("nom_complet,email\nAlice,a@b.com");
    expect(errors.some((e) => e.message.includes("telephone"))).toBe(true);
  });

  it("ignore ligne avec nom_complet vide", () => {
    const csv = "nom_complet,telephone\n,0612345678";
    const { rows, errors } = parsePatientsCSV(csv);
    expect(rows).toHaveLength(0);
    expect(errors).toHaveLength(1);
  });

  it("ignore ligne avec telephone vide", () => {
    const csv = "nom_complet,telephone\nAlice,";
    const { rows, errors } = parsePatientsCSV(csv);
    expect(rows).toHaveLength(0);
    expect(errors).toHaveLength(1);
  });

  it("ignore ligne avec téléphone trop court (<8 chiffres)", () => {
    const csv = "nom_complet,telephone\nAlice,123";
    const { rows, errors } = parsePatientsCSV(csv);
    expect(rows).toHaveLength(0);
    expect(errors).toHaveLength(1);
  });

  it("ignore ligne avec email invalide", () => {
    const csv = "nom_complet,telephone,email\nAlice,0612345678,pas-un-email";
    const { rows, errors } = parsePatientsCSV(csv);
    expect(rows).toHaveLength(0);
    expect(errors).toHaveLength(1);
  });

  it("signale doublon de téléphone dans le fichier", () => {
    const csv = "nom_complet,telephone\nAlice,0612345678\nBob,0612345678";
    const { rows, errors } = parsePatientsCSV(csv);
    expect(rows).toHaveLength(1);
    expect(errors.some((e) => e.message.includes("doublon"))).toBe(true);
  });
});

describe("generatePatientsCsvTemplate", () => {
  it("inclut les headers requis", () => {
    const csv = generatePatientsCsvTemplate();
    const firstLine = csv.split("\n")[0];
    expect(firstLine).toContain("nom_complet");
    expect(firstLine).toContain("telephone");
    expect(firstLine).toContain("email");
    expect(firstLine).toContain("notes");
  });

  it("contient au moins une ligne d'exemple", () => {
    const csv = generatePatientsCsvTemplate();
    const lines = csv.split("\n").filter((l) => l.trim());
    expect(lines.length).toBeGreaterThan(1);
  });

  it("est lui-même parseable sans erreurs", () => {
    const csv = generatePatientsCsvTemplate();
    const { errors } = parsePatientsCSV(csv);
    expect(errors).toHaveLength(0);
  });
});
