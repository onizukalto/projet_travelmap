"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { ArrowUp, History, Map as MapIcon, RotateCcw, Square, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BlankAtlas } from "@/components/blank-atlas";
import { buttonPrimary, buttonSecondary } from "@/lib/button";
import { newConversationId, useConversationsStore } from "@/lib/conversations-store";
import { countryAt } from "@/lib/locate";
import { useTripsStore } from "@/lib/trips-store";
import { useDismiss } from "@/lib/use-dismiss";
import { prefersReducedMotion } from "@/lib/use-media-query";
import { loadWorld50m } from "@/lib/world-50m";
import { ChatMessage } from "./chat-message";
import { PlannerMap } from "./planner-map";
import { isItineraire, type ItineraireRendu } from "./types";

const IDEAS = [
  "Dix jours au Japon, hors des sentiers battus",
  "Un road trip d'une semaine dans les Pouilles",
  "Trois jours autour de Kazbegi en Géorgie, en juin",
];

const transport = new DefaultChatTransport({ api: "/api/chat" });

/** Le dernier itinéraire rendu par l'outil proposerItineraire, en partant de la fin. */
function findLatestItinerary(messages: UIMessage[]) {
  for (let m = messages.length - 1; m >= 0; m--) {
    const parts = messages[m].parts;
    for (let p = parts.length - 1; p >= 0; p--) {
      const part = parts[p];
      if (part.type === "tool-proposerItineraire" && part.state === "output-available" && isItineraire(part.output)) {
        return { id: part.toolCallId, itineraire: part.output as ItineraireRendu };
      }
    }
  }
  return null;
}

/** Vrai si le message de l'agent se termine par une vraie réponse (repondre accepté ou itinéraire). */
function aUneReponseFinale(message: UIMessage) {
  return message.parts.some((part) => {
    if (!("state" in part) || part.state !== "output-available") return false;
    if (part.type === "tool-proposerItineraire") return true;
    if (part.type !== "tool-repondre") return false;
    const output = part.output as unknown;
    return !(typeof output === "object" && output !== null && "erreur" in output);
  });
}

type Props = {
  /** Conversation enregistrée à rouvrir, ou null pour une nouvelle conversation. */
  conversationId: string | null;
  initialMessages: UIMessage[];
  initialText?: string;
  /** Appelé au premier message envoyé dans une nouvelle conversation, avec son nouvel id. */
  onStart: (id: string) => void;
  onBusyChange: (busy: boolean) => void;
  /** Ouvre l'historique (tiroir, sur mobile). */
  onOpenHistory: () => void;
};

