import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export interface WebhookUrlValidationResult {
  valid: boolean;
  error?: string;
}

// Noms d'hôte qui pointent toujours vers l'infrastructure locale/interne.
const BLOCKED_HOSTNAME_SUFFIXES = [".localhost", ".local", ".internal"];
const BLOCKED_HOSTNAMES = new Set(["localhost", "metadata.google.internal"]);

function parseIpv4Octets(address: string): number[] | null {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => Number.isNaN(octet))) return null;
  return octets;
}

export function isPrivateIpAddress(address: string): boolean {
  const version = isIP(address);

  if (version === 4) {
    const octets = parseIpv4Octets(address);
    if (!octets) return true;
    const [first, second] = octets;

    if (first === 0 || first === 10 || first === 127) return true;
    if (first === 169 && second === 254) return true; // link-local (métadonnées cloud)
    if (first === 172 && second >= 16 && second <= 31) return true;
    if (first === 192 && second === 168) return true;
    if (first === 100 && second >= 64 && second <= 127) return true; // CGNAT
    if (first === 192 && second === 0) return true; // IETF protocol assignments
    if (first === 198 && (second === 18 || second === 19)) return true; // benchmarking
    if (first >= 224) return true; // multicast + réservé
    return false;
  }

  if (version === 6) {
    const normalized = address.toLowerCase();
    if (normalized === "::" || normalized === "::1") return true;
    if (normalized.startsWith("fe8") || normalized.startsWith("fe9")) return true; // link-local
    if (normalized.startsWith("fea") || normalized.startsWith("feb")) return true;
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // ULA
    // IPv4 mappée en IPv6 (::ffff:10.0.0.1) — valider la partie IPv4
    const mappedMatch = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mappedMatch) return isPrivateIpAddress(mappedMatch[1]);
    return false;
  }

  // Pas une IP littérale reconnue — l'appelant doit résoudre le DNS
  return false;
}

export function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  if (BLOCKED_HOSTNAMES.has(normalized)) return true;
  return BLOCKED_HOSTNAME_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
}

/**
 * Valide une URL de webhook contre les attaques SSRF :
 * HTTPS obligatoire, pas d'identifiants dans l'URL, hôte non interne,
 * et aucune adresse résolue dans une plage IP privée.
 */
export async function validateWebhookUrl(rawUrl: string): Promise<WebhookUrlValidationResult> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return { valid: false, error: "URL invalide" };
  }

  if (parsedUrl.protocol !== "https:") {
    return { valid: false, error: "L'URL doit utiliser HTTPS" };
  }

  if (parsedUrl.username || parsedUrl.password) {
    return { valid: false, error: "L'URL ne doit pas contenir d'identifiants" };
  }

  // Un hostname IPv6 arrive entre crochets dans URL.hostname
  const hostname = parsedUrl.hostname.replace(/^\[|\]$/g, "");

  if (isBlockedHostname(hostname)) {
    return { valid: false, error: "Hôte interne non autorisé" };
  }

  if (isIP(hostname)) {
    if (isPrivateIpAddress(hostname)) {
      return { valid: false, error: "Les adresses IP privées ne sont pas autorisées" };
    }
    return { valid: true };
  }

  try {
    const resolvedAddresses = await lookup(hostname, { all: true });
    const hasPrivateAddress = resolvedAddresses.some((entry) =>
      isPrivateIpAddress(entry.address)
    );
    if (hasPrivateAddress) {
      return { valid: false, error: "L'hôte résout vers une adresse IP privée" };
    }
  } catch {
    return { valid: false, error: "Hôte introuvable (résolution DNS échouée)" };
  }

  return { valid: true };
}
