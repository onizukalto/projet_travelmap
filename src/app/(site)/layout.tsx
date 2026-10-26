import { MobileTabBar } from "@/components/mobile-tab-bar";
import { SiteHeader } from "@/components/site-header";

/** Mise en page des pages du site : en-tête, contenu et barre d'onglets mobile. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#contenu"
        className="sr-only z-50 rounded-control bg-ink px-4 py-3 font-semibold text-surface focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Aller au contenu
      </a>
      <SiteHeader />
      <main
        id="contenu"
        className="flex flex-1 flex-col pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0"
      >
        {children}
      </main>
      <MobileTabBar />
    </>
  );
}
