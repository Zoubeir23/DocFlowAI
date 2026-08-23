import { createHmac } from "node:crypto";

/**
 * Scellement des documents médicaux.
 *
 * La signature apposée sur une ordonnance est une image : elle ne dit rien du
 * contenu qu'elle accompagne. Modifier un traitement après validation
 * réaffichait jusqu'ici la même signature, sans que rien ne le signale.
 *
 * On calcule donc une empreinte du contenu au moment où le document est produit,
 * et on la conserve. À l'affichage, l'empreinte est recalculée : toute
 * divergence prouve une modification postérieure au scellement.
 *
 * Le sceau est un HMAC-SHA256, pas un simple SHA-256 : un hachage non gardé
 * par une clé serait recalculable par quiconque connaît l'algorithme (public,
 * ce fichier), ce qui permettrait de forger un sceau valide pour un contenu
 * modifié sans jamais passer par cette fonction (voir
 * tasks/audit-2026-08-23-full-codebase.md, C2). Seul le serveur, détenteur de
 * `DOCUMENT_SEAL_SECRET`, peut produire un sceau qui vérifie.
 *
 * PORTÉE : c'est un contrôle d'intégrité, pas une signature électronique au sens
 * eIDAS. Il détecte une modification du contenu après coup ; il ne prouve pas
 * l'identité du signataire par un certificat, et l'horodatage est celui du
 * serveur, non celui d'une autorité de temps. L'imputabilité repose sur
 * `sealed_by_user_id`, complétée par `validated_by_user_id`.
 */

/**
 * Marque le format HMAC : un sceau produit avant ce format (SHA-256 non
 * gardé) ne porte pas ce préfixe. Sans lui, un document scellé avant ce
 * changement recalculerait toujours un sceau différent et serait signalé
 * « altéré » à tort — une fausse accusation sur un document jamais modifié.
 * Un ancien sceau reste néanmoins traité comme non vérifiable plutôt que
 * revérifié avec l'ancien algorithme : celui-ci n'étant pas gardé par clé,
 * le revérifier indéfiniment laisserait un chemin de contournement permanent
 * (omettre le préfixe) au correctif de forgeabilité (voir
 * tasks/audit-2026-08-23-full-codebase.md, C2).
 */
const SEAL_FORMAT_PREFIX = "hmac:";

function getDocumentSealSecret(): string {
  const secret = process.env.DOCUMENT_SEAL_SECRET;
  if (!secret) {
    throw new Error(
      "DOCUMENT_SEAL_SECRET n'est pas configuré : le scellement des documents médicaux est indisponible."
    );
  }
  return secret;
}

/** Champs du diagnostic qui figurent sur le document imprimé. */
export interface SealableDocument {
  document_type: string | null;
  patient_full_name: string | null;
  patient_age_years: number | null;
  patient_sex: string | null;
  patient_weight_kg: number | null;
  patient_blood_group: string | null;
  validated_diagnosis_code: string | null;
  validated_diagnosis_name: string | null;
  chief_complaint: string | null;
  clinical_notes: string | null;
  treatments: unknown[];
  recommendations: string[];
  follow_up_delay_days: number | null;
  follow_up_tests: string[];
  practitioner_name: string | null;
  practitioner_title: string | null;
  practitioner_rpps: string | null;
  validated_by: string | null;
  validated_by_user_id: string | null;
  validated_at: string | null;
}

/**
 * Sérialise une valeur de façon déterministe.
 *
 * `JSON.stringify` conserve l'ordre d'insertion des clés : deux objets
 * identiques mais construits différemment produiraient deux empreintes
 * distinctes, et donc une fausse alerte de falsification. On trie donc les clés
 * à tous les niveaux.
 */
function canonicalize(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([key, entryValue]) => `${JSON.stringify(key)}:${canonicalize(entryValue)}`);
    return `{${entries.join(",")}}`;
  }

  return JSON.stringify(value);
}

/**
 * Représentation canonique du document, dans un ordre de champs figé.
 *
 * Exportée pour les tests : c'est elle qui détermine ce qu'une modification
 * rend détectable. Tout champ absent d'ici pourra être modifié sans rompre le
 * sceau.
 */
export function buildDocumentFingerprint(document: SealableDocument): string {
  return canonicalize({
    document_type: document.document_type,
    patient_full_name: document.patient_full_name,
    patient_age_years: document.patient_age_years,
    patient_sex: document.patient_sex,
    patient_weight_kg: document.patient_weight_kg,
    patient_blood_group: document.patient_blood_group,
    validated_diagnosis_code: document.validated_diagnosis_code,
    validated_diagnosis_name: document.validated_diagnosis_name,
    chief_complaint: document.chief_complaint,
    clinical_notes: document.clinical_notes,
    treatments: document.treatments,
    recommendations: document.recommendations,
    follow_up_delay_days: document.follow_up_delay_days,
    follow_up_tests: document.follow_up_tests,
    practitioner_name: document.practitioner_name,
    practitioner_title: document.practitioner_title,
    practitioner_rpps: document.practitioner_rpps,
    validated_by: document.validated_by,
    validated_by_user_id: document.validated_by_user_id,
    validated_at: document.validated_at,
  });
}

/** Empreinte HMAC-SHA256 du document, préfixée du marqueur de format. */
export function computeDocumentSeal(document: SealableDocument): string {
  const digest = createHmac("sha256", getDocumentSealSecret())
    .update(buildDocumentFingerprint(document), "utf8")
    .digest("hex");
  return `${SEAL_FORMAT_PREFIX}${digest}`;
}

export type DocumentSealStatus = "sealed" | "unsealed" | "tampered";

/**
 * Compare l'empreinte conservée au contenu actuel.
 *
 * `unsealed` couvre les documents produits avant la mise en place du
 * scellement, ou avec un format de sceau antérieur au HMAC (voir
 * SEAL_FORMAT_PREFIX) : ils ne sont pas suspects, ils sont simplement non
 * vérifiables avec le schéma actuel.
 */
export function verifyDocumentSeal(
  document: SealableDocument,
  storedSeal: string | null | undefined
): DocumentSealStatus {
  if (!storedSeal || !storedSeal.startsWith(SEAL_FORMAT_PREFIX)) return "unsealed";
  return computeDocumentSeal(document) === storedSeal ? "sealed" : "tampered";
}

/** Référence courte imprimable, pour rapprocher un document papier de son sceau. */
export function formatSealReference(seal: string): string {
  const digest = seal.startsWith(SEAL_FORMAT_PREFIX) ? seal.slice(SEAL_FORMAT_PREFIX.length) : seal;
  return digest.slice(0, 16).toUpperCase().replace(/(.{4})(?=.)/g, "$1-");
}
