"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";
import { prefersReducedMotion } from "@/lib/use-media-query";

type Props = {
  value: number;
  /** Mise en forme du nombre (doit être une fonction stable, définie hors du composant). */
  format?: (value: number) => string;
  className?: string;
};

const entier = (value: number) => String(Math.round(value));

/**
 * Un nombre qui défile jusqu'à sa nouvelle valeur (compteur façon Been).
 * Le texte est mis à jour par « motion », sans re-rendu React à chaque image.
 * Les lecteurs d'écran lisent directement la valeur finale.
 */
export function AnimatedNumber({ value, format = entier, className = "" }: Props) {
  const current = useMotionValue(value);
  const text = useTransform(current, (v) => format(v));

  useEffect(() => {
    if (prefersReducedMotion()) {
      current.set(value);
      return;
    }
    const controls = animate(current, value, { duration: 0.7, ease: [0.2, 0.8, 0.2, 1] });
    return () => controls.stop();
  }, [current, value]);

  return (
    <span className={className}>
      <motion.span aria-hidden>{text}</motion.span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}
