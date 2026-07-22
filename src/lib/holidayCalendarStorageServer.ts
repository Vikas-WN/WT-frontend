import { DeleteObjectCommand, PutObjectCommand, type GetObjectCommandOutput } from "@aws-sdk/client-s3";
import { getConfiguredObjectStorageBucket, getStoredObject, resolveStoredObjectFilename } from "@/lib/linodeStoredObject";
import { getLinodeS3Client } from "@/lib/linodeObjectStorage";
import { objectKeyCandidates } from "@/lib/objectStorageKeys";
import {
  HOLIDAY_CALENDAR_FILE_EXTENSIONS,
  holidayCalendarObjectKey,
  holidayCalendarStorageFileName,
  resolveHolidayCalendarExtension,
  type HolidayCalendarFileExtension,
} from "@/utils/holidayCalendarStorage";
import { holidayCalendarFileMimeType } from "@/utils/buildHolidayCalendarFile";

type StoredHolidayCalendarObject = {
  body: Uint8Array;
  fileName: string;
  contentType: string;
  uploadedAt: string | null;
};

const STORAGE_UNAVAILABLE_USER_MESSAGE =
  "File storage is temporarily unavailable. Please try again later or contact support.";

function configurationErrorMessage(_error: unknown): string {
  // Never surface vendor names, env var names, or operator setup hints to clients.
  return STORAGE_UNAVAILABLE_USER_MESSAGE;
}

function objectTimestamp(response: GetObjectCommandOutput): number {
  return response.LastModified?.getTime() ?? 0;
}

export async function getHolidayCalendarObjectForYear(year: number): Promise<StoredHolidayCalendarObject | null> {
  const bucket = getConfiguredObjectStorageBucket();
  let latest: { response: GetObjectCommandOutput; key: string } | null = null;

  for (const extension of HOLIDAY_CALENDAR_FILE_EXTENSIONS) {
    const objectKey = holidayCalendarObjectKey(year, extension);
    try {
      const response = await getStoredObject(bucket, objectKey);
      if (!response.Body) continue;
      if (!latest || objectTimestamp(response) >= objectTimestamp(latest.response)) {
        latest = { response, key: objectKey };
      }
    } catch {
      continue;
    }
  }

  if (!latest?.response.Body) {
    return null;
  }

  const bytes = await latest.response.Body.transformToByteArray();
  const fileName = resolveStoredObjectFilename(latest.key, latest.response);

  return {
    body: bytes,
    fileName,
    contentType: latest.response.ContentType || holidayCalendarFileMimeType(resolveHolidayCalendarExtension(fileName)),
    uploadedAt: latest.response.LastModified?.toISOString() ?? null,
  };
}

export async function putHolidayCalendarObjectForYear(
  year: number,
  fileName: string,
  content: Uint8Array
): Promise<string> {
  const extension = resolveHolidayCalendarExtension(fileName);
  const objectKey = holidayCalendarObjectKey(year, extension);
  const normalizedFileName = holidayCalendarStorageFileName(year, extension);
  const bucket = getConfiguredObjectStorageBucket();

  await getLinodeS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: content,
      ContentType: holidayCalendarFileMimeType(extension),
      Metadata: {
        "original-filename": normalizedFileName,
      },
    })
  );

  for (const otherExtension of HOLIDAY_CALENDAR_FILE_EXTENSIONS) {
    if (otherExtension === extension) continue;
    await deleteHolidayCalendarObjectKey(holidayCalendarObjectKey(year, otherExtension));
  }

  return objectKey;
}

async function deleteHolidayCalendarObjectKey(objectKey: string): Promise<void> {
  const bucket = getConfiguredObjectStorageBucket();
  const client = getLinodeS3Client();
  for (const candidateKey of objectKeyCandidates(objectKey, bucket)) {
    try {
      await client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: candidateKey,
        })
      );
    } catch {
      // Ignore missing keys while cleaning up alternate extensions.
    }
  }
}

export async function deleteHolidayCalendarObjectsForYear(year: number): Promise<void> {
  for (const extension of HOLIDAY_CALENDAR_FILE_EXTENSIONS) {
    await deleteHolidayCalendarObjectKey(holidayCalendarObjectKey(year, extension as HolidayCalendarFileExtension));
  }
}

export function holidayCalendarStorageUnavailableMessage(error: unknown): string {
  return configurationErrorMessage(error);
}
