// src/app/api/alternative/route.ts
// Propose jusqu'à 3 lieux du même type, proches, mieux notés et moins fréquentés. Sans agent : 0 token.
import { affluence } from "@/lib/agent/tools/lieux";
import { TYPES_EXCLUS } from "@/lib/agent/tools/itineraire";

type LieuDemande = { id: string; nom: string; type: string | null; lat: number; lon: number };
type PlaceGoogle = {
  id: string;
  displayName?: { text: string };
  primaryTypeDisplayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  photos?: { name: string; authorAttributions?: { displayName?: string }[] }[];
};

// Distance à vol d'oiseau entre deux points (formule de haversine), en km
function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export async function POST(req: Request) {
  const lieu = (await req.json()) as LieuDemande;
  if (!lieu?.id || typeof lieu.lat !== "number" || typeof lieu.lon !== "number") {
    return Response.json({ erreur: "Lieu invalide" }, { status: 400 });
  }

  // 1. Des lieux du même type, autour du lieu d'origine (rayon de 20 km)
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY ?? "",
      "X-Goog-FieldMask": [
        "places.id", "places.displayName", "places.primaryTypeDisplayName", "places.formattedAddress",
        "places.location", "places.rating", "places.userRatingCount", "places.googleMapsUri", "places.photos",
      ].join(","),
    },
    body: JSON.stringify({
      textQuery: lieu.type ?? "lieu à visiter",
      languageCode: "fr",
      pageSize: 15,
      locationBias: { circle: { center: { latitude: lieu.lat, longitude: lieu.lon }, radius: 20000 } },
    }),
  });
  if (!res.ok) return Response.json({ alternatives: [] }, { status: 502 });

  const places = ((await res.json()).places ?? []) as PlaceGoogle[];

  // 2. Le critère pépite, appliqué par le code
  const alternatives = places
    .filter((p) => p.id !== lieu.id && p.location)
    .map((p) => ({
      id: p.id,
      nom: p.displayName?.text ?? "Sans nom",
      type: p.primaryTypeDisplayName?.text ?? null,
      adresse: p.formattedAddress,
      note: p.rating ?? null,
      nombreAvis: p.userRatingCount ?? 0,
      affluence: affluence(p.userRatingCount ?? 0),
      lat: Math.round(p.location!.latitude * 1e4) / 1e4,
      lon: Math.round(p.location!.longitude * 1e4) / 1e4,
      lienMaps: p.googleMapsUri?.split("&")[0],
      photo: p.photos?.[0]?.name,
      photoAuteur: p.photos?.[0]?.authorAttributions?.[0]?.displayName,
      distanceKm: Math.round(distanceKm(lieu, { lat: p.location!.latitude, lon: p.location!.longitude })),
    }))
    .filter(
      (a) =>
        a.note !== null && a.note >= 4.5 &&          // très bien noté…
        a.nombreAvis >= 20 && a.nombreAvis < 500 &&  // …par assez de monde pour être fiable, mais pas une foule
        !(a.type && TYPES_EXCLUS.has(a.type)) &&     // un vrai lieu de visite
        a.distanceKm <= 25                           // pas à l'autre bout du pays
    )
    // 3. Les meilleures d'abord ; à note égale, la moins fréquentée
    .sort((a, b) => b.note! - a.note! || a.nombreAvis - b.nombreAvis)
    .slice(0, 3);

  return Response.json({ alternatives });
}
