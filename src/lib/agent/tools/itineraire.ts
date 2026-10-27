// src/lib/agent/tools/itineraire.ts
import { tool } from "ai";
import { z } from "zod";
import type { Registre } from "@/lib/agent/lieux-verifies";
import { calculerRoute } from "@/lib/agent/tools/trajet";

// Types Google qui ne sont pas des lieux de visite : jamais une étape, jamais une alternative
export const TYPES_EXCLUS = new Set([
  "Agence de voyages",
  "Parking",
  "Station-service",
  "Agence immobilière",
]);

export function creerProposerItineraire(registre: Registre) {
  return tool({
    description:
      "Enregistre l'itinéraire final pour l'afficher à l'utilisateur sous forme de cartes et sur la carte. " +
      "À appeler une seule fois, quand l'itinéraire est prêt. " +
      "N'utilise que des lieux trouvés avec rechercherLieux, en reprenant leur id exact.",

    // La « fiche » que l'agent doit remplir : sa forme est imposée et vérifiée par zod
    inputSchema: z.object({
      titre: z.string().describe("Titre court, ex. « Kazbegi, 3 jours »"),
      jours: z.array(z.object({
        jour: z.number().int().min(1),
        titre: z.string().describe("Ex. « Stepantsminda et la vallée de Truso »"),
        trajet: z.string().optional().describe("Pour un jour de route : le trajet, ex. « Tbilissi → Stepantsminda, environ 3 h »"),
        etapes: z.array(z.object({
          lieuId: z.string().describe("L'id exact d'un lieu renvoyé par rechercherLieux"),
          description: z.string().describe("Une ou deux phrases : quoi y faire, quand y aller"),
          pepite: z.boolean().describe("true si c'est une alternative moins fréquentée à un lieu connu"),
        })).describe("Les lieux visités ce jour-là. Peut être vide pour un jour de route : n'invente pas d'étape pour remplir"),
      })).min(1),
    }),

    // Le gardien : chaque étape est confrontée au registre
    execute: async ({ titre, jours }) => {
      const retires: string[] = [];
      const alertes: string[] = [];

      const joursVerifies = await Promise.all(
        jours.map(async (j) => {
          const vus = new Set<string>(); // lieux déjà placés ce jour-là
          const etapes = j.etapes.flatMap((e) => {
            const lieu = registre.get(e.lieuId);
            if (!lieu) {
              retires.push(e.lieuId);
              return [];
            }
            if (lieu.type && TYPES_EXCLUS.has(lieu.type)) {
              retires.push(`${lieu.nom} (pas un lieu de visite)`);
              return [];
            }
            if (vus.has(lieu.id)) {
              retires.push(`${lieu.nom} (doublon dans la journée)`);
              return [];
            }
            vus.add(lieu.id);
            const pepite = e.pepite && lieu.note !== null && lieu.note >= 4.5 && lieu.nombreAvis < 500;
            return [{ ...lieu, description: e.description, pepite }];
          });

          // Le trajet est CALCULÉ par le code dès qu'il y a au moins 2 étapes : le modèle ne peut plus l'inventer
          let trajet = j.trajet ? `${j.trajet} (estimation)` : undefined;
          if (etapes.length >= 2) {
            const route = await calculerRoute(etapes.map((e) => e.id), "voiture");
            if (!route) {
              trajet = "Pas de route entre toutes les étapes : une partie se fait à pied.";
            } else {
              trajet = `${route.distanceKm} km de route, ${route.duree}`;
              if (route.secondes > 4 * 3600) alertes.push(`Jour ${j.jour} : plus de 4 h de route.`);
            }
          }

          return { jour: j.jour, titre: j.titre, trajet, etapes };
        })
      );

      const verification = [
        retires.length ? `${retires.length} étape(s) retirée(s) : lieu non vérifié.` : "Tous les lieux ont été vérifiés.",
        ...alertes,
      ].join(" ");

      return { titre, jours: joursVerifies, verification };
    },
  });
}
