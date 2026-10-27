"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { supabaseNavigateur } from "@/lib/supabase/client";
import { demarrer, repondreImport, sessionPerdue } from "@/lib/sync/moteur";
import { useSession, type CompteLocal } from "@/lib/sync/session-store";

/** Suit la session du compte et lance la synchronisation ; pose la question d'import si besoin. */
export function SyncProvider() {
  const importLocal = useSession((s) => s.importLocal);

  useEffect(() => {
    const supabase = supabaseNavigateur();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evenement, session) => {
      // On ne rappelle pas Supabase directement dans cet écouteur (il tient un verrou) : on reporte.
      setTimeout(() => {
        const user = session?.user;
        if (user) {
          useSession.setState({ statut: "connecte", email: user.email ?? null });
          void demarrer(user.id);
        } else {
          useSession.setState({ statut: "deconnecte", email: null });
          sessionPerdue();
        }
      }, 0);
    });
    return () => subscription.unsubscribe();
  }, []);

  return importLocal ? <ImportDialog compte={importLocal} /> : null;
}

const pluriel = (n: number, un: string, plusieurs: string) => `${n} ${n > 1 ? plusieurs : un}`;

function ImportDialog({ compte }: { compte: CompteLocal }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const contenu = [
    compte.pays && pluriel(compte.pays, "pays", "pays"),
    compte.voyages && pluriel(compte.voyages, "voyage", "voyages"),
    compte.conversations && pluriel(compte.conversations, "conversation", "conversations"),
  ].filter(Boolean) as string[];
  const liste =
    contenu.length > 1 ? `${contenu.slice(0, -1).join(", ")} et ${contenu.at(-1)}` : (contenu[0] ?? "des données");

  return (
    <dialog
      ref={ref}
      aria-labelledby="import-titre"
      aria-describedby="import-texte"
      // Il faut choisir : Échap ne ferme pas la fenêtre.
      onCancel={(event) => event.preventDefault()}
      className="m-auto w-[min(30rem,calc(100vw-2rem))] rounded-panel border border-border bg-surface p-0 text-ink shadow-float backdrop:bg-ink/40"
    >
      <div className="pop-in p-5 md:p-6">
        <h2 id="import-titre" className="font-display text-[26px] leading-tight font-extrabold tracking-[-0.035em] text-ink">
          Ajouter les données de ce navigateur ?
        </h2>
        <p id="import-texte" className="mt-3 text-ink-2">
          Ce navigateur contient déjà {liste}. Tu peux les ajouter à ton compte pour les retrouver sur tous tes
          appareils, ou repartir uniquement de ton compte : elles seront alors effacées d&apos;ici.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => repondreImport(false)}>
            Repartir de mon compte
          </Button>
          <Button variant="primary" autoFocus onClick={() => repondreImport(true)}>
            Ajouter à mon compte
          </Button>
        </div>
      </div>
    </dialog>
  );
}
