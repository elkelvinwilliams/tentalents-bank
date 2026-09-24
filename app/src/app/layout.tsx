import type { Metadata, Viewport } from "next";
import { Libre_Caslon_Display, Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const caslonDisplay = Libre_Caslon_Display({ weight: "400", subsets: ["latin"], variable: "--font-caslon-display" });
const jakarta = Plus_Jakarta_Sans({ weight: ["400", "500", "600", "700", "800"], subsets: ["latin"], variable: "--font-jakarta" });
const plexMono = IBM_Plex_Mono({ weight: ["500", "600"], subsets: ["latin"], variable: "--font-plex-mono" });

export const metadata: Metadata = {
  title: "Ten Talents — Markets × Wealth × Wisdom",
  description: "Learn, understand, simulate — then decide. The Ten Talents app: Academy, simulator, journal, wisdom library and Steward goals. Education, not advice.",
  icons: { icon: "/logo-hand-gold.png" },
};

export const viewport: Viewport = {
  width: "device-width", initialScale: 1, viewportFit: "cover",
  themeColor: "#011936",
};

const THEME_BOOT = `try{var t=localStorage.getItem('tt-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${caslonDisplay.variable} ${jakarta.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} /></head>
      <body>{children}</body>
    </html>
  );
}
