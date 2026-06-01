"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Plus, Search, Phone, Mail, X, Hash } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { getPatientsWithCarnets } from "@/actions/patients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CarnetNumeriqueSection } from "@/components/patients/carnet-numerique-section";
import { ImportCarnetDialog } from "@/components/patients/import-carnet-dialog";

async function fetchClinicId() {
  const supabase = createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("clinic_id").eq("id", user.id).maybeSingle();
  return data?.clinic_id || null;
}

export default function CarnetsPage() {
  const t = useTranslations("carnets");
  const [search, setSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showImportCarnet, setShowImportCarnet] = useState(false);
  const queryClient = useQueryClient();

  const { data: clinicId } = useQuery({ queryKey: ["clinicId"], queryFn: fetchClinicId });

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["patients-with-carnets"],
    queryFn: getPatientsWithCarnets,
  });

  const filtered = patients.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.phone.includes(search) ||
    (p.carnet?.public_code || "").toLowerCase().includes(search.toLowerCase())
  );

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || null;

  const avatarColors = [
    "from-teal-500 to-cyan-500",
    "from-violet-500 to-purple-500",
    "from-rose-500 to-pink-500",
    "from-amber-500 to-orange-500",
    "from-blue-500 to-indigo-500",
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="section-header">
          <div className="icon-container bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <BookOpen className="w-5 h-5" strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="section-title">{t("title")}</h2>
            <p className="section-subtitle">
              {isLoading ? "..." : t("count", { count: patients.length })}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowImportCarnet(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("importButton")}
        </Button>
      </div>

      {clinicId && (
        <ImportCarnetDialog
          open={showImportCarnet}
          onOpenChange={(open) => {
            setShowImportCarnet(open);
            if (!open) queryClient.invalidateQueries({ queryKey: ["patients-with-carnets"] });
          }}
          clinicId={clinicId}
        />
      )}

      {/* Search */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t("searchPlaceholder")}
          className="pl-10 h-10 rounded-xl border-border bg-card text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left — patient list */}
        <div className="space-y-3">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass-card p-4 space-y-2">
                  <Skeleton className="h-4 w-32 rounded-lg" />
                  <Skeleton className="h-3 w-24 rounded-lg" />
                </div>
              ))
            : filtered.length === 0
            ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-xl bg-muted border border-border flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <p className="text-foreground font-medium">{t("empty")}</p>
                <p className="text-sm text-muted-foreground mt-1">{t("emptyHint")}</p>
              </div>
            )
            : filtered.map((patient, idx) => (
              <button
                key={patient.id}
                onClick={() => setSelectedPatientId(patient.id === selectedPatientId ? null : patient.id)}
                className={`w-full glass-card p-4 text-left hover-lift transition-all group ${
                  selectedPatientId === patient.id
                    ? "border-primary/40 ring-1 ring-primary/20"
                    : "hover:border-primary/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarColors[idx % avatarColors.length]} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
                    {patient.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate group-hover:text-primary transition-colors">
                      {patient.full_name}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" /> {patient.phone}
                      </span>
                      {patient.email && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" /> {patient.email}
                        </span>
                      )}
                    </div>
                  </div>
                  {patient.carnet?.public_code && (
                    <span className="flex items-center gap-1 text-xs font-mono bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg flex-shrink-0">
                      <Hash className="w-3 h-3" />
                      {patient.carnet.public_code}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2 pl-13">
                  {t("since")} {format(parseISO(patient.created_at), "MMM yyyy")}
                </p>
              </button>
            ))}
        </div>

        {/* Right — carnet detail */}
        <div>
          {selectedPatient ? (
            <CarnetNumeriqueSection patientId={selectedPatient.id} />
          ) : (
            <div className="glass-card p-10 text-center text-muted-foreground flex flex-col items-center justify-center h-full min-h-[200px]">
              <BookOpen className="w-10 h-10 mb-3 text-muted-foreground/30" />
              <p className="text-sm">{t("selectHint")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
