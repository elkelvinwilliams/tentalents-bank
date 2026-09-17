import type { Metadata, Viewport } from "next";
import { Libre_Caslon_Display, Libre_Caslon_Text, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const caslonDisplay = Libre_Caslon_Display({ weight: "400", subsets: ["latin"], variable: "--font-caslon-display" });
const caslonText = Libre_Caslon_Text({ weight: ["400", "700"], style: ["normal", "italic"], subsets: ["latin"], variable: "--font-caslon-text" });
const sourceSans = Source_Sans_3({ weight: ["400", "500", "600"], style: ["normal", "italic"], subsets: ["latin"], variable: "--font-source-sans" });

export const metadata: Metadata = {
  title: "Academy — Ten Talents",
  description: "Structured financial education: four tracks, honest lessons, quizzes that teach, certificates in your name.",
  icons: { icon: "/logo-hand-gold.png" },
};

export const viewport: Viewport = {
  width: "device-width", initialScale: 1, viewportFit: "cover",
  themeColor: "#011936",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${caslonDisplay.variable} ${caslonText.variable} ${sourceSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
