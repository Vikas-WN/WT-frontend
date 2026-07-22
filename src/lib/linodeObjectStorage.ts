import { S3Client } from "@aws-sdk/client-s3";

export type LinodeObjectStorageConfig = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
};

function normalizeObjectStorageEndpoint(raw: string): string {
  const value = raw.trim();
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value.replace(/\/$/, "");
  }
  return `https://${value.replace(/\/$/, "")}`;
}

/**
 * Bucket virtual-host endpoints (`{bucket}.{region}.linodeobjects.com`) must not be
 * used as the S3 client endpoint — the SDK will prepend the bucket again and DNS fails.
 * Prefer the regional endpoint instead.
 */
export function toRegionalObjectStorageEndpoint(
  endpoint: string,
  bucket?: string
): string {
  const normalized = normalizeObjectStorageEndpoint(endpoint);
  try {
    const hostname = new URL(normalized).hostname.toLowerCase();
    const parts = hostname.split(".");
    const linodeIndex = parts.indexOf("linodeobjects");
    if (linodeIndex < 1) return normalized;

    const region = parts[linodeIndex - 1]?.trim();
    if (!region) return normalized;

    const labelsBeforeRegion = parts.slice(0, linodeIndex - 1);
    if (!labelsBeforeRegion.length) {
      return `https://${region}.linodeobjects.com`;
    }

    // `{bucket}.{region}.linodeobjects.com` — strip to regional endpoint.
    // Keep unrelated hostnames like `cluster.{region}.linodeobjects.com`.
    const bucketName = bucket?.trim().toLowerCase();
    const looksLikeBucketHost =
      Boolean(bucket) && labelsBeforeRegion[0] === bucket!.trim().toLowerCase();
    if (looksLikeBucketHost) {
      return `https://${region}.linodeobjects.com`;
    }

    return normalized;
  } catch {
    return normalized;
  }
}

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Add it to .env.local (see .env.example).`
    );
  }
  return value;
}

/** e.g. `cluster.in-maa-1.linodeobjects.com` → `in-maa-1` */
export function inferRegionFromEndpoint(endpoint: string): string | null {
  try {
    const hostname = new URL(endpoint).hostname;
    const parts = hostname.split(".");
    const linodeIndex = parts.indexOf("linodeobjects");
    if (linodeIndex < 1) return null;
    return parts[linodeIndex - 1]?.trim() || null;
  } catch {
    return null;
  }
}

/** Cluster hostnames include an extra label before the region (e.g. cluster.in-maa-1.linodeobjects.com). */
export function isClusterObjectStorageEndpoint(endpoint: string): boolean {
  try {
    const hostname = new URL(endpoint).hostname.toLowerCase();
    const parts = hostname.split(".");
    const linodeIndex = parts.indexOf("linodeobjects");
    // cluster.in-maa-1.linodeobjects.com → index 2 labels before region occupies index 1
    return linodeIndex >= 3;
  } catch {
    return false;
  }
}

function resolveObjectStorageRegion(): string {
  const configured = process.env.LINODE_OBJECT_STORAGE_REGION?.trim();
  if (configured) return configured;

  const endpoint = process.env.LINODE_OBJECT_STORAGE_ENDPOINT?.trim();
  if (endpoint) {
    const inferred = inferRegionFromEndpoint(normalizeObjectStorageEndpoint(endpoint));
    if (inferred) return inferred;
  }

  throw new Error(
    "Missing LINODE_OBJECT_STORAGE_REGION. Set it explicitly or use an endpoint like https://in-maa-1.linodeobjects.com."
  );
}

function resolveObjectStorageEndpoint(region: string, bucket: string): string {
  const configured = process.env.LINODE_OBJECT_STORAGE_ENDPOINT?.trim();
  if (configured) {
    return toRegionalObjectStorageEndpoint(configured, bucket);
  }
  return `https://${region}.linodeobjects.com`;
}

export function getLinodeObjectStorageConfig(): LinodeObjectStorageConfig {
  const region = resolveObjectStorageRegion();
  const bucket = readRequiredEnv("LINODE_OBJECT_STORAGE_BUCKET");
  const endpoint = resolveObjectStorageEndpoint(region, bucket);

  return {
    endpoint,
    region,
    bucket,
    accessKeyId: readRequiredEnv("LINODE_OBJECT_STORAGE_ACCESS_KEY"),
    secretAccessKey: readRequiredEnv("LINODE_OBJECT_STORAGE_SECRET_KEY"),
  };
}

export function isLinodeObjectStorageConfigured(): boolean {
  try {
    getLinodeObjectStorageConfig();
    return true;
  } catch {
    return false;
  }
}

function buildS3Client(config: LinodeObjectStorageConfig, forcePathStyle: boolean): S3Client {
  return new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle,
  });
}

function endpointVariants(config: LinodeObjectStorageConfig): string[] {
  const endpoints = new Set<string>([config.endpoint]);
  const regional = `https://${config.region}.linodeobjects.com`;
  endpoints.add(regional);

  const configured = process.env.LINODE_OBJECT_STORAGE_ENDPOINT?.trim();
  if (configured) {
    endpoints.add(toRegionalObjectStorageEndpoint(configured, config.bucket));
  }

  return Array.from(endpoints);
}

type ClientProfile = {
  client: S3Client;
  label: string;
};

let cachedClients: ClientProfile[] | null = null;

/** Return S3 clients for primary and fallback Linode endpoint/path-style combinations. */
export function getLinodeS3ClientProfiles(): ClientProfile[] {
  if (cachedClients) return cachedClients;

  const config = getLinodeObjectStorageConfig();
  const profiles: ClientProfile[] = [];
  const seen = new Set<string>();

  for (const endpoint of endpointVariants(config)) {
    for (const forcePathStyle of [false, true] as const) {
      const signature = `${endpoint}|${forcePathStyle ? "path" : "virtual"}`;
      if (seen.has(signature)) continue;
      seen.add(signature);
      profiles.push({
        client: buildS3Client({ ...config, endpoint }, forcePathStyle),
        label: signature,
      });
    }
  }

  cachedClients = profiles;
  return profiles;
}

export function getLinodeS3Client(): S3Client {
  const config = getLinodeObjectStorageConfig();
  const forcePathStyle = !isClusterObjectStorageEndpoint(config.endpoint);
  return buildS3Client(config, forcePathStyle);
}

export function resetLinodeS3ClientForTests(): void {
  cachedClients = null;
}
