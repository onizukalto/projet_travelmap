"use client";

import type { UIMessage } from "ai";
import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

export type Conversation = {
  id: string;
  /** Premier message de l'utilisateur, tronqué à 60 caractères. */
  titre: string;
  createdAt: number;
  updatedAt: number;
  messages: UIMessage[];
};

const MAX_CONVERSATIONS = 30;
const MAX_TITRE = 60;

export const newConversationId = () => crypto.randomUUID().slice(0, 12);

function titreDe(messages: UIMessage[]) {
  const premier = messages.find((m) => m.role === "user");
  const texte = (premier?.parts ?? [])
    .map((p) => (p.type === "text" ? p.text : ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (!texte) return "Nouvelle conversation";
  return texte.length > MAX_TITRE ? `${texte.slice(0, MAX_TITRE - 1).trimEnd()}…` : texte;
}

/** Les réflexions du modèle prennent de la place et ne sont pas utiles à la relecture : on les retire. */
function sansReflexion(messages: UIMessage[]): UIMessage[] {
  return messages.map((m) => ({ ...m, parts: m.parts.filter((p) => p.type !== "reasoning") }));
}

/** Les plus récentes d'abord, 30 au maximum. */
function ranger(conversations: Conversation[]) {
  return [...conversations].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_CONVERSATIONS);
}

/** Vrai si la conversation contient un itinéraire rendu par l'agent. */
export function contientItineraire(conversation: Conversation) {
  return conversation.messages.some((m) =>
    m.parts.some((p) => p.type === "tool-proposerItineraire" && "state" in p && p.state === "output-available"),
  );
}

// Si le navigateur manque de place, on n'enregistre pas plutôt que de faire planter la page.
const stockage: StateStorage = {
  getItem: (name) => localStorage.getItem(name),
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      console.warn("Conversations non enregistrées : espace insuffisant dans le navigateur.", error);
    }
  },
  removeItem: (name) => localStorage.removeItem(name),
};

type ConversationsState = {
  conversations: Conversation[];
  /** Crée ou met à jour une conversation avec ses messages. */
  enregistrer: (id: string, messages: UIMessage[]) => void;
  supprimer: (id: string) => Conversation | null;
  restaurer: (conversation: Conversation) => void;
};

/** Historique des conversations du planificateur, enregistré dans ce navigateur. */
export const useConversationsStore = create<ConversationsState>()(
  persist(
    (set, get) => ({
      conversations: [],
      enregistrer: (id, messages) => {
        if (!messages.some((m) => m.role === "user")) return;
        const maintenant = Date.now();
        set(({ conversations }) => {
          const existante = conversations.find((c) => c.id === id);
          const conversation: Conversation = {
            id,
            titre: existante?.titre ?? titreDe(messages),
            createdAt: existante?.createdAt ?? maintenant,
            updatedAt: maintenant,
            messages: sansReflexion(messages),
          };
          return { conversations: ranger([conversation, ...conversations.filter((c) => c.id !== id)]) };
        });
      },
      supprimer: (id) => {
        const conversation = get().conversations.find((c) => c.id === id) ?? null;
        set(({ conversations }) => ({ conversations: conversations.filter((c) => c.id !== id) }));
        return conversation;
      },
      restaurer: (conversation) =>
        set(({ conversations }) => ({
          conversations: ranger([conversation, ...conversations.filter((c) => c.id !== conversation.id)]),
        })),
    }),
    {
      name: "travelmap-conversations",
      version: 1,
      storage: createJSONStorage(() => stockage),
      partialize: ({ conversations }) => ({ conversations }),
      skipHydration: true,
    },
  ),
);

/** Vrai une fois l'historique relu depuis le navigateur. */
export function useConversationsHydrated() {
  return useSyncExternalStore(
    (onChange) => useConversationsStore.persist.onFinishHydration(onChange),
    () => useConversationsStore.persist.hasHydrated(),
    () => false,
  );
}
