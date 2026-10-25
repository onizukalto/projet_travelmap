"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { buttonPrimary } from "@/lib/button";

const IDEAS = [
  "Dix jours au Japon, hors des sentiers battus",
  "Un road trip d'une semaine dans les Pouilles",
  "Les îles grecques en ferry, en juin",
];

/**
 * Champ de demande à l'assistant. Les idées remplissent le champ ;
 * l'envoi sera branché avec l'assistant IA.
 */
export function PlannerPrompt() {
  const [value, setValue] = useState("");

  return (
    <form className="mt-8" onSubmit={(event) => event.preventDefault()}>
      <label htmlFor="idee-voyage" className="font-semibold text-ink">
        Ton idée de voyage
      </label>
      <textarea
        id="idee-voyage"
        rows={3}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Par exemple : deux semaines en Écosse en van, avec des randonnées"
        aria-describedby="assistant-etat"
        className="mt-2 block w-full resize-none rounded-control border border-line-strong bg-surface-raised px-4 py-3 text-ink transition-colors duration-150 placeholder:text-muted hover:border-ink-2 focus-visible:border-ink"
      />
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p id="assistant-etat" className="text-caption text-muted">
          L&apos;assistant n&apos;est pas encore branché.
        </p>
        <button type="submit" disabled className={buttonPrimary}>
          Construire l&apos;itinéraire
          <ArrowRight aria-hidden strokeWidth={1.8} className="size-[18px]" />
        </button>
      </div>

      <fieldset className="mt-8">
        <legend className="text-caption font-semibold text-ink-2">Pour t&apos;inspirer</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {IDEAS.map((idea) => (
            <button
              key={idea}
              type="button"
              aria-pressed={value === idea}
              onClick={() => setValue(idea)}
              className="min-h-11 cursor-pointer rounded-control border border-line bg-surface px-3.5 py-2 text-left text-caption text-ink transition-colors duration-150 hover:border-ink-2 hover:bg-surface-raised aria-pressed:border-ink aria-pressed:font-semibold"
            >
              {idea}
            </button>
          ))}
        </div>
      </fieldset>
    </form>
  );
}
