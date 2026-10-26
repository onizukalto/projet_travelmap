import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type CSSProperties } from "react";
import { ConnexionForm } from "@/components/connexion-form";
import { ColoringMap } from "@/components/landing/coloring-map";
import { SEQUENCE_MONDE } from "@/components/landing/sequences";
import { Logo } from "@/components/logo";
import { APP_HOME } from "@/lib/nav";

export const metadata: Metadata = { title: "Connexion" };

/** N'accepte qu'une page de ce site comme destination après la connexion. */
function destination(suite: string | string[] | undefined) {
  if (typeof suite !== "string" || !suite.startsWith("/") || suite.startsWith("//")) return APP_HOME;
  if (suite === "/" || suite.startsWith("/connexion") || suite.startsWith("/api/")) return APP_HOME;
  return suite;
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default function ConnexionPage({ searchParams }: Props) {
  return (
    <main className="grid min-h-dvh flex-1 bg-bg lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      {/* À gauche sur grand écran : une tuile bento avec la carte qui se colorie toute seule */}
      <div className="hidden p-4 lg:flex">
        <div className="bento w-full grid-rows-[auto_minmax(0,1fr)_auto]">
          <div className="px-6 py-3">
            <Logo href="/" />
          </div>
          <div aria-hidden className="flex items-center bg-ocean p-6">
            <ColoringMap steps={SEQUENCE_MONDE} loop className="block aspect-[1000/451] w-full" />
          </div>
          <p className="px-6 py-5 text-ink-2">
            Colorie les pays que tu as visités, garde le carnet de tes voyages et prépare les prochains, loin de la
            foule.
          </p>
        </div>
      </div>

      {/* Le formulaire */}
      <div className="flex flex-col px-4 py-6 sm:px-8 lg:py-10">
        <div className="lg:hidden">
          <Logo href="/" />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="reveal-up font-display text-[48px] leading-[0.95] font-extrabold tracking-[-0.05em] text-ink md:text-[64px]">
            Accès privé
          </h1>
          <p className="reveal-up mt-4 text-lg text-ink-2" style={{ "--d": "80ms" } as CSSProperties}>
            Ce site est réservé à quelques personnes pour l&apos;instant. Entre le mot de passe pour continuer.
          </p>
          {/* La page à rouvrir après connexion (?suite=…) n'est connue qu'à la visite. */}
          <div className="reveal-up" style={{ "--d": "160ms" } as CSSProperties}>
            <Suspense fallback={<ConnexionForm suite={APP_HOME} />}>
              {searchParams.then((params) => (
                <ConnexionForm suite={destination(params.suite)} />
              ))}
            </Suspense>
          </div>
        </div>
        <Link
          href="/"
          className="mx-auto inline-flex min-h-11 w-full max-w-sm items-center gap-1.5 rounded-control text-caption font-semibold text-ink-2 transition-colors duration-150 hover:text-ink"
        >
          <ArrowLeft aria-hidden strokeWidth={1.75} className="size-4" />
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
