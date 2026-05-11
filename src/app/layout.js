import { Inter, Bebas_Neue } from "next/font/google";
import "./globals.scss";

const fontText = Inter({
  variable: "--font-text",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const fontDisplay = Bebas_Neue({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

export const metadata = {
  title: "FiguritApp",
  description:
    "Seguí tu progreso del álbum Panini FIFA World Cup 2026: figuritas conseguidas, faltantes y repetidas.",
  applicationName: "FIGURITAPP",
  icons: {
    icon: [{ url: "/logo.png", type: "image/png" }],
    apple: [{ url: "/logo.png", type: "image/png" }],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#111111",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${fontText.variable} ${fontDisplay.variable}`}>
      <body>{children}</body>
    </html>
  );
}
