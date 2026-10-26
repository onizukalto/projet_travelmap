import type { Metadata, Viewport } from "next";
import { Overpass } from "next/font/google";
import { MapPatterns } from "@/components/map-patterns";
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
          {/* En-tête et barre d'onglets : voir (site)/layout.tsx (absents de /connexion) */}
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
