import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { APP_HOME } from "@/lib/nav";

/** L'appel final, puis le pied de page : le nom revient en très grand. */
export function FinalCta() {
  return (
    <>
      <section aria-labelledby="titre-final" className="mx-auto max-w-[1600px] px-4 py-24 md:px-6 md:py-36 lg:px-8">
        <div className="scroll-reveal grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <h2
              id="titre-final"
              className="font-display text-[44px] leading-[0.95] font-extrabold tracking-[-0.05em] text-ink md:text-[88px]"
            >
              Ta carte t&apos;attend.
            </h2>
            <p className="mt-5 max-w-[50ch] text-lg text-ink-2">
              Colorie les pays que tu connais, note tes voyages, et laisse l&apos;assistant te trouver des endroits
              calmes pour le prochain.
            </p>
          </div>
          <ButtonLink href={APP_HOME} prefetch={false} variant="accent" size="lg" className="self-start lg:self-end">
            Entrer
            <ArrowRight aria-hidden strokeWidth={2} className="size-[18px]" />
          </ButtonLink>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-[1600px] overflow-hidden px-4 pt-10 md:px-6 lg:px-8">
          <p
            aria-hidden
            className="flex items-center gap-[0.12em] pb-[0.16em] font-display text-[19vw] leading-[0.9] font-extrabold tracking-[-0.06em] text-ink lg:text-[17vw] 2xl:text-[280px]"
          >
            <span className="inline-block size-[0.42em] shrink-0 rounded-[0.08em] border-[0.035em] border-ink bg-accent-yellow" />
            TravelMap
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-5 text-caption text-muted">
            <p>Une carte du monde, un carnet de voyages et un planificateur qui cherche le calme.</p>
            <a href="#titre-accueil" className="inline-flex min-h-11 items-center font-semibold text-ink hover:underline">
              Revenir en haut
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
