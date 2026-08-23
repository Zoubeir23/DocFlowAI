import { describe, it, expect } from "vitest";
import { detectAllergyConflict } from "@/lib/allergy-conflicts";

describe("detectAllergyConflict", () => {
  it("détecte l'amoxicilline chez un patient allergique à la pénicilline", () => {
    // Le cas d'école que la comparaison par sous-chaîne ratait : les deux noms
    // n'ont aucune racine commune, seule la classe ATC les rapproche.
    const conflict = detectAllergyConflict("Amoxicilline", "J01CA04", ["pénicilline"]);

    expect(conflict).toMatchObject({
      allergy: "pénicilline",
      kind: "same_class",
      className: "Pénicillines",
    });
  });

  it("ignore les accents et la casse de la saisie", () => {
    expect(detectAllergyConflict("Amoxicilline", "J01CA04", ["PÉNICILLINE"])).not.toBeNull();
    expect(detectAllergyConflict("Amoxicilline", "J01CA04", ["penicilline"])).not.toBeNull();
  });

  it("signale la réactivité croisée pénicilline / céphalosporine à part", () => {
    const conflict = detectAllergyConflict("Ceftriaxone", "J01DD04", ["pénicilline"]);

    expect(conflict?.kind).toBe("cross_reactivity");
    expect(conflict?.className).toBe("Pénicillines");
  });

  it("ne signale rien pour un médicament d'une autre famille", () => {
    expect(detectAllergyConflict("Paracétamol", "N02BE01", ["pénicilline"])).toBeNull();
  });

  it("rattrape une allergie notée avec un nom commercial précis", () => {
    const conflict = detectAllergyConflict("Doliprane 1000", "N02BE01", ["doliprane"]);

    expect(conflict).toMatchObject({ allergy: "doliprane", kind: "drug_name" });
  });

  it("fait primer la correspondance de classe sur celle de nom", () => {
    const conflict = detectAllergyConflict("Amoxicilline", "J01CA04", ["amoxicilline"]);

    expect(conflict?.kind).toBe("same_class");
  });

  it("reste opérant sur le nom quand le code ATC est absent", () => {
    expect(detectAllergyConflict("Amoxicilline", null, ["amoxicilline"])?.kind).toBe("drug_name");
    // Sans code ATC, la classe ne peut pas être déduite : c'est une limite assumée.
    expect(detectAllergyConflict("Amoxicilline", null, ["pénicilline"])).toBeNull();
  });

  it("ignore les allergies vides ou en blancs", () => {
    expect(detectAllergyConflict("Amoxicilline", "J01CA04", ["", "   "])).toBeNull();
  });

  it("ne déclenche rien sans nom de médicament", () => {
    expect(detectAllergyConflict("", "J01CA04", ["pénicilline"])).toBeNull();
  });

  it("couvre les familles fréquentes par leur code ATC", () => {
    const cases: Array<[string, string, string, string]> = [
      ["Ibuprofène", "M01AE01", "AINS", "Anti-inflammatoires non stéroïdiens"],
      ["Aspirine", "N02BA01", "aspirine", "Salicylés"],
      ["Azithromycine", "J01FA10", "macrolide", "Macrolides"],
      ["Ciprofloxacine", "J01MA02", "quinolone", "Quinolones"],
      ["Doxycycline", "J01AA02", "cycline", "Cyclines"],
      ["Gentamicine", "J01GB03", "aminoside", "Aminosides"],
      ["Morphine", "N02AA01", "morphine", "Opiacés"],
      ["Énoxaparine", "B01AB05", "héparine", "Héparines"],
      ["Lidocaïne", "N01BB02", "lidocaïne", "Anesthésiques locaux"],
    ];

    for (const [drugName, atcCode, allergy, expectedClass] of cases) {
      const conflict = detectAllergyConflict(drugName, atcCode, [allergy]);
      expect(conflict, `${drugName} / ${allergy}`).not.toBeNull();
      expect(conflict?.className, `${drugName} / ${allergy}`).toBe(expectedClass);
    }
  });

  it("détecte une correspondance même quand le code renvoyé est moins spécifique qu'un préfixe de 7 caractères", () => {
    // RxNav renvoie le plus souvent un code de niveau 4 (5 caractères, "B01AC")
    // plutôt que le niveau 5 complet ("B01AC06") utilisé par la réactivité
    // croisée AINS/salicylés. Avant le correctif, code.startsWith(prefix) ne
    // pouvait jamais matcher un préfixe plus long que le code.
    const conflict = detectAllergyConflict("AspirineX", "B01AC", ["AINS"]);

    expect(conflict?.kind).toBe("cross_reactivity");
    expect(conflict?.className).toBe("Anti-inflammatoires non stéroïdiens");
  });

  it("détecte une correspondance même quand le code renvoyé n'est que le sous-groupe pharmacologique (niveau 3)", () => {
    const conflict = detectAllergyConflict("Amoxicilline", "J01C", ["pénicilline"]);

    expect(conflict).toMatchObject({ kind: "same_class", className: "Pénicillines" });
  });
});
