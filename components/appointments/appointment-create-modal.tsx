"use client";

import { useState, useTransition, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { createAppointment } from "@/actions/appointments";
import { toast } from "sonner";
import { Plus, Loader2, User2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Patient {
  id: string;
  full_name: string;
  phone: string;
}

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number | null;
}

interface Practitioner {
  id: string;
  full_name: string;
}

interface AppointmentCreateModalProps {
  onCreated?: () => void;
}

export function AppointmentCreateModal({ onCreated }: AppointmentCreateModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);

  const [patientId, setPatientId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [practitionerId, setPractitionerId] = useState("");
  const [startAt, setStartAt] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    const supabase = createClient() as any;

    async function loadData() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;
      const { data: userData } = await supabase
        .from("users")
        .select("clinic_id")
        .eq("id", authData.user.id)
        .single();
      if (!userData) return;

      const [patientsResult, servicesResult, practitionersResult] = await Promise.all([
        supabase
          .from("patients")
          .select("id, full_name, phone")
          .eq("clinic_id", userData.clinic_id)
          .order("full_name"),
        supabase
          .from("services")
          .select("id, name, duration_minutes, price")
          .eq("clinic_id", userData.clinic_id)
          .eq("active", true)
          .order("name"),
        supabase
          .from("users")
          .select("id, full_name")
          .eq("clinic_id", userData.clinic_id)
          .order("full_name"),
      ]);

      setPatients(patientsResult.data ?? []);
      setServices(servicesResult.data ?? []);
      setPractitioners(practitionersResult.data ?? []);
    }

    loadData();
  }, [open]);

  function computeEndAt(start: string, durationMinutes: number): string {
    const date = new Date(start);
    date.setMinutes(date.getMinutes() + durationMinutes);
    return date.toISOString();
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!patientId || !serviceId || !startAt) return;

    const selectedService = services.find((s) => s.id === serviceId);
    if (!selectedService) return;

    const endAt = computeEndAt(startAt, selectedService.duration_minutes);

    startTransition(async () => {
      const result = await createAppointment({
        patient_id: patientId,
        service_id: serviceId,
        start_at: new Date(startAt).toISOString(),
        end_at: endAt,
        notes: notes || null,
        status: "booked",
        source: "manual",
        practitioner_id: practitionerId || null,
      });

      if (result.success) {
        toast.success("Rendez-vous créé");
        setOpen(false);
        resetForm();
        onCreated?.();
      } else {
        toast.error(result.error ?? "Erreur lors de la création");
      }
    });
  }

  function resetForm() {
    setPatientId("");
    setServiceId("");
    setPractitionerId("");
    setStartAt("");
    setNotes("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nouveau RDV
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau rendez-vous</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Patient */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Patient *
            </label>
            <Select value={patientId} onValueChange={setPatientId} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner un patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.full_name}
                    <span className="text-muted-foreground text-xs ml-1">— {patient.phone}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Service */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Service *
            </label>
            <Select value={serviceId} onValueChange={setServiceId} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner un service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                    <span className="text-muted-foreground text-xs ml-1">— {service.duration_minutes} min</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Praticien */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <User2 className="w-3.5 h-3.5" />
              Praticien
            </label>
            <Select
              value={practitionerId || "unassigned"}
              onValueChange={(value) =>
                setPractitionerId(value === "unassigned" ? "" : value)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Non assigné" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Non assigné</SelectItem>
                {practitioners.map((practitioner) => (
                  <SelectItem key={practitioner.id} value={practitioner.id}>
                    {practitioner.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date/heure */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Date et heure *
            </label>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes internes…"
              rows={2}
              className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isPending || !patientId || !serviceId || !startAt}
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Créer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
