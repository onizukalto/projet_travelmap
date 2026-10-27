"use client";

import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Phase = "repos" | "chargement" | "arrivee";

/** Le lien cliqué mène-t-il à une autre page de ce site, ouverte dans cet onglet ? */
function versAutrePage(event: MouseEvent) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  const lien = (event.target as Element | null)?.closest?.("a[href]");
  if (!(lien instanceof HTMLAnchorElement) || lien.target || lien.hasAttribute("download")) return false;
  const url = new URL(lien.href, location.href);
  return url.origin === location.origin && url.pathname + url.search !== location.pathname + location.search;
}

/**
 * Transition légère entre les pages, y compris « Entrer » depuis l'accueil :
 * - au clic sur un lien, une fine barre jaune part en haut de l'écran et la page quittée s'estompe
 *   (data-nav="depart" sur <html>, voir les classes des <main>) ;
 * - à l'arrivée, la barre se remplit puis disparaît ; la nouvelle page fait son entrée (PageTransition).
 * Uniquement transform et opacity.
 */
export function NavigationFeedback() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("repos");
  const premier = useRef(true);

  // Départ : au clic sur un lien interne.
  useEffect(() => {
    let secours: ReturnType<typeof setTimeout> | undefined;
    const onClick = (event: MouseEvent) => {
      if (!versAutrePage(event)) return;
      document.documentElement.dataset.nav = "depart";
      setPhase("chargement");
      // Si la navigation n'aboutit pas (lien annulé, erreur), on rend la page telle quelle.
      clearTimeout(secours);
      secours = setTimeout(() => {
        delete document.documentElement.dataset.nav;
        setPhase("repos");
      }, 10_000);
    };
    // En capture : le composant Link de Next.js annule le clic (il navigue lui-même) avant la phase normale.
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimeout(secours);
    };
  }, []);

  // Arrivée : la nouvelle page est affichée.
  useEffect(() => {
    if (premier.current) {
      premier.current = false;
      return;
    }
    delete document.documentElement.dataset.nav;
    setPhase((current) => (current === "chargement" ? "arrivee" : current));
    const fin = setTimeout(() => setPhase("repos"), 450);
    return () => clearTimeout(fin);
  }, [pathname]);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[110] h-1 origin-left border-b border-ink bg-accent-yellow"
      initial={false}
      animate={{
        scaleX: phase === "repos" ? 0 : phase === "chargement" ? 0.82 : 1,
        opacity: phase === "chargement" ? 1 : 0,
      }}
      transition={
        phase === "chargement"
          ? // La barre avance vite au début, puis ralentit : la page arrive le plus souvent avant la fin.
            { scaleX: { duration: 2.4, ease: [0.1, 0.7, 0.2, 1] }, opacity: { duration: 0.1 } }
          : phase === "arrivee"
            ? { scaleX: { duration: 0.18, ease: "easeOut" }, opacity: { duration: 0.25, delay: 0.15 } }
            : { duration: 0 }
      }
    />
  );
}
