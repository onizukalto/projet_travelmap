"use client";

import type { UIMessage } from "ai";
import { Check, CloudSun, LoaderCircle, Route, Search, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { ItineraryView } from "./itinerary-view";
import { Markdown } from "./markdown";
import { isItineraire, type EtapeRendue } from "./types";

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

type Part = UIMessage["parts"][number];
/** Partie « outil » : son nom commence par tool-, avec un état, une entrée et une sortie. */
type ToolPart = Extract<Part, { type: `tool-${string}` }>;

const isToolPart = (part: Part): part is ToolPart => part.type.startsWith("tool-");
const hasErreur = (output: unknown) => typeof output === "object" && output !== null && "erreur" in output;

type TrajetCalcule = { troncons?: { de: string; vers: string }[]; total?: { duree: string; distanceKm: number } };

/** Les noms des lieux trouvés par rechercherLieux dans ce message, par id (calculerTrajet ne reçoit que des id). */
function nomsDesLieux(message: UIMessage) {
  const noms = new Map<string, string>();
  for (const part of message.parts) {
    if (part.type !== "tool-rechercherLieux" || part.state !== "output-available") continue;
    const lieux = (part.output as { lieux?: { id: string; nom: string }[] } | undefined)?.lieux ?? [];
    for (const lieu of lieux) noms.set(lieu.id, lieu.nom);
  }
  return noms;
}

type Props = {
  message: UIMessage;
  /** Id de l'appel qui a produit l'itinéraire le plus récent (le seul qu'on enregistre). */
  latestItineraryId: string | null;
  selectedDay: number | null;
  onSelectDay: (day: number) => void;
  onSave: () => void | Promise<void>;
  /** Remplace une étape de l'itinéraire (appel qui l'a produit, jour, position). */
  onReplaceStep?: (toolCallId: string, jour: number, index: number, etape: EtapeRendue) => void;
  /** Faux pendant que l'agent répond. */
  editable?: boolean;
  /** Vrai pour le message que l'agent est en train d'écrire. */
  streaming?: boolean;
};

/** Un message de la conversation : celui de l'utilisateur, ou les étapes et la réponse de l'agent. */
export function ChatMessage({
  message,
  latestItineraryId,
  selectedDay,
  onSelectDay,
  onSave,
  onReplaceStep,
  editable = true,
  streaming = false,
}: Props) {
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

  const noms = nomsDesLieux(message);

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
          case "tool-calculerTrajet": {
            // Les noms viennent du résultat s'il est là (lieux d'un message précédent compris),
            // sinon des recherches de ce message.
            const ids = Array.isArray(input.lieuxIds) ? (input.lieuxIds as string[]) : [];
            const trajet = hasErreur(output) ? undefined : (output as TrajetCalcule | undefined);
            const premier = trajet?.troncons?.[0]?.de ?? noms.get(ids[0]) ?? "…";
            const dernier = trajet?.troncons?.at(-1)?.vers ?? (ids.length > 1 ? noms.get(ids[ids.length - 1]) : undefined) ?? "…";
            return (
              <ToolLine key={key} icon={Route} done={done} failed={failed || hasErreur(output)}>
                Trajet : {premier} → {dernier}
                {trajet?.total ? ` · ${trajet.total.duree}` : ""}
              </ToolLine>
            );
          }
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
                onReplaceStep={
                  part.toolCallId === latestItineraryId && onReplaceStep
                    ? (jour, index, etape) => onReplaceStep(part.toolCallId, jour, index, etape)
                    : undefined
                }
                editable={editable}
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
