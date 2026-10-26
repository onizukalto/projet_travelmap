import type { CSSProperties } from "react";

const RANGEE_1 = ["Kazbegi", "Lofoten", "Hokkaido", "Açores", "Patagonie", "Dolomites", "Pouilles", "Haut Atlas"];
const RANGEE_2 = ["Madère", "Kirghizistan", "Tasmanie", "Islande", "Ladakh", "Sardaigne", "Transylvanie", "Yukon"];

/** Une rangée qui défile en continu : la liste est doublée pour boucler sans à-coup. */
function Rangee({ noms, inverse = false, duree }: { noms: string[]; inverse?: boolean; duree: string }) {
  return (
    <div className="marquee overflow-hidden py-2">
      <div className={`marquee-track ${inverse ? "is-reverse" : ""}`} style={{ "--marquee-duration": duree } as CSSProperties}>
        {[0, 1].map((copie) => (
          // La copie sert seulement à boucler : masquée quand le bandeau ne défile pas.
          <ul key={copie} className={`flex shrink-0 items-center ${copie === 1 ? "motion-reduce:hidden" : ""}`}>
            {noms.map((nom) => (
              <li
                key={nom}
                className="flex items-center gap-6 pr-6 font-display text-[44px] leading-none font-extrabold tracking-[-0.045em] whitespace-nowrap text-ink md:gap-10 md:pr-10 md:text-[80px]"
              >
                {nom}
                <span className="size-3 rounded-[3px] border-2 border-ink bg-accent-yellow md:size-5" />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

/** Bandeau de destinations qui défile en continu. Les lecteurs d'écran lisent une liste simple. */
export function Marquee() {
  return (
    <section aria-labelledby="titre-destinations" className="overflow-hidden border-y border-border py-12 md:py-20">
      <h2 id="titre-destinations" className="mx-auto max-w-[1600px] px-4 text-caption font-medium tracking-normal text-muted md:px-6 lg:px-8">
        Des envies plein la carte
      </h2>
      <p className="sr-only">Quelques destinations : {[...RANGEE_1, ...RANGEE_2].join(", ")}.</p>
      <div aria-hidden className="mt-6">
        <Rangee noms={RANGEE_1} duree="52s" />
        <Rangee noms={RANGEE_2} inverse duree="60s" />
      </div>
    </section>
  );
}
