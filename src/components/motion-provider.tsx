"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Réglages communs des animations « motion » :
 * - reducedMotion="user" : si le système demande moins d'animations,
 *   les déplacements et agrandissements sont coupés (les fondus restent) ;
 * - un ressort court et ferme par défaut.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ type: "spring", stiffness: 520, damping: 34, mass: 0.7 }}>
      {children}
    </MotionConfig>
  );
}
