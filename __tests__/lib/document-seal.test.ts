import { describe, it, expect, beforeAll, afterAll } from "vitest";

let buildDocumentFingerprint: typeof import("@/lib/document-seal").buildDocumentFingerprint;
let computeDocumentSeal: typeof import("@/lib/document-seal").computeDocumentSeal;
let verifyDocumentSeal: typeof import("@/lib/document-seal").verifyDocumentSeal;
let formatSealReference: typeof import("@/lib/document-seal").formatSealReference;
type SealableDocument = import("@/lib/document-seal").SealableDocument;

const originalSecret = process.env.DOCUMENT_SEAL_SECRET;

beforeAll(async () => {
  // computeDocumentSeal exige un secret serveur (HMAC) — sans lui, le module
  // lève dès le premier appel. Import différé pour isoler cette valeur du
  // reste de la suite.
  process.env.DOCUMENT_SEAL_SECRET = "test-secret-do-not-use-in-production";
  ({ buildDocumentFingerprint, computeDocumentSeal, verifyDocumentSeal, formatSealReference } =
    await import("@/lib/document-seal"));
});

afterAll(() => {
  // `process.env.KEY = undefined` coercerait en la chaîne "undefined" plutôt
  // que de retirer la variable — restaurer l'absence d'origine exige delete.
  if (originalSecret === undefined) delete process.env.DOCUMENT_SEAL_SECRET;
  else process.env.DOCUMENT_SEAL_SECRET = originalSecret;
});

const BASE_DOCUMENT: SealableDocument = {
  document_type: "prescription",
  patient_full_name: "Amina Diallo",
  patient_age_years: 42,
  patient_sex: "female",
  patient_weight_kg: 68,
  patient_blood_group: "O+",
  validated_diagnosis_code: "BA00",
  validated_diagnosis_name: "Hypertension essentielle",
  chief_complaint: "Céphalées répétées",
  clinical_notes: "Tension élevée sur trois mesures.",
  treatments: [{ drug_name: "Lisinopril", dosage_mg: "10 mg", duration_days: 30 }],
  recommendations: ["Réduire le sel"],
  follow_up_delay_days: 30,
  follow_up_tests: ["Ionogramme"],
  practitioner_name: "Martin",
  practitioner_title: "Dr.",
  practitioner_rpps: "10101010101",
  validated_by: "Dr. Martin",
  validated_by_user_id: "0f7a1c9e-3c5b-4c1a-9f2d-8e5b6a4c1d2f",
  validated_at: "2026-08-02T09:30:00.000Z",
};

function withChange(change: Partial<SealableDocument>): SealableDocument {
  return { ...BASE_DOCUMENT, ...change };
}

describe("computeDocumentSeal", () => {
  it("produit la même empreinte pour un contenu identique", () => {
    expect(computeDocumentSeal(BASE_DOCUMENT)).toBe(computeDocumentSeal({ ...BASE_DOCUMENT }));
  });

  it("ne dépend pas de l'ordre d'insertion des clés", () => {
    // Un objet reconstruit dans un autre ordre décrit le même document : il ne
    // doit pas déclencher une fausse alerte de falsification.
    const reordered = Object.fromEntries(
      Object.entries(BASE_DOCUMENT).reverse()
    ) as unknown as SealableDocument;

    expect(computeDocumentSeal(reordered)).toBe(computeDocumentSeal(BASE_DOCUMENT));
  });

  it("produit une empreinte HMAC-SHA256 hexadécimale, préfixée du marqueur de format", () => {
    expect(computeDocumentSeal(BASE_DOCUMENT)).toMatch(/^hmac:[0-9a-f]{64}$/);
  });
});

