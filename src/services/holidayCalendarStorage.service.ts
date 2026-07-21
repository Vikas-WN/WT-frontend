import { endpoints } from "@/api/endpoints";
import { ApiError } from "@/api/error";
import { apiClient } from "@/api/httpClient";
import type { HolidayCalendarRow } from "@/utils/holidayCalendarTable";
import { normalizeHolidayCalendarRows } from "@/utils/holidayCalendarTable";
import {
  buildHolidayCalendarFile,
  holidayCalendarFileMimeType,
} from "@/utils/buildHolidayCalendarFile";
import { parseSpreadsheetFile } from "@/utils/parseSpreadsheetFile";
import {
  holidayCalendarStorageFileName,
  resolveHolidayCalendarExtension,
  resolveHolidayCalendarUploadYear,
} from "@/utils/holidayCalendarStorage";

export type StoredHolidayCalendarResponse = {
  year: number;
  fileName: string;
  rows: HolidayCalendarRow[];
  uploadedAt: string | null;
};

async function parseStoredFileResponse(
  response: Response,
  year: number
): Promise<StoredHolidayCalendarResponse> {
  const fileName =
    response.headers.get("x-original-filename")?.trim() ||
    holidayCalendarStorageFileName(year, resolveHolidayCalendarExtension("holiday_calendar.csv"));
  const uploadedAt = response.headers.get("x-uploaded-at");
  const blob = await response.blob();
  const file = new File([blob], fileName, {
    type: blob.type || "application/octet-stream",
  });

  const parsed = await parseSpreadsheetFile(file);
  const rows = normalizeHolidayCalendarRows(parsed);

  return {
    year,
    fileName,
    rows,
    uploadedAt,
  };
}

export const holidayCalendarStorageService = {
  resolveUploadYear(fileName: string, rows: HolidayCalendarRow[], currentYear: number): number {
    return resolveHolidayCalendarUploadYear(fileName, rows, currentYear);
  },

  async fetchByYear(year: number): Promise<StoredHolidayCalendarResponse | null> {
    try {
      const response = await apiClient.get<Response>(
        endpoints.holidayCalendarStorage.byYear(year),
        { responseType: "raw" }
      );
      return parseStoredFileResponse(response, year);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        return null;
      }
      throw error instanceof Error ? error : new Error("Failed to load holiday calendar.");
    }
  },

  async uploadFile(file: File, year: number, cleanedRows?: HolidayCalendarRow[]): Promise<void> {
    const extension = resolveHolidayCalendarExtension(file.name);
    let uploadFile = file;

    if (cleanedRows?.length) {
      const blob = await buildHolidayCalendarFile(cleanedRows, extension);
      uploadFile = new File([blob], holidayCalendarStorageFileName(year, extension), {
        type: holidayCalendarFileMimeType(extension),
      });
    }

    const formData = new FormData();
    formData.append("file", uploadFile);

    await apiClient.put(endpoints.holidayCalendarStorage.byYear(year), {
      body: formData,
    });
  },
};
