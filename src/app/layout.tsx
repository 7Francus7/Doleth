import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Instrument_Serif, Manrope } from "next/font/google";
import "./globals.css";
import { AppNav } from "../components/finance/AppNav";
import { AmountPrivacyProvider } from "../components/privacy/AmountPrivacy";
import { PwaManager } from "../components/pwa/PwaManager";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: { default: "Doleth", template: "%s · Doleth" },
  description: "Claridad financiera para entender dónde estás hoy.",
  icons: {
    icon: "/brand/doleth-mark.svg",
    apple: "/brand/doleth-apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Doleth",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#F7F5F1",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-AR"
      className={`${manrope.variable} ${instrumentSerif.variable} ${ibmPlexMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{document.documentElement.dataset.amountsHidden=localStorage.getItem('doleth.hideAmounts')==='true'?'true':'false'}catch{document.documentElement.dataset.amountsHidden='false'}",
          }}
        />
      </head>
      <body>
        <AmountPrivacyProvider>
          {children}
          <AppNav />
          <PwaManager />
        </AmountPrivacyProvider>
      </body>
    </html>
  );
}
