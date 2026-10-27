"use client";

import { motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";

// Vrai dès que l'application tourne dans le navigateur : les pages suivantes sont des navigations.
let dejaAffichee = false;

/**
 * Entrée d'une page (fondu et léger glissement), rejouée à chaque navigation,
 * y compris en arrivant de l'accueil par « Entrer » (data-nav="depart", voir NavigationFeedback).
 * Les tuiles bento de la page arrivent alors en cascade rapide (data-arrivee, voir Tile).
 * Pas d'animation au premier affichage : la page arrive déjà visible depuis le serveur,
 * et c'est le préchargement qui fait l'entrée. Avec « réduire les animations », il ne reste que le fondu.
 * Une fois finie, l'animation ne laisse aucun transform (les panneaux fixes restent bien placés).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const [animer] = useState(
    () => dejaAffichee || (typeof document !== "undefined" && document.documentElement.dataset.nav === "depart"),
  );

  useEffect(() => {
    dejaAffichee = true;
  }, []);

  return (
    <motion.div
      data-arrivee={animer ? "" : undefined}
      initial={animer ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
      className="flex min-h-0 flex-1 flex-col"
    >
      {children}
    </motion.div>
  );
}
