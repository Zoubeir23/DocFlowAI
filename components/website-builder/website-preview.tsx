"use client";

import { OracareEditorialPreview } from "./previews/oracare-editorial-preview";
import { LumierePriveePreview } from "./previews/lumiere-privee-preview";
import { StructureBrutPreview } from "./previews/structure-brut-preview";

// Chaque aperçu compact vit dans son propre fichier sous ./previews — ce
// composant ne fait que router vers le bon rendu selon style_config.style.
export function WebsitePreview({ website }: { website: any }) {
  switch (website?.style_config?.style) {
    case "lumiere-privee":
      return <LumierePriveePreview website={website} />;
    case "structure-brut":
      return <StructureBrutPreview website={website} />;
    default:
      return <OracareEditorialPreview website={website} />;
  }
}
