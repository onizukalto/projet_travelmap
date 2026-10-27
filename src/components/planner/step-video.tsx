"use client";

import { Play } from "lucide-react";
import { useId, useState } from "react";

type Video = { videoId: string; titre: string; chaine: string; miniature?: string };
type Etat = { statut: "chargement" } | { statut: "trouvee"; video: Video } | { statut: "aucune" } | { statut: "erreur" };

// Résultats déjà reçus, par requête, pour toute la visite de la page : refermer puis rouvrir
// (la vidéo, ou le jour de l'itinéraire) ne rappelle pas la route. Chaque recherche coûte du quota.
const memoire = new Map<string, Video | null>();
// Recherches en cours : un double clic ne lance pas deux fois la même.
const enCours = new Map<string, Promise<Video | null>>();

/** YouTube renvoie des titres avec des entités HTML (&#39;, &amp;) : on les remet en texte. */
function decoder(texte: string) {
  return new DOMParser().parseFromString(texte, "text/html").documentElement.textContent ?? texte;
}

function chercher(q: string) {
  const deja = enCours.get(q);
  if (deja) return deja;
  const promesse = fetch(`/api/video?q=${encodeURIComponent(q)}`)
    .then(async (res) => {
      if (!res.ok) throw new Error(`video ${res.status}`);
      const { video } = (await res.json()) as { video: Video | null };
      const propre = video ? { ...video, titre: decoder(video.titre), chaine: decoder(video.chaine) } : null;
      memoire.set(q, propre);
      return propre;
    })
    .finally(() => enCours.delete(q));
  enCours.set(q, promesse);
  return promesse;
}

const etatDe = (video: Video | null): Etat => (video ? { statut: "trouvee", video } : { statut: "aucune" });

/**
 * Bouton discret « Voir une vidéo » d'une étape : une vidéo YouTube cherchée seulement au clic,
 * affichée en miniature, puis lue dans un lecteur youtube-nocookie au clic sur la miniature.
 * À placer dans une ligne flex-wrap : le panneau prend toute la largeur, sous le bouton.
 */
export function StepVideo({ nom, adresse }: { nom: string; adresse?: string }) {
  // Le nom du lieu et son pays (la dernière partie de l'adresse).
  const pays = adresse?.split(",").at(-1)?.trim();
  const q = (pays && pays !== nom ? `${nom}, ${pays}` : nom).slice(0, 120);
  const id = useId();
  const [ouvert, setOuvert] = useState(false);
  const [etat, setEtat] = useState<Etat | null>(null);
  const [lecture, setLecture] = useState(false);

  const basculer = async () => {
    if (ouvert) {
      setOuvert(false);
      setLecture(false);
      return;
    }
    setOuvert(true);
    if (memoire.has(q)) {
      setEtat(etatDe(memoire.get(q) ?? null));
      return;
    }
    setEtat({ statut: "chargement" });
    try {
      setEtat(etatDe(await chercher(q)));
    } catch {
      // L'erreur n'est pas gardée en mémoire : on pourra réessayer.
      setEtat({ statut: "erreur" });
    }
  };

  return (
    <>
      <button
        type="button"
        aria-expanded={ouvert}
        aria-controls={id}
        onClick={basculer}
        className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-caption font-semibold text-ink-2 transition-colors duration-150 hover:text-ink"
      >
        <Play aria-hidden strokeWidth={1.75} className="size-3.5" />
        {ouvert ? "Masquer la vidéo" : "Voir une vidéo"}
      </button>

      {ouvert && etat && (
        <div id={id} className="pop-in basis-full pb-1">
          {etat.statut === "chargement" && (
            <div role="status" aria-label="Recherche d'une vidéo…" className="flex flex-col gap-2">
              <div className="aspect-video w-full animate-pulse rounded-control bg-line motion-reduce:animate-none" />
              <div className="h-3.5 w-3/4 animate-pulse rounded-badge bg-line motion-reduce:animate-none" />
              <div className="h-3 w-1/3 animate-pulse rounded-badge bg-line motion-reduce:animate-none" />
            </div>
          )}
          {etat.statut === "aucune" && (
            <p role="status" className="text-caption text-ink-2">
              Aucune vidéo trouvée pour ce lieu.
            </p>
          )}
          {etat.statut === "erreur" && (
            <p role="status" className="text-caption text-warn-ink">
              Vidéos indisponibles pour le moment.
            </p>
          )}
          {etat.statut === "trouvee" && (
            <figure>
              {lecture ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${etat.video.videoId}?autoplay=1`}
                  title={`Vidéo YouTube : ${etat.video.titre}`}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="block aspect-video w-full rounded-control border border-border bg-ink"
                />
              ) : (
                <button
                  type="button"
                  aria-label={`Lire la vidéo « ${etat.video.titre} »`}
                  onClick={() => setLecture(true)}
                  className="group relative block aspect-video w-full cursor-pointer overflow-hidden rounded-control border border-border bg-surface-2"
                >
                  {etat.video.miniature && (
                    // Miniature servie par YouTube : <img> simple, sans passer par l'optimiseur d'images.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={etat.video.miniature}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-300 ease-[var(--ease-spring)] group-hover:scale-[1.03]"
                    />
                  )}
                  <span aria-hidden className="absolute inset-0 flex items-center justify-center">
                    <span className="flex size-14 items-center justify-center rounded-full border-2 border-ink bg-accent-yellow text-on-accent transition-transform duration-200 ease-[var(--ease-spring)] group-hover:scale-110">
                      <Play strokeWidth={1.75} className="size-6 translate-x-0.5 fill-current" />
                    </span>
                  </span>
                </button>
              )}
              <figcaption className="mt-2">
                <span className="line-clamp-2 text-caption font-semibold text-ink">{etat.video.titre}</span>
                <span className="block text-small text-muted">{etat.video.chaine}</span>
              </figcaption>
            </figure>
          )}
        </div>
      )}
    </>
  );
}
