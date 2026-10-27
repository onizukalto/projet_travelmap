import type { CSSProperties, ReactNode } from "react";

type TileProps = {
  /** Position dans la cascade d'entrée (préchargement). */
  index?: number;
  /** Libellé de la tuile, en petit au-dessus du contenu (c'est son titre). */
  label?: ReactNode;
  /** Élément à droite du libellé (lien, bouton…). */
  action?: ReactNode;
  className?: string;
  children?: ReactNode;
  id?: string;
};

/**
 * Une tuile de la grille bento. À placer dans un conteneur `.bento`,
 * qui dessine les séparations de 1 px entre les tuiles.
 */
export function Tile({ index = 0, label, action, className = "", children, id }: TileProps) {
  const titleId = id ? `${id}-titre` : undefined;
  return (
    <section
      id={id}
      aria-labelledby={label ? titleId : undefined}
      // En arrivant d'une autre page, le contenu des tuiles apparaît en cascade rapide (data-arrivee :
      // voir PageTransition). La tuile reste opaque : le fond de la grille ne se voit jamais.
      className={`bento-tile relative flex flex-col p-5 md:p-6 [[data-arrivee]_&>*]:animate-[pop-in_300ms_var(--ease-spring)_backwards] [[data-arrivee]_&>*]:[animation-delay:calc(40ms+var(--i,0)*35ms)] ${className}`}
      style={{ "--i": index } as CSSProperties}
    >
      {(label || action) && (
        <div className="mb-3 flex min-h-6 items-center justify-between gap-3">
          {label && (
            <h2 id={titleId} className="font-sans text-caption font-medium tracking-normal text-muted">
              {label}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
