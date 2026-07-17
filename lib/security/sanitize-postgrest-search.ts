const MAX_SEARCH_TERM_LENGTH = 100;

/**
 * Neutralise les caractères ayant un sens dans la syntaxe de filtre PostgREST
 * (`,` sépare les conditions d'un `.or()`, les parenthèses groupent, les
 * guillemets délimitent). Sans cela, un terme de recherche peut injecter des
 * conditions arbitraires dans le filtre.
 */
export function sanitizePostgrestSearchTerm(term: string): string {
  return term
    .replace(/[,()"'\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_SEARCH_TERM_LENGTH);
}
