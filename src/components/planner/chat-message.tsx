"use client";

import type { UIMessage } from "ai";
import { Check, CloudSun, LoaderCircle, Search, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { ItineraryView } from "./itinerary-view";
import { Markdown } from "./markdown";
import { isItineraire } from "./types";

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

type Part = UIMessage["parts"][number];
/** Partie « outil » : son nom commence par tool-, avec un état, une entrée et une sortie. */
type ToolPart = Extract<Part, { type: `tool-${string}` }>;

const isToolPart = (part: Part): part is ToolPart => part.type.startsWith("tool-");
const hasErreur = (output: unknown) => typeof output === "object" && output !== null && "erreur" in output;

type Props = {
  message: UIMessage;
  /** Id de l'appel qui a produit l'itinéraire le plus récent (le seul qu'on enregistre). */
  latestItineraryId: string | null;
  selectedDay: number | null;
  onSelectDay: (day: number) => void;
  onSave: () => void | Promise<void>;
  /** Vrai pour le message que l'agent est en train d'écrire. */
  streaming?: boolean;
};

/** Un message de la conversation : celui de l'utilisateur, ou les étapes et la réponse de l'agent. */
export function ChatMessage({ message, latestItineraryId, selectedDay, onSelectDay, onSave, streaming = false }: Props) {
  if (message.role === "user") {
    const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
    return (
      <li className="flex justify-end">
        <p className="max-w-[85%] rounded-panel border border-ink bg-ink px-4 py-2.5 whitespace-pre-wrap text-bg">
          <span className="sr-only">Toi : </span>
          {text}
        </p>
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-2">
      <span className="sr-only">Assistant :</span>
      {message.parts.map((part, index) => {
        const key = `${message.id}-${index}`;
        if (part.type === "reasoning") return <Reasoning key={key} text={part.text} />;
        // Toutes les réponses passent par des outils : un texte libre est une étape ratée
        // (par exemple un appel d'outil écrit en JSON), on ne l'affiche pas.
        if (part.type === "text") return null;
        if (!isToolPart(part)) return null;

        const done = part.state === "output-available";
        // Une étape sans résultat alors que la réponse est finie : elle a été interrompue.
        const failed = part.state === "output-error" || (!done && !streaming);
        const input = (part.input ?? {}) as Record<string, unknown>;
        const output = done ? (part.output as unknown) : undefined;

        switch (part.type) {
          case "tool-repondre": {
            // Une réponse refusée par le garde-fou contient « erreur » : l'agent recommence seul.
            if (!done || hasErreur(output)) return null;
            const texte = (output as { texte?: string }).texte ?? "";
            return <Markdown key={key}>{texte}</Markdown>;
          }
          case "tool-rechercherLieux":
            return (
              <ToolLine key={key} icon={Search} done={done} failed={failed || hasErreur(output)}>
                Recherche : {String(input.requete ?? "…")}
                {done ? "" : "…"}
              </ToolLine>
            );
          case "tool-climatTypique": {
            const mois = typeof input.mois === "number" ? MOIS[input.mois - 1] : "…";
            return (
              <ToolLine key={key} icon={CloudSun} done={done} failed={failed || hasErreur(output)}>
                Climat à {String(input.lieu ?? "…")}, mois de {mois}
              </ToolLine>
            );
          }
          case "tool-proposerItineraire":
            if (!done || !isItineraire(output)) return null;
            return (
              <ItineraryView
                key={key}
                itineraire={output}
                selectedDay={part.toolCallId === latestItineraryId ? selectedDay : null}
                onSelectDay={onSelectDay}
                onSave={part.toolCallId === latestItineraryId ? onSave : undefined}
              />
            );
          default:
            return null;
        }
      })}
    </li>
  );
}

function ToolLine({
  icon: Icon,
  done,
  failed,
  children,
}: {
  icon: typeof Search;
  done: boolean;
  failed: boolean;
  children: React.ReactNode;
}) {
  return (
    <p className="flex items-center gap-2 text-small text-muted">
      <Icon aria-hidden strokeWidth={1.75} className="size-4 shrink-0" />
      <span className="min-w-0 truncate">{children}</span>
      {failed ? (
        <TriangleAlert aria-label="interrompu" strokeWidth={1.75} className="size-3.5 shrink-0 text-warn-ink" />
      ) : done ? (
        <Check aria-label="terminé" strokeWidth={2} className="size-3.5 shrink-0 text-pepite" />
      ) : (
        <LoaderCircle aria-label="en cours" strokeWidth={1.75} className="size-3.5 shrink-0 animate-spin motion-reduce:animate-none" />
      )}
    </p>
  );
}

function Reasoning({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  if (!text.trim()) return null;
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex min-h-8 cursor-pointer items-center text-small text-muted underline decoration-line-strong underline-offset-4 hover:text-ink"
      >
        {open ? "Masquer la réflexion" : "Voir la réflexion"}
      </button>
      {open && (
        <p className="mt-1 rounded-control bg-surface-2 px-3 py-2 text-small whitespace-pre-wrap text-ink-2">{text}</p>
      )}
    </div>
  );
}
