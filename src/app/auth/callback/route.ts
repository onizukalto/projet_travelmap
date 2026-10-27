// src/app/auth/callback/route.ts
// Retour du lien magique reçu par e-mail : on ouvre la session Supabase, puis on va à la page demandée.
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { destinationSure } from "@/lib/nav";
import { supabaseServeur } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const suite = destinationSure(url.searchParams.get("suite"));
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  const supabase = await supabaseServeur();
  // Lien standard : un « code » à échanger (il doit être ouvert dans le navigateur qui l'a demandé).
  // Modèle d'e-mail personnalisé : un « token_hash » à vérifier (fonctionne sur n'importe quel appareil).
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("Lien incomplet") };

  if (error) {
    const retour = new URL("/connexion", url.origin);
    retour.searchParams.set("erreur", "lien");
    if (suite) retour.searchParams.set("suite", suite);
    return NextResponse.redirect(retour);
  }
  return NextResponse.redirect(new URL(suite, url.origin));
}
