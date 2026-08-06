import { notFound } from "next/navigation";
import { AppDetailPageClient } from "@/components/dashboard/apps/AppDetailPageClient";

export default async function AppDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numeric = Number(id);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    notFound();
  }
  return <AppDetailPageClient appId={numeric} />;
}
