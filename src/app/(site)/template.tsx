import { PageTransition } from "@/components/page-transition";

/** Transition entre les pages (Ma carte, Voyages, Planifier) : Next.js recrée ce gabarit à chaque navigation. */
export default function SiteTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
