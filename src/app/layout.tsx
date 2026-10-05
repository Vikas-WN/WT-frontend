import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { ActionSplashHost } from "@/components/ui/ActionSplash";
import { themeInitScript } from "@/components/shared/ThemeInitScript";
import "./globals.css";
import { cn } from "@/lib/utils";

// Self-hosted (latin subset, variable) rather than next/font/google: the Google
// loader downloads the files during `next build`, so a build machine that can't
// reach fonts.gstatic.com — like the production Docker build — fails outright.
const inter = localFont({
  src: "./fonts/Inter-latin-variable.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = localFont({
  src: "./fonts/PlusJakartaSans-latin-variable.woff2",
  weight: "200 800",
  variable: "--font-brand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WebTrak — Workforce Tracker",
  description: "Modern workforce tracking and management platform",
  applicationName: "WebTrak",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "WebTrak",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#070b14",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={cn("h-full", inter.variable, plusJakarta.variable, "font-sans")}
      suppressHydrationWarning
    >
      <head>
        {/* Synchronous theme bootstrap: must run before first paint to avoid a
            light-mode flash. next/script (even beforeInteractive) does not
            guarantee pre-paint execution for inline scripts in the App Router. */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript() }} />
      </head>
      <body className="min-h-full bg-wt-bg text-wt-text antialiased">
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
        <ActionSplashHost />
      </body>
    </html>
  );
}
