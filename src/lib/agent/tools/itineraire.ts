// src/lib/agent/tools/itineraire.ts
import { tool } from "ai";
import { z } from "zod";
import type { Registre } from "@/lib/agent/lieux-verifies";

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
        etapes: z.array(z.object({
          lieuId: z.string().describe("L'id exact d'un lieu renvoyé par rechercherLieux"),
          description: z.string().describe("Une ou deux phrases : quoi y faire, quand y aller"),
          pepite: z.boolean().describe("true si c'est une alternative moins fréquentée à un lieu connu"),
        })).min(1),
      })).min(1),
    }),

    // Le gardien : chaque étape est confrontée au registre
    execute: async ({ titre, jours }) => {
      const retires: string[] = [];

      const joursVerifies = jours.map((j) => ({
        jour: j.jour,
        titre: j.titre,
        etapes: j.etapes.flatMap((e) => {
          const lieu = registre.get(e.lieuId);
          if (!lieu) {
            retires.push(e.lieuId); // pas de preuve : l'étape disparaît
            return [];
          }
          // Les faits viennent de Google ; seule la description vient du modèle
          return [{ ...lieu, description: e.description, pepite: e.pepite }];
        }),
      }));

      return {
        titre,
        jours: joursVerifies,
        verification: retires.length
          ? `${retires.length} étape(s) retirée(s) : lieu non vérifié.`
          : "Tous les lieux ont été vérifiés.",
      };
    },
  });
}