describe("détection des modifications", () => {
  const scenarios: Array<[string, Partial<SealableDocument>]> = [
    ["la posologie d'un traitement", {
      treatments: [{ drug_name: "Lisinopril", dosage_mg: "40 mg", duration_days: 30 }],
    }],
    ["l'ajout d'un traitement", {
      treatments: [
        { drug_name: "Lisinopril", dosage_mg: "10 mg", duration_days: 30 },
        { drug_name: "Tramadol", dosage_mg: "50 mg", duration_days: 7 },
      ],
    }],
    ["le diagnostic retenu", { validated_diagnosis_code: "5A11" }],
    ["l'identité du patient", { patient_full_name: "Amina Diallo-Sy" }],
    ["le numéro RPPS du praticien", { practitioner_rpps: "20202020202" }],
    ["le nom du validateur", { validated_by: "Dr. Autre" }],
    ["une recommandation", { recommendations: ["Réduire le sel", "Arrêter le tabac"] }],
    ["les notes cliniques", { clinical_notes: "Tension normale." }],
  ];

  for (const [label, change] of scenarios) {
    it(`rompt le sceau si l'on modifie ${label}`, () => {
      const seal = computeDocumentSeal(BASE_DOCUMENT);
      expect(verifyDocumentSeal(withChange(change), seal)).toBe("tampered");
    });
  }

  it("confirme un document intact", () => {
    const seal = computeDocumentSeal(BASE_DOCUMENT);
    expect(verifyDocumentSeal(BASE_DOCUMENT, seal)).toBe("sealed");
  });

  it("distingue un document jamais scellé d'un document altéré", () => {
    expect(verifyDocumentSeal(BASE_DOCUMENT, null)).toBe("unsealed");
    expect(verifyDocumentSeal(BASE_DOCUMENT, "")).toBe("unsealed");
  });

  it("traite un sceau d'un format antérieur au HMAC comme non vérifiable, jamais comme altéré", () => {
    // Un sceau produit avant ce format (SHA-256 non gardé) ne recalculera
    // jamais la même valeur que le HMAC actuel : le classer "tampered"
    // accuserait à tort un document jamais modifié. Le revérifier avec
    // l'ancien algorithme rouvrirait la forgeabilité que le HMAC corrige.
    const legacySha256Seal = "3f9a1c2b0d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e";
    expect(verifyDocumentSeal(BASE_DOCUMENT, legacySha256Seal)).toBe("unsealed");
  });
});

describe("buildDocumentFingerprint", () => {
  it("distingue null d'une chaîne vide", () => {
    const withNull = buildDocumentFingerprint(withChange({ clinical_notes: null }));
    const withEmpty = buildDocumentFingerprint(withChange({ clinical_notes: "" }));

    expect(withNull).not.toBe(withEmpty);
  });

  it("tient compte de l'ordre des traitements", () => {
    // Deux ordonnances listant les mêmes molécules dans un ordre différent sont
    // deux documents différents à l'impression : le sceau doit le refléter.
    const first = buildDocumentFingerprint(
      withChange({ treatments: [{ drug_name: "A" }, { drug_name: "B" }] })
    );
    const second = buildDocumentFingerprint(
      withChange({ treatments: [{ drug_name: "B" }, { drug_name: "A" }] })
    );

    expect(first).not.toBe(second);
  });
});

describe("formatSealReference", () => {
  it("met en forme un préfixe lisible pour impression", () => {
    expect(formatSealReference("a1b2c3d4e5f60718293a4b5c6d7e8f90")).toBe("A1B2-C3D4-E5F6-0718");
  });
});

describe("secret HMAC", () => {
  it("refuse de sceller un document sans DOCUMENT_SEAL_SECRET configuré", () => {
    const previous = process.env.DOCUMENT_SEAL_SECRET;
    delete process.env.DOCUMENT_SEAL_SECRET;
    try {
      expect(() => computeDocumentSeal(BASE_DOCUMENT)).toThrow(/DOCUMENT_SEAL_SECRET/);
    } finally {
      if (previous === undefined) delete process.env.DOCUMENT_SEAL_SECRET;
      else process.env.DOCUMENT_SEAL_SECRET = previous;
    }
  });

  it("produit des sceaux différents pour des secrets différents", () => {
    const previous = process.env.DOCUMENT_SEAL_SECRET;
    try {
      process.env.DOCUMENT_SEAL_SECRET = "secret-a";
      const sealA = computeDocumentSeal(BASE_DOCUMENT);
      process.env.DOCUMENT_SEAL_SECRET = "secret-b";
      const sealB = computeDocumentSeal(BASE_DOCUMENT);
      expect(sealA).not.toBe(sealB);
    } finally {
      if (previous === undefined) delete process.env.DOCUMENT_SEAL_SECRET;
      else process.env.DOCUMENT_SEAL_SECRET = previous;
    }
  });
});
