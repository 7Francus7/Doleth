import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Doleth",
    short_name: "Doleth",
    description: "Claridad financiera para entender dónde estás hoy.",
    start_url: "/ahora",
    display: "standalone",
    background_color: "#F7F5F1",
    theme_color: "#184E47",
    icons: [
      {
        src: "/brand/doleth-app-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/doleth-app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/brand/doleth-app-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
