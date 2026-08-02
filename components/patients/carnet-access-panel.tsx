"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { History, RefreshCw, ShieldAlert, Loader2 } from "lucide-react";
import { getCarnetImportHistory, regenerateCarnetCode } from "@/actions/patients";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface CarnetAccessPanelProps {
  patientId: string;
}

/**
 * Traçabilité du carnet : quelles cliniques ont rattaché ce dossier, et
 * révocation du code porteur.
 *
 * Le code donne accès à l'historique médical inter-cliniques ; le praticien doit
 * pouvoir constater les rattachements et régénérer le code si l'un d'eux est
 * illégitime.
 */
export function CarnetAccessPanel({ patientId }: CarnetAccessPanelProps) {
  const queryClient = useQueryClient();
  const [isRotating, setIsRotating] = useState(false);
  const [rotationError, setRotationError] = useState<string | null>(null);

  const { data: importEvents, isLoading } = useQuery({
    queryKey: ["carnet-import-history", patientId],
    queryFn: () => getCarnetImportHistory(patientId),
  });

  const rotateCode = async () => {
    setIsRotating(true);
    setRotationError(null);

    const result = await regenerateCarnetCode(patientId);

    if (result.success) {
      // La fiche patient porte l'ancien code : elle doit être rechargée.
      queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
      queryClient.invalidateQueries({ queryKey: ["patients-with-carnets"] });
    } else {
      setRotationError(result.error ?? "Échec de la régénération du code");
    }

    setIsRotating(false);
  };

  return (
    <div className="card-panel p-5 space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2.5">
          <History className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Accès au carnet</h3>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={rotateCode}
          disabled={isRotating}
          className="rounded-xl gap-1.5"
        >
          {isRotating ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          Régénérer le code
        </Button>
      </div>

      {rotationError && (
        <p className="flex items-center gap-2 text-sm text-destructive">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          {rotationError}
        </p>
      )}

      {isLoading ? (
        <Skeleton className="h-16 w-full rounded-xl" />
      ) : !importEvents || importEvents.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune autre clinique n&apos;a rattaché ce carnet.
        </p>
      ) : (
        <ul className="space-y-2">
          {importEvents.map((event) => (
            <li
              key={event.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/30 px-4 py-2.5"
            >
              <div>
                <p className="text-sm font-medium text-foreground">
                  {event.clinic?.name ?? "Clinique supprimée"}
                </p>
                {event.imported_by?.full_name && (
                  <p className="text-xs text-muted-foreground">
                    par {event.imported_by.full_name}
                  </p>
                )}
              </div>
              <time className="text-xs text-muted-foreground shrink-0">
                {format(parseISO(event.created_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}
              </time>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground border-t border-border pt-3">
        Régénérer le code invalide l&apos;ancien immédiatement. Les cliniques déjà rattachées
        conservent leur accès : leur lien repose sur le carnet, pas sur le code.
      </p>
    </div>
  );
}
