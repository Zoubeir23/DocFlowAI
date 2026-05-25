-- Migration 001 — Activer Supabase Realtime sur la table appointments
-- Nécessaire pour que le filtre clinic_id soit appliqué côté serveur (RLS)
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
