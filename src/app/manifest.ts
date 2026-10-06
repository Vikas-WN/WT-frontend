import type { MetadataRoute } from "next";

import { DASHBOARD_ROUTES } from "@/constants/routes";

const SHORTCUT_ICON = [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }];

/**
 * Web app manifest — makes "Add to Home Screen" / "Install app" produce a real app entry with the WebTrak mark,
 * opening straight into the dashboard, with long-press shortcuts for the things people do most.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WebTrak — Workforce Tracker",
    short_name: "WebTrak",
    description: "Leave, time, projects, meeting rooms and company updates in one place.",
    id: "/dashboard",
    start_url: "/dashboard?source=pwa",
    scope: "/",
    lang: "en-IN",
    dir: "ltr",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "any",
    background_color: "#0b0d12",
    theme_color: "#0b0d12",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Apply for leave", short_name: "Leave", url: `${DASHBOARD_ROUTES.leave}?tab=my`, icons: SHORTCUT_ICON },
      { name: "Log time", short_name: "Time", url: DASHBOARD_ROUTES.timelog, icons: SHORTCUT_ICON },
      { name: "Book a meeting room", short_name: "Rooms", url: DASHBOARD_ROUTES["meeting-rooms"], icons: SHORTCUT_ICON },
      { name: "Announcements", short_name: "News", url: DASHBOARD_ROUTES.announcements, icons: SHORTCUT_ICON },
    ],
  };
}
