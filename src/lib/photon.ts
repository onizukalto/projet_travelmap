/**
 * Recherche de lieux avec l'API publique Photon (photon.komoot.io), en français.
 * Aucune clé nécessaire.
 */

export type Place = {
  name: string;
  /** « nom, région, pays » */
  label: string;
  lat: number;
  lon: number;
  countryCode?: string;
};

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    city?: string;
    locality?: string;
    county?: string;
    state?: string;
    country?: string;
    countrycode?: string;
  };
};

const BASE = "https://photon.komoot.io";

function toPlace(feature: PhotonFeature, preferCity = false): Place | null {
  const p = feature.properties;
  const name = (preferCity ? (p.city ?? p.locality ?? p.name) : (p.name ?? p.city)) ?? p.county ?? p.state;
  if (!name) return null;
  const parts = [name, p.state, p.country].filter(
    (part, index, list): part is string => Boolean(part) && list.indexOf(part) === index,
  );
  const [lon, lat] = feature.geometry.coordinates;
  return { name, label: parts.join(", "), lat, lon, countryCode: p.countrycode };
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const url = `${BASE}/api/?q=${encodeURIComponent(query)}&lang=fr&limit=8`;
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Photon ${response.status}`);
  const data = (await response.json()) as { features: PhotonFeature[] };
  const seen = new Set<string>();
  const places: Place[] = [];
  for (const feature of data.features) {
    const place = toPlace(feature);
    if (!place || seen.has(place.label)) continue;
    seen.add(place.label);
    places.push(place);
  }
  return places.slice(0, 6);
}

/** Nom du lieu le plus proche d'un point (pour une étape posée sur la carte). */
export async function reversePlace(lon: number, lat: number): Promise<Place | null> {
  const response = await fetch(`${BASE}/reverse?lon=${lon}&lat=${lat}&lang=fr`);
  if (!response.ok) return null;
  const data = (await response.json()) as { features: PhotonFeature[] };
  const place = data.features[0] ? toPlace(data.features[0], true) : null;
  // On garde le point cliqué, pas celui de l'adresse trouvée.
  return place ? { ...place, lat, lon } : null;
}
