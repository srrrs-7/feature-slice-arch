import { S3Client } from "@aws-sdk/client-s3";

const buildS3Client = (): S3Client => {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION ?? "ap-northeast-1";

  return new S3Client({
    region,
    ...(endpoint && {
      endpoint,
      forcePathStyle: true,
    }),
  });
};

export const s3Client = buildS3Client();
export const S3_BUCKET = process.env.S3_BUCKET ?? "file-uploads";
export const S3_REGION = process.env.S3_REGION ?? "ap-northeast-1";

// Internal endpoint (for API server → LocalStack communication)
export const S3_INTERNAL_ENDPOINT = process.env.S3_ENDPOINT;
// Public endpoint (for browser → LocalStack communication via presigned URL)
export const S3_PUBLIC_ENDPOINT = process.env.S3_PUBLIC_ENDPOINT;
