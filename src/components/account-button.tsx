"use client";

import { CircleUserRound, CloudCheck, CloudOff, CloudUpload, LogIn, LogOut, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { seDeconnecter } from "@/lib/sync/moteur";
import { useSession, type EtatSynchro } from "@/lib/sync/session-store";
import { useDismiss } from "@/lib/use-dismiss";

const SYNCHRO: Record<EtatSynchro, { icone: typeof CloudCheck; texte: string }> = {
  "a-jour": { icone: CloudCheck, texte: "Tout est synchronisé avec ton compte." },
  "en-attente": { icone: CloudUpload, texte: "Synchronisation en cours…" },
  "hors-ligne": { icone: CloudOff, texte: "Hors ligne : tes modifications partiront au retour du réseau." },
  erreur: { icone: TriangleAlert, texte: "Synchronisation en échec, nouvel essai dans un instant." },
};

/** Bouton compte : l'e-mail du compte, l'état de la synchronisation et la déconnexion. */
export function AccountButton() {
  const { statut, email, synchro } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sortie, setSortie] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  const deconnecter = async () => {
    setSortie(true);
    // La synchronisation envoie ce qui reste, ferme la session et vide les données de ce navigateur.
    await seDeconnecter().catch(() => null);
    router.replace("/connexion");
    router.refresh();
  };

  const { icone: IconeSynchro, texte: texteSynchro } = SYNCHRO[synchro];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Mon compte"
        aria-expanded={open}
        aria-controls="panneau-compte"
        onClick={() => setOpen((value) => !value)}
        className="flex size-11 cursor-pointer items-center justify-center rounded-control text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
      >
        <CircleUserRound aria-hidden strokeWidth={1.75} className="size-[22px]" />
      </button>
      {open && (
        <div
          id="panneau-compte"
          role="dialog"
          aria-label="Mon compte"
          className="pop-in absolute top-full right-0 z-40 mt-2 w-72 rounded-panel border border-border bg-surface-raised p-4 shadow-float"
        >
          {statut === "connecte" ? (
            <>
              <p className="text-small text-muted">Connecté avec</p>
              <p className="truncate font-semibold text-ink" title={email ?? undefined}>
                {email ?? "ton compte"}
              </p>
              <p role="status" className="mt-3 flex items-start gap-2 text-caption text-ink-2">
                <IconeSynchro aria-hidden strokeWidth={1.75} className="mt-0.5 size-4 shrink-0" />
                {texteSynchro}
              </p>
              <button
                type="button"
                onClick={deconnecter}
                disabled={sortie}
                className="mt-3 -mb-1 flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-control border-t border-line px-1 pt-3 text-left font-semibold text-ink hover:text-warn-ink disabled:cursor-wait disabled:opacity-60"
              >
                <LogOut aria-hidden strokeWidth={1.75} className="size-[18px]" />
                {sortie ? "Déconnexion…" : "Se déconnecter"}
              </button>
            </>
          ) : (
            <>
              <p className="font-semibold text-ink">{statut === "inconnu" ? "Chargement du compte…" : "Pas connecté"}</p>
              <p className="mt-1 text-caption text-ink-2">
                Connecte-toi pour retrouver ta carte et tes voyages sur tous tes appareils.
              </p>
              {statut === "deconnecte" && (
                <Link
                  href="/connexion"
                  className="mt-3 -mb-1 flex min-h-11 w-full items-center gap-2 rounded-control border-t border-line px-1 pt-3 font-semibold text-ink hover:underline"
                >
                  <LogIn aria-hidden strokeWidth={1.75} className="size-[18px]" />
                  Se connecter
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
