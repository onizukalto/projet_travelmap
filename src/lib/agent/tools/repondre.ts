// src/lib/agent/tools/repondre.ts
import { tool } from "ai";
import { z } from "zod";

export const repondre = tool({
  description:
    "Donne ta réponse finale quand ce n'est PAS un itinéraire : réponse à une question, conseil, " +
    "ou questions pour préciser la demande. N'utilise jamais cet outil pour un itinéraire jour par jour : " +
    "pour ça, utilise proposerItineraire.",
  inputSchema: z.object({
    texte: z.string().describe("Ta réponse en Markdown léger, en français, sans emoji"),
  }),
  execute: async ({ texte }) => {
    // Garde-fou : un itinéraire jour par jour doit passer par proposerItineraire, qui vérifie chaque lieu
    const joursCites = texte.match(/jour\s*\d+/gi) ?? [];
    if (joursCites.length >= 2) {
      return {
        erreur:
          "Refusé : ceci est un itinéraire jour par jour. Rends-le avec proposerItineraire, " +
          "en reprenant les id exacts des lieux trouvés avec rechercherLieux.",
      };
    }
    return { texte };
  },
});
