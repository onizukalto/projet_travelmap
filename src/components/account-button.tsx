"use client";

import { CircleUserRound, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { useDismiss } from "@/lib/use-dismiss";

/** Vrai si on s'est connecté avec le mot de passe du site (cookie lisible, sans rien de secret). */
function estConnecte() {
  return document.cookie.split("; ").some((c) => c.startsWith("travelmap_connecte="));
}

/**
 * Bouton compte. Pas de compte pour l'instant : il explique où vont les données,
 * et permet de se déconnecter quand le site est protégé par un mot de passe.
 */
export function AccountButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [connecte, setConnecte] = useState(false);
  const [sortie, setSortie] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  const seDeconnecter = async () => {
    setSortie(true);
    await fetch("/api/connexion", { method: "DELETE" }).catch(() => null);
    router.replace("/connexion");
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Mon compte"
        aria-expanded={open}
        aria-controls="panneau-compte"
        onClick={() => {
          if (!open) setConnecte(estConnecte());
          setOpen((value) => !value);
        }}
        className="flex size-11 cursor-pointer items-center justify-center rounded-control text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
      >
        <CircleUserRound aria-hidden strokeWidth={1.8} className="size-[22px]" />
      </button>
      {open && (
        <div
          id="panneau-compte"
          role="dialog"
          aria-label="Mon compte"
          className="pop-in absolute top-full right-0 z-40 mt-2 w-72 rounded-panel border border-border bg-surface-raised p-4 shadow-float"
        >
          <p className="font-bold text-ink">Pas besoin de compte</p>
          <p className="mt-1 text-caption text-ink-2">
            Ta carte et tes voyages sont enregistrés dans ce navigateur. Tu pourras créer un
            compte plus tard pour les retrouver partout.
          </p>
          {connecte && (
            <button
              type="button"
              onClick={seDeconnecter}
              disabled={sortie}
              className="mt-3 -mb-1 flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-control border-t border-line px-1 pt-3 text-left font-semibold text-ink hover:text-warn-ink disabled:cursor-wait disabled:opacity-60"
            >
              <LogOut aria-hidden strokeWidth={1.8} className="size-[18px]" />
              {sortie ? "Déconnexion…" : "Se déconnecter"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
