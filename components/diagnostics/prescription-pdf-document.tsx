"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { DiagnosticRecord } from "@/types";

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  consultation: "Compte rendu de consultation",
  prescription: "Ordonnance médicale",
  receipt: "Reçu médical",
  medical_report: "Rapport médical",
  sick_leave: "Certificat médical",
};

const AGE_GROUP_LABELS: Record<string, string> = {
  infant: "Nourrisson (0–3 ans)",
  toddler: "Petit enfant (3–5 ans)",
  child: "Enfant (5–12 ans)",
  minor: "Mineur (12–18 ans)",
  adult: "Adulte (18+)",
};

const ROUTE_LABELS: Record<string, string> = {
  oral: "Voie orale",
  iv: "Intraveineuse (IV)",
  im: "Intramusculaire (IM)",
  topical: "Application locale",
  inhaled: "Inhalation",
  sublingual: "Sublinguale",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 48,
    backgroundColor: "#ffffff",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 16,
    marginBottom: 20,
  },
  clinicName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  practitionerName: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 3,
  },
  documentTypeBadge: {
    backgroundColor: "#111827",
    color: "#ffffff",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  dateText: {
    fontSize: 9,
    color: "#6b7280",
    marginTop: 6,
  },
  refText: {
    fontSize: 8,
    color: "#9ca3af",
    marginTop: 2,
    fontFamily: "Helvetica",
  },

  // Section
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },

  // Patient block
  patientBlock: {
    backgroundColor: "#f9fafb",
    borderRadius: 6,
    padding: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  patientField: {
    width: "48%",
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 7,
    color: "#9ca3af",
    marginBottom: 1,
  },
  fieldValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },

  // Diagnosis
  diagnosisBlock: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eef2ff",
    borderRadius: 6,
    padding: 10,
    gap: 10,
  },
  diagnosisCode: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: "#4338ca",
    backgroundColor: "#ffffff",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  diagnosisName: {
    fontSize: 10,
    color: "#111827",
    flex: 1,
  },
  validationNote: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 4,
  },

  // Vitals
  vitalsRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  vitalCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 4,
    padding: 8,
    alignItems: "center",
    minWidth: 64,
  },
  vitalLabel: {
    fontSize: 7,
    color: "#9ca3af",
    marginBottom: 2,
  },
  vitalValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },

  // Treatment
  treatmentBlock: {
    borderLeftWidth: 3,
    borderLeftColor: "#6366f1",
    backgroundColor: "#f5f3ff",
    borderRadius: 4,
    paddingLeft: 10,
    paddingRight: 10,
    paddingVertical: 8,
    marginBottom: 6,
  },
  treatmentDrug: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
  },
  treatmentDetails: {
    fontSize: 9,
    color: "#374151",
    marginTop: 2,
  },
  treatmentRoute: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 1,
  },
  treatmentPrecaution: {
    fontSize: 8,
    color: "#92400e",
    marginTop: 2,
    fontFamily: "Helvetica-Oblique",
  },
  genericBadge: {
    fontSize: 7,
    color: "#6b7280",
    marginLeft: 6,
  },

  // Recommendation
  recommendationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 3,
    gap: 6,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#10b981",
    marginTop: 2,
  },
  recommendationText: {
    fontSize: 9,
    color: "#374151",
    flex: 1,
  },

  // Follow-up
  followUpBlock: {
    backgroundColor: "#fffbeb",
    borderRadius: 6,
    padding: 10,
  },
  followUpText: {
    fontSize: 9,
    color: "#92400e",
  },
  followUpTest: {
    fontSize: 8,
    color: "#78350f",
    marginTop: 2,
  },

  // Clinical notes
  clinicalNotesText: {
    fontSize: 9,
    color: "#374151",
    lineHeight: 1.5,
  },

  // Divider
  divider: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    marginVertical: 12,
  },

  // Signature
  signatureSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 16,
  },
  signatureMeta: {
    fontSize: 8,
    color: "#9ca3af",
    lineHeight: 1.6,
  },
  signatureBox: {
    alignItems: "center",
    gap: 24,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#9ca3af",
    width: 140,
    marginTop: 16,
  },
  signatureName: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#374151",
    marginTop: 4,
    textAlign: "center",
  },
  signatureRpps: {
    fontSize: 7,
    color: "#9ca3af",
    textAlign: "center",
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: "#d1d5db",
  },
});

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface PrescriptionPdfDocumentProps {
  diagnostic: DiagnosticRecord;
  clinicName?: string;
}

