// src/proxy.ts
// Protège l'application derrière deux barrières. Next.js 16 appelle ce fichier « proxy »
// (anciennement « middleware ») : il passe avant chaque page et chaque route /api.
//
// 1. Le mot de passe du site (SITE_PASSWORD) : sans lui, rien d'autre n'est visible.
//    Sans SITE_PASSWORD (en local), cette barrière est ouverte.
// 2. Le compte Supabase (connexion par lien magique) : sa session est vérifiée et rafraîchie ici.
//
// Toujours accessibles : l'accueil « / » et /api/connexion. La page /connexion et le retour du lien
// magique (/auth/callback) passent la seconde barrière, puisqu'ils servent à la franchir.
// Sans accès : redirection vers /connexion pour les pages, erreur 401 pour les routes /api.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_ACCES, jetonValide, motDePasseDuSite } from "@/lib/acces";

const PAGE_CONNEXION = "/connexion";
const RETOUR_LIEN = "/auth/callback";
/** Page d'arrivée de l'application, après connexion. */
const ACCUEIL_APPLI = "/carte";

/** Redirection vers /connexion, en gardant la page demandée pour y revenir ensuite. */
function versConnexion(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const url = new URL(PAGE_CONNEXION, request.url);
  if (pathname !== ACCUEIL_APPLI) url.searchParams.set("suite", pathname + search);
  return NextResponse.redirect(url);
}

/** Recopie les cookies de session rafraîchis sur une autre réponse (une redirection). */
function avecCookies(cible: NextResponse, source: NextResponse) {
  for (const cookie of source.cookies.getAll()) cible.cookies.set(cookie);
  return cible;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/" || pathname === "/api/connexion") return NextResponse.next();

  // 1. Première barrière : le mot de passe du site.
  if (motDePasseDuSite() && !jetonValide(request.cookies.get(COOKIE_ACCES)?.value)) {
    if (pathname === PAGE_CONNEXION || pathname === RETOUR_LIEN) return NextResponse.next();
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "connexion-requise" }, { status: 401 });
    return versConnexion(request);
  }

  // 2. Seconde barrière : le compte Supabase. Le client relit la session dans les cookies
  //    et, si elle a expiré, la rafraîchit : les nouveaux cookies partent avec la réponse.
  let reponse = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (liste) => {
        for (const { name, value } of liste) request.cookies.set(name, value);
        reponse = NextResponse.next({ request });
        for (const { name, value, options } of liste) reponse.cookies.set(name, value, options);
      },
    },
  });
  // getClaims vérifie la signature de la session (sans appel réseau quand c'est possible).
  const { data } = await supabase.auth.getClaims();
  const connecte = Boolean(data?.claims?.sub);

  if (pathname === RETOUR_LIEN) return reponse;
  if (pathname === PAGE_CONNEXION) {
    // Déjà connecté : inutile de revoir la page de connexion.
    return connecte ? avecCookies(NextResponse.redirect(new URL(ACCUEIL_APPLI, request.url)), reponse) : reponse;
  }
  if (connecte) return reponse;

  if (pathname.startsWith("/api/")) {
    return avecCookies(NextResponse.json({ error: "compte-requis" }, { status: 401 }), reponse);
  }
  return avecCookies(versConnexion(request), reponse);
}

export const config = {
  // Tout, sauf les fichiers techniques de Next.js et les fichiers statiques (icône, images…).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)"],
};
