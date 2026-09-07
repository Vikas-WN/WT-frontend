"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { WtLoaderCentered } from "@/components/dashboard/ui/WtLoader";

/**
 * Route guard for all protected routes under (protected)/.
 * - While loading: shows the app loader.
 * - Unauthenticated: redirects to /login.
 * - Authenticated: renders children.
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useAuth();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 10 * 60_000,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
          },
        },
      })
  );

  useEffect(() => {
    if (status !== "unauthenticated") return;
    // Hard navigation, not router.replace: a session end must guarantee the
    // protected page's entire component tree (state, timers, in-flight
    // requests) is torn down immediately. An SPA replace only swaps the route
    // once every ancestor has re-rendered to `status === "unauthenticated"`,
    // which leaves a window (and, on some transitions, unmounted-but-still
    // painted content) where the previous page stays visible/interactive
    // behind the "Session Ended" cover — exactly what must never happen once
    // the session is gone.
    window.location.replace("/login");
  }, [status]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-wt-bg">
        <WtLoaderCentered label="Loading your workspace…" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
