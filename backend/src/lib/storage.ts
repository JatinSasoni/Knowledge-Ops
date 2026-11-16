import { env } from "../config/env.js";
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
const credentials = { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY };

// The API's own calls (check, delete, and later download) use the internal address.
const s3 = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  credentials,
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
});

// Links for the browser are signed with the address the browser will use.
const s3Public = new S3Client({
  endpoint: env.S3_PUBLIC_ENDPOINT,
  region: env.S3_REGION,
  credentials,
  forcePathStyle: true,
});

export function createUploadUrl(key: string, contentType: string, size: number) {
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: contentType,
    ContentLength: size,
  });
  return getSignedUrl(s3Public, command, { expiresIn: 600 }); //10 min
}

export async function fileExists(key: string) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

export async function deleteFile(key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
}
