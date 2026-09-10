import type { MetadataRoute } from "next";

/**
 * Web app manifest — makes "Add to Home Screen" on Android / iOS install a real
 * app entry with the WebTrak mark instead of a generated "W" letter tile
 * (which is what happens when no manifest / no properly sized square icon is
 * served).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WebTrak — Workforce Tracker",
    short_name: "WebTrak",
    description: "Modern workforce tracking and management platform",
    id: "/dashboard",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#070b14",
    theme_color: "#070b14",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
