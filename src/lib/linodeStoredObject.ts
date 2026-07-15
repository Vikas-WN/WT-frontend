import {
  GetObjectCommand,
  ListObjectsV2Command,
  type GetObjectCommandOutput,
} from "@aws-sdk/client-s3";
import { getLinodeObjectStorageConfig, getLinodeS3ClientProfiles } from "@/lib/linodeObjectStorage";
import { holidayCalendarListPrefix, objectKeyCandidates } from "@/lib/objectStorageKeys";
import { isMissingObjectError } from "@/lib/s3Errors";

function basenameFromKey(key: string): string {
  const parts = key.split("/");
  return parts[parts.length - 1] || key;
}

function listPrefixesForKey(objectKey: string): string[] {
  const normalizedKey = objectKey.replace(/^\/+/, "").trim();
  const basename = basenameFromKey(normalizedKey);
  const stem = basename.replace(/\.(xlsx|xls|csv)$/i, "");
  const parentPrefix = normalizedKey.includes("/")
    ? normalizedKey.slice(0, normalizedKey.lastIndexOf("/") + 1)
    : "";

  const prefixes = new Set<string>();
  if (parentPrefix && stem) {
    prefixes.add(`${parentPrefix}${stem}`);
  }
  if (stem) {
    prefixes.add(stem);
  }

  const yearMatch = stem.match(/^holiday_calendar_(\d{4})$/i);
  if (yearMatch) {
    prefixes.add(holidayCalendarListPrefix(yearMatch[1]));
  }

  return Array.from(prefixes).filter(Boolean);
}

async function listKeysByPrefix(bucket: string, prefix: string): Promise<string[]> {
  const keys = new Set<string>();

  for (const { client } of getLinodeS3ClientProfiles()) {
    try {
      const response = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
        })
      );
      for (const item of response.Contents ?? []) {
        if (item.Key?.trim()) {
          keys.add(item.Key.trim());
        }
      }
      if (keys.size > 0) {
        return Array.from(keys);
      }
    } catch {
      continue;
    }
  }

  return Array.from(keys);
}

async function fetchObjectWithKey(
  bucket: string,
  candidateKey: string
): Promise<GetObjectCommandOutput | null> {
  let lastError: unknown;

  for (const { client } of getLinodeS3ClientProfiles()) {
    try {
      return await client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: candidateKey,
        })
      );
    } catch (error) {
      lastError = error;
      if (isMissingObjectError(error)) continue;
      throw error;
    }
  }

  if (lastError && !isMissingObjectError(lastError)) {
    throw lastError;
  }

  return null;
}

export async function getStoredObject(
  bucket: string,
  objectKey: string
): Promise<GetObjectCommandOutput> {
  const triedKeys = new Set<string>();
  const keyQueue: string[] = [];

  for (const candidate of objectKeyCandidates(objectKey, bucket)) {
    if (!triedKeys.has(candidate)) {
      triedKeys.add(candidate);
      keyQueue.push(candidate);
    }
  }

  for (const prefix of listPrefixesForKey(objectKey)) {
    const listedKeys = await listKeysByPrefix(bucket, prefix);
    const requestedBasename = basenameFromKey(objectKey.replace(/^\/+/, "").trim()).toLowerCase();
    for (const listedKey of listedKeys) {
      // Only accept exact basename matches — do not substitute .csv for .xlsx, etc.
      if (basenameFromKey(listedKey).toLowerCase() !== requestedBasename) {
        continue;
      }
      for (const candidate of objectKeyCandidates(listedKey, bucket)) {
        if (!triedKeys.has(candidate)) {
          triedKeys.add(candidate);
          keyQueue.push(candidate);
        }
      }
    }
  }

  let lastError: unknown;
  for (const candidateKey of keyQueue) {
    try {
      const response = await fetchObjectWithKey(bucket, candidateKey);
      if (response) {
        return response;
      }
    } catch (error) {
      lastError = error;
      if (isMissingObjectError(error)) continue;
      throw error;
    }
  }

  throw lastError ?? Object.assign(new Error("File not found."), { name: "NoSuchKey", Code: "NoSuchKey" });
}

export function resolveStoredObjectFilename(
  objectKey: string,
  response: GetObjectCommandOutput
): string {
  return response.Metadata?.["original-filename"]?.trim() || basenameFromKey(objectKey);
}

export function getConfiguredObjectStorageBucket(): string {
  return getLinodeObjectStorageConfig().bucket;
}