/** Une conversation avec l'agent : le fil et le champ de saisie, la carte du jour à droite. */
export function ChatPane({ conversationId, initialMessages, initialText = "", onStart, onBusyChange, onOpenHistory }: Props) {
  const router = useRouter();
  const createTrip = useTripsStore((state) => state.createTrip);
  const addStop = useTripsStore((state) => state.addStop);
  const enregistrer = useConversationsStore((state) => state.enregistrer);
  // L'id d'une nouvelle conversation n'est créé qu'au premier envoi (jamais pendant le rendu).
  const idRef = useRef(conversationId);
  // useChat recrée sa conversation si son id change : on lui garde celui du départ.
  const [chatId] = useState(conversationId ?? undefined);
  const { messages, sendMessage, status, stop, error, regenerate, clearError } = useChat({
    id: chatId,
    messages: initialMessages,
    transport,
    // Sauvegarde à chaque fin de réponse, y compris interrompue ou en erreur.
    onFinish: ({ messages: all }) => {
      if (idRef.current) enregistrer(idRef.current, all);
    },
  });

  const [text, setText] = useState(initialText);
  const [dayChoice, setDayChoice] = useState<{ key: string; day: number } | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    onBusyChange(busy);
  }, [busy, onBusyChange]);

  // L'itinéraire le plus récent de la conversation : c'est lui que suit la carte.
  const latest = useMemo(() => findLatestItinerary(messages), [messages]);

  const firstDay = latest?.itineraire.jours[0]?.jour ?? 1;
  const day = latest && dayChoice?.key === latest.id ? dayChoice.day : firstDay;
  const selectDay = useCallback(
    (next: number) => latest && setDayChoice({ key: latest.id, day: next }),
    [latest],
  );

  // Le fil descend tout seul quand un message ou une étape arrive.
  useEffect(() => {
    const box = scrollRef.current;
    if (!box) return;
    box.scrollTo({ top: box.scrollHeight, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [messages, status]);

  const send = (value: string) => {
    const message = value.trim();
    if (!message || busy) return;
    if (error) clearError();
    if (!idRef.current) {
      idRef.current = newConversationId();
      onStart(idRef.current);
    }
    sendMessage({ text: message });
    setText("");
  };

  const retry = () => {
    clearError();
    regenerate();
  };

  // Enregistre l'itinéraire comme une idée de voyage, puis ouvre sa page.
  const save = async () => {
    if (!latest) return;
    const { itineraire } = latest;
    // Les frontières détaillées évitent de ranger un lieu frontalier dans le pays voisin.
    const detailed = (await loadWorld50m().catch(() => null))?.keyed;
    const id = createTrip({ title: itineraire.titre, status: "idea" });
    for (const jour of itineraire.jours) {
      for (const etape of jour.etapes) {
        if (etape.lat === undefined || etape.lon === undefined) continue;
        addStop(id, {
          day: jour.jour,
          name: etape.nom,
          lat: etape.lat,
          lon: etape.lon,
          note: etape.description,
          transport: "road",
          country: countryAt(etape.lon, etape.lat, { detailed }),
        });
      }
    }
    router.push(`/voyages/${id}`);
  };

  // Limite du jour (garde-fou du serveur) : inutile de réessayer avant demain.
  const dailyLimit = Boolean(error && /limite-jour/.test(error.message));
  // Limite du fournisseur (Groq) : ça repasse au bout d'une minute.
  const rateLimited = !dailyLimit && Boolean(error && /429|rate.?limit|too many|trop de demandes/i.test(error.message));
  const last = messages.at(-1);
  // Réponse interrompue : une erreur, ou un dernier message de l'agent sans réponse finale.
  const interrupted =
    !busy && !dailyLimit && !rateLimited && (Boolean(error) || (last?.role === "assistant" && !aUneReponseFinale(last)));
  const suggestions = latest ? ["Moins de route", "Plus de pépites", `Refais le jour ${day}`] : [];
  const empty = messages.length === 0;

  return (
    <>
      {/* Conversation */}
      <section aria-label="Conversation avec l'assistant" className="flex min-h-0 flex-col">
        <header
          className={`flex shrink-0 items-center justify-between gap-3 border-b border-line px-4 py-2 md:px-6 lg:px-8 ${
            empty ? "lg:hidden" : ""
          }`}
        >
          {empty ? <span /> : <h1 className="text-section text-ink">Planifier</h1>}
          <button
            type="button"
            onClick={onOpenHistory}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-control px-3 text-caption font-semibold text-ink-2 hover:bg-bg hover:text-ink lg:hidden"
          >
            <History aria-hidden strokeWidth={1.8} className="size-4" />
            Conversations
          </button>
        </header>

        <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-6 lg:px-8">
          {empty ? (
            <div className="flex h-full flex-col justify-center">
              <h1 className="text-[32px] leading-[1.1] font-extrabold tracking-[-0.02em] text-ink md:text-page-title">
                Où as-tu envie d&apos;aller ?
              </h1>
              <p className="mt-3 max-w-[52ch] text-ink">
                Décris ton voyage en une phrase. L&apos;assistant construit l&apos;itinéraire jour par jour, vérifie
                chaque lieu, et propose des pépites loin de la foule.
              </p>
              <div className="mt-6">
                <p className="text-caption font-semibold text-ink-2">Pour t&apos;inspirer</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {IDEAS.map((idea) => (
                    <button
                      key={idea}
                      type="button"
                      onClick={() => {
                        setText(idea);
                        inputRef.current?.focus();
                      }}
                      className="min-h-11 cursor-pointer rounded-control border border-line bg-surface px-3.5 py-2 text-left text-caption text-ink transition-colors duration-150 hover:border-ink-2 hover:bg-surface-raised"
                    >
                      {idea}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <ol aria-live="polite" className="mx-auto flex max-w-3xl flex-col gap-6">
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  latestItineraryId={latest?.id ?? null}
                  selectedDay={day}
                  onSelectDay={selectDay}
                  onSave={save}
                  streaming={busy && index === messages.length - 1}
                />
              ))}

              {busy && (
                <li role="status" className="flex items-center gap-2.5 text-caption text-ink-2">
                  <span aria-hidden className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="size-1.5 rounded-full bg-ink-2 motion-safe:animate-pulse"
                        style={{ animationDelay: `${i * 160}ms` }}
                      />
                    ))}
                  </span>
                  L&apos;agent prépare ta réponse…
                </li>
              )}

              {!busy && (dailyLimit || rateLimited) && (
                <li role="alert" className="rounded-panel bg-warn-bg p-4 text-warn-ink">
                  <p className="font-semibold">
                    {dailyLimit
                      ? "Tu as atteint la limite du jour. Reviens demain !"
                      : "Trop de demandes, réessaie dans une minute."}
                  </p>
                  {rateLimited && (
                    <button type="button" onClick={retry} className={`${buttonSecondary} mt-3 border-warn-ink text-warn-ink`}>
                      <RotateCcw aria-hidden strokeWidth={1.8} className="size-4" />
                      Réessayer
                    </button>
                  )}
                </li>
              )}

              {interrupted && (
                <li role="alert" className="rounded-panel bg-warn-bg p-4 text-warn-ink">
                  <p className="font-semibold">La réponse a été interrompue.</p>
                  <p className="mt-0.5 text-caption">Relance-la : ça passe souvent au deuxième essai.</p>
                  <button type="button" onClick={retry} className={`${buttonSecondary} mt-3 border-warn-ink text-warn-ink`}>
                    <RotateCcw aria-hidden strokeWidth={1.8} className="size-4" />
                    Réessayer
                  </button>
                </li>
              )}

              {!busy && !error && !interrupted && last?.role === "assistant" && suggestions.length > 0 && (
                <li>
                  <p className="sr-only">Suggestions rapides</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => send(suggestion)}
                        className="min-h-11 cursor-pointer rounded-control border border-line bg-surface px-3.5 text-caption font-semibold text-ink transition-colors duration-150 hover:border-ink-2 hover:bg-surface-raised"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </li>
              )}
            </ol>
          )}
        </div>

        {/* Champ de saisie */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            send(text);
          }}
          className="shrink-0 border-t border-line bg-surface px-4 py-3 md:px-6 lg:px-8"
        >
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            {latest && (
              <button
                type="button"
                onClick={() => setMapOpen(true)}
                aria-label="Voir la carte de l'itinéraire"
                className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-control border border-line text-ink hover:bg-bg lg:hidden"
              >
                <MapIcon aria-hidden strokeWidth={1.8} className="size-5" />
              </button>
            )}
            <label htmlFor="message-assistant" className="sr-only">
              Ton message à l&apos;assistant
            </label>
            <textarea
              id="message-assistant"
              ref={inputRef}
              rows={1}
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                // Entrée envoie, Maj + Entrée passe à la ligne.
                if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  send(text);
                }
              }}
              placeholder={empty ? "Par exemple : deux semaines en Écosse en van" : "Ta réponse ou une précision…"}
              className="max-h-40 min-h-11 flex-1 resize-none rounded-control border border-line-strong bg-surface-raised px-4 py-2.5 text-ink [field-sizing:content] placeholder:text-muted hover:border-ink-2 focus-visible:border-ink"
            />
            {busy ? (
              <button type="button" onClick={() => stop()} className={`${buttonSecondary} shrink-0`}>
                <Square aria-hidden strokeWidth={1.8} className="size-4 fill-current" />
                Arrêter
              </button>
            ) : (
              <button
                type="submit"
                disabled={!text.trim()}
                aria-label="Envoyer"
                className={`${buttonPrimary} size-11 shrink-0 px-0`}
              >
                <ArrowUp aria-hidden strokeWidth={2} className="size-5" />
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Carte (grand écran) */}
      <aside aria-label="Carte de l'itinéraire" className="hidden min-h-0 p-4 lg:block lg:pl-0">
        {latest ? (
          <PlannerMap itineraire={latest.itineraire} day={day} onDayChange={selectDay} />
        ) : (
          <MapPlaceholder />
        )}
      </aside>

      {/* Carte (mobile) : panneau qui monte du bas de l'écran */}
      {mapOpen && latest && (
        <MapSheet onClose={() => setMapOpen(false)}>
          <PlannerMap itineraire={latest.itineraire} day={day} onDayChange={selectDay} />
        </MapSheet>
      )}
    </>
  );
}

