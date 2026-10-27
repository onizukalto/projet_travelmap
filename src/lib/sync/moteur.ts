"use client";

// Synchronisation des données avec le compte Supabase.
//
// Les stores zustand restent la source affichée (et leur copie dans le navigateur, pour le hors-ligne).
// Ce module les observe sans toucher à leur logique :
// - chaque modification est notée « en attente » avec sa date, puis envoyée par un upsert après un court délai ;
// - à la connexion (et au retour sur l'onglet), il recharge les données du compte et fusionne :
//   pour un même pays, voyage ou conversation, la modification la plus récente gagne.
//
// Pour savoir si un élément absent a été supprimé ici ou ailleurs, il garde dans le navigateur
// (clé « travelmap-sync ») la date de dernière synchronisation de chaque élément.

import type { Conversation } from "@/lib/conversations-store";
import { useConversationsStore } from "@/lib/conversations-store";
import { useMapStore, type CountryStatus } from "@/lib/map-store";
import { supabaseNavigateur } from "@/lib/supabase/client";
import { useTripsStore, type Trip } from "@/lib/trips-store";
import { useSession, type CompteLocal } from "./session-store";

type Table = "pays" | "voyages" | "conversations";
const TABLES: Table[] = ["pays", "voyages", "conversations"];
type Valeurs = Record<string, unknown>;
type Dates = Record<string, number>;

type Meta = {
  /** Le compte synchronisé dans ce navigateur. */
  userId: string | null;
  /** Date (ms) de chaque élément tel qu'il est enregistré dans le compte, à la dernière synchronisation. */
  base: Record<Table, Dates>;
  /** Éléments modifiés ici et pas encore envoyés, avec la date de la modification. */
  attente: Record<Table, Dates>;
};

const CLE_META = "travelmap-sync";
const DELAI_ENVOI_MS = 1200;
const DELAI_NOUVEL_ESSAI_MS = 15_000;
const MAX_CONVERSATIONS = 30;

const metaVide = (userId: string | null): Meta => ({
  userId,
  base: { pays: {}, voyages: {}, conversations: {} },
  attente: { pays: {}, voyages: {}, conversations: {} },
});

function lireMeta(): Meta {
  try {
    const brut = localStorage.getItem(CLE_META);
    return brut ? { ...metaVide(null), ...(JSON.parse(brut) as Meta) } : metaVide(null);
  } catch {
    return metaVide(null);
  }
}

// ---- Chaque table : sa colonne d'identifiant, sa colonne de contenu, et son store ----

type MapState = ReturnType<typeof useMapStore.getState>;
type TripsState = ReturnType<typeof useTripsStore.getState>;
type ConversationsState = ReturnType<typeof useConversationsStore.getState>;

const COLONNES: Record<Table, { cle: "code" | "id"; contenu: "statut" | "data" }> = {
  pays: { cle: "code", contenu: "statut" },
  voyages: { cle: "id", contenu: "data" },
  conversations: { cle: "id", contenu: "data" },
};

const extraire = {
  pays: (s: MapState): Valeurs => ({ ...s.countryStatuses }),
  voyages: (s: TripsState): Valeurs => Object.fromEntries(s.trips.map((t) => [t.id, t])),
  conversations: (s: ConversationsState): Valeurs => Object.fromEntries(s.conversations.map((c) => [c.id, c])),
};

function lireLocal(table: Table): Valeurs {
  if (table === "pays") return extraire.pays(useMapStore.getState());
  if (table === "voyages") return extraire.voyages(useTripsStore.getState());
  return extraire.conversations(useConversationsStore.getState());
}

/** Écrit dans un store, du plus récent au plus ancien, sans déclencher d'envoi. */
function ecrireLocal(table: Table, valeurs: Valeurs, dates: Dates) {
  const parDate = (ids: string[]) => ids.sort((a, b) => (dates[b] ?? 0) - (dates[a] ?? 0));
  ecriture = true;
  try {
    if (table === "pays") {
      useMapStore.setState({ countryStatuses: valeurs as Record<string, CountryStatus> });
    } else if (table === "voyages") {
      useTripsStore.setState({ trips: parDate(Object.keys(valeurs)).map((id) => valeurs[id] as Trip) });
    } else {
      const conversations = Object.values(valeurs) as Conversation[];
      useConversationsStore.setState({
        conversations: conversations.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_CONVERSATIONS),
      });
    }
  } finally {
    ecriture = false;
  }
}

