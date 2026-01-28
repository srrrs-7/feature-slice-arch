#!/bin/bash
set -e

echo "Creating S3 bucket for file uploads..."
awslocal s3 mb s3://file-uploads-dev 2>/dev/null || echo "Bucket already exists"

echo "Setting up CORS configuration..."
awslocal s3api put-bucket-cors --bucket file-uploads-dev --cors-configuration '{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "HEAD", "DELETE"],
      "AllowedOrigins": [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
      ],
      "ExposeHeaders": ["ETag", "x-amz-request-id", "x-amz-id-2"],
      "MaxAgeSeconds": 3600
    }
  ]
}'

echo "Verifying CORS configuration..."
awslocal s3api get-bucket-cors --bucket file-uploads-dev

echo "LocalStack S3 initialization completed!"
awslocal s3 ls
