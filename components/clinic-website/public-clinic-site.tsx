"use client";

import { OracareEditorialSite } from "./templates/oracare-editorial-site";

interface PublicClinicSiteProps {
  website: any;
  clinic: any;
  services: any[];
  doctor: any;
}

// Chaque template de site public vit dans son propre fichier sous ./templates —
// ce composant ne fait que router vers le bon rendu selon style_config.style.
export function PublicClinicSite(props: PublicClinicSiteProps) {
  return <OracareEditorialSite {...props} />;
}
