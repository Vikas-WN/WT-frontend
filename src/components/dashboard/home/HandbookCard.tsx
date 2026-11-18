"use client";

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, ExternalLink, Upload } from "lucide-react";

import { endpoints } from "@/api/endpoints";
import { CardMessage, CardSkeleton, HomeCard } from "@/components/dashboard/home/HomeCard";
import { Button } from "@/components/ui/button";
import { notifyError, notifySuccess } from "@/lib/notify";
import { handbookService, type HandbookInfo } from "@/services/handbook.service";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";

export const HANDBOOK_QUERY_KEY = ["home", "handbook"] as const;
const MAX_HANDBOOK_BYTES = 25 * 1024 * 1024;

const COPY = {
  title: "Employee Handbook",
  subtitle: "Policies, benefits and how we work",
  open: "Open handbook",
  upload: "Upload new version",
  uploadFirst: "Upload handbook",
  uploading: "Uploading…",
  uploaded: "Handbook updated — everyone now sees this version.",
  uploadFailed: "Couldn't upload the handbook.",
  notPdf: "Choose the handbook as a PDF file.",
  tooBig: "The handbook must be 25MB or less.",
  missing: "The handbook hasn't been uploaded yet.",
  missingAdmin: "Upload the PDF so everyone can open it from here.",
  error: "Couldn't load the handbook.",
} as const;

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** "Employee_Handbook_V.1.3___Webknot.pdf" (as stored) → "Employee Handbook V.1.3 Webknot". */
function displayName(fileName: string): string {
  return fileName.replace(/\.pdf$/i, "").replace(/_+/g, " ").replace(/\s+/g, " ").trim() || "Employee Handbook";
}

function formatUpdated(value: string): string {
  const date = new Date(value.includes("T") || value.includes("Z") ? value : value.replace(" ", "T") + "Z");
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/**
 * The company handbook, one click from Home. Everyone opens it in a new tab, where the browser's own PDF viewer shows
 * it (search, zoom, page thumbnails, download). Admins upload a new version here; the server keeps the old ones.
 */
export function HandbookCard({ canUpload }: { canUpload: boolean }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // UI state: whether an upload is in flight.
  const [uploading, setUploading] = useState(false);
  const handbook = useQuery({ queryKey: HANDBOOK_QUERY_KEY, queryFn: () => handbookService.current(), staleTime: 10 * 60_000 });

  const upload = async (file: File | undefined) => {
    if (!file) return;
    if (!(file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"))) {
      notifyError(COPY.notPdf);
      return;
    }
    if (file.size > MAX_HANDBOOK_BYTES) {
      notifyError(COPY.tooBig);
      return;
    }
    setUploading(true);
    try {
      const info = await handbookService.upload(file);
      queryClient.setQueryData<HandbookInfo>(HANDBOOK_QUERY_KEY, info);
      notifySuccess(COPY.uploaded);
    } catch (error) {
      notifyError(toUserFriendlyApiErrorMessage(error, COPY.uploadFailed));
    } finally {
      setUploading(false);
    }
  };

  const data = handbook.data;
  const uploadButton = canUpload ? (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        aria-label={COPY.upload}
        onChange={(e) => {
          void upload(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
        <Upload className="size-4" aria-hidden />
        {uploading ? COPY.uploading : data?.available ? COPY.upload : COPY.uploadFirst}
      </Button>
    </>
  ) : null;

  return (
    <HomeCard title={COPY.title} subtitle={COPY.subtitle} icon={<BookOpen className="size-4" aria-hidden />} tone="violet">
      {handbook.isLoading ? (
        <CardSkeleton />
      ) : handbook.isError ? (
        <CardMessage text={COPY.error} />
      ) : data?.available ? (
        <div className="space-y-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-wt-text" title={displayName(data.file_name)}>
              {displayName(data.file_name)}
            </p>
            <p className="mt-0.5 text-xs text-wt-text-muted">
              {[formatUpdated(data.uploaded_at) && `Updated ${formatUpdated(data.uploaded_at)}`, formatSize(data.size_bytes)]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="brand"
              size="sm"
              nativeButton={false}
              render={<a href={endpoints.handbook.file} target="_blank" rel="noopener noreferrer" />}
            >
              <ExternalLink className="size-4" aria-hidden />
              {COPY.open}
            </Button>
            {uploadButton}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <CardMessage text={canUpload ? COPY.missingAdmin : COPY.missing} />
          {uploadButton}
        </div>
      )}
    </HomeCard>
  );
}
