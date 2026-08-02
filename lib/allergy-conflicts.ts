/**
 * Détection de conflit entre un médicament prescrit et les allergies connues du
 * patient.
 *
 * La comparaison par sous-chaîne du nom commercial ne suffit pas : une allergie
 * « pénicilline » ne se retrouve pas dans « Amoxicilline », alors que les deux
 * appartiennent à la même famille des bêta-lactamines. Le classement ATC, déjà
 * porté par chaque traitement (`atc_code`), permet de raisonner par classe
 * thérapeutique plutôt que par orthographe.
 *
 * AVERTISSEMENT : cette table couvre les familles d'allergies médicamenteuses
 * les plus fréquentes, pas la pharmacopée entière. Elle assiste le prescripteur,
 * elle ne le remplace pas — l'absence de conflit détecté ne vaut pas absence
 * d'allergie.
 */

/** Nature du rapprochement ayant déclenché l'alerte. */
export type AllergyConflictKind = "same_class" | "cross_reactivity" | "drug_name";

export interface AllergyConflict {
  /** Allergie du patient à l'origine de l'alerte, telle qu'elle est enregistrée. */
  allergy: string;
  kind: AllergyConflictKind;
  /** Famille concernée, absente lorsque la correspondance porte sur le nom. */
  className?: string;
}

interface AllergyClass {
  /** Libellé affiché de la famille. */
  name: string;
  /** Termes, français et anglais, susceptibles d'être saisis comme allergie. */
  synonyms: string[];
  /** Préfixes ATC de la famille elle-même. */
  atcPrefixes: string[];
  /** Préfixes ATC d'une famille à réactivité croisée documentée. */
  crossReactiveAtcPrefixes?: string[];
}

const ALLERGY_CLASSES: readonly AllergyClass[] = [
  {
    name: "Pénicillines",
    synonyms: ["penicilline", "penicillin", "beta-lactamine", "betalactamine", "amoxicilline", "ampicilline"],
    atcPrefixes: ["J01C"],
    // Réactivité croisée pénicillines / céphalosporines : minoritaire mais documentée.
    crossReactiveAtcPrefixes: ["J01D"],
  },
  {
    name: "Céphalosporines",
    synonyms: ["cephalosporine", "cephalosporin", "cefixime", "ceftriaxone"],
    atcPrefixes: ["J01D"],
    crossReactiveAtcPrefixes: ["J01C"],
  },
  {
    name: "Sulfamides",
    synonyms: ["sulfamide", "sulfonamide", "sulfamethoxazole", "bactrim", "cotrimoxazole"],
    atcPrefixes: ["J01E", "D06BA"],
  },
  {
    name: "Anti-inflammatoires non stéroïdiens",
    synonyms: ["ains", "nsaid", "anti-inflammatoire", "ibuprofene", "diclofenac", "ketoprofene"],
    atcPrefixes: ["M01A", "M02AA"],
    // L'intolérance aux AINS s'étend fréquemment aux salicylés.
    crossReactiveAtcPrefixes: ["N02BA", "B01AC06"],
  },
  {
    name: "Salicylés",
    synonyms: ["aspirine", "aspirin", "salicyle", "acide acetylsalicylique"],
    atcPrefixes: ["N02BA", "B01AC06"],
    crossReactiveAtcPrefixes: ["M01A"],
  },
  {
    name: "Macrolides",
    synonyms: ["macrolide", "erythromycine", "azithromycine", "clarithromycine"],
    atcPrefixes: ["J01F"],
  },
  {
    name: "Quinolones",
    synonyms: ["quinolone", "fluoroquinolone", "ciprofloxacine", "levofloxacine", "ofloxacine"],
    atcPrefixes: ["J01M"],
  },
  {
    name: "Cyclines",
    synonyms: ["cycline", "tetracycline", "doxycycline", "minocycline"],
    atcPrefixes: ["J01A"],
  },
  {
    name: "Aminosides",
    synonyms: ["aminoside", "aminoglycoside", "gentamicine", "amikacine"],
    atcPrefixes: ["J01G"],
  },
  {
    name: "Opiacés",
    synonyms: ["opiace", "opioide", "opioid", "morphine", "codeine", "tramadol"],
    atcPrefixes: ["N02A"],
  },
  {
    name: "Produits de contraste iodés",
    synonyms: ["iode", "iodine", "produit de contraste", "contraste iode"],
    atcPrefixes: ["V08A"],
  },
  {
    name: "Héparines",
    synonyms: ["heparine", "heparin", "enoxaparine"],
    atcPrefixes: ["B01AB"],
  },
  {
    name: "Anesthésiques locaux",
    synonyms: ["anesthesique local", "lidocaine", "xylocaine", "procaine"],
    atcPrefixes: ["N01B"],
  },
] as const;

/**
 * Neutralise casse, accents et ponctuation pour comparer des saisies libres :
 * « Pénicilline », « penicilline » et « PENICILLINE » doivent se rejoindre.
 */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesAnyPrefix(atcCode: string, prefixes: readonly string[]): boolean {
  const upperCode = atcCode.toUpperCase();
  return prefixes.some((prefix) => upperCode.startsWith(prefix));
}

function findClassForAllergy(normalizedAllergy: string): AllergyClass | undefined {
  return ALLERGY_CLASSES.find((allergyClass) =>
    allergyClass.synonyms.some((synonym) => normalizedAllergy.includes(normalize(synonym)))
  );
}

/**
 * Renvoie le premier conflit détecté entre un médicament et les allergies du
 * patient, ou `null`. Les correspondances de classe priment sur les
 * correspondances de nom : elles portent une information clinique plus sûre.
 */
export function detectAllergyConflict(
  drugName: string,
  atcCode: string | null | undefined,
  allergies: readonly string[]
): AllergyConflict | null {
  const normalizedDrugName = normalize(drugName);
  if (!normalizedDrugName) return null;

  const meaningfulAllergies = allergies.filter((allergy) => normalize(allergy).length > 0);

  if (atcCode) {
    for (const allergy of meaningfulAllergies) {
      const allergyClass = findClassForAllergy(normalize(allergy));
      if (!allergyClass) continue;

      if (matchesAnyPrefix(atcCode, allergyClass.atcPrefixes)) {
        return { allergy, kind: "same_class", className: allergyClass.name };
      }

      if (
        allergyClass.crossReactiveAtcPrefixes &&
        matchesAnyPrefix(atcCode, allergyClass.crossReactiveAtcPrefixes)
      ) {
        return { allergy, kind: "cross_reactivity", className: allergyClass.name };
      }
    }
  }

  // Repli sur le nom : couvre les allergies notées avec un nom commercial précis,
  // hors de toute famille répertoriée.
  for (const allergy of meaningfulAllergies) {
    if (normalizedDrugName.includes(normalize(allergy))) {
      return { allergy, kind: "drug_name" };
    }
  }

  return null;
}
