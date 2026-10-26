// src/lib/acces.ts
// Accès privé au site : mot de passe unique (SITE_PASSWORD) et cookie signé.
// Utilisé côté serveur uniquement (proxy et route /api/connexion).
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/** Cookie httpOnly qui prouve qu'on a donné le bon mot de passe. */
export const COOKIE_ACCES = "travelmap_acces";
/** Cookie lisible par l'interface, sans rien de secret : il sert seulement à afficher « Se déconnecter ». */
export const COOKIE_CONNECTE = "travelmap_connecte";

export const DUREE_ACCES_SECONDES = 30 * 24 * 60 * 60; // 30 jours

/** Le mot de passe du site, ou null si l'accès n'est pas protégé (en local). */
export function motDePasseDuSite() {
  return process.env.SITE_PASSWORD || null;
}

// Compare deux textes en temps constant, via leurs empreintes SHA-256 (toujours 32 octets) :
// la durée ne révèle ni les caractères justes ni la longueur du mot de passe.
function egauxEnTempsConstant(a: string, b: string) {
  const empreinte = (texte: string) => createHash("sha256").update(texte).digest();
  return timingSafeEqual(empreinte(a), empreinte(b));
}

export function motDePasseValide(recu: string) {
  const attendu = motDePasseDuSite();
  return attendu !== null && egauxEnTempsConstant(recu, attendu);
}

// Signature HMAC d'une date de création. La clé dérive du mot de passe :
// changer SITE_PASSWORD déconnecte tout le monde.
function signer(creeLe: string, motDePasse: string) {
  return createHmac("sha256", `travelmap-acces:${motDePasse}`).update(creeLe).digest("base64url");
}

/** Jeton du cookie : « dateDeCréation.signature ». Il ne contient jamais le mot de passe. */
export function creerJeton() {
  const motDePasse = motDePasseDuSite();
  if (!motDePasse) return null;
  const creeLe = String(Date.now());
  return `${creeLe}.${signer(creeLe, motDePasse)}`;
}

/** Vrai si le jeton a bien été signé avec le mot de passe actuel et date de moins de 30 jours. */
export function jetonValide(jeton: string | undefined) {
  const motDePasse = motDePasseDuSite();
  if (!motDePasse || !jeton) return false;
  const [creeLe, signature] = jeton.split(".");
  if (!creeLe || !signature) return false;
  const age = Date.now() - Number(creeLe);
  if (!Number.isFinite(age) || age < 0 || age > DUREE_ACCES_SECONDES * 1000) return false;
  return egauxEnTempsConstant(signature, signer(creeLe, motDePasse));
}
