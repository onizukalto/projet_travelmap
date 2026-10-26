// src/lib/agent/limites.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Lit automatiquement UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN dans .env.local
const redis = Redis.fromEnv();

// Par visiteur : 20 messages sur 24 heures glissantes
export const limiteVisiteur = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 d"),
  prefix: "travelmap:visiteur",
});

// Pour tout le site : 150 messages par jour, pour protéger les quotas Groq et Google
export const limiteGlobale = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(150, "1 d"),
  prefix: "travelmap:global",
});

// Identifie un visiteur par son adresse IP (transmise par Vercel dans cet en-tête)
export function identifiantVisiteur(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
}