function compterLocal(): CompteLocal {
  return {
    pays: Object.keys(lireLocal("pays")).length,
    voyages: Object.keys(lireLocal("voyages")).length,
    conversations: Object.keys(lireLocal("conversations")).length,
  };
}

// ---- État du moteur ----

let utilisateur: string | null = null;
let meta: Meta = metaVide(null);
let ecriture = false; // vrai quand le moteur écrit lui-même dans les stores
let desabonnements: (() => void)[] = [];
const minuteries: Partial<Record<Table, ReturnType<typeof setTimeout>>> = {};
let reponseImport: ((importer: boolean) => void) | null = null;
let dernierChargement = 0;

function sauverMeta() {
  try {
    localStorage.setItem(CLE_META, JSON.stringify(meta));
  } catch {
    // Navigateur plein : la synchronisation continue, sans mémoire entre deux visites.
  }
}

function majEtat() {
  const enAttente = TABLES.some((t) => Object.keys(meta.attente[t]).length > 0);
  if (!navigator.onLine) useSession.setState({ synchro: "hors-ligne" });
  else useSession.setState((s) => ({ synchro: enAttente ? (s.synchro === "erreur" ? "erreur" : "en-attente") : "a-jour" }));
}

// ---- Envoi des modifications ----

function planifierEnvoi(table: Table, delai = DELAI_ENVOI_MS) {
  clearTimeout(minuteries[table]);
  minuteries[table] = setTimeout(() => void envoyer(table), delai);
}

async function envoyer(table: Table) {
  const uid = utilisateur;
  const attente = { ...meta.attente[table] };
  const ids = Object.keys(attente);
  if (!uid || ids.length === 0) return majEtat();
  if (!navigator.onLine) return majEtat();

  const { cle, contenu } = COLONNES[table];
  const local = lireLocal(table);
  const aEnvoyer = ids.filter((id) => id in local);
  const aSupprimer = ids.filter((id) => !(id in local));
  const supabase = supabaseNavigateur();
  try {
    if (aEnvoyer.length) {
      const lignes = aEnvoyer.map((id) => ({
        user_id: uid,
        [cle]: id,
        [contenu]: local[id],
        updated_at: new Date(attente[id]).toISOString(),
      }));
      const { error } = await supabase.from(table).upsert(lignes, { onConflict: `user_id,${cle}` });
      if (error) throw error;
    }
    if (aSupprimer.length) {
      const { error } = await supabase.from(table).delete().eq("user_id", uid).in(cle, aSupprimer);
      if (error) throw error;
    }
    if (utilisateur !== uid) return; // déconnecté entre-temps
    for (const id of ids) {
      // Modifié de nouveau pendant l'envoi : il reste en attente.
      if (meta.attente[table][id] === attente[id]) delete meta.attente[table][id];
      if (aSupprimer.includes(id)) delete meta.base[table][id];
      else meta.base[table][id] = attente[id];
    }
    sauverMeta();
    useSession.setState({ synchro: "a-jour" });
    majEtat();
  } catch (error) {
    console.warn(`Synchronisation (${table}) impossible pour le moment :`, error);
    useSession.setState({ synchro: "erreur" });
    planifierEnvoi(table, DELAI_NOUVEL_ESSAI_MS);
  }
}

function envoyerTout() {
  for (const table of TABLES) void envoyer(table);
}

/** Note les éléments modifiés entre deux états d'un store. */
function noterChangements(table: Table, avant: Valeurs, apres: Valeurs) {
  if (ecriture || !utilisateur) return;
  const maintenant = Date.now();
  let change = false;
  for (const id of new Set([...Object.keys(avant), ...Object.keys(apres)])) {
    if (avant[id] !== apres[id]) {
      // Une modification faite ici est toujours plus récente que la version sur laquelle elle s'appuie,
      // même si l'horloge de cet appareil retarde sur celle d'un autre.
      meta.attente[table][id] = Math.max(maintenant, (meta.base[table][id] ?? 0) + 1);
      change = true;
    }
  }
  if (!change) return;
  sauverMeta();
  useSession.setState({ synchro: "en-attente" });
  planifierEnvoi(table);
}

