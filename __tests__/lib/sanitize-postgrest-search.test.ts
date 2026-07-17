import { describe, it, expect } from "vitest";
import { sanitizePostgrestSearchTerm } from "@/lib/security/sanitize-postgrest-search";

describe("sanitizePostgrestSearchTerm", () => {
  it("laisse passer un terme de recherche normal", () => {
    expect(sanitizePostgrestSearchTerm("Jean Dupont")).toBe("Jean Dupont");
  });

  it("conserve les points et arobases (recherche par email)", () => {
    expect(sanitizePostgrestSearchTerm("jean.dupont@mail.com")).toBe("jean.dupont@mail.com");
  });

  it("neutralise les virgules (séparateur de conditions PostgREST)", () => {
    expect(sanitizePostgrestSearchTerm("x%,phone.ilike.%y")).not.toContain(",");
  });

  it("neutralise les parenthèses (groupement PostgREST)", () => {
    const sanitized = sanitizePostgrestSearchTerm("a(or(email.eq.b))");
    expect(sanitized).not.toContain("(");
    expect(sanitized).not.toContain(")");
  });

  it("neutralise guillemets et antislash", () => {
    const sanitized = sanitizePostgrestSearchTerm(`a"b'c\\d`);
    expect(sanitized).toBe("a b c d");
  });

  it("tronque à 100 caractères", () => {
    expect(sanitizePostgrestSearchTerm("x".repeat(500))).toHaveLength(100);
  });

  it("réduit les espaces multiples et trim", () => {
    expect(sanitizePostgrestSearchTerm("  Jean   Dupont  ")).toBe("Jean Dupont");
  });
});
