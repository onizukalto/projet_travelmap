import type { Metadata } from "next";
import { Suspense } from "react";
import { BlankAtlas } from "@/components/blank-atlas";
import { ConnexionForm } from "@/components/connexion-form";

export const metadata: Metadata = { title: "Connexion" };

/** N'accepte qu'une page de ce site comme destination après la connexion. */
function destination(suite: string | string[] | undefined) {
  if (typeof suite !== "string" || !suite.startsWith("/") || suite.startsWith("//")) return "/";
  if (suite.startsWith("/connexion") || suite.startsWith("/api/")) return "/";
  return suite;
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default function ConnexionPage({ searchParams }: Props) {
  return (
    <main className="grid min-h-dvh flex-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      {/* L'atlas, à gauche sur grand écran */}
      <div aria-hidden className="hidden flex-col justify-between border-r border-line bg-surface p-10 lg:flex">
        <span className="inline-flex self-start rounded-[2px] border-[3px] border-double border-ink px-2.5 pt-1 pb-0.5 text-lg leading-none font-extrabold tracking-[-0.01em] text-ink">
          TravelMap
        </span>
        <BlankAtlas className="h-auto w-full" />
        <p className="max-w-[44ch] text-ink-2">
          Colorie les pays que tu as visités, garde le carnet de tes voyages et prépare les prochains.
        </p>
      </div>

      {/* Le formulaire */}
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <span className="inline-flex rounded-[2px] border-[3px] border-double border-ink px-2.5 pt-1 pb-0.5 text-lg leading-none font-extrabold tracking-[-0.01em] text-ink lg:hidden">
            TravelMap
          </span>
          <h1 className="mt-8 text-[32px] leading-[1.1] font-extrabold tracking-[-0.02em] text-ink md:text-page-title lg:mt-0">
            Accès privé
          </h1>
          <p className="mt-3 text-ink-2">
            Ce site est réservé à quelques personnes pour l&apos;instant. Entre le mot de passe pour continuer.
          </p>
          {/* La page à rouvrir après connexion (?suite=…) n'est connue qu'à la visite. */}
          <Suspense fallback={<ConnexionForm suite="/" />}>
            {searchParams.then((params) => (
              <ConnexionForm suite={destination(params.suite)} />
            ))}
          </Suspense>
        </div>
      </div>
    </main>
  );
}
