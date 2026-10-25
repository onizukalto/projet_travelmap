import type { Metadata, Viewport } from "next";
import { Overpass } from "next/font/google";
import { MapPatterns } from "@/components/map-patterns";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { SiteHeader } from "@/components/site-header";
import { StoreHydration } from "@/components/store-hydration";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/toaster";
import "./globals.css";

const overpass = Overpass({
  variable: "--font-overpass",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TravelMap",
    template: "%s · TravelMap",
  },
  description:
    "Colorie les pays que tu as visités, garde le carnet de tes voyages et prépare les prochains.",
};

// Couleur de la barre du navigateur mobile : reprend --surface clair et sombre.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FCFCFA" },
    { media: "(prefers-color-scheme: dark)", color: "#161F28" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning : next-themes ajoute la classe du thème avant React.
    <html lang="fr" className={`${overpass.variable} antialiased`} suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col">
        <ThemeProvider>
          <StoreHydration />
          <MapPatterns />
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
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
