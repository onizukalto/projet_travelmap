// src/app/api/connexion/route.ts
// POST : vérifie le mot de passe et pose le cookie d'accès. DELETE : se déconnecter.
import { NextResponse } from "next/server";
import {
  COOKIE_ACCES,
  COOKIE_CONNECTE,
  DUREE_ACCES_SECONDES,
  creerJeton,
  motDePasseDuSite,
  motDePasseValide,
} from "@/lib/acces";

const attendre = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: Request) {
  // Sans SITE_PASSWORD (en local), le site n'est pas protégé : rien à vérifier.
  if (!motDePasseDuSite()) return NextResponse.json({ ok: true });

  const corps = (await req.json().catch(() => null)) as { motDePasse?: unknown } | null;
  const recu = typeof corps?.motDePasse === "string" ? corps.motDePasse : "";

  if (!motDePasseValide(recu)) {
    // Une petite pause ralentit les essais à la chaîne.
    await attendre(600);
    return NextResponse.json({ error: "mot-de-passe" }, { status: 401 });
  }

  const reponse = NextResponse.json({ ok: true });
  const options = {
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: DUREE_ACCES_SECONDES,
  };
  reponse.cookies.set(COOKIE_ACCES, creerJeton()!, { ...options, httpOnly: true });
  reponse.cookies.set(COOKIE_CONNECTE, "1", { ...options, httpOnly: false });
  return reponse;
}

export async function DELETE() {
  const reponse = NextResponse.json({ ok: true });
  reponse.cookies.delete(COOKIE_ACCES);
  reponse.cookies.delete(COOKIE_CONNECTE);
  return reponse;
}
