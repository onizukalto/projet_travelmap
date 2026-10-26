// src/proxy.ts
// Protège tout le site derrière la page /connexion.
// Next.js 16 appelle ce fichier « proxy » (anciennement « middleware ») : il passe avant chaque page.
//
// - Sans SITE_PASSWORD (en local), rien n'est protégé.
// - L'accueil public « / », /connexion et /api/connexion restent toujours accessibles.
// - Sans cookie d'accès valide : redirection vers /connexion, ou 401 pour les routes /api.
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_ACCES, jetonValide, motDePasseDuSite } from "@/lib/acces";

const PAGE_CONNEXION = "/connexion";
/** Page d'arrivée de l'application, après connexion. */
const ACCUEIL_APPLI = "/carte";

export function proxy(request: NextRequest) {
  if (!motDePasseDuSite()) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const connecte = jetonValide(request.cookies.get(COOKIE_ACCES)?.value);

  // L'accueil vitrine est public. Son bouton « Entrer » mène à /carte :
  // avec un cookie valide on y entre, sinon on passe par /connexion.
  if (pathname === "/" || pathname === "/api/connexion") return NextResponse.next();
  if (pathname === PAGE_CONNEXION) {
    // Déjà connecté : inutile de revoir la page de connexion.
    return connecte ? NextResponse.redirect(new URL(ACCUEIL_APPLI, request.url)) : NextResponse.next();
  }
  if (connecte) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "connexion-requise" }, { status: 401 });
  }

  // On garde la page demandée pour y revenir après la connexion.
  const url = new URL(PAGE_CONNEXION, request.url);
  if (pathname !== ACCUEIL_APPLI) url.searchParams.set("suite", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  // Tout, sauf les fichiers techniques de Next.js et les fichiers statiques (icône, images…).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)"],
};
