import { Compass, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { RouteSketch } from "@/components/route-sketch";
import { buttonPrimary, buttonSecondary } from "@/lib/button";

export const metadata: Metadata = { title: "Voyages" };

const TRACES = [
  { label: "Route", dash: undefined },
  { label: "Ferry", dash: "9 7" },
  { label: "Vol", dash: "0.1 7" },
];

export default function VoyagesPage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-6 md:py-12 lg:px-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[32px] leading-[1.1] font-extrabold tracking-[-0.02em] text-ink md:text-page-title">
            Voyages
          </h1>
          <p className="mt-2 text-ink-2">Aucun voyage pour l&apos;instant.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/planifier" className={buttonSecondary}>
            <Compass aria-hidden strokeWidth={1.8} className="size-[18px]" />
            Planifier avec l&apos;assistant
          </Link>
          <button type="button" disabled className={buttonPrimary}>
            <Plus aria-hidden strokeWidth={1.8} className="size-[18px]" />
            Nouveau voyage
          </button>
        </div>
      </div>

      <section
        aria-labelledby="carnet-vide"
        className="mt-8 grid overflow-hidden rounded-panel border-2 border-dashed border-line-strong bg-surface md:mt-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"
      >
        <div className="border-b-2 border-dashed border-line-strong md:border-r-2 md:border-b-0">
          <RouteSketch className="block h-full w-full" />
        </div>
        <div className="flex flex-col justify-center p-6 md:p-10">
          <h2 id="carnet-vide" className="text-section text-ink md:text-[24px]">
            Ton carnet de voyages est vide
          </h2>
          <p className="mt-3 max-w-[46ch] text-ink">
            Note un voyage passé ou prépare le prochain. Ajoute ses étapes jour par jour : le tracé
            se dessine sur la carte, et les pays traversés se colorient tout seuls.
          </p>
          <ul aria-label="Légende des tracés" className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            {TRACES.map(({ label, dash }) => (
              <li key={label} className="flex items-center gap-2 text-caption text-ink-2">
                <svg aria-hidden viewBox="0 0 36 8" className="h-2 w-9">
                  <line
                    x1="3"
                    x2="33"
                    y1="4"
                    y2="4"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={dash}
                    className="stroke-ink"
                  />
                </svg>
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
