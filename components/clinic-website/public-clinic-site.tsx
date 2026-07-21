"use client";

import { OracareEditorialSite } from "./templates/oracare-editorial-site";
import { LumierePriveeSite } from "./templates/lumiere-privee-site";
import { StructureBrutSite } from "./templates/structure-brut-site";

interface PublicClinicSiteProps {
  website: any;
  clinic: any;
  services: any[];
  doctor: any;
}

// Chaque template de site public vit dans son propre fichier sous ./templates —
// ce composant ne fait que router vers le bon rendu selon style_config.style.
export function PublicClinicSite(props: PublicClinicSiteProps) {
  switch (props.website?.style_config?.style) {
    case "lumiere-privee":
      return <LumierePriveeSite {...props} />;
    case "structure-brut":
      return <StructureBrutSite {...props} />;
    default:
      return <OracareEditorialSite {...props} />;
  }
}
