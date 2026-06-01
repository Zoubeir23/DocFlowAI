"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { importPatientCarnet } from "@/actions/patients";
import { patientSchema, type PatientInput } from "@/lib/validations";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ImportCarnetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clinicId: string;
}

export function ImportCarnetDialog({ open, onOpenChange, clinicId }: ImportCarnetDialogProps) {
  const t = useTranslations("patients");
  const [publicCode, setPublicCode] = useState("");
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PatientInput>({
    resolver: zodResolver(patientSchema),
  });

  const importMutation = useMutation({
    mutationFn: (data: PatientInput) => importPatientCarnet(clinicId, publicCode, data),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t("carnet.successToast"));
        queryClient.invalidateQueries({ queryKey: ["patients"] });
        onOpenChange(false);
        reset();
        setPublicCode("");
      } else {
        toast.error(result.error || t("carnet.errorImport"));
      }
    },
  });

  const onSubmit = (data: PatientInput) => {
    if (!publicCode.trim()) {
      toast.error(t("carnet.errorNoCode"));
      return;
    }
    importMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t("carnet.importTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>{t("carnet.codeLabel")}</Label>
            <Input
              placeholder={t("carnet.codePlaceholder")}
              value={publicCode}
              onChange={(e) => setPublicCode(e.target.value)}
              className="rounded-xl bg-card border-border"
            />
            <p className="text-xs text-muted-foreground">{t("carnet.codeHint")}</p>
          </div>

          <div className="space-y-2">
            <Label>{t("carnet.fullName")}</Label>
            <Input {...register("full_name")} className="rounded-xl" placeholder="John Doe" />
            {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>{t("carnet.phone")}</Label>
            <Input {...register("phone")} className="rounded-xl" placeholder="+33 6 12 34 56 78" />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>{t("carnet.email")}</Label>
            <Input {...register("email")} type="email" className="rounded-xl" placeholder="john@example.com" />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>{t("carnet.notes")}</Label>
            <Textarea {...register("notes")} className="rounded-xl min-h-[80px]" placeholder="Informations complémentaires..." />
            {errors.notes && <p className="text-xs text-red-500">{errors.notes.message}</p>}
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              {t("carnet.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={importMutation.isPending}
              className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {importMutation.isPending ? t("carnet.importing") : t("carnet.importButton")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
