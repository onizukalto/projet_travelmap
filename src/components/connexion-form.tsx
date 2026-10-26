"use client";

import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useRef, useState } from "react";
import { buttonPrimary } from "@/lib/button";

type Etat = "pret" | "envoi" | "refuse" | "indisponible";

/** Formulaire de la page /connexion : un mot de passe, un bouton « Entrer ». */
export function ConnexionForm({ suite }: { suite: string }) {
  const [motDePasse, setMotDePasse] = useState("");
  const [visible, setVisible] = useState(false);
  const [etat, setEtat] = useState<Etat>("pret");
  const champ = useRef<HTMLInputElement>(null);

  const erreur =
    etat === "refuse"
      ? "Ce mot de passe n'est pas le bon. Vérifie-le et réessaie."
      : etat === "indisponible"
        ? "Connexion impossible pour le moment. Réessaie dans un instant."
        : null;

  const entrer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!motDePasse || etat === "envoi") return;
    setEtat("envoi");
    try {
      const reponse = await fetch("/api/connexion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motDePasse }),
      });
      if (reponse.ok) {
        // Rechargement complet : le serveur voit le nouveau cookie dès la page suivante.
        window.location.assign(suite);
        return;
      }
      setEtat(reponse.status === 401 ? "refuse" : "indisponible");
    } catch {
      setEtat("indisponible");
    }
    champ.current?.select();
  };

  return (
    <form onSubmit={entrer} noValidate className="mt-8">
      <label htmlFor="mot-de-passe" className="font-semibold text-ink">
        Mot de passe
      </label>
      <div className="relative mt-2">
        <input
          ref={champ}
          id="mot-de-passe"
          name="motDePasse"
          type={visible ? "text" : "password"}
          autoComplete="current-password"
          autoFocus
          required
          value={motDePasse}
          onChange={(event) => {
            setMotDePasse(event.target.value);
            if (etat === "refuse" || etat === "indisponible") setEtat("pret");
          }}
          aria-invalid={etat === "refuse"}
          aria-describedby={erreur ? "erreur-connexion" : undefined}
          className="h-12 w-full rounded-control border border-line-strong bg-surface-raised pr-12 pl-4 text-ink transition-colors duration-150 hover:border-ink-2 focus-visible:border-ink aria-invalid:border-warn-ink"
        />
        <button
          type="button"
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          aria-pressed={visible}
          onClick={() => setVisible((value) => !value)}
          className="absolute top-1/2 right-0.5 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-control text-ink-2 hover:text-ink"
        >
          {visible ? (
            <EyeOff aria-hidden strokeWidth={1.8} className="size-5" />
          ) : (
            <Eye aria-hidden strokeWidth={1.8} className="size-5" />
          )}
        </button>
      </div>

      <p id="erreur-connexion" role="alert" className="mt-2 min-h-[1.45em] text-caption text-warn-ink">
        {erreur}
      </p>

      <button
        type="submit"
        disabled={!motDePasse || etat === "envoi"}
        className={`${buttonPrimary} mt-3 h-12 w-full`}
      >
        {etat === "envoi" ? (
          <>
            <LoaderCircle aria-hidden strokeWidth={1.8} className="size-[18px] animate-spin motion-reduce:animate-none" />
            Vérification…
          </>
        ) : (
          "Entrer"
        )}
      </button>
    </form>
  );
}
