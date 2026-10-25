import { Gem } from "lucide-react";
import type { Metadata } from "next";
import { BlankAtlas } from "@/components/blank-atlas";
import { PlannerPrompt } from "./planner-prompt";

export const metadata: Metadata = { title: "Planifier" };

export default function PlanifierPage() {
  return (
    <div className="mx-auto grid w-full max-w-[1440px] flex-1 gap-6 px-4 py-8 md:px-6 md:py-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start lg:gap-10 lg:px-8">
      <div className="flex flex-col">
        <h1 className="text-[32px] leading-[1.1] font-extrabold tracking-[-0.02em] text-ink md:text-page-title">
          Où as-tu envie d&apos;aller ?
        </h1>
        <p className="mt-3 max-w-[52ch] text-ink">
          Décris ton voyage en une phrase. L&apos;assistant construit l&apos;itinéraire jour par
          jour, avec les trajets, des photos, et des pépites loin de la foule.
        </p>
        <PlannerPrompt />
      </div>

      <section
        aria-labelledby="apercu-itineraire"
        className="flex flex-col overflow-hidden rounded-panel border border-line bg-surface"
      >
        <div className="flex flex-1 items-center justify-center p-4 md:p-8">
          <BlankAtlas className="h-auto w-full" />
        </div>
        <div className="flex flex-col gap-3 bg-bg/60 p-5 md:flex-row md:items-center md:justify-between md:p-6">
          <div>
            <h2 id="apercu-itineraire" className="font-bold text-ink">
              Ton itinéraire se dessinera ici
            </h2>
            <p className="text-caption text-ink-2">Jour après jour, avec chaque étape sur la carte.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 self-start rounded-badge bg-pepite-bg px-2.5 py-1 text-small font-bold text-pepite md:self-auto">
            <Gem aria-hidden strokeWidth={1.8} className="size-4" />
            Pépite : un lieu peu fréquenté
          </span>
        </div>
      </section>
    </div>
  );
}
