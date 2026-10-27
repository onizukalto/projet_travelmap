// src/lib/agent/tools/trajet.ts
const MODES = { voiture: "DRIVE", "a-pied": "WALK" } as const;

function duree(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return h ? `${h} h ${String(m).padStart(2, "0")}` : `${m} min`;
}

// Calcule la vraie route entre des lieux du registre (appelée par le CODE, pas par le modèle)
export async function calculerRoute(lieuxIds: string[], mode: keyof typeof MODES) {
  const point = (id: string) => ({ placeId: id });
  const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY ?? "",
      "X-Goog-FieldMask": "routes.duration,routes.distanceMeters",
    },
    body: JSON.stringify({
      origin: point(lieuxIds[0]),
      destination: point(lieuxIds[lieuxIds.length - 1]),
      intermediates: lieuxIds.slice(1, -1).map(point),
      travelMode: MODES[mode],
    }),
  });
  if (!res.ok) return null;
  const route = (await res.json()).routes?.[0];
  if (!route) return null; // pas de route (randonnée, mer…)

  const secondes = parseInt(route.duration ?? "0", 10);
  return { distanceKm: Math.round((route.distanceMeters ?? 0) / 1000), duree: duree(secondes), secondes };
}
