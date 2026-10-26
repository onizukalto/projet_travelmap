import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ButtonLink } from "@/components/ui/button";
import { APP_HOME, NAV_ITEMS } from "@/lib/nav";

/**
 * L'année du « © ». La page est générée à l'avance : une date ne peut pas y être calculée
 * directement, on met donc la valeur en cache (elle est recalculée à chaque déploiement).
 */
async function anneeEnCours() {
  "use cache";
  return new Date().getFullYear();
}

/** L'appel final, puis un pied de page sobre. */
export async function FinalCta() {
  const annee = await anneeEnCours();
  return (
    <>
      <section aria-labelledby="titre-final" className="mx-auto max-w-[1600px] px-4 pt-24 pb-20 md:px-6 md:pt-36 md:pb-28 lg:px-8">
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
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6 lg:px-8">
          <Logo href="/" />
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption">
            <nav aria-label="L'application">
              <ul className="flex flex-wrap items-center">
                {NAV_ITEMS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      prefetch={false}
                      className="inline-flex min-h-11 items-center rounded-control px-2.5 font-medium text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <p className="px-2.5 text-small text-muted">© {annee} TravelMap</p>
          </div>
        </div>
      </footer>
    </>
  );
}
