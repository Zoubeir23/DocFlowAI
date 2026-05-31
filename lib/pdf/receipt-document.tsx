import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

export interface ReceiptData {
  appointmentId: string;
  clinicName: string;
  patientFullName: string;
  patientPhone: string | null;
  patientEmail: string | null;
  serviceName: string;
  servicePrice: number | null;
  serviceDurationMinutes: number | null;
  startAt: string;
  endAt: string;
  notes: string | null;
  emittedAt: string;
}

Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 0,
    fontSize: 10,
    color: "#1a1a2e",
  },
  header: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 48,
    paddingTop: 36,
    paddingBottom: 28,
    marginBottom: 0,
  },
  headerBrand: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  headerClinic: {
    fontSize: 11,
    color: "rgba(255,255,255,0.85)",
    marginTop: 4,
  },
  headerTitle: {
    fontSize: 10,
    color: "rgba(255,255,255,0.65)",
    marginTop: 16,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  body: {
    paddingHorizontal: 48,
    paddingTop: 28,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: "#6b7280",
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    borderBottomStyle: "solid",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 7,
  },
  rowLabel: {
    fontSize: 10,
    color: "#6b7280",
    width: 140,
  },
  rowValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    flex: 1,
    textAlign: "right",
  },
  totalBox: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderStyle: "solid",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#166534",
  },
  totalAmount: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#166534",
  },
  notesBox: {
    backgroundColor: "#f9fafb",
    borderLeftWidth: 3,
    borderLeftColor: "#4f46e5",
    borderLeftStyle: "solid",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 2,
  },
  notesText: {
    fontSize: 10,
    color: "#374151",
    fontStyle: "italic",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    borderTopStyle: "solid",
    paddingTop: 10,
  },
  footerText: {
    fontSize: 9,
    color: "#9ca3af",
  },
});

function formatFrDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatFrDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(price);
}

export function ReceiptDocument({ data }: { data: ReceiptData }) {
  const showPrice = typeof data.servicePrice === "number" && data.servicePrice > 0;

  return (
    <Document
      title={`Reçu — ${data.patientFullName}`}
      author="DocFlow IA"
      subject="Reçu de consultation"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerBrand}>DocFlow IA</Text>
          <Text style={styles.headerClinic}>{data.clinicName}</Text>
          <Text style={styles.headerTitle}>Reçu de consultation</Text>
        </View>

        <View style={styles.body}>
          {/* Patient */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations patient</Text>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Nom complet</Text>
              <Text style={styles.rowValue}>{data.patientFullName}</Text>
            </View>
            {data.patientPhone && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Téléphone</Text>
                <Text style={styles.rowValue}>{data.patientPhone}</Text>
              </View>
            )}
            {data.patientEmail && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Email</Text>
                <Text style={styles.rowValue}>{data.patientEmail}</Text>
              </View>
            )}
          </View>

          {/* Consultation */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Détails de la consultation</Text>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Prestation</Text>
              <Text style={styles.rowValue}>{data.serviceName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Date</Text>
              <Text style={styles.rowValue}>{formatFrDateTime(data.startAt)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Fin</Text>
              <Text style={styles.rowValue}>{formatFrDateTime(data.endAt)}</Text>
            </View>
            {data.serviceDurationMinutes && (
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Durée</Text>
                <Text style={styles.rowValue}>{data.serviceDurationMinutes} min</Text>
              </View>
            )}
            {showPrice && (
              <View style={styles.totalBox}>
                <Text style={styles.totalLabel}>Montant total</Text>
                <Text style={styles.totalAmount}>{formatPrice(data.servicePrice!)}</Text>
              </View>
            )}
          </View>

          {/* Notes */}
          {data.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <View style={styles.notesBox}>
                <Text style={styles.notesText}>{data.notes}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Document généré le {formatFrDate(data.emittedAt)}</Text>
          <Text style={styles.footerText}>Réf. {data.appointmentId.slice(0, 8).toUpperCase()}</Text>
        </View>
      </Page>
    </Document>
  );
}
