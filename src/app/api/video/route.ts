// src/app/api/video/route.ts
// Cherche 10 vidéos, les note selon des critères explicites, et garde la meilleure. Cache de 7 jours.
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const CLE_API = process.env.YOUTUBE_API_KEY ?? "";

type Video = { videoId: string; titre: string; chaine: string; miniature?: string };
type Candidate = Video & { vues: number; likes: number; duree: number; publiee: string };

// Minuscules et sans accents, pour comparer des textes
const normaliser = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Durée YouTube « PT12M3S » → secondes
function enSecondes(iso: string) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  return m ? Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) : 0;
}

const BONUS = ["walk", "walking tour", "hike", "hiking", "trek", "drone", "4k", "guide", "visite", "randonnee", "things to do", "a voir"];
const MALUS = ["#shorts", "shorts", "prank", "reaction", "news", "accident", "compilation", "live"];

// La note d'une vidéo : chaque critère est visible et réglable
function noter(v: Candidate, nomLieu: string) {
  const titre = normaliser(v.titre);
  let note = 0;

  // 1. Pertinence : quelle part des mots du nom du lieu se retrouve dans le titre ?
  const mots = normaliser(nomLieu).split(/[\s,()'-]+/).filter((m) => m.length > 3);
  if (mots.length) note += (mots.filter((m) => titre.includes(m)).length / mots.length) * 40;

  // 2. Genre de vidéo : présentation du lieu plutôt que contenu hors sujet
  if (BONUS.some((b) => titre.includes(b))) note += 10;
  if (MALUS.some((m) => titre.includes(m))) note -= 30;

  // 3. Popularité, en échelle logarithmique : 1 000 vues = 15, 1 million = 30
  note += Math.min(Math.log10(v.vues + 1) * 5, 30);

  // 4. Qualité perçue : un ratio de 2,5 % de likes donne le maximum
  if (v.vues > 0) note += Math.min((v.likes / v.vues) * 400, 10);

  // 5. Durée : de 3 à 15 min, c'est idéal ; moins d'1 min, c'est un Short
  if (v.duree >= 180 && v.duree <= 900) note += 10;
  else if (v.duree < 60) note -= 20;

  // 6. Récence : le lieu tel qu'il est aujourd'hui
  const ans = (Date.now() - new Date(v.publiee).getTime()) / (365 * 24 * 3600 * 1000);
  if (ans < 3) note += 5;
  else if (ans > 8) note -= 5;

  return note;
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 3 || q.length > 120) {
    return Response.json({ erreur: "Requête invalide" }, { status: 400 });
  }
  // « Nom du lieu, Pays » : le nom sert à juger la pertinence des titres
  const nomLieu = q.split(",").slice(0, -1).join(",").trim() || q;

  // Nouveau préfixe « video2 » : les anciens résultats (mal triés) sont ignorés
  const cle = `travelmap:video2:${q.toLowerCase()}`;
  const enCache = await redis.get<Video | "aucune">(cle);
  if (enCache) return Response.json({ video: enCache === "aucune" ? null : enCache });

  // 1. Dix candidates (100 unités de quota)
  const recherche = new URLSearchParams({
    part: "snippet", q, type: "video", maxResults: "10",
    videoEmbeddable: "true", safeSearch: "strict", relevanceLanguage: "fr", key: CLE_API,
  });
  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${recherche}`);
  if (!res.ok) return Response.json({ video: null }, { status: 502 });
  const ids: string[] = ((await res.json()).items ?? []).map((i: { id: { videoId: string } }) => i.id.videoId);

  let meilleure: Video | null = null;
  if (ids.length) {
    // 2. Leurs statistiques et leur durée (1 unité pour les 10)
    const details = new URLSearchParams({ part: "snippet,statistics,contentDetails", id: ids.join(","), key: CLE_API });
    const resDetails = await fetch(`https://www.googleapis.com/youtube/v3/videos?${details}`);
    if (!resDetails.ok) return Response.json({ video: null }, { status: 502 });

    type ItemVideo = {
      id: string;
      snippet: { title: string; channelTitle: string; publishedAt: string; thumbnails?: { medium?: { url: string } } };
      statistics: { viewCount?: string; likeCount?: string };
      contentDetails: { duration: string };
    };
    const candidates: Candidate[] = ((await resDetails.json()).items ?? []).map((v: ItemVideo) => ({
      videoId: v.id,
      titre: v.snippet.title,
      chaine: v.snippet.channelTitle,
      miniature: v.snippet.thumbnails?.medium?.url,
      vues: Number(v.statistics.viewCount ?? 0),
      likes: Number(v.statistics.likeCount ?? 0),
      duree: enSecondes(v.contentDetails.duration),
      publiee: v.snippet.publishedAt,
    }));

    // 3. On note, on trie, on garde la meilleure
    const classees = candidates
      .map((c) => ({ c, note: noter(c, nomLieu) }))
      .sort((a, b) => b.note - a.note);
    // Pour apprendre et régler les poids : le classement s'affiche dans le terminal du serveur
    console.log(`[video] ${q}`, classees.map((x) => `${x.note.toFixed(0)} · ${x.c.titre}`));

    const top = classees[0]?.c;
    if (top) meilleure = { videoId: top.videoId, titre: top.titre, chaine: top.chaine, miniature: top.miniature };
  }

  await redis.set(cle, meilleure ?? "aucune", { ex: 60 * 60 * 24 * 7 });
  return Response.json({ video: meilleure });
}
