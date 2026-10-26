"use client";

import { useEffect } from "react";
import type { CSSProperties } from "react";

const MOT = "TravelMap";
const DUREE_MS = 1250;

function terminer() {
  document.documentElement.dataset.intro = "done";
}

/**
 * Préchargement : un rideau crème avec le logo, qui se lève en dévoilant la grille.
 * Il ne joue qu'à la première page de la session (le script de layout.tsx pose
 * data-intro="play" sur <html> avant l'affichage). Un clic ou une touche le passe.
 * Tout le mouvement est en CSS (globals.css) : transform et opacity uniquement.
 */
export function Intro() {
  useEffect(() => {
    if (document.documentElement.dataset.intro !== "play") return;
    const timer = setTimeout(terminer, DUREE_MS);
    window.addEventListener("keydown", terminer, { once: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", terminer);
    };
  }, []);

  return (
    <div
      aria-hidden
      onClick={terminer}
      className="intro fixed inset-0 z-[100] cursor-pointer flex-col items-center justify-center gap-6 bg-bg"
    >
      <div className="flex items-center gap-3">
        <span className="intro-mark size-9 rounded-[6px] border-2 border-ink bg-accent-yellow md:size-11" />
        <span className="font-display text-[44px] leading-none font-extrabold tracking-[-0.05em] text-ink md:text-[64px]">
          {MOT.split("").map((lettre, i) => (
            <span key={i} className="intro-letter" style={{ "--i": i } as CSSProperties}>
              {lettre}
            </span>
          ))}
        </span>
      </div>
      <div className="h-px w-56 bg-line md:w-72">
        <div className="intro-progress h-[3px] -translate-y-px bg-ink" />
      </div>
      <p className="absolute bottom-8 text-small text-muted">Touche pour passer</p>
    </div>
  );
}
