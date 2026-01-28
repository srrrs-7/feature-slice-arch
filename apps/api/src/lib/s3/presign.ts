import { dayjs } from "@api/lib/time";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  S3_BUCKET,
  S3_INTERNAL_ENDPOINT,
  S3_PUBLIC_ENDPOINT,
  s3Client,
} from "./index.ts";

const DEFAULT_EXPIRES_IN_SECONDS = 180;

export interface PresignedUrlResult {
  readonly url: string;
  readonly expiresAt: Date;
  readonly expiresIn: number;
}

/**
 * Replace internal endpoint with public endpoint for browser access.
 * e.g., http://localstack:4566 → http://localhost:4566
 */
const toPublicUrl = (url: string): string => {
  if (S3_INTERNAL_ENDPOINT && S3_PUBLIC_ENDPOINT) {
    return url.replace(S3_INTERNAL_ENDPOINT, S3_PUBLIC_ENDPOINT);
  }
  return url;
};

export const generatePresignedUploadUrl = async (
  key: string,
  contentType: string,
  expiresIn: number = DEFAULT_EXPIRES_IN_SECONDS,
): Promise<PresignedUrlResult> => {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const internalUrl = await getSignedUrl(s3Client, command, { expiresIn });
  const url = toPublicUrl(internalUrl);
  const expiresAt = dayjs().add(expiresIn, "second").toDate();

  return { url, expiresAt, expiresIn };
};

export const generateS3Key = (fileId: string, fileName: string): string => {
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `uploads/${fileId}/${sanitized}`;
};

const DEFAULT_DOWNLOAD_EXPIRES_IN_SECONDS = 3600;

export const generatePresignedDownloadUrl = async (
  key: string,
  expiresIn: number = DEFAULT_DOWNLOAD_EXPIRES_IN_SECONDS,
): Promise<PresignedUrlResult> => {
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });

  const internalUrl = await getSignedUrl(s3Client, command, { expiresIn });
  const url = toPublicUrl(internalUrl);
  const expiresAt = dayjs().add(expiresIn, "second").toDate();

  return { url, expiresAt, expiresIn };
};
