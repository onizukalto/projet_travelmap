import type { LieuVerifie } from "@/lib/agent/lieux-verifies";
import type { Stop } from "@/lib/trips-store";

/** Une étape de l'itinéraire : les faits viennent de Google, la description de l'agent. */
export type EtapeRendue = LieuVerifie & { description: string; pepite: boolean };

/** Ce que renvoie l'outil proposerItineraire. */
export type ItineraireRendu = {
  titre: string;
  /** trajet : pour un jour de route, ex. « Tbilissi → Stepantsminda, environ 3 h ». */
  jours: { jour: number; titre: string; trajet?: string; etapes: EtapeRendue[] }[];
  verification: string;
};

export function isItineraire(value: unknown): value is ItineraireRendu {
  return (
    typeof value === "object" &&
    value !== null &&
    "jours" in value &&
    Array.isArray((value as ItineraireRendu).jours)
  );
}

/** Les étapes localisées d'un jour, au format des cartes de voyage. */
export function stopsDuJour(itineraire: ItineraireRendu, jour: number): Stop[] {
  const day = itineraire.jours.find((j) => j.jour === jour);
  if (!day) return [];
  return day.etapes.flatMap((etape, order) =>
    etape.lat === undefined || etape.lon === undefined
      ? []
      : [
          {
            id: `${jour}-${etape.id}`,
            day: jour,
            order,
            name: etape.nom,
            lat: etape.lat,
            lon: etape.lon,
            note: etape.description,
            transport: "road" as const,
            country: null,
          },
        ],
  );
}
