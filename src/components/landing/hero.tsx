"use client";

import { ArrowDown, ArrowRight } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { Fragment, useRef, type CSSProperties } from "react";
import { StatusSwatch } from "@/components/map-patterns";
import { ButtonLink } from "@/components/ui/button";
import { APP_HOME } from "@/lib/nav";
import { ColoringMap, type ColoringStep } from "./coloring-map";

/** Les pays qui se colorient tout seuls dans le héros, dans l'ordre. */
const SEQUENCE: ColoringStep[] = [
  { key: "250", status: "home" },
  { key: "724", status: "visited" },
  { key: "392", status: "wish" },
  { key: "604", status: "visited" },
  { key: "352", status: "planned" },
  { key: "504", status: "visited" },
  { key: "554", status: "wish" },
  { key: "124", status: "visited" },
  { key: "704", status: "planned" },
  { key: "710", status: "visited" },
  { key: "032", status: "wish" },
  { key: "268", status: "planned" },
  { key: "484", status: "visited" },
  { key: "036", status: "wish" },
];

const LIGNES = [
  ["Colorie", "le", "monde."],
  ["Voyage", "loin", "de", "la", "foule."],
];

/** Le héros : le grand titre révélé mot par mot, et la carte qui se colorie toute seule. */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  // Parallaxe léger : le titre descend un peu moins vite que la page, la carte monte.
  const titreY = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? [0, 0] : [0, 90],
  );
  const titreOpacite = useTransform(
    scrollYProgress,
    [0, 0.7],
    reduce ? [1, 1] : [1, 0],
  );
  const carteY = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? [0, 0] : [0, -70],
  );

  let i = 0;
  return (
    <section
      ref={ref}
      aria-labelledby="titre-accueil"
      className="relative overflow-hidden"
    >
      <div className="mx-auto max-w-[1600px] px-4 pt-10 pb-8 md:px-6 md:pt-16 lg:px-8 lg:pt-14">
        <motion.div style={{ y: titreY, opacity: titreOpacite }}>
          <h1
            id="titre-accueil"
            className="font-display text-[44px] leading-[0.95] font-extrabold tracking-[-0.05em] text-ink sm:text-[64px] lg:text-[104px]"
          >
            {LIGNES.map((mots, ligne) => (
              <span key={ligne} className="block">
                {mots.map((mot, n) => (
                  <Fragment key={mot + ligne}>
                    {/* De vrais espaces entre les mots : le titre se lit normalement. */}
                    {n > 0 && " "}
                    <span className="reveal-mask">
                      <span
                        className="reveal-word"
                        style={{ "--i": i++ } as CSSProperties}
                      >
                        {mot}
                      </span>
                    </span>
                  </Fragment>
                ))}
                {ligne < LIGNES.length - 1 && " "}
              </span>
            ))}
          </h1>
          <div className="mt-6 flex flex-col gap-6 lg:mt-8 lg:flex-row lg:items-end lg:justify-between">
            <p
              className="reveal-up max-w-[54ch] text-[17px] leading-relaxed text-ink-2 md:text-lg"
              style={{ "--d": "620ms" } as CSSProperties}
            >
              TravelMap garde la carte des pays que tu as vus, le carnet de tes
              voyages, et un planificateur IA qui vérifie chaque lieu avant de
              te le proposer, en cherchant les endroits peu fréquentés.
            </p>
            <div
              className="reveal-up flex shrink-0 flex-wrap gap-3"
              style={{ "--d": "760ms" } as CSSProperties}
            >
              <ButtonLink
                href={APP_HOME}
                prefetch={false}
                variant="accent"
                size="lg"
              >
                Entrer
                <ArrowRight
                  aria-hidden
                  strokeWidth={2}
                  className="size-[18px]"
                />
              </ButtonLink>
              <a
                href="#agent"
                className="inline-flex min-h-12 items-center gap-2 rounded-control border border-transparent px-4 font-semibold text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
              >
                Voir comment il travaille
                <ArrowDown
                  aria-hidden
                  strokeWidth={1.75}
                  className="size-[18px]"
                />
              </a>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Parallaxe (motion) sur l'élément extérieur, apparition (CSS) sur l'intérieur : jamais les deux au même endroit. */}
      <motion.div
        style={{ y: carteY }}
        className="mx-auto max-w-[1600px] px-4 pb-16 md:px-6 lg:px-8 lg:pb-24"
      >
        <div
          className="reveal-up relative overflow-hidden rounded-panel border border-border bg-ocean"
          style={{ "--d": "380ms" } as CSSProperties}
        >
          <ColoringMap
            steps={SEQUENCE}
            loop
            className="block aspect-[1000/451] w-full"
          />
          <ul
            aria-hidden
            className="absolute bottom-3 left-3 hidden flex-wrap gap-1.5 rounded-control border border-border bg-surface p-1.5 sm:flex md:bottom-4 md:left-4"
          >
            {(
              [
                ["home", "J'y vis"],
                ["visited", "Visité"],
                ["wish", "Envie"],
                ["planned", "Prévu"],
              ] as const
            ).map(([status, label]) => (
              <li
                key={status}
                className="flex items-center gap-1.5 px-1.5 py-1 text-small font-semibold text-ink"
              >
                <StatusSwatch status={status} />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </section>
  );
}
