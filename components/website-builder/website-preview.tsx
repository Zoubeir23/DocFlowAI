"use client";

import { OracareEditorialPreview } from "./previews/oracare-editorial-preview";

// Chaque aperçu compact vit dans son propre fichier sous ./previews — ce
// composant ne fait que router vers le bon rendu selon style_config.style.
export function WebsitePreview({ website }: { website: any }) {
  return <OracareEditorialPreview website={website} />;
}
