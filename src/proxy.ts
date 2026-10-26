// src/proxy.ts
// Protège tout le site par un mot de passe (authentification « HTTP Basic » du navigateur).
// Next.js 16 appelle ce fichier « proxy » (anciennement « middleware ») : il passe avant chaque page.
//
// - Nom d'utilisateur : libre.
// - Mot de passe : la variable SITE_PASSWORD (à définir sur Vercel).
// - Si SITE_PASSWORD n'est pas défini (en local), rien n'est protégé.
import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

// Compare deux textes en temps constant : la durée ne dépend pas du nombre de caractères justes.
// On compare leurs empreintes SHA-256, qui ont toujours la même longueur (32 octets),
// pour ne pas non plus laisser deviner la longueur du mot de passe.
function egauxEnTempsConstant(a: string, b: string) {
  const empreinte = (texte: string) => createHash("sha256").update(texte).digest();
  return timingSafeEqual(empreinte(a), empreinte(b));
}

// Extrait le mot de passe de l'en-tête « Authorization: Basic base64(utilisateur:motdepasse) »
function motDePasseRecu(request: NextRequest) {
  const entete = request.headers.get("authorization");
  if (!entete?.startsWith("Basic ")) return null;
  try {
    const decode = Buffer.from(entete.slice(6), "base64").toString("utf8");
    const separateur = decode.indexOf(":");
    // Le mot de passe peut contenir « : » : on coupe seulement au premier.
    return separateur === -1 ? null : decode.slice(separateur + 1);
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const attendu = process.env.SITE_PASSWORD;
  if (!attendu) return NextResponse.next(); // en local : pas de protection

  const recu = motDePasseRecu(request);
  if (recu !== null && egauxEnTempsConstant(recu, attendu)) return NextResponse.next();

  // Pas de mot de passe ou mauvais mot de passe : le navigateur affiche sa fenêtre de connexion.
  return new NextResponse("Mot de passe requis.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="TravelMap", charset="UTF-8"' },
  });
}

export const config = {
  // Tout le site, y compris /api, sauf les fichiers techniques de Next.js et l'icône.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
