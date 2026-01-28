#!/bin/bash
set -e

echo "Creating S3 bucket for file uploads..."
awslocal s3 mb s3://file-uploads-dev

echo "Setting up CORS configuration..."
awslocal s3api put-bucket-cors --bucket file-uploads-dev --cors-configuration '{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
      "AllowedOrigins": ["http://localhost:3000", "http://localhost:5173"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}'

echo "LocalStack S3 initialization completed!"
awslocal s3 ls
