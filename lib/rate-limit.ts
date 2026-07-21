import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// In-memory fallback for local dev / when Redis is not configured.
// Per-instance only — does not persist across serverless invocations.
const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

function inMemoryCheck(key: string, limit: number, windowSeconds: number): boolean {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const entry = inMemoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    inMemoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

function buildRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (process.env.NODE_ENV === "production") {
      console.error("[RateLimit] UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN sont requis en production");
    }
    return null;
  }
  return new Redis({ url, token });
}

export interface RateLimitConfig {
  requests: number;
  windowSeconds: number;
}

const WIDGET_CHAT_LIMIT: RateLimitConfig = { requests: 30, windowSeconds: 60 };
const WIDGET_BOOK_LIMIT: RateLimitConfig = { requests: 10, windowSeconds: 60 };
const WIDGET_SLOTS_LIMIT: RateLimitConfig = { requests: 60, windowSeconds: 60 };

function getLimiter(config: RateLimitConfig): Ratelimit | null {
  const redis = buildRedisClient();
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.requests, `${config.windowSeconds}s`),
    prefix: "docflow:rl",
    ephemeralCache: new Map(),
  });
}

export async function checkWidgetChatRateLimit(ip: string): Promise<boolean> {
  const limiter = getLimiter(WIDGET_CHAT_LIMIT);
  if (!limiter) return inMemoryCheck(`chat:${ip}`, WIDGET_CHAT_LIMIT.requests, WIDGET_CHAT_LIMIT.windowSeconds);
  const { success } = await limiter.limit(`chat:${ip}`);
  return success;
}

export async function checkWidgetBookRateLimit(ip: string): Promise<boolean> {
  const limiter = getLimiter(WIDGET_BOOK_LIMIT);
  if (!limiter) return inMemoryCheck(`book:${ip}`, WIDGET_BOOK_LIMIT.requests, WIDGET_BOOK_LIMIT.windowSeconds);
  const { success } = await limiter.limit(`book:${ip}`);
  return success;
}

export async function checkWidgetSlotsRateLimit(ip: string): Promise<boolean> {
  const limiter = getLimiter(WIDGET_SLOTS_LIMIT);
  if (!limiter) return inMemoryCheck(`slots:${ip}`, WIDGET_SLOTS_LIMIT.requests, WIDGET_SLOTS_LIMIT.windowSeconds);
  const { success } = await limiter.limit(`slots:${ip}`);
  return success;
}

// ── Limiters génériques (endpoints hors widget) ───────────────────────────────
// Requêtes API par IP : appliqué AVANT la validation de clé, donc protège aussi
// contre le brute-force de clés d'API (une clé invalide n'a pas de keyId).
const API_IP_LIMIT: RateLimitConfig = { requests: 120, windowSeconds: 60 };
// Endpoints authentifiés coûteux (upload, import, proxies externes) : par user.
const AUTHENTICATED_WRITE_LIMIT: RateLimitConfig = { requests: 30, windowSeconds: 60 };

/**
 * Vérifie une limite de débit pour un identifiant arbitraire (IP, userId…).
 * Retombe sur le store en mémoire si Redis n'est pas configuré.
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<boolean> {
  const limiter = getLimiter(config);
  if (!limiter) return inMemoryCheck(identifier, config.requests, config.windowSeconds);
  const { success } = await limiter.limit(identifier);
  return success;
}

export function checkApiIpRateLimit(ip: string): Promise<boolean> {
  return checkRateLimit(`api-ip:${ip}`, API_IP_LIMIT);
}

export function checkAuthenticatedRateLimit(userId: string, bucket: string): Promise<boolean> {
  return checkRateLimit(`auth:${bucket}:${userId}`, AUTHENTICATED_WRITE_LIMIT);
}

/**
 * Extrait l'IP client. x-real-ip est écrit directement par l'edge Vercel
 * (une seule valeur, non falsifiable par le client), on le préfère à
 * x-forwarded-for dont le contenu dépend de la chaîne de proxys en amont.
 */
export function getClientIp(request: Request): string {
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}
