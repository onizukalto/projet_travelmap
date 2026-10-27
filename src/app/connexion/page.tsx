import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { Suspense, type CSSProperties } from "react";
import { ConnexionEmail } from "@/components/connexion-email";
import { ConnexionForm } from "@/components/connexion-form";
import { ColoringMap } from "@/components/landing/coloring-map";
import { SEQUENCE_MONDE } from "@/components/landing/sequences";
import { Logo } from "@/components/logo";
import { COOKIE_ACCES, jetonValide, motDePasseDuSite } from "@/lib/acces";
import { destinationSure } from "@/lib/nav";

export const metadata: Metadata = { title: "Connexion" };

/** Première étape (mot de passe du site) tant qu'il n'a pas été donné, puis le compte (lien par e-mail). */
async function etape() {
  if (!motDePasseDuSite()) return "compte" as const;
  const magasin = await cookies();
  return jetonValide(magasin.get(COOKIE_ACCES)?.value) ? ("compte" as const) : ("mot-de-passe" as const);
}

const TEXTES = {
  "mot-de-passe": {
    titre: "Accès privé",
    texte: "Ce site est réservé à quelques personnes pour l'instant. Entre le mot de passe pour continuer.",
  },
  compte: {
    titre: "Connexion",
    texte: "Reçois un lien de connexion par e-mail : pas de mot de passe à retenir. Ta carte et tes voyages te suivent sur tous tes appareils.",
  },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default function ConnexionPage({ searchParams }: Props) {
  return (
    <main className="grid min-h-dvh flex-1 bg-bg transition-opacity duration-200 motion-safe:[html[data-nav=depart]_&]:opacity-45 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
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
          {/* L'étape (mot de passe ou compte) et la page de retour ne sont connues qu'à la visite. */}
          <Suspense fallback={<div aria-hidden className="h-72" />}>
            {searchParams.then(async (params) => {
              const quelle = await etape();
              const suite = destinationSure(params.suite);
              return (
                <>
                  <h1 className="reveal-up font-display text-[48px] leading-[0.95] font-extrabold tracking-[-0.05em] text-ink md:text-[64px]">
                    {TEXTES[quelle].titre}
                  </h1>
                  <p className="reveal-up mt-4 text-lg text-ink-2" style={{ "--d": "80ms" } as CSSProperties}>
                    {TEXTES[quelle].texte}
                  </p>
                  <div className="reveal-up" style={{ "--d": "160ms" } as CSSProperties}>
                    {quelle === "mot-de-passe" ? (
                      <ConnexionForm suite={suite} />
                    ) : (
                      <ConnexionEmail suite={suite} lienExpire={params.erreur === "lien"} />
                    )}
                  </div>
                </>
              );
            })}
          </Suspense>
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
