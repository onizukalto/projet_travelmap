"use client";

import { CircleUserRound } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useDismiss } from "@/lib/use-dismiss";

/** Bouton compte. Pas de compte pour l'instant : il explique où vont les données. */
export function AccountButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Mon compte"
        aria-expanded={open}
        aria-controls="panneau-compte"
        onClick={() => setOpen((value) => !value)}
        className="flex size-11 cursor-pointer items-center justify-center rounded-control text-ink-2 transition-colors duration-150 hover:bg-bg hover:text-ink"
      >
        <CircleUserRound aria-hidden strokeWidth={1.8} className="size-[22px]" />
      </button>
      {open && (
        <div
          id="panneau-compte"
          role="dialog"
          aria-label="Mon compte"
          className="pop-in absolute top-full right-0 z-40 mt-2 w-72 rounded-panel border border-line bg-surface-raised p-4 shadow-float"
        >
          <p className="font-bold text-ink">Pas besoin de compte</p>
          <p className="mt-1 text-caption text-ink-2">
            Ta carte et tes voyages sont enregistrés dans ce navigateur. Tu pourras créer un
            compte plus tard pour les retrouver partout.
          </p>
        </div>
      )}
    </div>
  );
}
