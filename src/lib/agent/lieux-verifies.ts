// src/lib/agent/lieux-verifies.ts
// Un lieu tel que Google l'a renvoyé : c'est la seule source de vérité pour les faits.
export type LieuVerifie = {
  id: string;
  nom: string;
  type: string | null;
  adresse?: string;
  note: number | null;
  nombreAvis: number;
  affluence: string;
  lat?: number;
  lon?: number;
  lienMaps?: string;
  photo?: string;        // référence Google de la photo (jamais envoyée au modèle)
  photoAuteur?: string;  // nom de l'auteur, à afficher (obligation de Google)
};

// Le registre : tous les lieux réellement trouvés pendant UNE requête, rangés par id
export type Registre = Map<string, LieuVerifie>;
