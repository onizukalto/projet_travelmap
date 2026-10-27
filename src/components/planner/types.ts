import type { LieuVerifie } from "@/lib/agent/lieux-verifies";
import type { Stop } from "@/lib/trips-store";

/**
 * Une étape de l'itinéraire : les faits viennent de Google, la description de l'agent.
 * photo : référence Google de la photo (servie par /api/photo) ; photoAuteur : crédit à afficher.
 */
export type EtapeRendue = LieuVerifie & {
  description: string;
  pepite: boolean;
  photo?: string;
  photoAuteur?: string;
  /** L'étape remplacée par cette alternative : sert à « Annuler ». */
  origine?: EtapeRendue;
};

/** Un lieu proposé par /api/alternative : les champs d'une étape, plus sa distance au lieu d'origine. */
export type Alternative = LieuVerifie & { photo?: string; photoAuteur?: string; distanceKm: number };

/** L'itinéraire avec une étape remplacée (jour, position dans le jour). */
export function remplacerEtape(
  itineraire: ItineraireRendu,
  jour: number,
  index: number,
  etape: EtapeRendue,
): ItineraireRendu {
  return {
    ...itineraire,
    jours: itineraire.jours.map((j) =>
      j.jour === jour ? { ...j, etapes: j.etapes.map((e, i) => (i === index ? etape : e)) } : j,
    ),
  };
}

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
            // La position rend l'id unique même si un lieu apparaît deux fois dans la journée.
            id: `${jour}-${order}-${etape.id}`,
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
