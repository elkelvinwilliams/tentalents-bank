import type { Metadata, Viewport } from "next";
import { Libre_Caslon_Display, Inter, Manrope } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/Pwa";

const caslonDisplay = Libre_Caslon_Display({ weight: "400", subsets: ["latin"], variable: "--font-caslon-display" });
const inter = Inter({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-inter" });
const manrope = Manrope({ weight: ["600", "700", "800"], subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "Ten Talents Academy",
  description: "Ten Talents Academy — learn, understand, simulate, then decide. Four tracks, a risk-first simulator, a journal, a wisdom library and your own goals. Education, not advice.",
  manifest: "/manifest.webmanifest",
  applicationName: "Ten Talents Academy",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Ten Talents" },
  icons: {
    icon: [{ url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" }, { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }, { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }],
    apple: "/icons/apple-touch-icon.png",
  },
  formatDetection: { telephone: false },
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
      <body>{children}<PwaRegister /></body>
    </html>
  );
}
