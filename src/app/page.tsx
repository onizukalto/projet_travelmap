import type { Metadata } from "next";
import { Features } from "@/components/landing/features";
import { FinalCta } from "@/components/landing/final-cta";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LandingHeader } from "@/components/landing/landing-header";
import { Marquee } from "@/components/landing/marquee";
import { SmoothScroll } from "@/components/landing/smooth-scroll";

export const metadata: Metadata = {
  title: { absolute: "TravelMap · Colorie le monde, voyage loin de la foule" },
  description:
    "Une carte du monde à colorier, le carnet de tes voyages et un planificateur IA qui vérifie chaque lieu et cherche les endroits peu fréquentés.",
};

/** L'accueil public : une page vitrine, générée statiquement (aucune donnée de l'utilisateur). */
export default function Accueil() {
  return (
    <>
      <SmoothScroll />
      <a
        href="#contenu"
        className="sr-only z-50 rounded-control bg-ink px-4 py-3 font-semibold text-bg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Aller au contenu
      </a>
      <LandingHeader />
      <main id="contenu" className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <Marquee />
        <FinalCta />
      </main>
    </>
  );
}
