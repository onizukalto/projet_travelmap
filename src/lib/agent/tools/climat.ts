// src/lib/agent/tools/climat.ts
import { tool } from "ai";
import { z } from "zod";

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

// Moyenne d'une liste en ignorant les valeurs manquantes
function moyenne(valeurs: (number | null)[]) {
  const ok = valeurs.filter((v): v is number => typeof v === "number");
  return ok.length ? Math.round(ok.reduce((a, b) => a + b, 0) / ok.length) : null;
}

export const climatTypique = tool({
  // La description est un prompt : c'est grâce à elle que le modèle décide de s'en servir.
  description:
    "Donne le climat typique d'un lieu pour un mois donné (températures moyennes, jours de pluie), " +
    "d'après les mesures réelles de l'année passée. Utilise-le pour conseiller une période " +
    "ou vérifier qu'un mois convient, plutôt que de répondre de mémoire.",

  // Les paramètres attendus, décrits pour le modèle et vérifiés à chaque appel
  inputSchema: z.object({
    lieu: z.string().describe("Nom de la ville ou du village seul, sans le pays. Ex. : Stepantsminda"),
    codePays: z.string().length(2).describe("Code ISO du pays en 2 lettres. Ex. : GE pour la Géorgie"),
    mois: z.number().int().min(1).max(12).describe("Mois de 1 (janvier) à 12 (décembre)"),
  }),

  // Le vrai travail : c'est TON code qui s'exécute ici, pas le modèle
  execute: async ({ lieu, codePays, mois }) => {
    // 1. Trouver les coordonnées du lieu
    const geoUrl =
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(lieu)}` +
      `&countryCode=${codePays.toUpperCase()}&count=1&language=fr`;
    const geo = await fetch(geoUrl).then((r) => r.json());
    const place = geo.results?.[0];

    // Une erreur renvoyée comme une donnée : le modèle peut alors réagir (corriger le nom, réessayer…)
    if (!place) return { erreur: `Lieu introuvable : ${lieu} (${codePays}). Essaie un nom plus connu à proximité.` };

    // 2. Récupérer les mesures du même mois l'an dernier
    const annee = new Date().getFullYear() - 1;
    const mm = String(mois).padStart(2, "0");
    const dernierJour = new Date(annee, mois, 0).getDate();
    const meteoUrl =
      `https://archive-api.open-meteo.com/v1/archive?latitude=${place.latitude}&longitude=${place.longitude}` +
      `&start_date=${annee}-${mm}-01&end_date=${annee}-${mm}-${dernierJour}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
    const res = await fetch(meteoUrl);
    if (!res.ok) return { erreur: "Le service météo ne répond pas pour le moment." };
    const { daily } = await res.json();

    // 3. Résumer : on renvoie au modèle des chiffres simples, pas 30 lignes de données brutes
    const pluies: (number | null)[] = daily.precipitation_sum;
    return {
      lieu: `${place.name}, ${place.country}`,
      altitudeM: place.elevation,
      periode: `${MOIS[mois - 1]} ${annee}`,
      temperatureMaxMoyenne: moyenne(daily.temperature_2m_max),
      temperatureMinMoyenne: moyenne(daily.temperature_2m_min),
      joursDePluie: pluies.filter((p) => (p ?? 0) >= 1).length,
      source: "Open-Meteo, mesures d'une seule année : c'est une indication, pas une moyenne sur 30 ans",
    };
  },
});
