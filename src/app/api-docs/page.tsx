import type { Metadata } from "next";
import { ApiDocsPage } from "@/components/api-docs/ApiDocsPage";

export const metadata: Metadata = {
  title: "API Reference — WebTrak",
  description: "WebTrak REST API documentation for workforce, allocation, leave, and client integrations.",
};

export default function ApiDocsRoutePage() {
  return <ApiDocsPage />;
}
