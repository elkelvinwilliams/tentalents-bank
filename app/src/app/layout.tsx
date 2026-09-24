import type { Metadata, Viewport } from "next";
import { Libre_Caslon_Display, Inter, Manrope } from "next/font/google";
import "./globals.css";

const caslonDisplay = Libre_Caslon_Display({ weight: "400", subsets: ["latin"], variable: "--font-caslon-display" });
const inter = Inter({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-inter" });
const manrope = Manrope({ weight: ["600", "700", "800"], subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "Ten Talents Academy",
  description: "Ten Talents Academy — learn, understand, simulate, then decide. Four tracks, a risk-first simulator, a journal, a wisdom library and your own goals. Education, not advice.",
  icons: { icon: "/logo-hand-gold.png" },
};

export const viewport: Viewport = {
  width: "device-width", initialScale: 1, viewportFit: "cover",
  themeColor: "#011936",
};

const THEME_BOOT = `try{var t=localStorage.getItem('tt-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${caslonDisplay.variable} ${inter.variable} ${manrope.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} /></head>
      <body>{children}</body>
    </html>
  );
}