function abonner() {
  desabonner();
  desabonnements = [
    useMapStore.subscribe((s, p) => noterChangements("pays", extraire.pays(p), extraire.pays(s))),
    useTripsStore.subscribe((s, p) => noterChangements("voyages", extraire.voyages(p), extraire.voyages(s))),
    useConversationsStore.subscribe((s, p) =>
      noterChangements("conversations", extraire.conversations(p), extraire.conversations(s)),
    ),
  ];
}

function desabonner() {
  for (const off of desabonnements) off();
  desabonnements = [];
  for (const table of TABLES) clearTimeout(minuteries[table]);
}

// ---- Chargement et fusion ----

type Distant = Record<string, { valeur: unknown; date: number }>;

async function lireDistant(uid: string): Promise<Record<Table, Distant> | null> {
  const supabase = supabaseNavigateur();
  const reponses = await Promise.all(
    TABLES.map((table) => {
      const { cle, contenu } = COLONNES[table];
      return supabase.from(table).select(`${cle}, ${contenu}, updated_at`).eq("user_id", uid);
    }),
  );
  if (reponses.some((r) => r.error)) {
    console.warn("Chargement du compte impossible :", reponses.find((r) => r.error)?.error);
    return null;
  }
  const resultat = {} as Record<Table, Distant>;
  TABLES.forEach((table, i) => {
    const { cle, contenu } = COLONNES[table];
    resultat[table] = {};
    for (const ligne of (reponses[i].data ?? []) as Record<string, unknown>[]) {
      resultat[table][String(ligne[cle])] = { valeur: ligne[contenu], date: Date.parse(String(ligne.updated_at)) };
    }
  });
  return resultat;
}

/**
 * Fusionne une table : pour chaque élément, la version la plus récente l'emporte.
 * - modifié ici (en attente) : on garde la version d'ici, sauf si celle du compte est plus récente ;
 * - sinon, la version du compte fait foi ;
 * - absent du compte mais déjà synchronisé : il a été supprimé ailleurs ;
 * - absent du compte et jamais synchronisé : il est nouveau ici, on l'envoie.
 */
function fusionner(table: Table, distant: Distant) {
  const local = lireLocal(table);
  const base = meta.base[table];
  const attente = meta.attente[table];
  const resultat: Valeurs = {};
  const dates: Dates = {};

  for (const id of new Set([...Object.keys(local), ...Object.keys(distant)])) {
    const ici = id in local;
    const compte = distant[id];
    if (attente[id] !== undefined) {
      if (compte && compte.date > attente[id]) {
        delete attente[id];
        resultat[id] = compte.valeur;
        dates[id] = base[id] = compte.date;
      } else if (ici) {
        resultat[id] = local[id];
        dates[id] = attente[id];
      }
      // Supprimé ici, en attente d'envoi : on ne le remet pas.
    } else if (compte) {
      resultat[id] = compte.valeur;
      dates[id] = base[id] = compte.date;
    } else if (base[id] !== undefined) {
      delete base[id];
    } else if (ici) {
      resultat[id] = local[id];
      dates[id] = attente[id] = Date.now();
    }
  }

  // Un seul pays « j'y vis » : s'il y en a plusieurs après fusion, le plus récent garde ce statut.
  if (table === "pays") {
    const maisons = Object.keys(resultat).filter((id) => resultat[id] === "home");
    maisons.sort((a, b) => (dates[b] ?? 0) - (dates[a] ?? 0));
    for (const id of maisons.slice(1)) {
      resultat[id] = "visited";
      dates[id] = attente[id] = Date.now();
    }
  }

  ecrireLocal(table, resultat, dates);
}

