"use client";

import { useState, useTransition } from "react";
import { Building2, X, Loader2, Send, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendEnterpriseContactRequest, type EnterpriseContactData } from "@/actions/enterprise-contact";
import { useTranslations } from "next-intl";

interface EnterpriseContactModalProps {
  onClose: () => void;
}

const EMPTY_FORM: EnterpriseContactData = {
  organizationName: "",
  contactName: "",
  contactRole: "",
  email: "",
  phone: "",
  numberOfDoctors: "",
  message: "",
};

export function EnterpriseContactModal({ onClose }: EnterpriseContactModalProps) {
  const t = useTranslations("billing");
  const [isPendingSubmit, startSubmitTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<EnterpriseContactData>(EMPTY_FORM);

  const handleChange = (field: keyof EnterpriseContactData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    startSubmitTransition(async () => {
      const result = await sendEnterpriseContactRequest(formData);
      if (result.success) {
        setSubmitted(true);
      } else {
        setSubmitError(result.error ?? (t("failedToSave") as string));
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg">{t("enterprisePlanTitle")}</h3>
              <p className="text-xs text-muted-foreground">{t("enterpriseResponseTime")}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <h4 className="text-xl font-bold text-foreground">{t("messageSent")}</h4>
            <p className="text-muted-foreground text-sm">
              {t("teamWillContact")} <strong>{formData.email}</strong>.
            </p>
            <Button onClick={onClose} className="btn-primary mt-4">{t("closeBtn")}</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">{t("enterpriseFormOrganization")}</Label>
                <Input required placeholder={t("enterpriseFormOrgPlaceholder")} value={formData.organizationName} onChange={handleChange("organizationName")} className="rounded-xl border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">{t("enterpriseFormDoctorCount")}</Label>
                <select
                  required
                  value={formData.numberOfDoctors}
                  onChange={handleChange("numberOfDoctors")}
                  className="w-full h-10 px-3 border border-border rounded-xl bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">{t("enterpriseFormDoctorCountPlaceholder")}</option>
                  <option value="11-25">11 – 25</option>
                  <option value="26-50">26 – 50</option>
                  <option value="51-100">51 – 100</option>
                  <option value="100+">100+</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">{t("enterpriseFormYourName")}</Label>
                <Input required placeholder={t("enterpriseFormNamePlaceholder")} value={formData.contactName} onChange={handleChange("contactName")} className="rounded-xl border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">{t("enterpriseFormRole")}</Label>
                <Input placeholder={t("enterpriseFormRolePlaceholder")} value={formData.contactRole} onChange={handleChange("contactRole")} className="rounded-xl border-border" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">{t("enterpriseFormProfessionalEmail")}</Label>
                <Input required type="email" placeholder={t("enterpriseFormEmailPlaceholder")} value={formData.email} onChange={handleChange("email")} className="rounded-xl border-border" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">{t("enterpriseFormPhone")}</Label>
                <Input placeholder={t("enterpriseFormPhonePlaceholder")} value={formData.phone} onChange={handleChange("phone")} className="rounded-xl border-border" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-foreground">{t("enterpriseFormNeed")}</Label>
              <Textarea rows={3} placeholder={t("enterpriseFormNeedPlaceholder")} value={formData.message} onChange={handleChange("message")} className="rounded-xl border-border resize-none" />
            </div>

            {submitError && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {submitError}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl border-border">
                {t("enterpriseFormCancel")}
              </Button>
              <Button type="submit" disabled={isPendingSubmit} className="flex-1 btn-primary">
                {isPendingSubmit ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t("enterpriseFormSending")}</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" />{t("enterpriseFormSend")}</>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
