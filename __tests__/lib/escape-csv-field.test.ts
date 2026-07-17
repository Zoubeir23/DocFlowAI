import { describe, it, expect } from "vitest";
import { escapeCsvField } from "@/lib/csv/escape-csv-field";

describe("escapeCsvField", () => {
  it("retourne une chaîne vide pour null/undefined", () => {
    expect(escapeCsvField(null)).toBe("");
    expect(escapeCsvField(undefined)).toBe("");
  });

  it("laisse passer une valeur simple", () => {
    expect(escapeCsvField("Jean Dupont")).toBe("Jean Dupont");
  });

  it("échappe les guillemets et virgules", () => {
    expect(escapeCsvField('Dupont, "Le Grand"')).toBe('"Dupont, ""Le Grand"""');
  });

  it.each(["=HYPERLINK(http://evil)", "@SUM(A1:A9)", "\tcmd", "=1+1"])(
    "préfixe les champs de formule %s d'une apostrophe",
    (value) => {
      expect(escapeCsvField(value).startsWith("'")).toBe(true);
    }
  );

  it("préfixe un nom commençant par - qui n'est pas un nombre", () => {
    expect(escapeCsvField("-cmd|calc")).toBe("'-cmd|calc");
  });

  it("ne casse pas un numéro de téléphone international", () => {
    expect(escapeCsvField("+33 6 12 34 56 78")).toBe("+33 6 12 34 56 78");
  });

  it("ne casse pas un nombre négatif", () => {
    expect(escapeCsvField("-42")).toBe("-42");
  });

  it("combine préfixe formule et quoting quand la formule contient une virgule", () => {
    expect(escapeCsvField("=A1,B2")).toBe('"\'=A1,B2"');
  });
});
