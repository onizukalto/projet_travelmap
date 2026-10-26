"use client";

import { useEffect, useState } from "react";
import { useConversationsHydrated, useConversationsStore } from "@/lib/conversations-store";
import { useToast } from "@/lib/toast-store";
import { ChatPane, MapPlaceholder } from "./chat-pane";
import { HistoryColumn, HistoryDrawer } from "./history-panel";

/**
 * La conversation ouverte, et d'où elle vient :
 * - « url » ou « list » : une conversation enregistrée (?c=… ou clic dans l'historique) ;
 * - « new » : une nouvelle conversation. Son id est null jusqu'au premier message envoyé.
 * `slot` change à chaque conversation ouverte : c'est la clé du fil, qui ne change pas
 * quand une nouvelle conversation reçoit son id (sinon le premier envoi serait perdu).
 */
type Active = { id: string | null; origin: "url" | "list" | "new"; slot: number };

/** L'adresse reflète la conversation ouverte, sans recharger la page. */
function setUrl(id: string | null) {
  window.history.replaceState(null, "", id ? `/planifier?c=${encodeURIComponent(id)}` : "/planifier");
}

type Props = {
  /** Conversation à rouvrir (?c=…). */
  initialConversation?: string;
  /** Texte de départ d'une nouvelle conversation (?pays=…). */
  initialText?: string;
};

/** Le planificateur : l'historique, la conversation avec l'agent et la carte du jour. */
export function Planner({ initialConversation, initialText = "" }: Props) {
  const hydrated = useConversationsHydrated();
  const conversations = useConversationsStore((state) => state.conversations);
  const supprimer = useConversationsStore((state) => state.supprimer);
  const restaurer = useConversationsStore((state) => state.restaurer);
  const showToast = useToast((state) => state.show);

  const [active, setActive] = useState<Active>(
    initialConversation ? { id: initialConversation, origin: "url", slot: 0 } : { id: null, origin: "new", slot: 0 },
  );
  const [prefill, setPrefill] = useState(initialText);
  const [busy, setBusy] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const stored = conversations.find((c) => c.id === active.id);
  // ?c=… vers une conversation introuvable (supprimée, autre navigateur) : on repart à neuf.
  const missing = hydrated && active.origin !== "new" && active.id !== null && !stored;

  useEffect(() => {
    if (missing) setUrl(null);
  }, [missing]);

  const nouvelle = () => {
    if (busy) return;
    setActive((current) => ({ id: null, origin: "new", slot: current.slot + 1 }));
    setPrefill("");
    setUrl(null);
    setDrawerOpen(false);
  };

  const ouvrir = (id: string) => {
    if (busy && id !== active.id) return;
    setActive((current) => ({ id, origin: "list", slot: current.slot + 1 }));
    setUrl(id);
    setDrawerOpen(false);
  };

  // Premier message d'une nouvelle conversation : elle prend son adresse.
  const demarrer = (id: string) => {
    setActive((current) => ({ ...current, id, origin: "new" }));
    setUrl(id);
  };

  const effacer = (id: string) => {
    const conversation = supprimer(id);
    if (id === active.id) nouvelle();
    if (conversation) {
      showToast("Conversation supprimée", { label: "Annuler", run: () => restaurer(conversation) });
    }
  };

  const list = {
    conversations,
    activeId: active.id ?? "",
    busy,
    onSelect: ouvrir,
    onDelete: effacer,
  };

  return (
    <div className="mx-auto grid h-[calc(100svh-4rem-4.5rem-env(safe-area-inset-bottom))] w-full max-w-[1760px] min-h-0 grid-cols-[minmax(0,1fr)] md:h-[calc(100svh-4rem)] lg:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.1fr)]">
      {hydrated ? (
        <HistoryColumn {...list} onNew={nouvelle} collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      ) : (
        <div aria-hidden className="hidden w-72 border-r border-border bg-surface lg:block" />
      )}

      {hydrated ? (
        <ChatPane
          // Une conversation = un fil indépendant : changer de conversation repart d'un fil neuf.
          key={active.slot}
          conversationId={active.id}
          initialMessages={stored?.messages ?? []}
          initialText={active.origin === "new" ? prefill : ""}
          onStart={demarrer}
          onBusyChange={setBusy}
          onOpenHistory={() => setDrawerOpen(true)}
        />
      ) : (
        <>
          <section aria-label="Conversation avec l'assistant" aria-busy="true" className="min-h-0" />
          <aside aria-label="Carte de l'itinéraire" className="hidden min-h-0 p-4 lg:block lg:pl-0">
            <MapPlaceholder />
          </aside>
        </>
      )}

      {drawerOpen && hydrated && (
        <HistoryDrawer {...list} onNew={nouvelle} onClose={() => setDrawerOpen(false)} />
      )}
    </div>
  );
}
