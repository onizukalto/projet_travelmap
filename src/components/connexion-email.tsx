"use client";

import { LoaderCircle, MailCheck } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabaseNavigateur } from "@/lib/supabase/client";

type Etat = "pret" | "envoi" | "envoye" | "invalide" | "trop" | "indisponible";

/** Formulaire de connexion au compte : on reçoit un lien magique par e-mail, sans mot de passe. */
export function ConnexionEmail({ suite, lienExpire = false }: { suite: string; lienExpire?: boolean }) {
  const [email, setEmail] = useState("");
  const [etat, setEtat] = useState<Etat>("pret");
  const champ = useRef<HTMLInputElement>(null);

  const erreur =
    etat === "invalide"
      ? "Vérifie l'adresse e-mail."
      : etat === "trop"
        ? "Trop de demandes. Réessaie dans une minute."
        : etat === "indisponible"
          ? "Envoi impossible pour le moment. Réessaie dans un instant."
          : lienExpire && etat === "pret"
            ? "Ce lien n'est plus valable. Demande-en un nouveau."
            : null;

  const envoyer = async (event: React.FormEvent) => {
    event.preventDefault();
    const adresse = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adresse)) {
      setEtat("invalide");
      champ.current?.focus();
      return;
    }
    setEtat("envoi");
    const retour = new URL("/auth/callback", window.location.origin);
    retour.searchParams.set("suite", suite);
    const { error } = await supabaseNavigateur().auth.signInWithOtp({
      email: adresse,
      options: { emailRedirectTo: retour.toString() },
    });
    if (!error) {
      setEtat("envoye");
      return;
    }
    setEtat(error.status === 429 ? "trop" : error.status === 400 ? "invalide" : "indisponible");
    champ.current?.select();
  };

  if (etat === "envoye") {
    return (
      <div role="status" className="pop-in mt-8 rounded-panel border border-border bg-surface p-5">
        <MailCheck aria-hidden strokeWidth={1.75} className="size-6 text-ink" />
        <p className="mt-3 font-semibold text-ink">Lien envoyé à {email.trim()}</p>
        <p className="mt-1 text-caption text-ink-2">
          Ouvre l&apos;e-mail sur cet appareil et clique sur le lien pour te connecter. Pense à regarder dans les
          indésirables.
        </p>
        <button
          type="button"
          onClick={() => setEtat("pret")}
          className="mt-3 inline-flex min-h-11 cursor-pointer items-center text-caption font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
        >
          Utiliser une autre adresse
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={envoyer} noValidate className="mt-8">
      <label htmlFor="email-connexion" className="font-semibold text-ink">
        Adresse e-mail
      </label>
      <input
        ref={champ}
        id="email-connexion"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoFocus
        required
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          if (etat !== "pret" && etat !== "envoi") setEtat("pret");
        }}
        aria-invalid={etat === "invalide"}
        aria-describedby={erreur ? "erreur-email" : undefined}
        placeholder="toi@exemple.fr"
        className="mt-2 h-12 w-full rounded-control border border-line-strong bg-surface px-4 text-ink transition-colors duration-150 placeholder:text-muted hover:border-ink focus-visible:border-ink aria-invalid:border-accent-orange"
      />
      <p id="erreur-email" role="alert" className="mt-2 min-h-[1.45em] text-caption text-warn-ink">
        {erreur}
      </p>
      <Button type="submit" variant="primary" size="lg" disabled={!email.trim() || etat === "envoi"} className="mt-3 w-full">
        {etat === "envoi" ? (
          <>
            <LoaderCircle aria-hidden strokeWidth={1.75} className="size-[18px] animate-spin motion-reduce:animate-none" />
            Envoi du lien…
          </>
        ) : (
          "Recevoir le lien de connexion"
        )}
      </Button>
    </form>
  );
}