async function charger() {
  const uid = utilisateur;
  if (!uid || !navigator.onLine) return majEtat();
  const distant = await lireDistant(uid);
  if (!distant || utilisateur !== uid) {
    if (!distant) useSession.setState({ synchro: "erreur" });
    return;
  }
  for (const table of TABLES) fusionner(table, distant[table]);
  dernierChargement = Date.now();
  sauverMeta();
  envoyerTout();
  majEtat();
}

// ---- Cycle de vie ----

function hydrate(store: { persist: { hasHydrated: () => boolean; onFinishHydration: (fn: () => void) => () => void } }) {
  return new Promise<void>((resolve) => {
    if (store.persist.hasHydrated()) return resolve();
    const off = store.persist.onFinishHydration(() => {
      off();
      resolve();
    });
  });
}

const auRetour = () => {
  // Retour sur l'onglet : on récupère ce qui a pu changer sur un autre appareil (au plus une fois par minute).
  if (document.visibilityState === "visible" && Date.now() - dernierChargement > 60_000) void charger();
};
const enLigne = () => void charger();
const horsLigne = () => majEtat();

/** Démarre la synchronisation pour ce compte (à la connexion, ou au chargement d'une page connectée). */
export async function demarrer(userId: string) {
  if (utilisateur === userId) return;
  utilisateur = userId;
  await Promise.all([hydrate(useMapStore), hydrate(useTripsStore), hydrate(useConversationsStore)]);
  if (utilisateur !== userId) return;

  meta = lireMeta();
  if (meta.userId !== userId) {
    // Première connexion de ce compte dans ce navigateur : que faire des données déjà présentes ?
    const compte = compterLocal();
    const importer =
      compte.pays + compte.voyages + compte.conversations > 0 &&
      (await new Promise<boolean>((resolve) => {
        reponseImport = resolve;
        useSession.setState({ importLocal: compte });
      }));
    if (utilisateur !== userId) return;
    if (!importer) viderStores();
    // Sans mémoire de synchronisation, tout ce qui reste ici est considéré comme nouveau, donc envoyé.
    meta = metaVide(userId);
    sauverMeta();
  }

  await charger();
  if (utilisateur !== userId) return;
  abonner();
  document.addEventListener("visibilitychange", auRetour);
  window.addEventListener("online", enLigne);
  window.addEventListener("offline", horsLigne);
}

/** Réponse à la question d'import des données de ce navigateur. */
export function repondreImport(importer: boolean) {
  useSession.setState({ importLocal: null });
  reponseImport?.(importer);
  reponseImport = null;
}

/** Arrête la synchronisation (sans effacer les données de ce navigateur). */
export function arreter() {
  utilisateur = null;
  desabonner();
  document.removeEventListener("visibilitychange", auRetour);
  window.removeEventListener("online", enLigne);
  window.removeEventListener("offline", horsLigne);
  if (reponseImport) repondreImport(false);
}

function viderStores() {
  ecriture = true;
  try {
    useMapStore.setState({ countryStatuses: {} });
    useTripsStore.setState({ trips: [] });
    useConversationsStore.setState({ conversations: [] });
  } finally {
    ecriture = false;
  }
}

/** Oublie le compte dans ce navigateur : arrête la synchronisation et vide les données locales. */
export function oublier() {
  arreter();
  viderStores();
  meta = metaVide(null);
  try {
    localStorage.removeItem(CLE_META);
  } catch {
    // rien à faire
  }
}

/**
 * La session a disparu. Déconnexion volontaire (ici ou dans un autre onglet, qui a effacé la mémoire
 * de synchronisation) : on vide ce navigateur. Session expirée : on garde tout, les modifications
 * en attente repartiront à la reconnexion du même compte.
 */
export function sessionPerdue() {
  let oublie = false;
  try {
    oublie = localStorage.getItem(CLE_META) === null;
  } catch {
    // stockage illisible : on garde les données
  }
  if (oublie) oublier();
  else arreter();
}

/** Déconnexion : on envoie ce qui reste en attente, on ferme la session, puis on vide ce navigateur. */
export async function seDeconnecter() {
  await Promise.all(TABLES.map((table) => envoyer(table))).catch(() => null);
  await supabaseNavigateur().auth.signOut();
  oublier();
}
