-- ═══════════════════════════════════════════════════════════════════════════════
-- 006 — Contrainte anti-chevauchement de rendez-vous (audit bugs/sécurité 2026-07-20)
--
-- CRITICAL : createAppointment (dashboard) et POST /api/v1/appointments (API
-- publique) n'appliquaient aucun contrôle de chevauchement, contrairement à
-- create_booking_from_widget qui vérifie déjà les conflits sous verrou
-- (pg_advisory_xact_lock). Cette contrainte protège TOUS les chemins
-- d'insertion/mise à jour, présents et futurs, au niveau base de données.
--
-- Granularité alignée sur create_booking_from_widget : le contrôle se fait au
-- niveau de la clinique (clinic_id), pas du praticien, car practitioner_id
-- n'est pas renseigné par le widget ni par l'API publique.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE appointments
  ADD CONSTRAINT appointments_no_overlap
  EXCLUDE USING gist (
    clinic_id WITH =,
    tstzrange(start_at, end_at, '[)') WITH &&
  )
  WHERE (status IN ('booked', 'confirmed'));
