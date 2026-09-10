import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { ActionSplashHost } from "@/components/ui/ActionSplash";
import { themeInitScript } from "@/components/shared/ThemeInitScript";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700"],
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
