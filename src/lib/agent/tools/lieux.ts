// src/lib/agent/tools/lieux.ts
import { tool } from "ai";
import { z } from "zod";
import type { LieuVerifie, Registre } from "@/lib/agent/lieux-verifies";

type PlaceGoogle = {
  id: string;
  displayName?: { text: string };
  primaryTypeDisplayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
};

// Cache partagé entre toutes les requêtes : une même recherche ne coûte qu'un appel à Google
const cache = new Map<string, LieuVerifie[]>();

function affluence(nombreAvis: number) {
  if (nombreAvis < 100) return "très faible";
  if (nombreAvis < 500) return "faible";
  if (nombreAvis < 2000) return "moyenne";
  if (nombreAvis < 10000) return "forte";
  return "très forte";
}

const arrondi = (x: number) => Math.round(x * 1e4) / 1e4; // 4 décimales ≈ 10 m

// Fabrique : chaque requête reçoit son propre outil, branché sur son propre registre
export function creerRechercherLieux(registre: Registre) {
  return tool({
    description:
      "Cherche des lieux réels (sites, sentiers, villages, cascades, points de vue, restaurants…) sur Google Maps " +
      "et renvoie leur id, leur note, leur nombre d'avis et leurs coordonnées. " +
      "Utilise-le AVANT de mentionner un lieu précis. Le nombre d'avis indique la fréquentation : peu d'avis signifie peu de monde.",

    inputSchema: z.object({
      requete: z.string().describe("Ce que tu cherches, avec la zone. Ex. : « cascade près de Stepantsminda, Géorgie »"),
      nombre: z.number().int().min(1).max(10).optional().describe("Nombre de résultats voulus (6 par défaut)"),
    }),

    execute: async ({ requete, nombre }) => {
      const n = nombre ?? 6;
      const cle = `${requete.toLowerCase().trim()}|${n}`;
      let lieux = cache.get(cle);

      if (!lieux) {
        const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY ?? "",
            "X-Goog-FieldMask": [
              "places.id",
              "places.displayName",
              "places.primaryTypeDisplayName",
              "places.formattedAddress",
              "places.location",
              "places.rating",
              "places.userRatingCount",
              "places.googleMapsUri",
            ].join(","),
          },
          body: JSON.stringify({ textQuery: requete, languageCode: "fr", pageSize: n }),
        });

        if (!res.ok) {
          return { erreur: `Recherche impossible (code ${res.status}). Ne mentionne aucun lieu précis sans vérification.` };
        }

        const data = await res.json();
        lieux = ((data.places ?? []) as PlaceGoogle[]).map((p) => ({
          id: p.id,
          nom: p.displayName?.text ?? "Sans nom",
          type: p.primaryTypeDisplayName?.text ?? null,
          adresse: p.formattedAddress,
          note: p.rating ?? null,
          nombreAvis: p.userRatingCount ?? 0,
          affluence: affluence(p.userRatingCount ?? 0),
          lat: p.location ? arrondi(p.location.latitude) : undefined,
          lon: p.location ? arrondi(p.location.longitude) : undefined,
          lienMaps: p.googleMapsUri?.split("&")[0],
        }));
        cache.set(cle, lieux);
      }

      // On note dans le registre de CETTE requête tout ce qui a été réellement trouvé
      for (const lieu of lieux) registre.set(lieu.id, lieu);

      return lieux.length
        ? { lieux }
        : { lieux: [], remarque: "Aucun lieu trouvé. N'invente rien : cherche autrement ou propose autre chose." };
    },
  });
}
