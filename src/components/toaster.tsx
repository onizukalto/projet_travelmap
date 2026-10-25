"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { useToast } from "@/lib/toast-store";

const DURATION = 7000;

/** Affiche le message en cours, au-dessus de la barre d'onglets sur mobile. */
export function Toaster() {
  const toast = useToast((state) => state.toast);
  const dismiss = useToast((state) => state.dismiss);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(dismiss, DURATION);
    return () => clearTimeout(timer);
  }, [toast, dismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 md:bottom-6"
    >
      {toast && (
        <div
          key={toast.id}
          className="pop-in pointer-events-auto flex items-center gap-2 rounded-panel bg-ink py-1.5 pr-1.5 pl-4 text-surface shadow-float"
        >
          <span className="py-2 font-semibold">{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action?.run();
                dismiss();
              }}
              className="min-h-11 cursor-pointer rounded-control px-3 font-bold text-surface underline decoration-visited decoration-2 underline-offset-4 hover:bg-surface/10"
            >
              {toast.action.label}
            </button>
          )}
          <button
            type="button"
            aria-label="Fermer le message"
            onClick={dismiss}
            className="flex size-11 cursor-pointer items-center justify-center rounded-control opacity-80 hover:opacity-100"
          >
            <X aria-hidden strokeWidth={1.8} className="size-[18px]" />
          </button>
        </div>
      )}
    </div>
  );
}
