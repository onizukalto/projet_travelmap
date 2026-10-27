// src/lib/agent/tools/trajet.ts
import { tool } from "ai";
import { z } from "zod";
import type { Registre } from "@/lib/agent/lieux-verifies";

const MODES = { voiture: "DRIVE", "a-pied": "WALK" } as const;

// Google renvoie les durées sous la forme "8040s" : on les rend lisibles, « 2 h 14 »
function duree(texte: string | undefined) {
  const s = parseInt(texte ?? "0", 10);
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return h ? `${h} h ${String(m).padStart(2, "0")}` : `${m} min`;
}

export function creerCalculerTrajet(registre: Registre) {
  return tool({
    description:
      "Calcule la durée et la distance réelles d'un trajet passant par plusieurs lieux, dans l'ordre. " +
      "Utilise-le pour vérifier qu'une journée est faisable avant de proposer l'itinéraire. " +
      "Les lieux sont désignés par leur id (renvoyé par rechercherLieux).",
    inputSchema: z.object({
      lieuxIds: z.array(z.string()).min(2).max(10).describe("Les id des lieux, dans l'ordre du trajet"),
      mode: z.enum(["voiture", "a-pied"]).describe("voiture pour la route, a-pied pour une randonnée"),
    }),
    execute: async ({ lieuxIds, mode }) => {
      // On n'accepte que des lieux réellement trouvés pendant cette requête
      const inconnus = lieuxIds.filter((id) => !registre.has(id));
      if (inconnus.length) {
        return { erreur: `Lieux inconnus : ${inconnus.join(", ")}. Cherche-les d'abord avec rechercherLieux.` };
      }

      // Google accepte directement les identifiants de lieux : pas besoin de coordonnées
      const point = (id: string) => ({ placeId: id });
      const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY ?? "",
          // Comme pour Places : on ne demande que ce qui sert, c'est ce qui fixe le prix
          "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.legs.duration,routes.legs.distanceMeters",
        },
        body: JSON.stringify({
          origin: point(lieuxIds[0]),
          destination: point(lieuxIds[lieuxIds.length - 1]),
          intermediates: lieuxIds.slice(1, -1).map(point),
          travelMode: MODES[mode],
          languageCode: "fr",
        }),
      });
      if (!res.ok) {
        return { erreur: `Trajet impossible à calculer (code ${res.status}).` };
      }

      const data = await res.json();
      const route = data.routes?.[0];
      if (!route) {
        return {
          erreur:
            mode === "voiture"
              ? "Aucune route carrossable entre ces lieux. Si c'est une randonnée, réessaie en mode a-pied."
              : "Aucun chemin trouvé entre ces lieux (traversée maritime ou zone non cartographiée).",
        };
      }

      // Un tronçon (« leg ») par paire de lieux consécutifs
      const troncons = (route.legs ?? []).map(
        (leg: { distanceMeters?: number; duration?: string }, i: number) => ({
          de: registre.get(lieuxIds[i])!.nom,
          vers: registre.get(lieuxIds[i + 1])!.nom,
          distanceKm: Math.round((leg.distanceMeters ?? 0) / 1000),
          duree: duree(leg.duration),
        })
      );

      return {
        mode,
        troncons,
        total: { distanceKm: Math.round((route.distanceMeters ?? 0) / 1000), duree: duree(route.duration) },
      };
    },
  });
}