/** Carte vide, avant le premier itinéraire. */
export function MapPlaceholder() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-panel border border-line bg-surface">
      <div className="flex flex-1 items-center justify-center p-8">
        <BlankAtlas className="h-auto w-full" />
      </div>
      <p className="bg-bg/60 px-6 py-4 text-caption text-ink-2">
        <span className="font-bold text-ink">Ton itinéraire se dessinera ici</span>, jour après jour, avec les pépites
        en vert.
      </p>
    </div>
  );
}

function MapSheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
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
        aria-label="Carte de l'itinéraire"
        className="sheet-in absolute inset-x-0 bottom-0 flex h-[80svh] flex-col rounded-t-panel border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] shadow-float"
      >
        <div className="flex shrink-0 items-center justify-between px-4 pt-3 pb-1">
          <span aria-hidden className="mx-auto h-1 w-10 rounded-full bg-line-strong" />
        </div>
        <div className="flex shrink-0 items-center justify-between px-4 pb-2">
          <p className="font-bold text-ink">Carte de l&apos;itinéraire</p>
          <button
            ref={closeRef}
            type="button"
            aria-label="Fermer la carte"
            onClick={onClose}
            className="flex size-11 cursor-pointer items-center justify-center rounded-control text-ink-2 hover:bg-bg hover:text-ink"
          >
            <X aria-hidden strokeWidth={1.8} className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 px-3 pb-3">{children}</div>
      </div>
    </div>
  );
}
