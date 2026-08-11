import type { Metadata } from "next";
import { IntegrationsApiPage } from "@/components/integrations-api/IntegrationsApiPage";

export const metadata: Metadata = {
  title: "Integrations API Reference — WebTrak",
  description: "WebTrak external integrations API — access projects, allocations, and employees via API key.",
};

export default function IntegrationsApiRoutePage() {
  return <IntegrationsApiPage />;
}
