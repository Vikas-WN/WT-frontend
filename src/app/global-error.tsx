"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Global Error Boundary]", error);
  }, [error]);

  const isChunkError =
    error.message?.includes("Loading chunk") ||
    error.message?.includes("ChunkLoadError") ||
    error.message?.includes("Failed to fetch dynamically imported module");

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          margin: 0,
          padding: "2rem",
          background: "#f9fafb",
        }}
      >
        <div
          style={{
            maxWidth: "420px",
            textAlign: "center",
            padding: "2rem",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            background: "#fff",
          }}
        >
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600, margin: 0 }}>
            {isChunkError ? "App Updated" : "Something went wrong"}
          </h2>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#6b7280",
              marginTop: "0.5rem",
            }}
          >
            {isChunkError
              ? "A new version of the app was deployed. Please reload to continue."
              : "An unexpected error occurred. Please reload the page."}
          </p>
          <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <button
              onClick={reset}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                background: "#fff",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                border: "none",
                background: "#2563eb",
                color: "#fff",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
