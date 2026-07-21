import { NextRequest, NextResponse } from "next/server";
import { isLinodeObjectStorageConfigured } from "@/lib/linodeObjectStorage";
import { requireSession } from "@/lib/requireSession";
import {
  backendUnavailableResponse,
  buildUpstreamAuthHeaders,
  getBackendBaseUrl,
} from "@/lib/serverApi";
import {
  deleteHolidayCalendarObjectsForYear,
  getHolidayCalendarObjectForYear,
  holidayCalendarStorageUnavailableMessage,
  putHolidayCalendarObjectForYear,
} from "@/lib/holidayCalendarStorageServer";
import { isMissingObjectError } from "@/lib/s3Errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ year: string }> };

function parseYear(raw: string): number | null {
  const year = Number(raw);
  if (!Number.isFinite(year) || year < 2000 || year > 9999) return null;
  return year;
}

function storageUnavailableResponse(error: unknown) {
  return NextResponse.json(
    { error: holidayCalendarStorageUnavailableMessage(error) },
    { status: 503 }
  );
}

async function proxyToBackend(request: NextRequest, year: string) {
  const backendUrl = `${getBackendBaseUrl()}/api/v1/holiday-calendar-storage/${encodeURIComponent(year)}${request.nextUrl.search}`;
  const headers = buildUpstreamAuthHeaders(request);

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    const body = await request.arrayBuffer();
    if (body.byteLength > 0) {
      init.body = body;
      headers.set("content-length", String(body.byteLength));
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(backendUrl, init);
  } catch {
    return backendUnavailableResponse();
  }

  const body = await upstream.arrayBuffer();
  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.delete("transfer-encoding");

  return new NextResponse(body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  const unauthorized = requireSession(request);
  if (unauthorized) return unauthorized;

  const { year: yearRaw } = await context.params;
  const year = parseYear(yearRaw);
  if (year == null) {
    return NextResponse.json({ error: "Invalid year." }, { status: 400 });
  }

  if (!isLinodeObjectStorageConfigured()) {
    return proxyToBackend(request, yearRaw);
  }

  try {
    const stored = await getHolidayCalendarObjectForYear(year);
    if (!stored) {
      return NextResponse.json({ error: "Holiday calendar file not found." }, { status: 404 });
    }

    const headers = new Headers({
      "Content-Type": stored.contentType,
      "Content-Disposition": `inline; filename="${stored.fileName}"`,
      "X-Original-Filename": stored.fileName,
    });
    if (stored.uploadedAt) {
      headers.set("X-Uploaded-At", stored.uploadedAt);
    }

    return new NextResponse(Buffer.from(stored.body), { headers });
  } catch (error) {
    if (isMissingObjectError(error)) {
      return NextResponse.json({ error: "Holiday calendar file not found." }, { status: 404 });
    }
    return storageUnavailableResponse(error);
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const unauthorized = requireSession(request);
  if (unauthorized) return unauthorized;

  const { year: yearRaw } = await context.params;
  const year = parseYear(yearRaw);
  if (year == null) {
    return NextResponse.json({ error: "Invalid year." }, { status: 400 });
  }

  if (!isLinodeObjectStorageConfigured()) {
    return proxyToBackend(request, yearRaw);
  }

  try {
    const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
    let body: ArrayBuffer;
    let fileName = `holiday_calendar_${year}.csv`;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const uploaded = formData.get("file");
      if (!(uploaded instanceof File)) {
        return NextResponse.json({ error: "File body is required." }, { status: 400 });
      }
      body = await uploaded.arrayBuffer();
      if (!body.byteLength) {
        return NextResponse.json({ error: "File body is required." }, { status: 400 });
      }
      if (uploaded.name.trim()) {
        fileName = uploaded.name.trim();
      }
    } else {
      body = await request.arrayBuffer();
      if (!body.byteLength) {
        return NextResponse.json({ error: "File body is required." }, { status: 400 });
      }
    }

    const objectKey = await putHolidayCalendarObjectForYear(year, fileName, new Uint8Array(body));

    return NextResponse.json({
      message: "Holiday calendar uploaded successfully",
      data: { key: objectKey, year },
    });
  } catch (error) {
    return storageUnavailableResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const unauthorized = requireSession(request);
  if (unauthorized) return unauthorized;

  const { year: yearRaw } = await context.params;
  const year = parseYear(yearRaw);
  if (year == null) {
    return NextResponse.json({ error: "Invalid year." }, { status: 400 });
  }

  if (!isLinodeObjectStorageConfigured()) {
    return proxyToBackend(request, yearRaw);
  }

  try {
    await deleteHolidayCalendarObjectsForYear(year);
    return NextResponse.json({
      message: "Holiday calendar files deleted",
      data: { year },
    });
  } catch (error) {
    return storageUnavailableResponse(error);
  }
}
