"use client";

import { create } from "zustand";

export type EtatSynchro = "a-jour" | "en-attente" | "hors-ligne" | "erreur";
export type CompteLocal = { pays: number; voyages: number; conversations: number };

type SessionState = {
  /** « inconnu » le temps de lire la session au chargement. */
  statut: "inconnu" | "deconnecte" | "connecte";
  email: string | null;
  synchro: EtatSynchro;
  /** Données trouvées dans ce navigateur à la première connexion : la question d'import est affichée. */
  importLocal: CompteLocal | null;
};

/** La session du compte et l'état de la synchronisation, pour l'interface (non enregistrés). */
export const useSession = create<SessionState>()(() => ({
  statut: "inconnu",
  email: null,
  synchro: "a-jour",
  importLocal: null,
}));
