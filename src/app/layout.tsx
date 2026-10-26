import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import { MapPatterns } from "@/components/map-patterns";
import { MotionProvider } from "@/components/motion-provider";
import { StoreHydration } from "@/components/store-hydration";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/toaster";
import "./globals.css";

// Texte : Inter, aéré. Titres et chiffres : Inter Tight, très gras et serré.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "TravelMap",
    template: "%s · TravelMap",
  },
  description:
    "Colorie les pays que tu as visités, garde le carnet de tes voyages et prépare les prochains.",
};

// Couleur de la barre du navigateur mobile : reprend --bg clair et sombre.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FDFBF7" },
    { media: "(prefers-color-scheme: dark)", color: "#0E0E0E" },
  ],
};

/**
 * Préchargement de l'application : décide AVANT l'affichage s'il doit jouer (première page
 * de la session), pour éviter tout clignotement. Il ne joue jamais sur l'accueil « / »
 * (qui a sa propre entrée animée), ni sur /connexion, ni si l'on préfère réduire les animations.
 */
const INTRO_SCRIPT = `(function(){try{var d=document.documentElement;
var p=location.pathname;if(p==='/'||p.indexOf('/connexion')===0)return;
if(sessionStorage.getItem('tm-intro')){d.dataset.intro='done';return}
sessionStorage.setItem('tm-intro','1');
d.dataset.intro=matchMedia('(prefers-reduced-motion: reduce)').matches?'done':'play';
}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning : next-themes et le préchargement modifient <html> avant React.
    <html lang="fr" className={`${inter.variable} ${interTight.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <ThemeProvider>
          <MotionProvider>
            <StoreHydration />
            <MapPatterns />
            {/* En-tête et barre d'onglets : voir (site)/layout.tsx (absents de /connexion) */}
            {children}
            <Toaster />
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
