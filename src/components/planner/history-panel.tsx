"use client";

import { MapPinned, PanelLeftClose, PanelLeftOpen, SquarePen, Trash2, X } from "lucide-react";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { Badge } from "@/components/ui/badge";
import { contientItineraire, type Conversation } from "@/lib/conversations-store";
import { useDismiss } from "@/lib/use-dismiss";

const relatif = new Intl.RelativeTimeFormat("fr", { numeric: "auto", style: "short" });
const jourMois = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });

/** « à l'instant », « il y a 5 min », « il y a 2 h », « hier », puis la date. */
function depuis(date: number, maintenant: number) {
  const secondes = (date - maintenant) / 1000;
  const ecart = Math.abs(secondes);
  if (ecart < 60) return "à l'instant";
  if (ecart < 3600) return relatif.format(Math.round(secondes / 60), "minute");
  if (ecart < 86400) return relatif.format(Math.round(secondes / 3600), "hour");
  if (ecart < 7 * 86400) return relatif.format(Math.round(secondes / 86400), "day");
  return jourMois.format(date);
}

// L'heure actuelle, arrondie à la minute et rafraîchie chaque minute (0 pendant le rendu serveur).
const abonnerMinute = (onChange: () => void) => {
  const timer = setInterval(onChange, 60_000);
  return () => clearInterval(timer);
};
function useMaintenant() {
  return useSyncExternalStore(
    abonnerMinute,
    () => Math.floor(Date.now() / 60_000) * 60_000,
    () => 0,
  );
}

type ListProps = {
  conversations: Conversation[];
  activeId: string;
  busy: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
};

function ConversationList({ conversations, activeId, busy, onSelect, onDelete }: ListProps) {
  const maintenant = useMaintenant();

  if (conversations.length === 0) {
    return <p className="px-4 py-6 text-caption text-ink-2">Tes conversations apparaîtront ici.</p>;
  }

  return (
    <ul className="flex flex-col gap-1 px-2 pb-4">
      {conversations.map((conversation) => {
        const active = conversation.id === activeId;
        return (
          <li key={conversation.id} className="group relative">
            <button
              type="button"
              aria-current={active ? "true" : undefined}
              disabled={busy && !active}
              title={busy && !active ? "Attends la fin de la réponse en cours" : undefined}
              onClick={() => onSelect(conversation.id)}
              className={`flex w-full cursor-pointer flex-col gap-1 rounded-control py-2.5 pr-12 pl-3 text-left transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${
                active ? "bg-accent-yellow text-on-accent ring-1 ring-ink" : "hover:bg-surface-2"
              }`}
            >
              <span className={`line-clamp-2 text-caption leading-snug ${active ? "font-bold text-on-accent" : "font-semibold text-ink"}`}>
                {conversation.titre}
              </span>
              <span className={`flex flex-wrap items-center gap-2 text-small ${active ? "text-on-accent" : "text-muted"}`}>
                {maintenant > 0 && <span>{depuis(conversation.updatedAt, maintenant)}</span>}
                {contientItineraire(conversation) && (
                  <Badge tone={active ? "ink" : "neutral"}>
                    <MapPinned aria-hidden strokeWidth={1.75} className="size-3" />
                    Itinéraire
                  </Badge>
                )}
              </span>
            </button>
            <button
              type="button"
              aria-label={`Supprimer la conversation « ${conversation.titre} »`}
              disabled={busy && active}
              onClick={() => onDelete(conversation.id)}
              className="absolute top-1/2 right-0.5 flex size-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-control text-muted transition-opacity duration-150 hover:text-warn-ink focus-visible:opacity-100 disabled:cursor-not-allowed disabled:hover:text-muted lg:opacity-0 lg:group-hover:opacity-100"
            >
              <Trash2 aria-hidden strokeWidth={1.75} className="size-4" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

const iconButton =
  "flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-control text-ink-2 transition-colors duration-150 hover:bg-surface-2 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50";

type PanelProps = ListProps & {
  onNew: () => void;
  collapsed: boolean;
  onToggle: () => void;
};

/** Colonne « Conversations récentes », repliable (ordinateur). */
export function HistoryColumn({ collapsed, onToggle, onNew, busy, ...list }: PanelProps) {
  if (collapsed) {
    return (
      <nav aria-label="Conversations récentes" className="hidden flex-col items-center gap-1 border-r border-border bg-surface py-3 lg:flex">
        <button type="button" aria-label="Afficher les conversations" aria-expanded={false} onClick={onToggle} className={iconButton}>
          <PanelLeftOpen aria-hidden strokeWidth={1.75} className="size-5" />
        </button>
        <button type="button" aria-label="Nouvelle conversation" disabled={busy} onClick={onNew} className={iconButton}>
          <SquarePen aria-hidden strokeWidth={1.75} className="size-5" />
        </button>
      </nav>
    );
  }

  return (
    <nav aria-labelledby="titre-historique" className="hidden w-72 min-h-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex shrink-0 items-center justify-between gap-2 px-4 pt-3 pb-2">
        <h2 id="titre-historique" className="font-display text-[18px] font-extrabold tracking-[-0.02em] text-ink">
          Conversations récentes
        </h2>
        <button type="button" aria-label="Replier les conversations" aria-expanded onClick={onToggle} className={`${iconButton} -mr-2`}>
          <PanelLeftClose aria-hidden strokeWidth={1.75} className="size-5" />
        </button>
      </div>
      <NewButton busy={busy} onNew={onNew} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ConversationList busy={busy} {...list} />
      </div>
    </nav>
  );
}

function NewButton({ busy, onNew }: { busy: boolean; onNew: () => void }) {
  return (
    <div className="shrink-0 px-2 pb-2">
      <button
        type="button"
        disabled={busy}
        onClick={onNew}
        className="flex min-h-11 w-full cursor-pointer items-center gap-2 rounded-control border border-border bg-surface px-3 font-semibold text-ink transition-[background-color,color,transform] duration-150 hover:bg-ink hover:text-bg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <SquarePen aria-hidden strokeWidth={1.75} className="size-[18px]" />
        Nouvelle conversation
      </button>
    </div>
  );
}

/** Tiroir « Conversations récentes » (mobile), qui glisse depuis la gauche. */
export function HistoryDrawer({ onClose, onNew, busy, ...list }: ListProps & { onNew: () => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useDismiss(ref, true, onClose);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div aria-hidden className="absolute inset-0 bg-ink/40" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titre-tiroir"
        className="drawer-in absolute inset-y-0 left-0 flex w-[min(22rem,88vw)] flex-col border-r border-border bg-surface pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] shadow-float"
      >
        <div className="flex shrink-0 items-center justify-between gap-2 px-4 pt-3 pb-2">
          <h2 id="titre-tiroir" className="font-display text-[18px] font-extrabold tracking-[-0.02em] text-ink">
            Conversations récentes
          </h2>
          <button ref={closeRef} type="button" aria-label="Fermer" onClick={onClose} className={`${iconButton} -mr-2`}>
            <X aria-hidden strokeWidth={1.75} className="size-5" />
          </button>
        </div>
        <NewButton busy={busy} onNew={onNew} />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ConversationList busy={busy} {...list} />
        </div>
      </div>
    </div>
  );
}