export function PrescriptionPdfDocument({
  diagnostic,
  clinicName = "Cabinet médical",
}: PrescriptionPdfDocumentProps) {
  const documentTitle = DOCUMENT_TYPE_LABELS[diagnostic.document_type] ?? "Document médical";
  const formattedDate = formatDate(diagnostic.created_at);
  const hasVitals =
    diagnostic.vital_temperature ||
    diagnostic.vital_heart_rate ||
    diagnostic.vital_oxygen_saturation ||
    (diagnostic.vital_blood_pressure_systolic && diagnostic.vital_blood_pressure_diastolic);

  return (
    <Document title={documentTitle} author={diagnostic.practitioner_name ?? clinicName}>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.clinicName}>{clinicName}</Text>
            {diagnostic.practitioner_name && (
              <Text style={styles.practitionerName}>
                {diagnostic.practitioner_title} {diagnostic.practitioner_name}
                {diagnostic.practitioner_rpps ? `  —  N° ${diagnostic.practitioner_rpps}` : ""}
              </Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.documentTypeBadge}>{documentTitle}</Text>
            <Text style={styles.dateText}>Le {formattedDate}</Text>
            <Text style={styles.refText}>Réf : {diagnostic.id.slice(0, 8).toUpperCase()}</Text>
          </View>
        </View>

        {/* Patient */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Patient</Text>
          <View style={styles.patientBlock}>
            <View style={styles.patientField}>
              <Text style={styles.fieldLabel}>Nom complet</Text>
              <Text style={styles.fieldValue}>{diagnostic.patient_full_name}</Text>
            </View>
            <View style={styles.patientField}>
              <Text style={styles.fieldLabel}>Âge</Text>
              <Text style={styles.fieldValue}>{diagnostic.patient_age_years} ans</Text>
            </View>
            <View style={styles.patientField}>
              <Text style={styles.fieldLabel}>Catégorie</Text>
              <Text style={styles.fieldValue}>{AGE_GROUP_LABELS[diagnostic.patient_age_group]}</Text>
            </View>
            <View style={styles.patientField}>
              <Text style={styles.fieldLabel}>Sexe</Text>
              <Text style={styles.fieldValue}>
                {diagnostic.patient_sex === "male" ? "Masculin" : "Féminin"}
              </Text>
            </View>
            {diagnostic.patient_weight_kg && (
              <View style={styles.patientField}>
                <Text style={styles.fieldLabel}>Poids</Text>
                <Text style={styles.fieldValue}>{diagnostic.patient_weight_kg} kg</Text>
              </View>
            )}
            {diagnostic.patient_blood_group && diagnostic.patient_blood_group !== "unknown" && (
              <View style={styles.patientField}>
                <Text style={styles.fieldLabel}>Groupe sanguin</Text>
                <Text style={styles.fieldValue}>{diagnostic.patient_blood_group}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Diagnosis */}
        {diagnostic.validated_diagnosis_name && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Diagnostic retenu</Text>
            <View style={styles.diagnosisBlock}>
              {diagnostic.validated_diagnosis_code && (
                <Text style={styles.diagnosisCode}>{diagnostic.validated_diagnosis_code}</Text>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.diagnosisName}>{diagnostic.validated_diagnosis_name}</Text>
                {diagnostic.chief_complaint && (
                  <Text style={{ fontSize: 8, color: "#6b7280", marginTop: 2 }}>
                    Motif : {diagnostic.chief_complaint}
                  </Text>
                )}
              </View>
            </View>
            {diagnostic.validated_by && (
              <Text style={styles.validationNote}>
                Validé par {diagnostic.validated_by}
                {diagnostic.validated_at
                  ? ` le ${formatDate(diagnostic.validated_at)}`
                  : ""}
              </Text>
            )}
          </View>
        )}

        {/* Vital signs */}
        {hasVitals && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Signes vitaux</Text>
            <View style={styles.vitalsRow}>
              {diagnostic.vital_temperature && (
                <View style={styles.vitalCard}>
                  <Text style={styles.vitalLabel}>Temp.</Text>
                  <Text style={styles.vitalValue}>{diagnostic.vital_temperature}°C</Text>
                </View>
              )}
              {diagnostic.vital_blood_pressure_systolic && diagnostic.vital_blood_pressure_diastolic && (
                <View style={styles.vitalCard}>
                  <Text style={styles.vitalLabel}>TA</Text>
                  <Text style={styles.vitalValue}>
                    {diagnostic.vital_blood_pressure_systolic}/{diagnostic.vital_blood_pressure_diastolic}
                  </Text>
                </View>
              )}
              {diagnostic.vital_heart_rate && (
                <View style={styles.vitalCard}>
                  <Text style={styles.vitalLabel}>FC</Text>
                  <Text style={styles.vitalValue}>{diagnostic.vital_heart_rate} bpm</Text>
                </View>
              )}
              {diagnostic.vital_respiratory_rate && (
                <View style={styles.vitalCard}>
                  <Text style={styles.vitalLabel}>FR</Text>
                  <Text style={styles.vitalValue}>{diagnostic.vital_respiratory_rate}/min</Text>
                </View>
              )}
              {diagnostic.vital_oxygen_saturation && (
                <View style={styles.vitalCard}>
                  <Text style={styles.vitalLabel}>SpO₂</Text>
                  <Text style={styles.vitalValue}>{diagnostic.vital_oxygen_saturation}%</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Clinical notes */}
        {diagnostic.clinical_notes && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Notes cliniques</Text>
            <Text style={styles.clinicalNotesText}>{diagnostic.clinical_notes}</Text>
          </View>
        )}

        {/* Treatments */}
        {diagnostic.treatments && diagnostic.treatments.length > 0 && (
          <View style={styles.section}>
            <View style={styles.divider} />
            <Text style={styles.sectionLabel}>Traitement prescrit</Text>
            {diagnostic.treatments.map((treatment, index) => (
              <View key={index} style={styles.treatmentBlock}>
                <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                  <Text style={styles.treatmentDrug}>{treatment.drug_name}</Text>
                  {treatment.is_generic && (
                    <Text style={styles.genericBadge}>(générique autorisé)</Text>
                  )}
                </View>
                <Text style={styles.treatmentDetails}>
                  {treatment.dosage_mg ? `${treatment.dosage_mg}  —  ` : ""}
                  {treatment.frequency}  —  {treatment.duration_days} jour{treatment.duration_days > 1 ? "s" : ""}
                </Text>
                <Text style={styles.treatmentRoute}>{ROUTE_LABELS[treatment.route]}</Text>
                {treatment.precautions && (
                  <Text style={styles.treatmentPrecaution}>⚠ {treatment.precautions}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Recommendations */}
        {diagnostic.recommendations && diagnostic.recommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Recommandations</Text>
            {diagnostic.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.recommendationText}>{rec}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Follow-up */}
        {(diagnostic.follow_up_delay_days ||
          (diagnostic.follow_up_tests && diagnostic.follow_up_tests.length > 0)) && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Suivi</Text>
            <View style={styles.followUpBlock}>
              {diagnostic.follow_up_delay_days && (
                <Text style={styles.followUpText}>
                  Prochaine consultation dans {diagnostic.follow_up_delay_days} jour{diagnostic.follow_up_delay_days > 1 ? "s" : ""}
                </Text>
              )}
              {diagnostic.follow_up_tests?.map((test, index) => (
                <Text key={index} style={styles.followUpTest}>• {test}</Text>
              ))}
            </View>
          </View>
        )}

        {/* Signature */}
        <View style={styles.signatureSection}>
          <View>
            <Text style={styles.signatureMeta}>Document généré le {formattedDate}</Text>
            <Text style={styles.signatureMeta}>Réf : {diagnostic.id.slice(0, 8).toUpperCase()}</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={{ fontSize: 8, color: "#9ca3af" }}>Signature et cachet</Text>
            <View style={styles.signatureLine} />
            {diagnostic.practitioner_name && (
              <Text style={styles.signatureName}>
                {diagnostic.practitioner_title} {diagnostic.practitioner_name}
              </Text>
            )}
            {diagnostic.practitioner_rpps && (
              <Text style={styles.signatureRpps}>N° {diagnostic.practitioner_rpps}</Text>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{clinicName}</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} / ${totalPages}`
          } />
        </View>
      </Page>
    </Document>
  );
}
