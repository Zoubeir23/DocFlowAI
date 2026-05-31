import type { WebhookEvent } from "@/lib/webhooks";

export const WEBHOOK_EVENTS: { value: WebhookEvent; label: string; description: string }[] = [
  { value: "appointment.created",   label: "Rendez-vous créé",    description: "Nouveau rendez-vous enregistré" },
  { value: "appointment.updated",   label: "Rendez-vous modifié", description: "Date/heure ou statut changé" },
  { value: "appointment.cancelled", label: "Rendez-vous annulé",  description: "Annulation par patient ou médecin" },
  { value: "appointment.completed", label: "Rendez-vous terminé", description: "Consultation marquée terminée" },
  { value: "patient.created",       label: "Nouveau patient",     description: "Premier rendez-vous d'un patient" },
];
