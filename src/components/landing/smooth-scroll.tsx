"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { prefersReducedMotion } from "@/lib/use-media-query";

/**
 * Défilement doux (Lenis), sur l'accueil uniquement. Il est retiré en quittant la page,
 * et n'est jamais activé si l'utilisateur préfère réduire les animations.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const lenis = new Lenis({ autoRaf: true, anchors: { offset: -64 }, lerp: 0.12 });
    return () => lenis.destroy();
  }, []);
  return null;
}
