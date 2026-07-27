"use client";

import { useState } from "react";
import Link from "next/link";
import { EnterpriseContactModal } from "@/components/billing/enterprise-contact-modal";

interface PricingPlanCtaProps {
  plan: string;
  href: string;
  label: string;
  highlighted: boolean;
}

export function PricingPlanCta({ plan, href, label, highlighted }: PricingPlanCtaProps) {
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const buttonClassName = `w-full ${highlighted ? "btn-void-primary" : "btn-void-ghost"}`;

  if (plan === "enterprise") {
    return (
      <>
        <button type="button" onClick={() => setShowEnterpriseModal(true)} className={`${buttonClassName} mt-auto`}>
          {label}
        </button>
        {showEnterpriseModal && (
          <EnterpriseContactModal onClose={() => setShowEnterpriseModal(false)} />
        )}
      </>
    );
  }

  return (
    <Link href={href} className="mt-auto">
      <button className={buttonClassName}>{label}</button>
    </Link>
  );
}
