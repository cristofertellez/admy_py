import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const BUCKETS = ["avatars", "projects", "attachments", "logos", "exports"] as const;
type Bucket = (typeof BUCKETS)[number];

let client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!client) {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error("Cloudflare R2 credentials are not configured.");
    }

    client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  return client;
}

export function isBucket(bucket: string): bucket is Bucket {
  return (BUCKETS as readonly string[]).includes(bucket);
}

function buildKey(bucket: Bucket, storagePath: string): string {
  return `${bucket}/${storagePath.replace(/^\/+/, "")}`;
}

export async function uploadToR2(
  bucket: Bucket,
  storagePath: string,
  body: Uint8Array | Buffer,
  contentType: string,
): Promise<void> {
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: buildKey(bucket, storagePath),
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function deleteFromR2(
  bucket: Bucket,
  storagePath: string,
): Promise<void> {
  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: buildKey(bucket, storagePath),
    }),
  );
}

export async function getSignedDownloadUrl(
  bucket: Bucket,
  storagePath: string,
  expiresInSeconds = 3600,
): Promise<string> {
  return getSignedUrl(
    getR2Client(),
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: buildKey(bucket, storagePath),
    }),
    { expiresIn: expiresInSeconds },
  );
}
