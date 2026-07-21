import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import { getLinodeObjectStorageConfig, getLinodeS3Client } from "@/lib/linodeObjectStorage";
import {
  getConfiguredObjectStorageBucket,
  getStoredObject,
  resolveStoredObjectFilename,
} from "@/lib/linodeStoredObject";
import { objectKeyCandidates } from "@/lib/objectStorageKeys";
import { requireSession } from "@/lib/requireSession";
import { formatS3Error, isMissingObjectError } from "@/lib/s3Errors";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ path: string[] }> };

function objectKeyFromPath(path: string[]): string {
  return path.map((segment) => decodeURIComponent(segment)).join("/");
}

function configurationErrorMessage(error: unknown): string | null {
  if (!(error instanceof Error)) return null;
  if (
    /Missing required environment variable|Missing LINODE_OBJECT_STORAGE|Linode Object Storage is not configured|LINODE_OBJECT_STORAGE_/i.test(
      error.message
    )
  ) {
    return "File storage is temporarily unavailable. Please try again later or contact support.";
  }
  return null;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const unauthorized = requireSession(request);
  if (unauthorized) return unauthorized;

  const { path } = await context.params;
  const key = objectKeyFromPath(path);

  try {
    const bucket = getConfiguredObjectStorageBucket();
    const response = await getStoredObject(bucket, key);

    if (!response.Body) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    const bytes = await response.Body.transformToByteArray();
    const originalFilename = resolveStoredObjectFilename(key, response);

    const headers = new Headers({
      "Content-Type": response.ContentType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${originalFilename}"`,
      "X-Original-Filename": originalFilename,
    });

    if (response.LastModified) {
      headers.set("X-Uploaded-At", response.LastModified.toISOString());
    }

    return new NextResponse(Buffer.from(bytes), { headers });
  } catch (error) {
    const configMessage = configurationErrorMessage(error);
    if (configMessage) {
      return NextResponse.json({ error: configMessage }, { status: 503 });
    }
    if (isMissingObjectError(error)) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    return NextResponse.json({ error: formatS3Error(error) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const unauthorized = requireSession(request);
  if (unauthorized) return unauthorized;

  const { path } = await context.params;
  const key = objectKeyFromPath(path);

  try {
    const body = await request.arrayBuffer();
    if (!body.byteLength) {
      return NextResponse.json({ error: "File body is required." }, { status: 400 });
    }

    const contentType =
      request.headers.get("content-type")?.trim() || "application/octet-stream";
    const originalFilename =
      request.headers.get("x-original-filename")?.trim() || key.split("/").pop() || key;

    const { bucket } = getLinodeObjectStorageConfig();
    await getLinodeS3Client().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key.replace(/^\/+/, ""),
        Body: new Uint8Array(body),
        ContentType: contentType,
        Metadata: {
          "original-filename": originalFilename,
        },
      })
    );

    return NextResponse.json({
      data: {
        key: key.replace(/^\/+/, ""),
        fileName: originalFilename,
      },
    });
  } catch (error) {
    const configMessage = configurationErrorMessage(error);
    if (configMessage) {
      return NextResponse.json({ error: configMessage }, { status: 503 });
    }
    return NextResponse.json({ error: formatS3Error(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const unauthorized = requireSession(request);
  if (unauthorized) return unauthorized;

  const { path } = await context.params;
  const key = objectKeyFromPath(path);

  try {
    const { bucket } = getLinodeObjectStorageConfig();
    const client = getLinodeS3Client();

    for (const candidateKey of objectKeyCandidates(key, bucket)) {
      await client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: candidateKey,
        })
      );
    }

    return NextResponse.json({
      data: {
        key,
      },
    });
  } catch (error) {
    const configMessage = configurationErrorMessage(error);
    if (configMessage) {
      return NextResponse.json({ error: configMessage }, { status: 503 });
    }
    return NextResponse.json({ error: formatS3Error(error) }, { status: 500 });
  }
}
