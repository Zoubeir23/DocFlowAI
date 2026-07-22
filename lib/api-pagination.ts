export interface PaginationResult {
  limit: number;
  offset: number;
}

export interface PaginationError {
  error: string;
}

// Valide une valeur limit/offset arbitraire (query param string ou argument
// JSON-RPC déjà numérique) — un input non numérique (`?limit=abc`) ne doit
// jamais se propager en NaN jusqu'à .range()/.limit() côté Supabase, qui
// répond alors par une erreur PostgREST opaque remontée en 500 générique
// au lieu d'un 400 explicite.
function parseNonNegativeInt(value: unknown, fallback: number): number | null {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return null;
  return parsed;
}

export function parsePaginationParams(
  searchParams: URLSearchParams,
  { defaultLimit = 50, maxLimit = 100 }: { defaultLimit?: number; maxLimit?: number } = {}
): PaginationResult | PaginationError {
  const limit = parseNonNegativeInt(searchParams.get("limit"), defaultLimit);
  if (limit === null || limit < 1) {
    return { error: "limit must be a positive integer" };
  }

  const offset = parseNonNegativeInt(searchParams.get("offset"), 0);
  if (offset === null) {
    return { error: "offset must be a non-negative integer" };
  }

  return { limit: Math.min(limit, maxLimit), offset };
}

// Variante pour les arguments d'un tool MCP (déjà un objet JS, pas une
// querystring) — même validation, limit seul (pas de pagination par offset
// côté MCP).
export function parseToolLimit(
  value: unknown,
  { defaultLimit = 20, maxLimit = 50 }: { defaultLimit?: number; maxLimit?: number } = {}
): number | null {
  const parsed = parseNonNegativeInt(value, defaultLimit);
  if (parsed === null || parsed < 1) return null;
  return Math.min(parsed, maxLimit);
}
