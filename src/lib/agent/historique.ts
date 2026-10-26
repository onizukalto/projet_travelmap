// src/lib/agent/historique.ts
// Résume l'historique avant de l'envoyer au modèle : moins de tokens, mêmes informations utiles.
import type { UIMessage } from "ai";
import type { LieuVerifie, Registre } from "@/lib/agent/lieux-verifies";

type EtapeItineraire = LieuVerifie & { description: string; pepite: boolean };
type Itineraire = {
  titre: string;
  jours: { jour: number; titre: string; trajet?: string; etapes: EtapeItineraire[] }[];
};

// Un itinéraire en quelques lignes : juste ce qu'il faut pour pouvoir le retoucher
function resumerItineraire(it: Itineraire) {
  const lignes = [`Itinéraire proposé : ${it.titre}`];
  for (const j of it.jours) {
    const etapes = j.etapes.map((e) => `${e.nom} (id ${e.id}${e.pepite ? ", pépite" : ""})`);
    const trajet = j.trajet ? ` (trajet : ${j.trajet})` : "";
    lignes.push(`Jour ${j.jour}, ${j.titre}${trajet} : ${etapes.join(" ; ") || "aucune étape"}`);
  }
  return lignes.join("\n");
}

export function compacterHistorique(messages: UIMessage[], registre: Registre): UIMessage[] {
  return messages.map((m) => {
    if (m.role !== "assistant") return m; // les messages de l'utilisateur restent tels quels

    const textes: string[] = [];
    for (const part of m.parts) {
      if (part.type === "text") textes.push(part.text);

      // La réponse finale « repondre » : on garde son texte
      if (part.type === "tool-repondre" && part.state === "output-available") {
        const sortie = part.output as { texte?: string };
        if (sortie.texte) textes.push(sortie.texte);
      }

      // L'itinéraire : on garde un résumé, et on recharge ses lieux (déjà vérifiés) dans le registre
      if (part.type === "tool-proposerItineraire" && part.state === "output-available") {
        const it = part.output as Itineraire;
        for (const jour of it.jours) {
          for (const e of jour.etapes) {
            registre.set(e.id, {
              id: e.id, nom: e.nom, type: e.type, adresse: e.adresse, note: e.note,
              nombreAvis: e.nombreAvis, affluence: e.affluence, lat: e.lat, lon: e.lon, lienMaps: e.lienMaps,
            });
          }
        }
        textes.push(resumerItineraire(it));
      }
      // Tout le reste (recherches, climat, réflexion) est volontairement oublié
    }

    return { ...m, parts: [{ type: "text", text: textes.join("\n\n") || "(pas de réponse)" }] };
  });
}
