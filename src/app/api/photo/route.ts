// src/app/api/photo/route.ts
// Récupère une photo Google sans jamais exposer la clé au navigateur.

export async function GET(req: Request) {
  const nom = new URL(req.url).searchParams.get("nom") ?? "";

  // Sécurité : on n'accepte que le format d'une référence de photo Google, rien d'autre
  if (!/^places\/[\w-]+\/photos\/[\w-]+$/.test(nom)) {
    return new Response("Référence invalide", { status: 400 });
  }

  // On demande à Google l'adresse publique de l'image (skipHttpRedirect = réponse en JSON)
  const res = await fetch(
    `https://places.googleapis.com/v1/${nom}/media?maxWidthPx=800&skipHttpRedirect=true`,
    { headers: { "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY ?? "" } }
  );
  if (!res.ok) return new Response("Photo indisponible", { status: 404 });

  const { photoUri } = await res.json();
  if (!photoUri) return new Response("Photo indisponible", { status: 404 });

  // Le navigateur est redirigé vers l'image : il ne voit jamais la clé
  return Response.redirect(photoUri, 302);
}
