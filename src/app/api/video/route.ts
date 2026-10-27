// src/app/api/video/route.ts
// Cherche UNE vidéo YouTube pour un lieu, seulement à la demande, avec un cache de 7 jours.
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
type Video = { videoId: string; titre: string; chaine: string; miniature?: string };

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 3 || q.length > 120) {
    return Response.json({ erreur: "Requête invalide" }, { status: 400 });
  }

  // 1. Déjà cherché ces 7 derniers jours ? On ne repaie pas (« aucune » = déjà cherché, rien trouvé)
  const cle = `travelmap:video:${q.toLowerCase()}`;
  const enCache = await redis.get<Video | "aucune">(cle);
  if (enCache) return Response.json({ video: enCache === "aucune" ? null : enCache });

  // 2. Recherche YouTube : vidéos intégrables, de durée moyenne (4 à 20 min), contenu filtré
  const params = new URLSearchParams({
    part: "snippet",
    q,
    type: "video",
    maxResults: "5",
    videoEmbeddable: "true",
    videoDuration: "medium",
    safeSearch: "strict",
    relevanceLanguage: "fr", // préférence pour le français, pas une obligation
    key: process.env.YOUTUBE_API_KEY ?? "",
  });
  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
  if (!res.ok) return Response.json({ video: null }, { status: 502 });

  const item = (await res.json()).items?.[0];
  const video: Video | null = item
    ? {
        videoId: item.id.videoId,
        titre: item.snippet.title,
        chaine: item.snippet.channelTitle,
        miniature: item.snippet.thumbnails?.medium?.url,
      }
    : null;

  // 3. On garde le résultat 7 jours, même vide, pour ne jamais refaire la même recherche
  await redis.set(cle, video ?? "aucune", { ex: 60 * 60 * 24 * 7 });
  return Response.json({ video });
}
