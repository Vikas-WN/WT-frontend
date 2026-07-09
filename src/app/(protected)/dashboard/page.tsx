"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { resolveEmployeeDashboardLanding } from "@/constants/routes";
import { useSelfProfile } from "@/hooks/useSelfProfile";

export default function DashboardPage() {
  const { user, status } = useAuth();
  const router = useRouter();
  const profileQ = useSelfProfile(status === "authenticated" && Boolean(user));

  useEffect(() => {
    if (status !== "authenticated" || !user) return;
    if (profileQ.isLoading) return;

    const path = resolveEmployeeDashboardLanding(user.roles ?? [], profileQ.data ?? null, user);
    router.replace(path);
  }, [status, user, profileQ.data, profileQ.isLoading, router]);

  return (
    <div className="flex flex-1 items-center justify-center p-8 text-sm text-wt-text-muted">
      Loading workspace…
    </div>
  );
}
